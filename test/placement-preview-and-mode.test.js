import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower } from '../src/game.js';
import { LANTERN, toggleModeAt } from '../src/tower.js';
import { selectedModel } from '../src/hud.js';
import { SPRITES, draw } from '../src/render.js';
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

const quietGame = (status) => ({ ...createGame({ waveSize: 0 }), status });

// The pointed cell's fill, good or bad.
const hoverFills = (ctx) =>
  ctx.calls
    .filter((c) => c.name === 'fillRect' && (c.fillStyle === THEME.hover || c.fillStyle === THEME.hoverBad))
    .map((c) => c.args);

// Range rings: only drawRangeRing strokes THEME.rangeRing with the [6, 6] dash, so the card's
// undashed border is never counted.
const ringArcs = (ctx) =>
  ctx.calls
    .filter((c) => c.name === 'arc' && c.strokeStyle === THEME.rangeRing && c.dash.join() === '6,6')
    .map((c) => c.args.slice(0, 3));

function drawn(game, hover, selected = null) {
  const ctx = recordingContext();
  draw(ctx, game, hover, SPRITES, null, selected);
  return ctx;
}

function cardLines(game, id) {
  const ctx = recordingContext();
  draw(ctx, game, null, SPRITES, null, id);
  return ctx.calls.filter((c) => c.name === 'fillText').slice(0, 3).map((c) => c.args[0]);
}

test('a playing game draws the pointed cell and its range ring', () => {
  const ctx = drawn(quietGame('playing'), { col: 3, row: 1, ok: true });
  assert.deepEqual([hoverFills(ctx), ringArcs(ctx)], [[[120, 40, 40, 40]], [[140, 60, LANTERN.range]]]);
});

test('a ready, won or lost game draws neither, whatever cell is pointed', () => {
  for (const status of ['ready', 'won', 'lost']) {
    for (const hover of [{ col: 3, row: 1, ok: true }, { col: 2, row: 2, ok: false }]) {
      const ctx = drawn(quietGame(status), hover);
      assert.deepEqual([hoverFills(ctx), ringArcs(ctx)], [[], []], `${status} at (${hover.col}, ${hover.row})`);
    }
  }
});

test("off the board, a placed tower's preview ring is not drawn either", () => {
  const game = quietGame('playing');
  placeTower(game, 1, 1);
  assert.deepEqual(ringArcs(drawn(game, { col: 1, row: 1, ok: false })), [[60, 60, LANTERN.range]]);
  game.status = 'won';
  assert.deepEqual(ringArcs(drawn(game, { col: 1, row: 1, ok: false })), []);
});

test("the selected tower's own ring still draws off the board, pointed at or not", () => {
  const game = quietGame('playing');
  placeTower(game, 1, 1);
  game.status = 'lost';
  assert.deepEqual(
    [ringArcs(drawn(game, { col: 1, row: 1, ok: false }, 1)), ringArcs(drawn(game, { col: 3, row: 1, ok: true }, 1))],
    [[[60, 60, LANTERN.range]], [[60, 60, LANTERN.range]]],
  );
});

test("selectedModel returns the tower's targeting mode", () => {
  const game = quietGame('playing');
  placeTower(game, 1, 1);
  const modes = [selectedModel(game, 1).mode];
  toggleModeAt(game, 1, 1);
  modes.push(selectedModel(game, 1).mode);
  toggleModeAt(game, 1, 1);
  modes.push(selectedModel(game, 1).mode);
  assert.deepEqual(modes, ['nearest', 'first', 'nearest']);
});

test("the card's range line ends with the mode, and follows the toggle", () => {
  const game = quietGame('playing');
  placeTower(game, 1, 1);
  const before = cardLines(game, 1)[1];
  toggleModeAt(game, 1, 1);
  assert.deepEqual(
    [before, cardLines(game, 1)[1]],
    ['Range 2.5 tiles · 1 damage · targets nearest', 'Range 2.5 tiles · 1 damage · targets first'],
  );
});
