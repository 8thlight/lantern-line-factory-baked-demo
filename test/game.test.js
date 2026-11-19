import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_LIVES, createGame, placeTower, spawnEnemy, step } from '../src/game.js';
import { WAYPOINTS, pathLength } from '../src/path.js';
import { LANTERN, createTower } from '../src/tower.js';

// A game whose waves hold no ghosts, so each test controls its enemies.
// Its wave number stays at 1: step() never advances past a wave of no ghosts.
function quietGame(options) {
  return createGame({ ...options, waveSize: 0 });
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

test('a wave spawns one ghost at once, then one per interval, and no more than its size', () => {
  const game = createGame({ waveSize: 2, spawnInterval: 1 });
  step(game, 0.01);
  assert.equal(game.enemies.length, 1);
  step(game, 0.5);
  assert.equal(game.enemies.length, 1);
  step(game, 0.5);
  assert.equal(game.enemies.length, 2);
  step(game, 1);
  assert.equal(game.enemies.length, 2);
});

test('the wave number moves from 1 to 2 only after wave 1 has spawned out and its ghosts are gone', () => {
  const game = createGame({ waveSize: 2, spawnInterval: 1 });
  assert.equal(game.wave, 1);
  step(game, 0.01);
  assert.equal(game.enemies.length, 1);
  assert.equal(game.wave, 1); // still spawning
  step(game, 1);
  assert.equal(game.enemies.length, 2);
  assert.equal(game.wave, 1); // spawned out, but its ghosts are on the board
  step(game, pathLength(WAYPOINTS) / game.enemies[0].speed + 0.1);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.lives, START_LIVES - 2);
  assert.equal(game.wave, 2); // both leaked, so the board is clear
});

test('the wave number moves from 1 to 2 only when the lanterns banish the last ghost of wave 1', () => {
  const game = createGame({ waveSize: 2, spawnInterval: 1 });
  // Three lanterns on the free cells hugging the path's first cell, wherever the path starts:
  // each is within range of the spawn point, so three beams banish a 3-health ghost in one step.
  const start = WAYPOINTS[0];
  for (const [dc, dr] of [[0, -1], [1, -1], [0, 1], [1, 1], [-1, -1], [-1, 1]]) {
    if (game.towers.length < 3) placeTower(game, start.col + dc, start.row + dr);
  }
  assert.equal(game.towers.length, 3);

  step(game, 0.01);
  assert.equal(game.kills, 1);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.wave, 1); // the board is clear, but wave 1 has a ghost still to come

  step(game, 0.5);
  assert.equal(game.wave, 1);

  step(game, 0.5);
  assert.equal(game.kills, 2);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.lives, START_LIVES);
  assert.equal(game.wave, 2); // spawned out and banished, so the next wave starts
});

test('a wave of no ghosts keeps the wave number where it is', () => {
  const game = quietGame();
  for (let i = 0; i < 5; i++) step(game, 1);
  assert.equal(game.wave, 1);
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

test("a tower kind with no damage of its own hits for the lantern's damage, and one with its own keeps it", () => {
  const tower = createTower(1, 1, { range: LANTERN.range, cooldown: LANTERN.cooldown });
  assert.equal(tower.damage, LANTERN.damage);
  assert.equal(createTower(1, 1, { ...LANTERN, damage: LANTERN.damage + 1 }).damage, LANTERN.damage + 1);
});
