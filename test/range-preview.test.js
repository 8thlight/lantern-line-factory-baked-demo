import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, rangePreview, towerAt } from '../src/game.js';
import { cellCenter } from '../src/path.js';
import { draw } from '../src/render.js';
import { THEME } from '../src/theme.js';
import { LANTERN } from '../src/tower.js';

const GRASS = { col: 3, row: 5 };
const PATH = { col: 0, row: 2 };

// A 2D context that records every call with the styles as they stand at it, and stubs the rest.
// Gradients are stubbed too, so draw runs through the lantern's pool as on a real canvas.
function recordingContext() {
  const calls = [];
  const props = {};
  const gradient = () => ({ addColorStop() {} });
  const ctx = new Proxy(props, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        calls.push({ method: key, args, style: { ...target } });
        if (key === 'createRadialGradient' || key === 'createLinearGradient') return gradient();
        return undefined;
      };
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
  return { ctx, calls };
}

// Every arc drawn at a radius, as [x, y, radius].
const arcsOf = (calls, radius) =>
  calls.filter((c) => c.method === 'arc' && c.args[2] === radius).map((c) => c.args.slice(0, 3));

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

test('rangePreview over empty grass still returns the lantern range once the round is over', () => {
  const game = createGame();
  game.status = 'lost';
  assert.deepEqual(rangePreview(game, GRASS), { ...cellCenter(GRASS), radius: LANTERN.range });
});

test('rangePreview over a path cell, off the map, or with no hover, returns null', () => {
  const game = createGame();
  assert.deepEqual(rangePreview(game, GRASS), { ...cellCenter(GRASS), radius: LANTERN.range });
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

  assert.deepEqual(arcsOf(calls, tower.range), [[tower.x, tower.y, tower.range]]);
  const ring = calls.findIndex((c) => c.method === 'arc' && c.args[2] === tower.range);
  const stroke = calls.slice(ring).find((c) => c.method === 'stroke');
  assert.equal(stroke?.style.strokeStyle, THEME.rangeRing);
  const fill = calls.slice(ring).find((c) => c.method === 'fill');
  assert.equal(fill?.style.fillStyle, THEME.rangeFill);
});

test('draw strokes the lantern range ring at the centre of hovered empty grass', () => {
  const game = createGame();
  const { ctx, calls } = recordingContext();
  draw(ctx, game, { ...GRASS, ok: true });
  const { x, y } = cellCenter(GRASS);
  assert.deepEqual(arcsOf(calls, LANTERN.range), [[x, y, LANTERN.range]]);
});

test('draw draws a range ring only while a cell that has one is hovered', () => {
  const game = createGame();
  placeTower(game, GRASS.col, GRASS.row);
  const rings = (hover) => {
    const { ctx, calls } = recordingContext();
    draw(ctx, game, hover);
    return arcsOf(calls, LANTERN.range).length;
  };
  assert.equal(rings({ ...GRASS, ok: false }), 1);
  assert.equal(rings(null), 0);
  assert.equal(rings({ ...PATH, ok: false }), 0);
});
