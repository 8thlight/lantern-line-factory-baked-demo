import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WAVES } from '../src/waves.js';
import { TOTAL_WAVES, createGame, restart, step } from '../src/game.js';

// Step a game by half a second until `done` holds, at most `limit` times.
function stepUntil(game, done, limit = 2000) {
  for (let i = 0; i < limit && !done(game); i++) step(game, 0.5);
}

test('the table holds ten waves, each with a positive count, interval, health and speed', () => {
  assert.equal(WAVES.length, 10);
  for (const wave of WAVES) {
    const { count, interval, health, speed } = wave;
    assert.deepEqual([count > 0, interval > 0, health > 0, speed > 0], [true, true, true, true]);
    assert.deepEqual(Object.keys(wave).sort(), ['count', 'health', 'interval', 'speed']);
  }
});

test("the table escalates: each wave's count * health is at least the one before, and no wave is slower", () => {
  for (let i = 1; i < WAVES.length; i++) {
    const [before, now] = [WAVES[i - 1], WAVES[i]];
    assert.equal(now.count * now.health >= before.count * before.health, true);
    assert.equal(now.speed >= before.speed, true);
  }
});

test('wave 2 is not wave 1 again', () => {
  assert.deepEqual([WAVES[1].health > WAVES[0].health, WAVES[1].speed > WAVES[0].speed], [true, true]);
});

test('a new game reads its waves from the table', () => {
  const game = createGame();
  assert.equal(TOTAL_WAVES, WAVES.length);
  assert.equal(game.totalWaves, WAVES.length);
  assert.deepEqual([game.spawner.count, game.spawner.interval], [WAVES[0].count, WAVES[0].interval]);
});

test("ghosts spawned in wave 2 carry wave 2's health and speed", () => {
  const game = createGame({ lives: 1000 });
  const seen = new Map();
  stepUntil(game, (g) => {
    for (const e of g.enemies) seen.set(e.id, [e.health, e.maxHealth, e.speed]);
    return g.wave === 2;
  });
  assert.equal(game.wave, 2);
  assert.deepEqual(
    [...seen.values()],
    Array.from({ length: WAVES[0].count }, () => [WAVES[0].health, WAVES[0].health, WAVES[0].speed]),
  );
  assert.deepEqual([game.spawner.count, game.spawner.interval], [WAVES[1].count, WAVES[1].interval]);
  step(game, 0.01);
  const ghost = game.enemies.at(-1);
  assert.deepEqual([ghost.health, ghost.maxHealth, ghost.speed], [WAVES[1].health, WAVES[1].health, WAVES[1].speed]);
});

test('clearing the last entry wins the round', () => {
  const game = createGame({ lives: 1000 });
  stepUntil(game, (g) => g.status !== 'playing', 20000);
  const total = WAVES.reduce((sum, w) => sum + w.count, 0);
  assert.deepEqual([game.status, game.wave, game.lives], ['won', WAVES.length, 1000 - total]);
});

test('explicit waveSize and spawnInterval still override the table, in every wave', () => {
  const game = createGame({ waveSize: 1, spawnInterval: 2, lives: 1000 });
  stepUntil(game, (g) => g.wave === 2);
  assert.deepEqual([game.wave, game.spawner.count, game.spawner.interval], [2, 1, 2]);
  step(game, 0.01);
  const ghost = game.enemies.at(-1);
  assert.deepEqual([ghost.health, ghost.speed], [WAVES[1].health, WAVES[1].speed]);
  assert.equal(restart(game).spawner.count, 1);
});

test('a game holding more waves than the table sends the last entry again', () => {
  const game = createGame({ totalWaves: WAVES.length + 1, lives: 1000 });
  stepUntil(game, (g) => g.wave === WAVES.length + 1, 20000);
  assert.equal(game.wave, WAVES.length + 1);
  step(game, 0.01);
  const last = WAVES.at(-1);
  const ghost = game.enemies.at(-1);
  assert.deepEqual(
    [game.spawner.count, ghost.health, ghost.speed],
    [last.count, last.health, last.speed],
  );
});
