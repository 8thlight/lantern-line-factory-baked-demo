import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, placementError, sellTower, sellValue, towerPrice, upgradeTower } from '../src/game.js';
import { LANTERN, createTower, towerById } from '../src/tower.js';
import { CANVAS_HEIGHT, HUD_HEIGHT, hudKey } from '../src/hud.js';
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

// A quiet game, no ghosts, with one lantern at (1, 1), off the path.
function withLantern(gold, options = {}) {
  const game = createGame({ waveSize: 0, gold, ...options });
  placeTower(game, 1, 1, LANTERN);
  return game;
}

test('a lantern placed for 20 gold has spent 20 and a sell value of 10; after a 25-gold upgrade, 45 and 22', () => {
  const game = withLantern(1000);
  const tower = towerById(game, 1);
  const before = [tower.spent, sellValue(tower)];
  upgradeTower(game, 1);
  assert.deepEqual([before, [tower.spent, sellValue(tower)]], [[20, 10], [45, 22]]);
});

test('a tower pushed by hand with no spent sells for 0, and an upgrade counts from 0', () => {
  const game = createGame({ waveSize: 0, gold: 1000 });
  game.towers.push({ id: game.nextTowerId++, ...createTower(1, 1) });
  const tower = towerById(game, 1);
  const before = sellValue(tower);
  upgradeTower(game, 1);
  assert.deepEqual([before, tower.spent, sellValue(tower)], [0, 25, 12]);
});

test('on normal a lantern placed at the stepped price remembers that price', () => {
  const game = createGame({ waveSize: 0, gold: 1000, difficulty: 'normal' });
  placeTower(game, 0, 0, LANTERN);
  placeTower(game, 1, 0, LANTERN);
  assert.deepEqual(game.towers.map((t) => t.spent), [20, 25]);
});

test('selling removes the tower, pays its sell value, returns null and frees the cell', () => {
  const game = withLantern(100);
  assert.equal(game.gold, 80);
  assert.equal(sellTower(game, 1), null);
  assert.deepEqual([game.towers.length, game.gold, placementError(game, 1, 1, LANTERN)], [0, 90, null]);
  assert.equal(placeTower(game, 1, 1, LANTERN), true);
});

test('on normal, with two lanterns placed, selling one makes the next lantern cost 25', () => {
  const game = createGame({ waveSize: 0, gold: 1000, difficulty: 'normal' });
  placeTower(game, 0, 0, LANTERN);
  placeTower(game, 1, 0, LANTERN);
  const before = towerPrice(game, LANTERN);
  assert.equal(sellTower(game, 1), null);
  assert.deepEqual([before, towerPrice(game, LANTERN)], [30, 25]);
});

test('an unknown id is refused with missing and nothing changes', () => {
  const game = withLantern(100);
  const kept = structuredClone([game.towers, game.gold]);
  assert.equal(sellTower(game, 9), 'missing');
  assert.deepEqual([game.towers, game.gold], kept);
  assert.equal(game.towers.length, 1);
});

test('a won, lost or ready game is refused with over and nothing changes', () => {
  for (const status of ['won', 'lost', 'ready']) {
    const game = withLantern(100);
    game.status = status;
    const kept = structuredClone([game.towers, game.gold]);
    assert.equal(sellTower(game, 1), 'over');
    assert.deepEqual([game.towers, game.gold], kept);
    assert.equal(game.towers.length, 1);
  }
});

test('hudKey returns sell for s and S', () => {
  assert.deepEqual(['s', 'S'].map(hudKey), ['sell', 'sell']);
});

test('the card of a selected lantern placed for 20 gold ends with Press S to sell: 10 gold', () => {
  const game = createGame({ waveSize: 0 });
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
});

test('the card grows by one line and its whole rectangle lies inside the canvas', () => {
  const corners = [[0, 0], [COLS - 1, 0], [0, ROWS - 1], [COLS - 1, ROWS - 1]];
  const cards = corners.map(([col, row]) => {
    const game = createGame({ waveSize: 0, gold: 1000 });
    placeTower(game, col, row, LANTERN);
    const ctx = recordingContext();
    draw(ctx, game, null, SPRITES, null, 1);
    const [x, y, width, height] = ctx.calls.find((c) => c.name === 'roundRect' && c.fillStyle === THEME.hudBg).args;
    return [height, x >= 0, x + width <= COLS * TILE, y + HUD_HEIGHT >= 0, y + HUD_HEIGHT + height <= CANVAS_HEIGHT];
  });
  assert.deepEqual(cards, Array(4).fill([108, true, true, true, true]));
});

// src/main.js against stand-ins for the DOM, as test/upgrade.test.js boots it: the canvas
// keeps its handlers, the window its keydown, and each frame is run by hand.
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
  await import('../src/main.js?sell=1');
  keys.keydown({ key: 'Enter', repeat: false }); // past the start screen, into the round
  return {
    click: (col, row) => handlers.click({ clientX: col * TILE + TILE / 2, clientY: HUD_HEIGHT + row * TILE + TILE / 2 }),
    key: (key, repeat = false) => keys.keydown({ key, repeat }),
    // Run the next queued frame and return the texts it drew.
    frame() {
      ctx = recordingContext();
      frames.shift()(performance.now());
      return texts(ctx).map((c) => c.args[0]);
    },
  };
}

test('in the browser, S sells the selected tower once per press, paused or not, and clears the selection', async () => {
  const game = await bootMain();
  game.click(1, 1); // places a lantern: 30 gold left, nothing selected
  game.click(1, 1); // selects it
  assert.deepEqual(game.frame().slice(0, 4), [
    'Lantern · level 1',
    'Range 2.5 tiles · 1 damage · targets nearest',
    'Press U to upgrade: 25 gold',
    'Press S to sell: 10 gold',
  ]);
  game.key('s', true); // a held key's repeat does nothing
  assert.deepEqual(game.frame().slice(0, 4), [
    'Lantern · level 1',
    'Range 2.5 tiles · 1 damage · targets nearest',
    'Press U to upgrade: 25 gold',
    'Press S to sell: 10 gold',
  ]);
  game.key('p'); // paused, the sale still goes through
  game.key('S');
  assert.deepEqual(game.frame().slice(0, 4), ['Lives', '10', 'Gold', '40']);
  game.click(1, 1); // the cell is free: a lantern is placed there, not a tower selected
  assert.deepEqual(game.frame().slice(0, 4), ['Lives', '10', 'Gold', '20']);
});
