import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { advanceEnemy, createEnemy, slowEnemy } from '../src/enemy.js';
import { createGame, placeTower, placementError, spawnEnemy, step } from '../src/game.js';
import { WAYPOINTS } from '../src/path.js';
import { FROST, LANTERN, createTower, kindForKey } from '../src/tower.js';
import { SPRITES, draw } from '../src/render.js';

// A game with no automatic spawning, so each test controls its enemies.
function quietGame(options) {
  const game = createGame(options);
  game.spawnTimer = Infinity;
  return game;
}

const ghost = () => createEnemy({ id: 1, waypoints: WAYPOINTS });

test('a ghost hit by frost covers half the distance in the next second', () => {
  const hit = ghost();
  const unhit = ghost();
  slowEnemy(hit, FROST.slow, FROST.slowFor);
  advanceEnemy(hit, WAYPOINTS, 1);
  advanceEnemy(unhit, WAYPOINTS, 1);
  assert.equal(hit.distance, unhit.distance / 2);
});

test('after slowFor seconds without another hit the ghost is back to full speed', () => {
  const enemy = ghost();
  slowEnemy(enemy, FROST.slow, FROST.slowFor);
  advanceEnemy(enemy, WAYPOINTS, FROST.slowFor);
  assert.equal(enemy.slow, 1);
  assert.equal(enemy.slowLeft, 0);
  const before = enemy.distance;
  advanceEnemy(enemy, WAYPOINTS, 1);
  assert.equal(enemy.distance - before, enemy.speed * 1);
});

test('two frost hits in a row leave the slow factor, not its square', () => {
  const enemy = ghost();
  slowEnemy(enemy, FROST.slow, FROST.slowFor);
  advanceEnemy(enemy, WAYPOINTS, 0.5);
  slowEnemy(enemy, FROST.slow, FROST.slowFor);
  assert.equal(enemy.slow, FROST.slow);
  assert.equal(enemy.slowLeft, FROST.slowFor);
  const before = enemy.distance;
  advanceEnemy(enemy, WAYPOINTS, 1);
  assert.equal(enemy.distance - before, enemy.speed * 0.5);
});

test('a frost tower costs 40 gold and is refused when gold is short', () => {
  assert.equal(FROST.cost, 40);
  const poor = quietGame({ gold: 30 });
  assert.equal(placementError(poor, 1, 0, FROST), 'gold');
  assert.equal(placeTower(poor, 1, 0, FROST), false);
  assert.equal(poor.towers.length, 0);
  assert.equal(poor.gold, 30);

  const game = quietGame();
  assert.equal(placementError(game, 1, 0, FROST), null);
  assert.equal(placeTower(game, 1, 0, FROST), true);
  assert.equal(game.gold, 10);
});

test('a frost tower in the game loop slows a ghost and does not kill it', () => {
  const game = quietGame();
  placeTower(game, 1, 1, FROST); // just above the first stretch of path
  const enemy = spawnEnemy(game);
  step(game, 0.1);
  assert.deepEqual(game.enemies, [enemy]);
  assert.equal(enemy.slow, FROST.slow);
  assert.equal(game.kills, 0);
  assert.equal(game.shots.length, 1);
  assert.equal(game.shots[0].frost, true);
});

test('key 3 picks frost, key 1 the lantern, and another key keeps the kind', () => {
  assert.equal(kindForKey('3', LANTERN), FROST);
  assert.equal(kindForKey('1', FROST), LANTERN);
  assert.equal(kindForKey('x', FROST), FROST);
  const tower = createTower(1, 0, FROST);
  assert.equal(tower.kind, FROST);
  assert.equal(tower.slow, FROST.slow);
  assert.equal(tower.slowFor, FROST.slowFor);
});

test('draw names the kind it is handed, by name and cost, and names none when handed no kind', () => {
  const texts = [];
  const ctx = new Proxy({}, { get: (target, name) => (name === 'fillText' ? (text) => texts.push(text) : () => ctx) });
  const game = quietGame();
  draw(ctx, game, null, SPRITES, FROST);
  const named = texts.slice();
  texts.length = 0;
  draw(ctx, game, null);
  assert.deepEqual(named, [...texts, `${FROST.name} (${FROST.cost})`]);
});

// src/main.js against stand-ins for the DOM: a canvas whose context keeps the text each
// frame draws, a window that keeps its keydown handler, and a frame queue.
async function bootMain() {
  const keys = {};
  const frames = [];
  let texts = [];
  const ctx = new Proxy({}, { get: (target, name) => (name === 'fillText' ? (text) => texts.push(text) : () => ctx), set: () => true });
  const canvas = { addEventListener() {}, getContext: () => ctx };
  const saved = { document: globalThis.document, window: globalThis.window, requestAnimationFrame: globalThis.requestAnimationFrame };
  after(() => Object.assign(globalThis, saved));
  globalThis.document = { getElementById: () => canvas };
  globalThis.window = { addEventListener: (type, handler) => (keys[type] = handler) };
  globalThis.requestAnimationFrame = (frame) => frames.push(frame);
  await import('../src/main.js?frost');
  return {
    key: (key) => keys.keydown({ key, repeat: false }),
    frame() {
      texts = [];
      frames.shift()(performance.now());
      return texts;
    },
  };
}

test('the running game names the kind a key picks in the HUD, and names none before a pick', async () => {
  const game = await bootMain();
  const bar = game.frame();
  game.key('3');
  assert.deepEqual(game.frame(), [...bar, `${FROST.name} (${FROST.cost})`]);
  game.key('1');
  assert.deepEqual(game.frame(), [...bar, `${LANTERN.name} (${LANTERN.cost})`]);
});
