import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, placementError, upgradeTower } from '../src/game.js';
import { LANTERN, towerById } from '../src/tower.js';
import { CANVAS_HEIGHT, HUD_HEIGHT, boardCellAt, cardButtonAt, cardButtons, cardRect } from '../src/hud.js';
import { SPRITES, draw } from '../src/render.js';
import { THEME } from '../src/theme.js';
import { COLS, ROWS, TILE } from '../src/path.js';

// A canvas stand-in that records each call with the fill colour it was made under.
function recordingContext() {
  const calls = [];
  let style = { fillStyle: '', strokeStyle: '' };
  const stack = [];
  const methods = {
    save: () => stack.push({ ...style }),
    restore: () => (style = stack.pop()),
    createRadialGradient: () => ({ addColorStop() {} }),
  };
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name === 'fillStyle' || name === 'strokeStyle') return style[name];
        if (name in target) return target[name];
        return (...args) => {
          calls.push({ name, args, fillStyle: style.fillStyle });
          return methods[name]?.(...args);
        };
      },
      set(target, name, value) {
        if (name === 'fillStyle' || name === 'strokeStyle') style[name] = value;
        else target[name] = value;
        return true;
      },
    },
  );
}

const texts = (ctx) => ctx.calls.filter((c) => c.name === 'fillText');

// A quiet game, no ghosts, with one lantern placed at (col, row).
function withLantern(col, row, options = {}) {
  const game = createGame({ waveSize: 0, gold: 1000, ...options });
  assert.equal(placeTower(game, col, row, LANTERN), true);
  return game;
}

test('cardButtons gives two rectangles that do not overlap, each at least 44 by 28, inside the card and the canvas, for a corner tower and a mid-board one', () => {
  const checks = [[0, 0], [COLS - 1, ROWS - 1], [8, 5]].map(([col, row]) => {
    const tower = towerById(withLantern(col, row), 1);
    const card = cardRect(tower);
    const { upgrade, sell } = cardButtons(tower);
    return [
      upgrade.width >= 44,
      upgrade.height >= 28,
      sell.width >= 44,
      sell.height >= 28,
      upgrade.x + upgrade.width <= sell.x || sell.x + sell.width <= upgrade.x,
      ...[upgrade, sell].flatMap((b) => [b.x >= card.x, b.x + b.width <= card.x + card.width, b.y >= card.y, b.y + b.height <= card.y + card.height]),
      card.x >= 0,
      card.x + card.width <= COLS * TILE,
      card.y >= 0,
      card.y + card.height <= CANVAS_HEIGHT,
    ];
  });
  assert.deepEqual(checks, Array(3).fill(Array(17).fill(true)));

  const tower = towerById(withLantern(1, 1), 1);
  assert.deepEqual(cardRect(tower), { x: 84, y: 46, width: 300, height: 108 });
  assert.deepEqual(cardButtons(tower), {
    upgrade: { x: 94, y: 116, width: 136, height: 28 },
    sell: { x: 238, y: 116, width: 136, height: 28 },
  });
});

test('cardButtonAt returns upgrade and sell inside each, null on the card outside both and off the card', () => {
  const tower = towerById(withLantern(1, 1), 1);
  const points = [[162, 130], [306, 130], [234, 130], [100, 60], [600, 400]];
  assert.deepEqual(points.map(([x, y]) => cardButtonAt(tower, x, y)), ['upgrade', 'sell', null, null, null]);
  assert.equal(cardButtonAt(undefined, 162, 130), null);
});

