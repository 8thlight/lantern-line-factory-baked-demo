import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, spawnEnemy, step } from '../src/game.js';
import { ENEMY_HEALTH } from '../src/enemy.js';
import { TILE } from '../src/path.js';
import { BRAZIER, FROST, LANTERN, createTower, kindForKey } from '../src/tower.js';
import { splashTargets } from '../src/targeting.js';
import { SPRITES, draw, drawBrazier } from '../src/render.js';
import { THEME } from '../src/theme.js';

test('splashTargets returns the enemies within the radius, one exactly on the edge included and one just outside left out', () => {
  const center = { x: 0, y: 0 };
  const inside = { id: 1, x: 10, y: 20 };
  const edge = { id: 2, x: 30, y: 40 }; // exactly 50 away
  const outside = { id: 3, x: 30, y: 40.1 }; // just over 50 away
  assert.deepEqual(splashTargets(center, [inside, edge, outside], 50), [inside, edge]);
});

test('splashTargets on an empty board returns an empty list', () => {
  assert.deepEqual(splashTargets({ x: 0, y: 0 }, [], 50), []);
});

test('createTower(col, row, BRAZIER) carries the brazier range, cooldown, damage and splash', () => {
  const tower = createTower(1, 1, BRAZIER);
  assert.deepEqual(
    [tower.range, tower.cooldown, tower.damage, tower.splash],
    [BRAZIER.range, BRAZIER.cooldown, BRAZIER.damage, BRAZIER.splash],
  );
});

test('the brazier reaches less far and fires more slowly than the lantern, and only it splashes', () => {
  assert.equal(BRAZIER.range < LANTERN.range, true);
  assert.equal(BRAZIER.cooldown > LANTERN.cooldown, true);
  assert.equal(BRAZIER.splash > 0, true);
  assert.equal(createTower(1, 1).splash, 0);
});

test('key 1 chooses the lantern, key 2 the brazier, key 3 frost, and any other key keeps the kind chosen', () => {
  assert.deepEqual(
    [kindForKey('1', BRAZIER), kindForKey('2', LANTERN), kindForKey('3', BRAZIER), kindForKey('a', LANTERN)],
    [LANTERN, BRAZIER, FROST, LANTERN],
  );
});

// A quiet game with a tower of `kind` at (1, 1), centre (60, 60), beside the path's first
// stretch on row 2 (y = 100), and three ghosts bunched at x = 20, 30 and 40 on that stretch.
function crowdBeside(kind, health = ENEMY_HEALTH) {
  const game = createGame({ waveSize: 0 });
  assert.equal(placeTower(game, 1, 1, kind), true);
  const ghosts = [0, 10, 20].map((distance) => {
    const ghost = spawnEnemy(game);
    ghost.distance = distance;
    ghost.health = ghost.maxHealth = health;
    return ghost;
  });
  step(game, 0.01);
  return { game, ghosts };
}

test('a brazier firing at a group of three close ghosts damages all three', () => {
  const { game, ghosts } = crowdBeside(BRAZIER);
  assert.equal(game.shots.length, 1);
  assert.deepEqual(
    ghosts.map((g) => g.health),
    [ENEMY_HEALTH - BRAZIER.damage, ENEMY_HEALTH - BRAZIER.damage, ENEMY_HEALTH - BRAZIER.damage],
  );
});

test('a lantern in the same spot damages one of the three', () => {
  const { game, ghosts } = crowdBeside(LANTERN);
  assert.equal(game.shots.length, 1);
  const healths = ghosts.map((g) => g.health).sort((a, b) => a - b);
  assert.deepEqual(healths, [ENEMY_HEALTH - LANTERN.damage, ENEMY_HEALTH, ENEMY_HEALTH]);
});

test('a brazier that banishes a group counts each ghost once', () => {
  const { game } = crowdBeside(BRAZIER, 1);
  assert.deepEqual(game.enemies, []);
  assert.equal(game.kills, 3);
});

test('a lantern hits only its target, even with a second ghost standing on the same spot', () => {
  const game = createGame({ waveSize: 0 });
  placeTower(game, 1, 1, LANTERN);
  const ghosts = [spawnEnemy(game), spawnEnemy(game)];
  step(game, 0.01);
  const healths = ghosts.map((g) => g.health).sort((a, b) => a - b);
  assert.deepEqual(healths, [ENEMY_HEALTH - LANTERN.damage, ENEMY_HEALTH]);
});

test('placeTower with no kind places a lantern', () => {
  const game = createGame({ waveSize: 0 });
  placeTower(game, 1, 1);
  assert.deepEqual([game.towers[0].range, game.towers[0].splash], [LANTERN.range, 0]);
});

// A '#rrggbb' colour's hue in degrees and its lightness from 0 to 1.
function hueAndLightness(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return { hue: 0, lightness };
  const d = max - min;
  let hue;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return { hue: (hue * 60 + 360) % 360, lightness };
}

test('drawBrazier draws an orange square centred on the tower, in THEME colours only', () => {
  const calls = [];
  const ctx = new Proxy(
    {},
    {
      get: (target, name) => (name in target ? target[name] : (...args) => calls.push({ name, args, fillStyle: target.fillStyle })),
    },
  );
  const tower = createTower(1, 1, BRAZIER);
  drawBrazier(ctx, tower);
  const squares = calls.filter((c) => c.name === 'fillRect');
  const side = TILE * 0.6;
  assert.deepEqual(squares[0], { name: 'fillRect', args: [tower.x - side / 2, tower.y - side / 2, side, side], fillStyle: THEME.lanternPaper });
  assert.deepEqual(
    squares.map((c) => Object.values(THEME).includes(c.fillStyle)),
    squares.map(() => true),
  );
  assert.equal(SPRITES.drawBrazier, drawBrazier);
  // The body is orange (a hue between red at 0 and yellow at 60, nearer neither end), and its core is lighter.
  const body = hueAndLightness(squares[0].fillStyle);
  const core = hueAndLightness(squares[1].fillStyle);
  assert.deepEqual([body.hue >= 15, body.hue <= 45, core.lightness > body.lightness], [true, true, true]);
});

test('draw gives a brazier its square and no lantern pool, and a lantern its pool and body', () => {
  const counts = { drawLanternLight: 0, drawLanternBody: 0, drawBrazier: 0 };
  const sprites = { ...SPRITES };
  for (const name of Object.keys(counts)) sprites[name] = () => (counts[name] += 1);
  const game = createGame({ waveSize: 0 });
  placeTower(game, 1, 1, BRAZIER);
  placeTower(game, 3, 1, LANTERN);
  const ctx = new Proxy({}, { get: (target, name) => (name in target ? target[name] : () => ctx) });
  draw(ctx, game, null, sprites);
  assert.deepEqual(counts, { drawLanternLight: 1, drawLanternBody: 1, drawBrazier: 1 });
});
