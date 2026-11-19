// Game state and the fixed-step update. No DOM: render.js draws what this holds.

import { WAYPOINTS, cellCenter, pathCells } from './path.js';
import { advanceEnemy, createEnemy, damageEnemy } from './enemy.js';
import { LANTERN, canPlace, cellError, createTower, updateTower } from './tower.js';
import { splashTargets } from './targeting.js';
import { createWave, updateWave, waveDone } from './wave.js';
import { WAVES } from './waves.js';

export const START_LIVES = 10;
export const START_GOLD = 50;
export const TOTAL_WAVES = WAVES.length; // waves to hold for the round to be won
const SHOT_TTL = 0.1; // how long a beam stays drawn

// The table's entry for a wave; a game holding more waves than the table repeats its last.
function waveEntry(wave) {
  return WAVES[Math.min(wave, WAVES.length) - 1];
}

// A wave's spawner: its entry's count and interval, unless the game was made with its own.
function createSpawner({ waveSize, spawnInterval }, wave) {
  const entry = waveEntry(wave);
  return createWave({ count: waveSize ?? entry.count, interval: spawnInterval ?? entry.interval });
}

// `waveSize` and `spawnInterval` left out, each wave reads them from the table; given, they hold for every wave.
export function createGame({
  waypoints = WAYPOINTS,
  spawnInterval,
  waveSize,
  lives = START_LIVES,
  gold = START_GOLD,
  totalWaves = TOTAL_WAVES,
} = {}) {
  const options = { waypoints, spawnInterval, waveSize, lives, gold, totalWaves };
  return {
    options,
    status: 'playing', // then 'won' or 'lost', and the round is over
    waypoints,
    path: pathCells(waypoints),
    wave: 1,
    totalWaves,
    spawner: createSpawner(options, 1),
    nextEnemyId: 1,
    enemies: [],
    towers: [],
    shots: [],
    lives,
    gold,
    kills: 0,
    paused: false,
    speed: 1, // 1 or 2: the ticks each step runs
  };
}

// Why a tower of `kind` may not be placed on a cell: the cell's reason ('bounds', 'path' or
// 'taken') first, then 'gold' when the gold held is below the kind's cost; null when it may.
// A kind with no cost is free.
export function placementError(state, col, row, kind = LANTERN) {
  return cellError(state, col, row) ?? (state.gold < (kind.cost ?? 0) ? 'gold' : null);
}

// Place a tower of `kind` and pay its cost, unless placementError refuses it.
export function placeTower(state, col, row, kind = LANTERN) {
  if (placementError(state, col, row, kind) !== null) return false;
  state.gold -= kind.cost ?? 0;
  state.towers.push(createTower(col, row, kind));
  return true;
}

// The hover the pointer shows on a cell: `ok` when a tower of `kind` may be placed there now.
export function hoverAt(state, col, row, kind = LANTERN) {
  return { col, row, kind, ok: placementError(state, col, row, kind) === null };
}

// The tower standing on a cell, or null.
export function towerAt(state, col, row) {
  return state.towers.find((t) => t.col === col && t.row === row) ?? null;
}

// The ring the pointer shows: a placed tower's reach, or on a cell a tower may take, the
// reach of the kind a click would place there (the hover's kind, a lantern if it names none).
// Null with no hover, on the path or off the board.
export function rangePreview(state, hover) {
  if (!hover) return null;
  const tower = towerAt(state, hover.col, hover.row);
  if (tower) return { x: tower.x, y: tower.y, radius: tower.range };
  if (!canPlace(state, hover.col, hover.row)) return null;
  const { x, y } = cellCenter(hover);
  return { x, y, radius: (hover.kind ?? LANTERN).range };
}

// A ghost of the current wave, as tough and fast as its entry in the table.
export function spawnEnemy(state) {
  const { health, speed } = waveEntry(state.wave);
  const enemy = createEnemy({ id: state.nextEnemyId++, waypoints: state.waypoints, health, speed });
  state.enemies.push(enemy);
  return enemy;
}

// Lose one life per enemy that reached the end, and remove those enemies.
export function leakEnemies(state) {
  const leaked = state.enemies.filter((e) => e.reachedEnd);
  state.lives = Math.max(0, state.lives - leaked.length);
  state.enemies = state.enemies.filter((e) => !e.reachedEnd);
  return leaked.length;
}

// A fresh game made with the options this one was made with.
export function restart(state) {
  return createGame(state.options);
}

// Pause and unpause the round.
export function togglePause(state) {
  state.paused = !state.paused;
  return state;
}

// Move the round between 1x and 2x.
export function toggleSpeed(state) {
  state.speed = state.speed === 2 ? 1 : 2;
  return state;
}

// Advance the whole game by `dt` seconds of play, `speed` times over. A finished round stays
// as it ended, and a paused one as it was. 2x is two ticks of the frame's `dt`, never one tick
// of twice the `dt`, so a long frame cannot carry a ghost past a tower's reach or fold two
// reloads into one shot.
export function step(state, dt) {
  if (state.status !== 'playing' || state.paused) return state;
  for (let i = 0; i < state.speed && state.status === 'playing'; i++) tick(state, dt);
  return state;
}

function tick(state, dt) {
  const due = updateWave(state.spawner, dt);
  for (let i = 0; i < due; i++) spawnEnemy(state);

  for (const enemy of state.enemies) advanceEnemy(enemy, state.waypoints, dt);
  leakEnemies(state);
  if (state.lives === 0) {
    state.status = 'lost'; // nothing else moves on the step the round is lost
    return state;
  }

  for (const shot of state.shots) shot.ttl -= dt;
  state.shots = state.shots.filter((s) => s.ttl > 0);

  for (const tower of state.towers) {
    const target = updateTower(tower, state.enemies, dt);
    if (!target) continue;
    state.shots.push({ from: { x: tower.x, y: tower.y }, to: { x: target.x, y: target.y }, ttl: SHOT_TTL });
    // A splash takes in its own target, so each ghost is hit once and each kill counted and paid once.
    const hit = tower.splash > 0 ? splashTargets(target, state.enemies, tower.splash) : [target];
    const dead = hit.filter((enemy) => damageEnemy(enemy, tower.damage));
    if (dead.length) {
      state.enemies = state.enemies.filter((e) => !dead.includes(e));
      state.kills += dead.length;
      state.gold += dead.reduce((sum, e) => sum + e.bounty, 0);
    }
  }

  // The next wave starts once this one has spawned out and the board is clear,
  // whether its ghosts were banished or leaked, and reads its entry in the table.
  // A wave of no ghosts is spawned out from the start, so it is kept from counting waves up on an empty board.
  // Clearing the last wave wins the round; lives are above 0 here, since a loss returned above.
  if (state.spawner.count > 0 && waveDone(state.spawner) && state.enemies.length === 0) {
    if (state.wave >= state.totalWaves) {
      state.status = 'won';
      return state;
    }
    state.wave += 1;
    state.spawner = createSpawner(state.options, state.wave);
  }

  return state;
}