test("drawing a selected tower's card draws Upgrade and Sell, Upgrade dimmed when refused", () => {
  const game = createGame({ waveSize: 0 }); // 50 gold
  placeTower(game, 1, 1, LANTERN);
  const ctx = recordingContext();
  draw(ctx, game, null, SPRITES, null, 1);
  assert.deepEqual(texts(ctx).slice(0, 7).map((c) => [c.args[0], c.fillStyle]), [
    ['Lantern · level 1', THEME.hudAccent],
    ['Range 2.5 tiles · 1 damage · targets nearest', THEME.hudInk],
    ['Press U to upgrade: 25 gold', THEME.hudAccent],
    ['Press S to sell: 10 gold', THEME.hudInk],
    ['Upgrade', THEME.hudInk],
    ['Sell', THEME.hudInk],
    ['Lives', THEME.hudMuted],
  ]);
  // What is drawn is what is pressed: each label at its button's centre, in board coordinates.
  assert.deepEqual(texts(ctx).slice(4, 6).map((c) => c.args.slice(1, 3)), [[162, 130 - HUD_HEIGHT], [306, 130 - HUD_HEIGHT]]);

  upgradeTower(game, 1); // 5 gold left, the next upgrade refused for gold
  const refused = recordingContext();
  draw(refused, game, null, SPRITES, null, 1);
  assert.deepEqual(texts(refused).slice(4, 6).map((c) => [c.args[0], c.fillStyle]), [['Upgrade', THEME.hudMuted], ['Sell', THEME.hudInk]]);
  assert.equal(texts(refused)[2].args[0], 'Needs 25 gold, you hold 5: banish more ghosts');
});

// src/main.js against stand-ins for the DOM, as test/sell.test.js boots it: the canvas keeps its
// handlers, the window its keydown, and each frame is run by hand.
const savedGlobals = { document: globalThis.document, window: globalThis.window, requestAnimationFrame: globalThis.requestAnimationFrame };
after(() => Object.assign(globalThis, savedGlobals));

// src/main.js picks each round's path with Math.random; 0 picks path 1, the path these clicks
// and hovers were written on.
const savedRandom = Math.random;
Math.random = () => 0;
after(() => (Math.random = savedRandom));

async function bootMain() {
  const handlers = {};
  const keys = {};
  const frames = [];
  let ctx = recordingContext();
  const canvas = {
    addEventListener: (type, handler) => (handlers[type] = handler),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: canvas.width, height: canvas.height }),
    getContext: () => new Proxy({}, { get: (t, name) => ctx[name], set: (t, name, value) => ((ctx[name] = value), true) }),
  };
  globalThis.document = { getElementById: () => canvas };
  globalThis.window = { addEventListener: (type, handler) => (keys[type] = handler) };
  globalThis.requestAnimationFrame = (frame) => frames.push(frame);
  await import('../src/main.js?card=1');
  keys.keydown({ key: 'Enter', repeat: false }); // past the start screen, into the round
  return {
    click: (col, row) => handlers.click({ clientX: col * TILE + TILE / 2, clientY: HUD_HEIGHT + row * TILE + TILE / 2 }),
    // A click at a canvas point, in canvas pixels.
    press: (x, y) => handlers.click({ clientX: x, clientY: y }),
    // Run the next queued frame and return the texts it drew.
    frame() {
      ctx = recordingContext();
      frames.shift()(performance.now());
      return texts(ctx).map((c) => c.args[0]);
    },
  };
}

test('in the browser, a click on Upgrade upgrades the selected tower once and a refused one changes nothing; a click on Sell sells it, clears the selection and places nothing', async () => {
  const game = await bootMain();
  game.click(1, 1); // places a lantern: 30 gold left, nothing selected
  game.click(1, 1); // selects it
  game.press(162, 130); // Upgrade: level 2, 5 gold left
  const upgraded = [
    'Lantern · level 2',
    'Range 3 tiles · 2 damage · targets nearest',
    'Needs 25 gold, you hold 5: banish more ghosts',
    'Press S to sell: 22 gold',
    'Upgrade',
    'Sell',
    'Lives',
    '10',
    'Gold',
    '5',
  ];
  assert.deepEqual(game.frame().slice(0, 10), upgraded);
  game.press(162, 130); // refused: nothing changes, the tower stays selected
  assert.deepEqual(game.frame().slice(0, 10), upgraded);

  // The cell under Sell would take a lantern, so a click landing on it would buy one.
  assert.deepEqual([boardCellAt(306, 130), placementError(createGame({ difficulty: 'normal' }), 7, 2, LANTERN)], [{ col: 7, row: 2 }, null]);
  game.press(306, 130); // Sell: 5 + 22 gold, no card, no lantern bought on (7, 2)
  assert.deepEqual(game.frame().slice(0, 4), ['Lives', '10', 'Gold', '27']);
});
