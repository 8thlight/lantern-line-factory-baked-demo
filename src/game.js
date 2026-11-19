// Game state and the fixed-step update. No DOM: render.js draws what this holds.

import { WAYPOINTS, pathCells } from './path.js';
import { advanceEnemy, createEnemy, damageEnemy } from './enemy.js';
import { canPlace, createTower, updateTower } from './tower.js';
import { createWave, updateWave, waveDone } from './wave.js';

export const START_LIVES = 10;
export const SPAWN_INTERVAL = 1.5; // seconds between ghosts
export const WAVE_SIZE = 5; // ghosts per wave
const SHOT_TTL = 0.1; // how long a beam stays drawn

export function createGame({
  waypoints = WAYPOINTS,
  spawnInterval = SPAWN_INTERVAL,
  waveSize = WAVE_SIZE,
  lives = START_LIVES,
} = {}) {
  return {
    waypoints,
    path: pathCells(waypoints),
    wave: 1,
    spawner: createWave({ count: waveSize, interval: spawnInterval }),
    nextEnemyId: 1,
    enemies: [],
    towers: [],
    shots: [],
    lives,
    kills: 0,
  };
}

export function placeTower(state, col, row) {
  if (!canPlace(state, col, row)) return false;
  state.towers.push(createTower(col, row));
  return true;
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

// Advance the whole game by `dt` seconds.
export function step(state, dt) {
  const due = updateWave(state.spawner, dt);
  for (let i = 0; i < due; i++) spawnEnemy(state);

  for (const enemy of state.enemies) advanceEnemy(enemy, state.waypoints, dt);
  leakEnemies(state);

  for (const shot of state.shots) shot.ttl -= dt;
  state.shots = state.shots.filter((s) => s.ttl > 0);

  for (const tower of state.towers) {
    const target = updateTower(tower, state.enemies, dt);
    if (!target) continue;
    state.shots.push({ from: { x: tower.x, y: tower.y }, to: { x: target.x, y: target.y }, ttl: SHOT_TTL });
    if (damageEnemy(target, tower.damage)) {
      state.enemies = state.enemies.filter((e) => e !== target);
      state.kills += 1;
    }
  }

  // The next wave starts once this one has spawned out and the board is clear,
  // whether its ghosts were banished or leaked. Every wave is the same size for now.
  // A wave of no ghosts never ends, so it cannot count waves up on an empty board.
  if (state.spawner.count > 0 && waveDone(state.spawner) && state.enemies.length === 0) {
    const { count, interval } = state.spawner;
    state.wave += 1;
    state.spawner = createWave({ count, interval });
  }

  return state;
}
