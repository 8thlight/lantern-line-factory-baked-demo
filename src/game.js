// Game state and the fixed-step update. No DOM: render.js draws what this holds.

import { WAYPOINTS, cellCenter, pathCells } from './path.js';
import { advanceEnemy, createEnemy, damageEnemy, slowEnemy } from './enemy.js';
import { LANTERN, MAX_LEVEL, canPlace, cellError, createTower, towerById, updateTower } from './tower.js';
import { splashTargets } from './targeting.js';
import { createWave, updateWave, waveDone } from './wave.js';
import { WAVES } from './waves.js';

export const START_LIVES = 10;
export const START_GOLD = 50;
export const TOTAL_WAVES = WAVES.length; // waves to hold for the round to be won
export const BOSS_LIVES = 3; // lives a boss takes when it reaches the end
const SHOT_TTL = 0.1; // how long a beam stays drawn

// The table's entry for a wave; a game holding more waves than the table repeats its last.
function waveEntry(wave) {
  return WAVES[Math.min(wave, WAVES.length) - 1];
}

// A wave's spawner: its entry's count and interval, unless the game was made with its own.
// A wave whose entry has a boss sends it as its last spawn; a wave of no ghosts sends no boss either.
export function waveSpawner({ options }, wave) {
  const entry = waveEntry(wave);
  const count = options.waveSize ?? entry.count;
  const boss = count > 0 ? entry.boss ?? null : null;
  return { ...createWave({ count: count + (boss ? 1 : 0), interval: options.spawnInterval ?? entry.interval }), boss };
}

// `waveSize` and `spawnInterval` left out, each wave reads them from the table; given, they hold for every wave,
// `waveSize` counting the plain ghosts, so a boss wave of a nonzero size still sends its boss after them.
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
    spawner: waveSpawner({ options }, 1),
    nextEnemyId: 1,
    nextTowerId: 1,
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
  state.towers.push({ id: state.nextTowerId++, ...createTower(col, row, kind) });
  return true;
}

// Why the tower with `id` may not be upgraded: 'missing' when no tower has it, then 'max' at
// MAX_LEVEL or when its kind declared no upgrade, then 'gold' when the gold held is below the
// upgrade's cost; null when it may.
export function upgradeError(state, id) {
  const tower = towerById(state, id);
  if (!tower) return 'missing';
  if (tower.level >= MAX_LEVEL || tower.upgrade === null) return 'max';
  if (state.gold < tower.upgrade.cost) return 'gold';
  return null;
}

// Raise a tower one level by the damage and range its upgrade (copied from its kind) declares
// and pay the upgrade's cost. Returns upgradeError's reason, having changed nothing, when it
// refuses; null when done.
export function upgradeTower(state, id) {
  const reason = upgradeError(state, id);
  if (reason !== null) return reason;
  const tower = towerById(state, id);
  const { cost, damage, range } = tower.upgrade;
  tower.level += 1;
  tower.damage += damage;
  tower.range += range;
  state.gold -= cost;
  return null;
}

// A left click on a board cell: a tower standing there is selected, its id returned and nothing
// placed; any other cell is handed to placeTower and the click selects nothing (null).
export function clickCell(state, col, row, kind = LANTERN) {
  const tower = towerAt(state, col, row);
  if (tower) return tower.id ?? null;
  placeTower(state, col, row, kind);
  return null;
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

// A plain ghost of the current wave, as tough and fast as its entry in the table.
export function spawnEnemy(state) {
  const { health, speed } = waveEntry(state.wave);
  const enemy = createEnemy({ id: state.nextEnemyId++, waypoints: state.waypoints, health, speed });
  state.enemies.push(enemy);
  return enemy;
}

// The current wave's boss, as tough, fast and rewarding as its entry declares, marked so render
// draws it larger. Only called on a wave whose entry has a boss.
export function spawnBoss(state) {
  const { health, speed, bounty } = waveEntry(state.wave).boss;
  const enemy = { ...createEnemy({ id: state.nextEnemyId++, waypoints: state.waypoints, health, speed, bounty }), boss: true };
  state.enemies.push(enemy);
  return enemy;
}

// Lose one life per enemy that reached the end, BOSS_LIVES for a boss, and remove those enemies.
// Returns the lives the leaks cost; lives stop at 0 even when that cost is more.
export function leakEnemies(state) {
  const cost = state.enemies.reduce((sum, e) => sum + (e.reachedEnd ? (e.boss ? BOSS_LIVES : 1) : 0), 0);
  state.lives = Math.max(0, state.lives - cost);
  state.enemies = state.enemies.filter((e) => !e.reachedEnd);
  return cost;
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
  // The boss is the wave's last spawn, even when a long tick owes a backlog.
  for (let i = 0; i < due; i++) {
    const last = state.spawner.spawned - due + i + 1 === state.spawner.count;
    if (last && state.spawner.boss) spawnBoss(state);
    else spawnEnemy(state);
  }

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
    // A frost hit sets the slow and restarts its time; it never deepens it.
    if (tower.slow > 0) for (const enemy of hit) if (!dead.includes(enemy)) slowEnemy(enemy, tower.slow, tower.slowFor);
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
    state.spawner = waveSpawner(state, state.wave);
  }

  return state;
}
