import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseDifficulty, createGame, restart, start } from '../src/game.js';
import { CANVAS_HEIGHT, DIFFICULTY_BUTTONS, START_BUTTON, difficultyButtonAt, difficultyKey } from '../src/hud.js';
import { draw } from '../src/render.js';
import { THEME } from '../src/theme.js';
import { COLS, TILE } from '../src/path.js';

const WIDTH = COLS * TILE;

// A context that records each call with the fillStyle it was made under.
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
  const normal = DIFFICULTY_BUTTONS[1];
  const filled = calls.filter((c) => c.name === 'roundRect' && c.fillStyle === THEME.hudAccent && c.args[0] === normal.x);
  assert.equal(filled.length, 1);
  assert.deepEqual(difficultyTexts(drawn(createGame({ status: 'ready' }))), []);
});
