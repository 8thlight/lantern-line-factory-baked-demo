import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, rangePreview, towerAt } from '../src/game.js';
import { cellCenter } from '../src/path.js';
import { draw } from '../src/render.js';
import { THEME } from '../src/theme.js';
import { LANTERN } from '../src/tower.js';

const GRASS = { col: 3, row: 5 };
const PATH = { col: 0, row: 2 };

// A 2D context that records every call and every property set, and stubs the rest.
function recordingContext() {
  const calls = [];
  const props = {};
  const ctx = new Proxy(props, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => calls.push({ method: key, args, style: { ...target } });
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
  return { ctx, calls };
}

test('towerAt finds a placed tower and returns null on an empty cell', () => {
  const game = createGame();
  placeTower(game, GRASS.col, GRASS.row);
  assert.equal(towerAt(game, GRASS.col, GRASS.row), game.towers[0]);
  assert.equal(towerAt(game, GRASS.col + 1, GRASS.row), null);
});

test('rangePreview over a placed tower returns its centre and its range', () => {
  const game = createGame();
  placeTower(game, GRASS.col, GRASS.row);
  const tower = game.towers[0];
  tower.range = LANTERN.range + 37;
  assert.deepEqual(rangePreview(game, GRASS), { x: tower.x, y: tower.y, radius: tower.range });
});

test('rangePreview over empty grass returns that cell centre and the lantern range', () => {
  const game = createGame();
  assert.deepEqual(rangePreview(game, GRASS), { ...cellCenter(GRASS), radius: LANTERN.range });
});

test('rangePreview over a path cell, off the map, or with no hover, returns null', () => {
  const game = createGame();
  assert.equal(rangePreview(game, PATH), null);
  assert.equal(rangePreview(game, { col: -1, row: GRASS.row }), null);
  assert.equal(rangePreview(game, null), null);
});

test('draw strokes the range ring in the theme colour while a tower is hovered', () => {
  const game = createGame();
  placeTower(game, GRASS.col, GRASS.row);
  const tower = game.towers[0];
  const { ctx, calls } = recordingContext();
  draw(ctx, game, { ...GRASS, ok: false });

  const ring = calls.findIndex(
    (c) => c.method === 'arc' && c.args[0] === tower.x && c.args[1] === tower.y && c.args[2] === tower.range,
  );
  assert.notEqual(ring, -1, 'an arc at the tower centre with its range');
  const stroke = calls.slice(ring).find((c) => c.method === 'stroke');
  assert.ok(stroke, 'the ring is stroked');
  assert.equal(stroke.style.strokeStyle, THEME.rangeRing);
});

test('draw draws no range ring with no hover', () => {
  const game = createGame();
  placeTower(game, GRASS.col, GRASS.row);
  const { ctx, calls } = recordingContext();
  draw(ctx, game, null);
  assert.ok(!calls.some((c) => c.method === 'arc' && c.args[2] === LANTERN.range));
});
