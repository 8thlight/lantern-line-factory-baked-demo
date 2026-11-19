import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { START_GOLD, START_LIVES, TOTAL_WAVES, createGame, placeTower, spawnEnemy, step, togglePause, toggleSpeed } from '../src/game.js';
import { BRAZIER, FROST, LANTERN } from '../src/tower.js';
import { CHALLENGES } from '../src/difficulty.js';
import { HUD_HEIGHT, PAUSE_BUTTON, SPEED_BUTTON } from '../src/hud.js';
import { ROWS, TILE } from '../src/path.js';
import { THEME } from '../src/theme.js';

// A game whose waves hold no ghosts, so only the ghosts a test spawns are on the board.
const quietGame = () => createGame({ waveSize: 0 });

test('togglePause flips paused; toggleSpeed moves between 1 and 2', () => {
  const game = createGame();
  assert.deepEqual([game.paused, game.speed], [false, 1]);
  assert.deepEqual([togglePause(game).paused, togglePause(game).paused], [true, false]);
  assert.deepEqual([toggleSpeed(game).speed, toggleSpeed(game).speed], [2, 1]);
});

test('a paused step leaves enemy positions, spawn timers and tower reloads unchanged', () => {
  const game = createGame();
  placeTower(game, 1, 1);
  for (let i = 0; i < 400 && !(game.towers[0].reload > 0); i++) step(game, 0.05);
  assert.equal(game.towers[0].reload > 0, true);
  assert.equal(game.enemies.length > 0, true);

  togglePause(game);
  const frozen = structuredClone(game);
  for (let i = 0; i < 5; i++) step(game, 0.5);
  assert.deepEqual(game, frozen);

  togglePause(game);
  const before = game.enemies[0].distance;
  step(game, 0.05);
  assert.equal(game.enemies[0].distance > before, true);
});

test('at speed 2, one step(state, 0.5) moves a ghost as far as two step(state, 0.5) at speed 1', () => {
  const fast = quietGame();
  const slow = quietGame();
  spawnEnemy(fast);
  spawnEnemy(slow);
  toggleSpeed(fast);
  step(fast, 0.5);
  step(slow, 0.5);
  step(slow, 0.5);
  const where = ({ distance, x, y }) => [distance, x, y];
  assert.deepEqual(where(fast.enemies[0]), where(slow.enemies[0]));
  assert.equal(slow.enemies[0].distance > 0, true);
});

test('a long frame at 2x is two ticks, so no shot and no stretch of path is skipped', () => {
  const play = () => {
    const game = createGame({ lives: 1000 });
    placeTower(game, 1, 1);
    placeTower(game, 4, 3);
    return game;
  };
  const fast = toggleSpeed(play());
  const slow = play();
  const view = ({ enemies, towers, spawner, gold, kills, lives, wave, status }) => ({ enemies, towers, spawner, gold, kills, lives, wave, status });
  for (let i = 0; i < 60; i++) {
    step(fast, 0.6);
    step(slow, 0.6);
    step(slow, 0.6);
    assert.deepEqual(view(fast), view(slow));
  }
  assert.equal(fast.kills > 0, true);

  // One lantern beside the path's first cell, with a ghost in its reach for the whole frame:
  // a 2x frame of 0.6 s is two ticks and two shots, where one tick of 1.2 s would fire once.
  const game = quietGame();
  placeTower(game, 0, 1);
  const ghost = spawnEnemy(game);
  toggleSpeed(game);
  step(game, 0.6);
  assert.deepEqual([ghost.maxHealth - ghost.health, game.towers[0].reload], [2, 0.6]);
});

test('a round lost on the first tick of a 2x step runs no second tick', () => {
  // A ghost at the path's end on its last life, and a wave still spawning: a second tick
  // would run the spawner on past the loss.
  const lose = () => {
    const game = createGame({ lives: 1 });
    spawnEnemy(game).distance = 1e9;
    return game;
  };
  const fast = toggleSpeed(lose());
  const slow = lose();
  step(fast, 0.05);
  step(slow, 0.05);
  assert.equal(fast.status, 'lost');
  assert.deepEqual({ ...fast, speed: 1 }, slow);
});

// src/main.js against stand-ins for the DOM: a canvas that keeps its handlers and records
// what each frame draws, a window that keeps its keydown handler, and a frame queue.
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

