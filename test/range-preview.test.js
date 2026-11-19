import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, rangePreview, towerAt } from '../src/game.js';
import { BRAZIER, LANTERN } from '../src/tower.js';
import { draw } from '../src/render.js';
import { THEME } from '../src/theme.js';

// Board facts: TILE 40; (1, 1) and (3, 1) are grass, centred at (60, 60) and (140, 60);
// (2, 2) lies on the path's first stretch.

const STYLES = ['fillStyle', 'strokeStyle', 'lineWidth'];

// A canvas stand-in that records each call with the styles and line dash as they stand at it;
// save/restore keep a stack of them as a canvas does.
function recordingContext() {
  const calls = [];
  const styles = { fillStyle: '', strokeStyle: '', lineWidth: 1, dash: [] };
  const stack = [];
  const methods = {
    save: () => stack.push({ ...styles }),
    restore: () => Object.assign(styles, stack.pop()),
    setLineDash: (dash) => {
      styles.dash = [...dash];
    },
    createRadialGradient: () => ({ gradient: true, addColorStop() {} }),
    createLinearGradient: () => ({ gradient: true, addColorStop() {} }),
  };
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name in styles) return styles[name];
        if (name in target) return target[name];
        return (...args) => {
          const result = methods[name]?.(...args);
          calls.push({ name, args, ...styles });
          return result;
        };
      },
      set(target, name, value) {
        if (STYLES.includes(name)) styles[name] = value;
        else target[name] = value;
        return true;
      },
    },
  );
}

const quietGame = () => createGame({ waveSize: 0 });
const ringStrokes = (ctx) => ctx.calls.filter((c) => c.name === 'stroke' && c.strokeStyle === THEME.rangeRing);

test('towerAt finds a placed tower and returns null on an empty cell', () => {
  const game = quietGame();
  placeTower(game, 1, 1);
  assert.equal(towerAt(game, 1, 1), game.towers[0]);
  assert.equal(towerAt(game, 3, 1), null);
});

test('rangePreview over a placed tower returns its centre and its range', () => {
  const game = quietGame();
  placeTower(game, 1, 1);
  placeTower(game, 3, 1, BRAZIER);
  assert.deepEqual(rangePreview(game, { col: 1, row: 1, ok: false }), { x: 60, y: 60, radius: LANTERN.range });
  // The placed tower wins over the kind the player holds.
  assert.deepEqual(rangePreview(game, { col: 3, row: 1, ok: false, kind: LANTERN }), {
    x: 140,
    y: 60,
    radius: BRAZIER.range,
  });
});

test('rangePreview over empty grass returns the range of the kind that would be placed', () => {
  const game = quietGame();
  assert.deepEqual(rangePreview(game, { col: 3, row: 1, ok: true }), { x: 140, y: 60, radius: LANTERN.range });
  assert.deepEqual(rangePreview(game, { col: 3, row: 1, ok: true, kind: BRAZIER }), {
    x: 140,
    y: 60,
    radius: BRAZIER.range,
  });
});

test('rangePreview is null on a path cell, off the board and with no hover', () => {
  const game = quietGame();
  assert.deepEqual(
    [rangePreview(game, { col: 2, row: 2, ok: false }), rangePreview(game, { col: -1, row: 0, ok: false }), rangePreview(game, null)],
    [null, null, null],
  );
});

// The ring as the Main artboard draws it (design/screens.html:204): #f2c14e, an opaque
// 1.5px stroke dashed 6 on 6 off, over a fill at 0.07.
test('the range ring tokens follow the Main artboard', () => {
  assert.deepEqual([THEME.rangeRing, THEME.rangeFill], ['#f2c14e', 'rgba(242, 193, 78, 0.07)']);
});

test('draw strokes the ring dashed and faint, and leaks no dash into what follows', () => {
  const game = quietGame();
  const ctx = recordingContext();
  draw(ctx, game, { col: 3, row: 1, ok: true });

  const arcs = ctx.calls.filter((c) => c.name === 'arc');
  assert.deepEqual(arcs.map((c) => c.args), [[140, 60, LANTERN.range, 0, Math.PI * 2]]);
  const fills = ctx.calls.filter((c) => c.name === 'fill');
  assert.deepEqual(fills.map((c) => c.fillStyle), [THEME.rangeFill]);
  const [ring] = ringStrokes(ctx);
  assert.deepEqual([ring.lineWidth, ring.dash], [1.5, [6, 6]]);
  assert.deepEqual(ctx.dash, []);
});

test('draw strokes no ring over a path cell', () => {
  const path = recordingContext();
  draw(path, quietGame(), { col: 2, row: 2, ok: false });
  const grass = recordingContext();
  draw(grass, quietGame(), { col: 3, row: 1, ok: true });
  assert.deepEqual([ringStrokes(path).length, ringStrokes(grass).length], [0, 1]);
});
