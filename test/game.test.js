import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_LIVES, createGame, placeTower, spawnEnemy, step } from '../src/game.js';
import { WAYPOINTS, pathLength } from '../src/path.js';

// A game with no automatic spawning, so each test controls its enemies.
function quietGame(options) {
  const game = createGame(options);
  game.spawnTimer = Infinity;
  return game;
}

test('a new game starts with full lives and an empty board', () => {
  const game = createGame();
  assert.equal(game.lives, START_LIVES);
  assert.deepEqual(game.enemies, []);
  assert.deepEqual(game.towers, []);
});

test('an enemy reaching the end costs exactly one life and leaves the board', () => {
  const game = quietGame();
  const enemy = spawnEnemy(game);
  step(game, pathLength(WAYPOINTS) / enemy.speed + 0.1);
  assert.equal(game.lives, START_LIVES - 1);
  assert.equal(game.enemies.length, 0);
});

test('lives never go below zero', () => {
  const game = quietGame({ lives: 1 });
  spawnEnemy(game);
  spawnEnemy(game);
  step(game, 1000);
  assert.equal(game.lives, 0);
});

test('enemies spawn on the interval', () => {
  const game = createGame({ spawnInterval: 1 });
  step(game, 0.01);
  assert.equal(game.enemies.length, 1);
  step(game, 0.5);
  assert.equal(game.enemies.length, 1);
  step(game, 0.5);
  assert.equal(game.enemies.length, 2);
});

test('towers are refused on the path and on a taken cell', () => {
  const game = quietGame();
  const onPath = WAYPOINTS[0];
  assert.equal(placeTower(game, onPath.col, onPath.row), false);
  assert.equal(placeTower(game, 1, 0), true);
  assert.equal(placeTower(game, 1, 0), false);
  assert.equal(placeTower(game, -1, 0), false);
  assert.equal(game.towers.length, 1);
});

test('a tower beside the path shoots an enemy that walks into range', () => {
  const game = quietGame();
  placeTower(game, 1, 1); // just below the first stretch of path
  spawnEnemy(game);
  step(game, 0.1);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.kills, 1);
  assert.equal(game.shots.length, 1);
  assert.equal(game.lives, START_LIVES);
});
