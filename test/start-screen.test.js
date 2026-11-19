import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { START_GOLD, createGame, restart, start, step } from '../src/game.js';
import { HUD_HEIGHT, PAUSE_BUTTON, START_BUTTON, startButtonAt, startKey } from '../src/hud.js';
import { draw } from '../src/render.js';
import { THEME } from '../src/theme.js';
import { TILE } from '../src/path.js';

// A context that records each call with the fillStyle it was made under.
function recordingContext() {
  let calls = [];
  const styles = {};
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name === 'clear') return () => (calls = []);
        if (name in styles) return styles[name];
        return (...args) => {
          calls.push({ name, args, fillStyle: styles.fillStyle });
          return String(name).startsWith('create') ? { addColorStop() {} } : undefined;
        };
      },
      set(target, name, value) {
        styles[name] = value;
        return true;
      },
    },
  );
}

const textsOf = (calls) => calls.filter((c) => c.name === 'fillText').map((c) => c.args[0]);
// Only the start screen's title and button text, in the order drawn.
const startTexts = (calls) => textsOf(calls).filter((t) => t === 'Lantern Line' || t === 'Start');
const TAGLINE = 'Light the lanterns. Stop the ghosts before they reach the gate.';
const HINT = 'or press Enter or Space';

const drawn = (state) => {
  const ctx = recordingContext();
  draw(ctx, state, null);
  return ctx.calls;
};

test('a game created ready is ready, and stepping it spawns nothing', () => {
  const game = createGame({ status: 'ready' });
  assert.equal(game.status, 'ready');
  step(game, 5);
  assert.deepEqual([game.status, game.enemies.length, game.wave], ['ready', 0, 1]);
});

test('start moves a ready game to playing, and the next step spawns the first ghost', () => {
  const game = createGame({ status: 'ready' });
  assert.equal(start(game), game);
  assert.equal(game.status, 'playing');
  step(game, 0.01);
  assert.equal(game.enemies.length, 1);
});

test('start on any other status changes nothing', () => {
  for (const status of ['playing', 'won', 'lost']) {
    const game = createGame();
    step(game, 0.01);
    game.status = status;
    const view = ({ status, wave, enemies, lives, gold }) => structuredClone({ status, wave, enemies, lives, gold });
    const before = view(game);
    start(game);
    assert.deepEqual(view(game), before);
  }
});

test('a game created without status starts playing', () => {
  assert.equal(createGame().status, 'playing');
});

test('restarting a game created ready gives a ready game', () => {
  const game = start(createGame({ status: 'ready', lives: 4 }));
  step(game, 0.01);
  game.status = 'lost';
  const fresh = restart(game);
  assert.deepEqual([fresh.status, fresh.lives], ['ready', 4]);
});

test('drawing a ready game draws the title and Start, a playing game neither', () => {
  const texts = textsOf(drawn(createGame({ status: 'ready' })));
  assert.deepEqual(startTexts(drawn(createGame({ status: 'ready' }))), ['Lantern Line', 'Start']);
  assert.equal(texts.includes(TAGLINE), true);
  assert.equal(texts.includes(HINT), true);
  assert.deepEqual(startTexts(drawn(createGame())), []);
  for (const status of ['won', 'lost']) assert.deepEqual(startTexts(drawn({ ...createGame(), status })), []);
});

test('a ready game draws no end card', () => {
  const texts = textsOf(drawn(createGame({ status: 'ready' })));
  assert.deepEqual(texts.filter((t) => t === 'The ghosts got through' || t === 'The path is safe'), []);
});

test('the Start button sits as the brief places it', () => {
  assert.deepEqual({ ...START_BUTTON }, { x: 240, y: 242, width: 160, height: 44 });
  const button = drawn(createGame({ status: 'ready' })).filter((c) => c.name === 'roundRect' && c.fillStyle === THEME.hudAccent);
  assert.deepEqual(button.map((c) => c.args.slice(0, 4)), [[240, 242, 160, 44]]);
});

test('startButtonAt hits only the Start button', () => {
  const { x, y, width, height } = START_BUTTON;
  const hits = [
    [x + width / 2, y + height / 2],
    [x, y],
    [x - 1, y],
    [x, y + height],
    [PAUSE_BUTTON.x + PAUSE_BUTTON.width / 2, PAUSE_BUTTON.y + PAUSE_BUTTON.height / 2],
  ].map(([px, py]) => startButtonAt(px, py));
  assert.deepEqual(hits, [true, true, false, false, false]);
});

test('startKey is Enter and Space only', () => {
  assert.deepEqual(['Enter', ' ', 'p', 'Escape', 'a'].map(startKey), [true, true, false, false, false]);
});

// src/main.js against stand-ins for the DOM, as test/pause-speed.test.js boots it.
const saved = { document: globalThis.document, window: globalThis.window, requestAnimationFrame: globalThis.requestAnimationFrame };
after(() => Object.assign(globalThis, saved));

let instance = 0;
async function boot() {
  const handlers = {};
  const keys = {};
  const frames = [];
  const ctx = recordingContext();
  const canvas = {
    addEventListener: (type, handler) => (handlers[type] = handler),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: canvas.width, height: canvas.height }),
    getContext: () => ctx,
  };
  globalThis.document = { getElementById: () => canvas };
  globalThis.window = { addEventListener: (type, handler) => (keys[type] = handler) };
  globalThis.requestAnimationFrame = (frame) => frames.push(frame);
  instance += 1;
  await import(`../src/main.js?start=${instance}`);

  return {
    click: (x, y) => handlers.click({ clientX: x, clientY: y, preventDefault() {} }),
    key: (key, repeat = false) => keys.keydown({ key, repeat }),
    // Run the next queued frame and return what it drew.
    frame() {
      ctx.clear();
      frames.shift()(performance.now());
      return ctx.calls;
    },
  };
}

test('main.js opens on the start screen, and a click off Start does nothing', async () => {
  const game = await boot();
  assert.deepEqual(startTexts(game.frame()), ['Lantern Line', 'Start']);
  game.click(TILE + TILE / 2, HUD_HEIGHT + TILE + TILE / 2);
  game.key('p');
  const calls = game.frame();
  const texts = textsOf(calls);
  assert.deepEqual(startTexts(calls), ['Lantern Line', 'Start']);
  assert.equal(texts[texts.indexOf('Gold') + 1], String(START_GOLD));
});

for (const [name, press] of [
  ['Enter starts the round', (game) => game.key('Enter')],
  ['Space starts the round', (game) => game.key(' ')],
  ['a click on Start starts the round', (game) => game.click(START_BUTTON.x + START_BUTTON.width / 2, START_BUTTON.y + START_BUTTON.height / 2)],
]) {
  test(name, async () => {
    const game = await boot();
    game.frame();
    press(game);
    const calls = game.frame();
    assert.deepEqual(startTexts(calls), []);
    assert.equal(textsOf(calls)[0], 'Lives');
  });
}

test('a held Enter does not start', async () => {
  const game = await boot();
  game.frame();
  game.key('Enter', true);
  assert.deepEqual(startTexts(game.frame()), ['Lantern Line', 'Start']);
});
