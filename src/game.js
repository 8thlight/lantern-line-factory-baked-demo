// Game state and the fixed-step update. No DOM: render.js draws what this holds.

import { WAYPOINTS, pathCells } from './path.js';
import { advanceEnemy, createEnemy } from './enemy.js';
import { canPlace, createTower, updateTower } from './tower.js';

export const START_LIVES = 10;
export const SPAWN_INTERVAL = 1.5; // seconds between ghosts
const SHOT_TTL = 0.1; // how long a beam stays drawn

export function createGame({ waypoints = WAYPOINTS, spawnInterval = SPAWN_INTERVAL, lives = START_LIVES } = {}) {
  return {
    waypoints,
    path: pathCells(waypoints),
    spawnInterval,
    spawnTimer: 0,
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
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnEnemy(state);
    state.spawnTimer += state.spawnInterval;
  }

  for (const enemy of state.enemies) advanceEnemy(enemy, state.waypoints, dt);
  leakEnemies(state);

  for (const shot of state.shots) shot.ttl -= dt;
  state.shots = state.shots.filter((s) => s.ttl > 0);

  for (const tower of state.towers) {
    const target = updateTower(tower, state.enemies, dt);
    if (!target) continue;
    // Today one hit removes a ghost. Enemy health is milestone work (work/m1-01).
    state.enemies = state.enemies.filter((e) => e !== target);
    state.kills += 1;
    state.shots.push({ from: { x: tower.x, y: tower.y }, to: { x: target.x, y: target.y }, ttl: SHOT_TTL });
  }

  return state;
}
