import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, spawnEnemy, step, togglePause, toggleSpeed } from '../src/game.js';

test('togglePause flips paused and toggleSpeed moves between 1 and 2', () => {
  const game = createGame();
  assert.equal(game.paused, false);
  assert.equal(game.speed, 1);
  assert.equal(togglePause(game), game);
  assert.equal(game.paused, true);
  togglePause(game);
  assert.equal(game.paused, false);
  assert.equal(toggleSpeed(game), game);
  assert.equal(game.speed, 2);
  toggleSpeed(game);
  assert.equal(game.speed, 1);
});

test('a paused step leaves enemy positions, spawn timers and tower reloads unchanged', () => {
  const game = createGame();
  placeTower(game, 1, 1);
  spawnEnemy(game);
  step(game, 0.3);
  assert.equal(game.towers[0].reload > 0, true); // the lantern has fired and is reloading
  const snapshot = () => ({
    enemies: game.enemies.map(({ x, y, distance }) => ({ x, y, distance })),
    spawner: { spawned: game.spawner.spawned, timer: game.spawner.timer },
    reloads: game.towers.map((t) => t.reload),
    gold: game.gold,
    kills: game.kills,
    lives: game.lives,
    wave: game.wave,
  });
  const before = snapshot();

  togglePause(game);
  for (let i = 0; i < 3; i++) step(game, 0.5);
  assert.deepEqual(snapshot(), before);

  togglePause(game);
  step(game, 0.1);
  assert.equal(game.enemies[0].distance > before.enemies[0].distance, true);
});

test('at speed 2, one step(state, 0.5) moves a ghost as far as two step(state, 0.5) calls at speed 1', () => {
  const fast = createGame({ waveSize: 0 });
  const slow = createGame({ waveSize: 0 });
  const fastGhost = spawnEnemy(fast);
  const slowGhost = spawnEnemy(slow);
  toggleSpeed(fast);
  step(fast, 0.5);
  step(slow, 0.5);
  step(slow, 0.5);
  const where = ({ x, y, distance }) => ({ x, y, distance });
  assert.deepEqual(where(fastGhost), where(slowGhost));
  assert.equal(fastGhost.distance, 60);
});

test('speed scales the spawner and tower reloads too', () => {
  const spawning = toggleSpeed(createGame({ waveSize: 3, spawnInterval: 1 }));
  step(spawning, 0.01);
  assert.equal(spawning.spawner.spawned, 1);
  step(spawning, 0.5);
  assert.equal(spawning.spawner.spawned, 2);

  const reloading = toggleSpeed(createGame({ waveSize: 0 }));
  placeTower(reloading, 1, 1);
  reloading.towers[0].reload = 0.6;
  step(reloading, 0.3);
  assert.equal(reloading.towers[0].reload, 0);
});