const saved = { document: globalThis.document, window: globalThis.window, requestAnimationFrame: globalThis.requestAnimationFrame };
after(() => Object.assign(globalThis, saved));

// src/main.js picks each round's path with Math.random; 0 picks path 1, the path these clicks
// and hovers were written on.
const savedRandom = Math.random;
Math.random = () => 0;
after(() => (Math.random = savedRandom));

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
  await import(`../src/main.js?case=${instance}`);
  keys.keydown({ key: 'Enter', repeat: false }); // past the start screen, into the round

  const event = (x, y, extra = {}) => ({ clientX: x, clientY: y, preventDefault() {}, ...extra });
  return {
    canvas,
    click: (x, y) => handlers.click(event(x, y)),
    move: (x, y) => handlers.mousemove(event(x, y)),
    key: (key, repeat = false) => keys.keydown({ key, repeat }),
    // Run the next queued frame and return what it drew.
    frame() {
      ctx.clear();
      frames.shift()(performance.now());
      return ctx.calls;
    },
  };
}

const textsOf = (calls) => calls.filter((c) => c.name === 'fillText').map((c) => c.args[0]);
const fillsIn = (calls, colour) => calls.filter((c) => c.name.startsWith('fill') && c.fillStyle === colour);
// The bar's texts; the kind a click places is named from boot, a lantern until a key changes it,
// with its price on the normal game main.js boots: its cost plus a step for each of its kind placed.
const priced = (kind, placed = 0) => `${kind.name} ${kind.cost + CHALLENGES.normal.priceStep * placed}`;
const hudAt = (gold, pause = 'Pause', speed = '1x', kind = priced(LANTERN)) =>
  ['Lives', String(START_LIVES), 'Gold', String(gold), 'Wave', `1 / ${TOTAL_WAVES}`, 'Tower', kind, pause, speed];
const centreOf = (rect) => [rect.x + rect.width / 2, rect.y + rect.height / 2];

test('the canvas is tall enough for the bar and the whole board', async () => {
  const game = await boot();
  assert.equal(game.canvas.height, HUD_HEIGHT + ROWS * TILE);
});

test('a click on the bar never places a tower', async () => {
  const game = await boot();
  const gap = (PAUSE_BUTTON.x + PAUSE_BUTTON.width + SPEED_BUTTON.x) / 2;
  game.click(5, 5);
  game.click(5, HUD_HEIGHT - 1);
  game.click(gap, HUD_HEIGHT / 2);
  const calls = game.frame();
  assert.deepEqual(textsOf(calls), hudAt(START_GOLD));
  assert.deepEqual(fillsIn(calls, THEME.lanternPaper), []);

  game.click(5, HUD_HEIGHT + 5);
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD - LANTERN.cost, 'Pause', '1x', priced(LANTERN, 1)));
});

test('a click on Pause or 1x toggles them and places nothing', async () => {
  const game = await boot();
  game.click(...centreOf(PAUSE_BUTTON));
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD, 'Resume'));
  game.click(...centreOf(SPEED_BUTTON));
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD, 'Resume', '2x'));
});

test('the hover clears over the bar', async () => {
  const game = await boot();
  game.move(TILE * 3 + 5, HUD_HEIGHT + TILE + 5);
  assert.equal(fillsIn(game.frame(), THEME.hover).length, 1);
  game.move(5, 5);
  const calls = game.frame();
  assert.deepEqual([fillsIn(calls, THEME.hover).length, fillsIn(calls, THEME.hoverBad).length], [0, 0]);
});

test('P and F reach the toggles while the round is playing', async () => {
  const game = await boot();
  game.key('p');
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD, 'Resume'));
  game.key('F');
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD, 'Resume', '2x'));
  game.key('p', true);
  game.key('f', true);
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD, 'Resume', '2x'));
});

test('the HUD names the kind from boot, and 1, 2 and 3 change it', async () => {
  const game = await boot();
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD));
  game.key('3');
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD, 'Pause', '1x', priced(FROST)));
  game.key('2');
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD, 'Pause', '1x', priced(BRAZIER)));
  game.key('3');
  game.click(5, HUD_HEIGHT + 5);
  assert.deepEqual(textsOf(game.frame()), hudAt(START_GOLD - FROST.cost, 'Pause', '1x', priced(FROST, 1)));
});
