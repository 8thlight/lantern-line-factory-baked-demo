// Game state and the fixed-step update. No DOM: render.js draws what this holds.

import { WAYPOINTS, pathCells } from './path.js';
import { advanceEnemy, createEnemy, damageEnemy } from './enemy.js';
import { canPlace, createTower, updateTower } from './tower.js';
import { createWave, updateWave, waveDone } from './wave.js';

export const START_LIVES = 10;
export const SPAWN_INTERVAL = 1.5; // seconds between ghosts
export const TOTAL_WAVES = 5;
export const WAVE_SIZE = 5; // ghosts per wave
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
    status: 'playing', // 'playing', 'won' or 'lost'
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

// A fresh game built from the same options.
export function restart(state) {
  return createGame(state.options);
}

// A click on cell (col, row): once the round is over it starts a fresh one, and while
// it is playing it places a lantern there. Returns the game to keep playing.
export function click(state, col, row) {
  if (state.status !== 'playing') return restart(state);
  placeTower(state, col, row);
  return state;
}

// End the round, clearing the beams so none stays drawn under the end-of-round card.
function endRound(state, status) {
  state.status = status;
  state.shots = [];
  return state;
}

// Advance the whole game by `dt` seconds. A round that is over stays as it is.
export function step(state, dt) {
  if (state.status !== 'playing') return state;

  const due = updateWave(state.spawner, dt);
  for (let i = 0; i < due; i++) spawnEnemy(state);

  for (const enemy of state.enemies) advanceEnemy(enemy, state.waypoints, dt);
  leakEnemies(state);
  if (state.lives === 0) return endRound(state, 'lost');

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

  // A wave is cleared once it has spawned out and the board is clear, whether its
  // ghosts were banished or leaked: the last wave wins the round, any other starts
  // the next. Every wave is the same size for now.
  // A wave of no ghosts is spawned out from the start, so it is kept from counting waves up on an empty board.
  if (state.spawner.count > 0 && waveDone(state.spawner) && state.enemies.length === 0) {
    if (state.wave >= state.totalWaves) return endRound(state, 'won');
    const { count, interval } = state.spawner;
    state.wave += 1;
    state.spawner = createWave({ count, interval });
  }

  return state;
}
