import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseDifficulty, createGame, restart, start } from '../src/game.js';
import { CANVAS_HEIGHT, DIFFICULTY_BUTTONS, START_BUTTON, difficultyButtonAt, difficultyKey } from '../src/hud.js';
import { draw } from '../src/render.js';
import { THEME } from '../src/theme.js';
import { COLS, TILE } from '../src/path.js';

const WIDTH = COLS * TILE;

// A context that records each call with the fillStyle and font it was made under.
function recordingContext() {
  const calls = [];
  const styles = {};
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name in styles) return styles[name];
        return (...args) => {
          calls.push({ name, args, fillStyle: styles.fillStyle, font: styles.font });
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

const drawn = (state) => {
  const ctx = recordingContext();
  draw(ctx, state, null);
  return ctx.calls;
};
const LABELS = ['Easy', 'Normal', 'Hard'];
const difficultyTexts = (calls) =>
  calls.filter((c) => c.name === 'fillText' && LABELS.some((label) => label === c.args[0])).map((c) => c.args[0]);
const centre = (b) => [b.x + b.width / 2, b.y + b.height / 2];
const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
// The difficulty whose button is filled rather than outlined: each button's roundRect is
// followed by a fill when it is the chosen one and by a stroke otherwise.
const strokes = (calls) =>
  DIFFICULTY_BUTTONS.map((b) => {
    const i = calls.findIndex((c) => c.name === 'roundRect' && c.args[0] === b.x && c.args[1] === b.y);
    return calls[i + 1]?.name;
  });
const textAfter = (calls, label) => {
  const texts = calls.filter((c) => c.name === 'fillText').map((c) => c.args[0]);
  return texts[texts.indexOf(label) + 1];
};
const facts = ({ status, difficulty, gold, lives }) => [status, difficulty, gold, lives];

test('difficultyButtonAt names each button inside it, and null on Start and off every button', () => {
  assert.deepEqual(DIFFICULTY_BUTTONS.map((b) => b.key), ['easy', 'normal', 'hard']);
  assert.deepEqual(DIFFICULTY_BUTTONS.map((b) => difficultyButtonAt(...centre(b))), ['easy', 'normal', 'hard']);
  assert.equal(difficultyButtonAt(...centre(START_BUTTON)), null);
  assert.equal(difficultyButtonAt(5, 5), null);
});

test('the buttons are 96 by 28, 8 apart, centred, 8 above the bottom, inside the canvas and clear of each other and Start', () => {
  for (const b of DIFFICULTY_BUTTONS) {
    assert.deepEqual([b.width, b.height], [96, 28]);
    assert.equal(b.y + b.height, CANVAS_HEIGHT - 8);
    assert.deepEqual(
      [b.x >= 0, b.y >= 0, b.x + b.width <= WIDTH, b.y + b.height <= CANVAS_HEIGHT],
      [true, true, true, true],
    );
  }
  const [easy, normal, hard] = DIFFICULTY_BUTTONS;
  assert.deepEqual([normal.x - (easy.x + easy.width), hard.x - (normal.x + normal.width)], [8, 8]);
  assert.equal(easy.x, WIDTH - (hard.x + hard.width));
  const rects = [...DIFFICULTY_BUTTONS, START_BUTTON];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) assert.equal(overlaps(rects[i], rects[j]), false);
  }
});

test('the row sits below the start screen\'s hint and steps, clear of their 12px text', () => {
  // Every text drawn after Start that is not a difficulty label: the hint, then the steps.
  const below = (state) => {
    const texts = drawn(state).filter((c) => c.name === 'fillText');
    return texts.slice(texts.findIndex((c) => c.args[0] === 'Start') + 1).filter((c) => LABELS.indexOf(c.args[0]) === -1);
  };
  const steps = below(createGame({ status: 'ready', difficulty: 'normal' }));
  // The same lines a game with no difficulty draws there, and at least one of them.
  assert.deepEqual(steps.map((c) => c.args[0]), below(createGame({ status: 'ready' })).map((c) => c.args[0]));
  assert.equal(steps.length > 0, true);
  // Middle-baselined, so each line reaches half its font's size below its y.
  const lowest = Math.max(...steps.map((c) => c.args[2] + parseInt(c.font.match(/(\d+)px/)[1], 10) / 2));
  assert.equal(lowest <= Math.min(...DIFFICULTY_BUTTONS.map((b) => b.y)), true);
});

test('difficultyKey reads E, N and H in either case, and null for any other key', () => {
  assert.deepEqual(
    ['e', 'E', 'n', 'h', 'x', 'Enter'].map(difficultyKey),
    ['easy', 'easy', 'normal', 'hard', null, null],
  );
});

test('chooseDifficulty on a ready game makes a ready game of that difficulty, and restart keeps it', () => {
  const game = chooseDifficulty(createGame({ status: 'ready', difficulty: 'normal' }), 'hard');
  assert.deepEqual(facts(game), ['ready', 'hard', 60, 8]);
  assert.deepEqual(facts(restart(game)), ['ready', 'hard', 60, 8]);
});

test('chooseDifficulty on a playing game returns that same game unchanged', () => {
  const game = start(createGame({ status: 'ready', difficulty: 'normal' }));
  const result = chooseDifficulty(game, 'hard');
  assert.equal(result, game);
  assert.deepEqual([result.difficulty, result.gold, result.lives], ['normal', 50, 10]);
});

test('a ready normal game draws Easy, Normal and Hard with Normal filled; a ready game with no difficulty draws none', () => {
  const calls = drawn(createGame({ status: 'ready', difficulty: 'normal' }));
  assert.deepEqual(difficultyTexts(calls), ['Easy', 'Normal', 'Hard']);
  assert.deepEqual(strokes(calls), ['stroke', 'fill', 'stroke']);
  const normal = DIFFICULTY_BUTTONS[1];
  const filled = calls.filter((c) => c.name === 'roundRect' && c.fillStyle === THEME.hudAccent && c.args[0] === normal.x);
  assert.equal(filled.length, 1);
  assert.deepEqual(difficultyTexts(drawn(createGame({ status: 'ready' }))), []);
});

// src/main.js against stand-ins for the DOM, as test/start-screen.test.js boots it.
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
  await import(`../src/main.js?difficulty=${instance}`);

  return {
    click: (x, y) => handlers.click({ clientX: x, clientY: y, preventDefault() {} }),
    key: (key, repeat = false) => keys.keydown({ key, repeat }),
    // Run the next queued frame and return what it drew.
    frame() {
      ctx.calls.length = 0;
      frames.shift()(performance.now());
      return ctx.calls;
    },
  };
}

test('main.js opens on normal; a click or a key chooses the difficulty, a held key does not, and Enter starts on it', async () => {
  const game = await boot();
  assert.deepEqual(strokes(game.frame()), ['stroke', 'fill', 'stroke']);
  game.click(...centre(DIFFICULTY_BUTTONS[0]));
  assert.deepEqual(strokes(game.frame()), ['fill', 'stroke', 'stroke']);
  game.key('H');
  const hard = game.frame();
  assert.deepEqual(strokes(hard), ['stroke', 'stroke', 'fill']);
  assert.deepEqual([textAfter(hard, 'Gold'), textAfter(hard, 'Lives')], ['60', '8']);
  game.key('n', true);
  assert.deepEqual(strokes(game.frame()), ['stroke', 'stroke', 'fill']);
  game.key('Enter');
  const playing = game.frame();
  assert.deepEqual(difficultyTexts(playing), []);
  assert.deepEqual([textAfter(playing, 'Gold'), textAfter(playing, 'Lives')], ['60', '8']);
});
