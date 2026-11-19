// Game state and the fixed-step update. No DOM: render.js draws what this holds.

import { WAYPOINTS, cellCenter, pathCells } from './path.js';
import { advanceEnemy, createEnemy, damageEnemy } from './enemy.js';
import { LANTERN, canPlace, createTower, updateTower } from './tower.js';
import { splashTargets } from './targeting.js';
import { createWave, updateWave, waveDone } from './wave.js';

export const START_LIVES = 10;
export const SPAWN_INTERVAL = 1.5; // seconds between ghosts
export const WAVE_SIZE = 5; // ghosts per wave
export const TOTAL_WAVES = 5; // waves to hold for the round to be won
const SHOT_TTL = 0.1; // how long a beam stays drawn

export function createGame({
  waypoints = WAYPOINTS,
  spawnInterval = SPAWN_INTERVAL,
  waveSize = WAVE_SIZE,
  lives = START_LIVES,
  totalWaves = TOTAL_WAVES,
} = {}) {
  return {
    options: { waypoints, spawnInterval, waveSize, lives, totalWaves },
    status: 'playing', // then 'won' or 'lost', and the round is over
    waypoints,
    path: pathCells(waypoints),
    wave: 1,
    totalWaves,
    spawner: createWave({ count: waveSize, interval: spawnInterval }),
    nextEnemyId: 1,
    enemies: [],
    towers: [],
    shots: [],
    lives,
    kills: 0,
  };
}

export function placeTower(state, col, row, kind = LANTERN) {
  if (!canPlace(state, col, row)) return false;
  state.towers.push(createTower(col, row, kind));
  return true;
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

export function spawnEnemy(state) {
  const enemy = createEnemy({ id: state.nextEnemyId++, waypoints: state.waypoints });
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

// Advance the whole game by `dt` seconds. A finished round stays as it ended.
export function step(state, dt) {
  if (state.status !== 'playing') return state;

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
    // A splash takes in its own target, so each ghost is hit once and each kill counted once.
    const hit = tower.splash > 0 ? splashTargets(target, state.enemies, tower.splash) : [target];
    const dead = hit.filter((enemy) => damageEnemy(enemy, tower.damage));
    if (dead.length) {
      state.enemies = state.enemies.filter((e) => !dead.includes(e));
      state.kills += dead.length;
    }
  }

  // The next wave starts once this one has spawned out and the board is clear,
  // whether its ghosts were banished or leaked. Every wave is the same size for now.
  // A wave of no ghosts is spawned out from the start, so it is kept from counting waves up on an empty board.
  // Clearing the last wave wins the round; lives are above 0 here, since a loss returned above.
  if (state.spawner.count > 0 && waveDone(state.spawner) && state.enemies.length === 0) {
    if (state.wave >= state.totalWaves) {
      state.status = 'won';
      return state;
    }
    const { count, interval } = state.spawner;
    state.wave += 1;
    state.spawner = createWave({ count, interval });
  }

  return state;
}
