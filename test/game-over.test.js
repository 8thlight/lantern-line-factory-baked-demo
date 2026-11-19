import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_LIVES, TOTAL_WAVES, createGame, placeTower, restart, spawnEnemy, step } from '../src/game.js';
import { WAYPOINTS, pathLength } from '../src/path.js';
import { ENEMY_SPEED } from '../src/enemy.js';

// Long enough for a ghost spawned now to walk the whole path.
const WALK = pathLength(WAYPOINTS) / ENEMY_SPEED + 0.1;

test('a new game is playing wave 1 of 5, and totalWaves can be set', () => {
  const game = createGame();
  assert.equal(game.status, 'playing');
  assert.equal(game.wave, 1);
  assert.equal(TOTAL_WAVES, 5);
  assert.equal(game.totalWaves, 5);
  assert.equal(createGame({ totalWaves: 2 }).totalWaves, 2);
});

test('losing the last life sets status to lost', () => {
  const game = createGame({ lives: 1, waveSize: 0 });
  spawnEnemy(game);
  assert.equal(game.status, 'playing');
  step(game, WALK);
  assert.equal(game.lives, 0);
  assert.equal(game.status, 'lost');
});

test('clearing every wave with lives left sets status to won, on the last wave', () => {
  const game = createGame({ totalWaves: 2, waveSize: 1, spawnInterval: 1 });
  step(game, 0.01); // wave 1's ghost spawns
  step(game, WALK); // and leaks
  assert.equal(game.status, 'playing');
  assert.equal(game.wave, 2);
  step(game, 0.01); // wave 2's ghost spawns
  step(game, WALK); // and leaks
  assert.equal(game.status, 'won');
  assert.equal(game.wave, 2);
  assert.equal(game.lives, START_LIVES - 2);
});

test('a ghost that takes the last life on the step that clears the last wave loses the round', () => {
  const game = createGame({ totalWaves: 1, waveSize: 1, lives: 1 });
  step(game, 0.01);
  step(game, WALK);
  assert.equal(game.lives, 0);
  assert.equal(game.status, 'lost');
});

function snapshot({ enemies, lives, towers, shots, wave, kills }) {
  return structuredClone({ enemies, lives, towers, shots, wave, kills });
}

for (const status of ['lost', 'won']) {
  test(`step on a ${status} game leaves enemies, lives and towers unchanged`, () => {
    const game = createGame({ waveSize: 2, spawnInterval: 0.5 });
    assert.equal(placeTower(game, 1, 1), true);
    step(game, 0.01);
    game.status = status;
    spawnEnemy(game);
    const before = snapshot(game);
    for (let i = 0; i < 10; i++) step(game, 0.5);
    assert.deepEqual(snapshot(game), before);
    assert.equal(game.status, status);
  });
}

test('restart returns full lives, no towers, no enemies, wave 1 and status playing', () => {
  const game = createGame({ waveSize: 1, spawnInterval: 1 });
  assert.equal(placeTower(game, 0, 0), true);
  step(game, 0.01);
  step(game, WALK);
  assert.equal(game.wave, 2);
  step(game, 0.01);
  game.status = 'lost';
  assert.deepEqual([game.lives, game.towers.length, game.enemies.length], [START_LIVES - 1, 1, 1]);

  const fresh = restart(game);
  assert.equal(game.status, 'lost'); // a new game, the finished one left as it was
  assert.equal(fresh.lives, START_LIVES);
  assert.deepEqual(fresh.towers, []);
  assert.deepEqual(fresh.enemies, []);
  assert.deepEqual(fresh.shots, []);
  assert.equal(fresh.wave, 1);
  assert.equal(fresh.kills, 0);
  assert.equal(fresh.status, 'playing');
  step(fresh, 0.01);
  assert.equal(fresh.enemies.length, 1);
});

test('restart keeps the options the game was made with', () => {
  const game = createGame({ lives: 4, totalWaves: 3 });
  game.lives = 0;
  game.status = 'lost';
  const fresh = restart(game);
  assert.equal(fresh.lives, 4);
  assert.equal(fresh.totalWaves, 3);
});
