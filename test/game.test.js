import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_LIVES, createGame, placeTower, spawnEnemy, step } from '../src/game.js';
import { WAYPOINTS, pathLength } from '../src/path.js';
import { LANTERN } from '../src/tower.js';

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

test('a 3-health ghost beside a lantern survives the first shot and is gone after the third', () => {
  const game = quietGame();
  placeTower(game, 1, 1); // just below the first stretch of path
  const enemy = spawnEnemy(game);
  assert.equal(enemy.health, 3);
  const reload = LANTERN.cooldown + 0.05; // each step fires exactly one beam

  step(game, 0.1);
  assert.equal(game.shots.length, 1);
  assert.deepEqual(game.enemies, [enemy]);
  assert.equal(enemy.health, 2);
  assert.equal(game.kills, 0);

  step(game, reload);
  assert.deepEqual(game.enemies, [enemy]);
  assert.equal(enemy.health, 1);
  assert.equal(game.kills, 0);

  step(game, reload);
  assert.equal(enemy.health, 0);
  assert.deepEqual(game.enemies, []);
  assert.equal(game.kills, 1);
  assert.equal(game.lives, START_LIVES);
});
