import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_GOLD, START_LIVES, createGame, placeTower, restart, spawnEnemy, step } from '../src/game.js';
import { ENEMY_SPEED, createEnemy } from '../src/enemy.js';
import { WAYPOINTS, pathLength } from '../src/path.js';
import { BRAZIER, LANTERN } from '../src/tower.js';

// `n` ghosts at distances 0, 10, ... on the path's first stretch (x = 20, 30, ... on y = 100),
// within reach of a tower at (1, 1), centre (60, 60), and within a brazier's splash of each
// other. Each has 1 health, so one hit banishes it.
function ghostsBeside(game, n) {
  return Array.from({ length: n }, (_, i) => {
    const ghost = spawnEnemy(game);
    ghost.distance = i * 10;
    ghost.health = ghost.maxHealth = 1;
    return ghost;
  });
}

test('a new game starts with 50 gold', () => {
  assert.equal(START_GOLD, 50);
  assert.equal(createGame().gold, 50);
  assert.equal(createGame({ gold: 7 }).gold, 7);
});

test('every ghost carries a bounty of 5 unless made with another', () => {
  assert.equal(createEnemy({ id: 1, waypoints: WAYPOINTS }).bounty, 5);
  assert.equal(createEnemy({ id: 1, waypoints: WAYPOINTS, bounty: 8 }).bounty, 8);
  assert.equal(spawnEnemy(createGame({ waveSize: 0 })).bounty, 5);
});

test('killing one ghost with bounty 5 raises gold by exactly 5', () => {
  const game = createGame({ waveSize: 0 });
  assert.equal(placeTower(game, 1, 1, LANTERN), true);
  ghostsBeside(game, 1);
  step(game, 0.01);
  assert.deepEqual([game.kills, game.enemies.length, game.gold], [1, 0, 35]);
});

test('a ghost that takes three lantern shots pays its bounty once, on the shot that banishes it', () => {
  const game = createGame({ waveSize: 0 });
  assert.equal(placeTower(game, 1, 1, LANTERN), true);
  const ghost = spawnEnemy(game);
  ghost.speed = 0; // stays at x = 20, in the lantern's reach
  const golds = [];
  while (game.kills === 0 && golds.length < 10) {
    step(game, LANTERN.cooldown);
    golds.push(game.gold);
  }
  assert.deepEqual(golds, [30, 30, 35]);
});

test('a ghost reaching the end leaves gold unchanged', () => {
  const game = createGame({ waveSize: 0 });
  spawnEnemy(game);
  step(game, pathLength(WAYPOINTS) / ENEMY_SPEED + 0.1);
  assert.deepEqual([game.lives, game.enemies.length, game.gold], [START_LIVES - 1, 0, 50]);
});

test('two ghosts killed in the same step each pay their bounty exactly once', () => {
  const game = createGame({ waveSize: 0 });
  assert.equal(placeTower(game, 1, 1, BRAZIER), true);
  ghostsBeside(game, 2);
  step(game, 0.01);
  assert.deepEqual([game.kills, game.enemies.length, game.shots.length, game.gold], [2, 0, 1, 30]);
  step(game, 0.01);
  assert.equal(game.gold, 30);
});

test('a ghost pays its own bounty', () => {
  const game = createGame({ waveSize: 0 });
  assert.equal(placeTower(game, 1, 1, LANTERN), true);
  const [ghost] = ghostsBeside(game, 1);
  ghost.bounty = 12;
  step(game, 0.01);
  assert.equal(game.gold, 42);
});

test('restart puts gold back to the game\'s start', () => {
  const game = createGame({ waveSize: 0, gold: 20 });
  assert.equal(placeTower(game, 1, 1, LANTERN), true);
  ghostsBeside(game, 1);
  step(game, 0.01);
  assert.equal(game.gold, 5);
  assert.equal(restart(game).gold, 20);
});
