import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, restart, spawnEnemy, step } from '../src/game.js';
import { ENEMY_SPEED, createEnemy } from '../src/enemy.js';
import { WAYPOINTS, pathLength } from '../src/path.js';

const WALK = pathLength(WAYPOINTS) / ENEMY_SPEED + 0.1; // seconds for a ghost to reach the gate

// A game with no automatic spawning, so the test controls its ghosts.
function quietGame(options) {
  const game = createGame(options);
  game.spawnTimer = Infinity;
  return game;
}

// Step in small ticks until the round ends, or give up after `limit` seconds.
function playOut(game, limit = 600, dt = 0.05) {
  for (let t = 0; t < limit && game.status === 'playing'; t += dt) step(game, dt);
  return game;
}

function lostGame(options) {
  const game = quietGame({ lives: 1, ...options });
  for (let i = 0; i < game.lives; i++) spawnEnemy(game);
  step(game, WALK);
  return game;
}

test('losing the last life sets status to lost', () => {
  const game = quietGame({ lives: 1 });
  assert.equal(game.status, 'playing');
  spawnEnemy(game);
  step(game, WALK);
  assert.equal(game.lives, 0);
  assert.equal(game.status, 'lost');
});

test('clearing every wave with lives left sets status to won', () => {
  const game = playOut(createGame({ totalWaves: 2, waveSize: 1, spawnInterval: 0.1 }));
  assert.equal(game.status, 'won');
  assert.equal(game.wave, 2);
  assert.ok(game.lives > 0);
});

test('clearing a wave that is not the last moves on to the next wave', () => {
  const game = createGame({ totalWaves: 2, waveSize: 1, spawnInterval: 0.1 });
  assert.equal(game.wave, 1);
  for (let t = 0; t < 600 && game.wave === 1; t += 0.05) step(game, 0.05);
  assert.equal(game.wave, 2);
  assert.equal(game.status, 'playing');
});

for (const [label, make] of [
  ['lost', () => lostGame({ lives: 1 })],
  ['won', () => playOut(createGame({ totalWaves: 1, waveSize: 1, spawnInterval: 0.1 }))],
]) {
  test(`step on a ${label} game leaves enemies, lives and towers unchanged`, () => {
    const game = make();
    assert.equal(game.status, label);
    assert.equal(placeTower(game, 1, 0), true);
    game.enemies.push(createEnemy({ id: 99, waypoints: WAYPOINTS }));
    const before = structuredClone({ enemies: game.enemies, lives: game.lives, towers: game.towers });
    const returned = step(game, 1000);
    assert.equal(returned, game);
    assert.deepEqual({ enemies: game.enemies, lives: game.lives, towers: game.towers }, before);
    assert.equal(game.status, label);
  });
}

test('restart returns full lives, no towers, no enemies, wave 1 and status playing', () => {
  const game = lostGame({ lives: 4, totalWaves: 3 });
  assert.equal(placeTower(game, 1, 0), true);
  game.enemies.push(createEnemy({ id: 99, waypoints: WAYPOINTS }));
  assert.equal(game.status, 'lost');
  const fresh = restart(game);
  assert.equal(fresh.lives, 4);
  assert.deepEqual(fresh.towers, []);
  assert.deepEqual(fresh.enemies, []);
  assert.equal(fresh.wave, 1);
  assert.equal(fresh.status, 'playing');
  assert.equal(fresh.totalWaves, 3);
  assert.notEqual(fresh, game);
  assert.equal(game.towers.length, 1);
});
