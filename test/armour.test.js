import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, spawnBoss, spawnEnemy, step, waveSpawner } from '../src/game.js';
import { createEnemy, damageEnemy } from '../src/enemy.js';
import { FROST } from '../src/tower.js';
import { WAVES } from '../src/waves.js';
import { drawGhost } from '../src/render.js';
import { THEME } from '../src/theme.js';
import { WAYPOINTS } from '../src/path.js';

const ARMOURED_WAVE_4 = [0, 0, 1, 0, 0, 1, 0, 0];

// A game started at wave `n`, its spawner that wave's.
function atWave(n, options = {}) {
  const game = createGame({ lives: 1000, ...options });
  game.wave = n;
  game.spawner = waveSpawner(game, n);
  return game;
}

// The armour of each plain ghost wave `n` sends, spawned in order through spawnEnemy.
function plainArmour(options, n) {
  const game = atWave(n, options);
  return Array.from({ length: WAVES[n - 1].count }, () => spawnEnemy(game).armour);
}

const zeros = (n) => Array(WAVES[n - 1].count).fill(0);

// The health each hit takes from a fresh ghost of 10 health made by `make`.
function taken(make) {
  return [1, 3, 0.5].map((amount) => {
    const enemy = make();
    damageEnemy(enemy, amount);
    return 10 - enemy.health;
  });
}

// A canvas stand-in that records each stroke with the stroke style and line width it was made under.
function strokes(enemy) {
  const calls = [];
  const ctx = new Proxy(
    {},
    {
      get: (target, name) => (name in target ? target[name] : (...args) => calls.push({ name, args, strokeStyle: target.strokeStyle, lineWidth: target.lineWidth })),
    },
  );
  drawGhost(ctx, enemy);
  return calls.filter((c) => c.name === 'stroke').map((c) => [c.strokeStyle, c.lineWidth]);
}

test('on normal the eight plain ghosts of wave 4 have armour 0, 0, 1, 0, 0, 1, 0, 0', () => {
  assert.deepEqual(plainArmour({ difficulty: 'normal' }, 4), ARMOURED_WAVE_4);
});

test("on normal the tick sends wave 4's ghosts armoured in spawn order", () => {
  const game = atWave(4, { difficulty: 'normal' });
  const count = ARMOURED_WAVE_4.length;
  for (let i = 0; i < 2000 && game.spawner.spawned < count; i++) step(game, 0.01);
  assert.equal(game.spawner.spawned, count);
  assert.deepEqual(
    game.enemies.map((e) => e.armour),
    ARMOURED_WAVE_4,
  );
});

test('on hard the plain ghosts of wave 4 are armoured as on normal, and none of wave 3', () => {
  assert.deepEqual([plainArmour({ difficulty: 'hard' }, 3), plainArmour({ difficulty: 'hard' }, 4)], [zeros(3), ARMOURED_WAVE_4]);
});

test('on normal no ghost of waves 1 to 3 has armour', () => {
  for (const n of [1, 2, 3]) assert.deepEqual(plainArmour({ difficulty: 'normal' }, n), zeros(n));
});

test('on normal the boss of wave 5 has armour 0', () => {
  const game = atWave(5, { difficulty: 'normal' });
  const plain = Array.from({ length: WAVES[4].count }, () => spawnEnemy(game).armour);
  const boss = spawnBoss(game);
  assert.deepEqual([boss.boss, boss.armour], [true, 0]);
  assert.deepEqual(plain, [0, 0, 1, 0, 0, 1, 0, 0, 1]);
});

test('on easy, and with no difficulty, no ghost of any wave has armour', () => {
  for (const options of [{ difficulty: 'easy' }, {}]) {
    for (let n = 1; n <= WAVES.length; n++) assert.deepEqual(plainArmour(options, n), zeros(n));
  }
});

test('a hit of 1, 3 and 0.5 takes 0.5, 2 and 0.5 from an armoured ghost', () => {
  assert.deepEqual(
    taken(() => createEnemy({ id: 1, waypoints: WAYPOINTS, health: 10, armour: 1 })),
    [0.5, 2, 0.5],
  );
});

test('each hit takes its full amount from a ghost with no armour', () => {
  assert.deepEqual(
    taken(() => createEnemy({ id: 1, waypoints: WAYPOINTS, health: 10, armour: 0 })),
    [1, 3, 0.5],
  );
  assert.deepEqual(
    taken(() => {
      const enemy = createEnemy({ id: 1, waypoints: WAYPOINTS, health: 10 });
      delete enemy.armour;
      return enemy;
    }),
    [1, 3, 0.5],
  );
});

test("a frost tower's hit on an armoured ghost slows it", () => {
  // A quiet game with a frost tower at (1, 1), centre (60, 60), in reach of the path's start at (20, 100).
  const game = createGame({ difficulty: 'normal', waveSize: 0 });
  assert.equal(placeTower(game, 1, 1, FROST), true);
  const ghost = createEnemy({ id: 1, waypoints: WAYPOINTS, health: 5, armour: 1 });
  game.enemies.push(ghost);
  step(game, 1 / 16);
  assert.deepEqual([ghost.health, ghost.slow, ghost.slowLeft > 0], [4.5, FROST.slow, true]);
});

test("an armoured ghost's outline is stroked in THEME.armour at 2 pixels; a plain ghost's is not", () => {
  const armoured = createEnemy({ id: 1, waypoints: WAYPOINTS, armour: 1 });
  const plain = createEnemy({ id: 2, waypoints: WAYPOINTS });
  assert.deepEqual(strokes(armoured), [
    [THEME.armour, 2],
    [THEME.ghostSheen, 2],
  ]);
  assert.deepEqual(strokes(plain), [
    [THEME.ghostEdge, 1.6],
    [THEME.ghostSheen, 2],
  ]);
});

test('THEME.armour is #c9ced6', () => {
  assert.equal(THEME.armour, '#c9ced6');
});
