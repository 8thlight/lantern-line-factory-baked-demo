import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BEST_KEY, bestAfterStep, readBest, writeBest } from '../src/best.js';
import { createGame, step } from '../src/game.js';
import { draw } from '../src/render.js';

// A plain object in the shape of the browser's Storage.
function memoryStorage(items = {}) {
  return {
    items,
    getItem(key) {
      return key in this.items ? this.items[key] : null;
    },
    setItem(key, value) {
      this.items[key] = String(value);
    },
  };
}

// A storage the browser refuses access to: every call throws.
const brokenStorage = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('SecurityError');
  },
};

// A context that records each call, with every style a no-op.
function recordingContext() {
  const calls = [];
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        return (...args) => {
          calls.push({ name, args });
          return String(name).startsWith('create') ? { addColorStop() {} } : undefined;
        };
      },
      set() {
        return true;
      },
    },
  );
}

const textsOf = (calls) => calls.filter((c) => c.name === 'fillText').map((c) => c.args[0]);
const drawnTexts = (state, best) => {
  const ctx = recordingContext();
  draw(ctx, state, null, undefined, null, null, best);
  return textsOf(ctx.calls);
};
// The start screen's texts, in the order drawn: everything from its title on.
const startScreenTexts = (texts) => texts.slice(texts.indexOf('Lantern Line'));

test('after a run that reached wave 7, readBest returns 7', () => {
  const storage = memoryStorage();
  assert.equal(writeBest(storage, 7), 7);
  assert.equal(readBest(storage), 7);
  assert.deepEqual(storage.items, { [BEST_KEY]: '7' });
});

test('a later run that reached wave 4 leaves the best at 7, and one that reached 9 makes it 9', () => {
  const storage = memoryStorage();
  writeBest(storage, 7);
  assert.equal(writeBest(storage, 4), 7);
  assert.equal(readBest(storage), 7);
  assert.equal(writeBest(storage, 9), 9);
  assert.equal(readBest(storage), 9);
});

test('an empty storage has no best', () => {
  assert.equal(readBest(memoryStorage()), null);
});

test('a storage holding text that is not a number reads as no best, and a write still works', () => {
  const storage = memoryStorage({ [BEST_KEY]: 'seven' });
  assert.equal(readBest(storage), null);
  assert.equal(writeBest(storage, 3), 3);
  assert.equal(readBest(storage), 3);
});

test('a storage that throws reads as no best, and a write to it does not throw', () => {
  assert.equal(readBest(brokenStorage), null);
  assert.equal(writeBest(brokenStorage, 5), 5);
});

test('no storage at all reads as no best, and a write to it does not throw', () => {
  assert.equal(readBest(undefined), null);
  assert.equal(writeBest(undefined, 5), 5);
});

test('the start screen draws "Best: wave 7" between the tagline and the Start button when the best is 7', () => {
  const without = startScreenTexts(drawnTexts(createGame({ status: 'ready' }), null));
  const texts = startScreenTexts(drawnTexts(createGame({ status: 'ready' }), 7));
  const after = without.indexOf('Start'); // the button: everything before it is the title and tagline
  assert.deepEqual(texts, [...without.slice(0, after), 'Best: wave 7', ...without.slice(after)]);
});

test('the start screen draws no Best line when there is no best', () => {
  const texts = startScreenTexts(drawnTexts(createGame({ status: 'ready' }), null));
  assert.deepEqual(texts, [
    'Lantern Line',
    'Light the lanterns. Stop the ghosts before they reach the gate.',
    'Start',
    'or press Enter or Space',
    '1  Hang lanterns on the grass beside the path',
    '2  Each one shines on the nearest ghost in range',
    '3  A ghost that reaches the gate costs a life',
  ]);
});

test('a playing game draws the same texts with a best as without one', () => {
  const game = createGame();
  const withBest = drawnTexts(game, 7);
  assert.deepEqual(withBest, drawnTexts(game, null));
  assert.equal(withBest[0], 'Lives');
});

test('a wave that is not a whole wave of at least 1 is never saved, and leaves a real best as it was', () => {
  const storage = memoryStorage();
  writeBest(storage, 7);
  for (const wave of [0, -2, 2.5, NaN, undefined, '9']) assert.equal(writeBest(storage, wave), 7);
  assert.deepEqual(storage.items, { [BEST_KEY]: '7' });
  assert.equal(writeBest(memoryStorage(), NaN), null);
});

// One frame of src/main.js's loop: the status before the step, the step, then the best after it.
function frame(storage, state, best) {
  const before = state.status;
  step(state, 0.05);
  return bestAfterStep(storage, before, state, best);
}

test('the step a run is lost on saves the wave it reached, once, through the real loop', () => {
  const storage = memoryStorage();
  const writes = [];
  const setItem = storage.setItem;
  storage.setItem = function (key, value) {
    writes.push(value);
    setItem.call(this, key, value);
  };
  const state = createGame({ lives: 1 });
  let best = null;
  for (let i = 0; i < 2000 && state.status === 'playing'; i++) best = frame(storage, state, best);
  assert.equal(state.status, 'lost');
  for (let i = 0; i < 5; i++) best = frame(storage, state, best); // the frames after the loss
  assert.equal(best, state.wave);
  assert.deepEqual(writes, [String(state.wave)]);
});

test('a step that wins the run saves the wave it reached', () => {
  const storage = memoryStorage({ [BEST_KEY]: '2' });
  const state = { status: 'won', wave: 5 };
  assert.equal(bestAfterStep(storage, 'playing', state, 2), 5);
  assert.equal(readBest(storage), 5);
});

test('a step that does not end a run leaves the best as it was and writes nothing', () => {
  const storage = memoryStorage();
  assert.equal(bestAfterStep(storage, 'playing', { status: 'playing', wave: 3 }, 2), 2);
  assert.equal(bestAfterStep(storage, 'ready', { status: 'ready', wave: 1 }, 2), 2);
  assert.equal(bestAfterStep(storage, 'lost', { status: 'lost', wave: 9 }, 2), 2);
  assert.deepEqual(storage.items, {});
});
