// Game state and the fixed-step update. No DOM: render.js draws what this holds.

import { COLS, ROWS, WAYPOINTS, cellKey, pathCells } from './path.js';
import { advanceEnemy, createEnemy, slowEnemy } from './enemy.js';
import { LANTERN, createTower, updateTower } from './tower.js';

export const START_LIVES = 10;
export const START_GOLD = 50;
export const SPAWN_INTERVAL = 1.5; // seconds between ghosts
const SHOT_TTL = 0.1; // how long a beam stays drawn

export function createGame({ waypoints = WAYPOINTS, spawnInterval = SPAWN_INTERVAL, lives = START_LIVES, gold = START_GOLD } = {}) {
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
    gold,
    kills: 0,
  };
}

// Why a tower of `kind` may not stand on a cell: 'bounds', 'path', 'taken' or 'gold'.
// null when it may.
export function placementError(state, col, row, kind = LANTERN) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return 'bounds';
  if (state.path.has(cellKey(col, row))) return 'path';
  if (state.towers.some((t) => t.col === col && t.row === row)) return 'taken';
  if (kind.cost > state.gold) return 'gold';
  return null;
}

export function placeTower(state, col, row, kind = LANTERN) {
  if (placementError(state, col, row, kind) !== null) return false;
  state.towers.push(createTower(col, row, kind));
  state.gold -= kind.cost;
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
    if (tower.slow) {
      // Frost slows and does no damage.
      slowEnemy(target, tower.slow, tower.slowFor);
      state.shots.push({ from: { x: tower.x, y: tower.y }, to: { x: target.x, y: target.y }, ttl: SHOT_TTL, frost: true });
      continue;
    }
    // Today one hit removes a ghost. Enemy health is milestone work (work/m1-01).
    state.enemies = state.enemies.filter((e) => e !== target);
    state.kills += 1;
    state.shots.push({ from: { x: tower.x, y: tower.y }, to: { x: target.x, y: target.y }, ttl: SHOT_TTL });
  }

  return state;
}
