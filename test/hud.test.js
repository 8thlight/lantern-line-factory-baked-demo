import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HUD_HEIGHT, PAUSE_BUTTON, SPEED_BUTTON, boardCellAt, hudButtonAt, hudKey, hudModel } from '../src/hud.js';
import { START_GOLD, START_LIVES, TOTAL_WAVES, createGame, placeTower, spawnEnemy, step, togglePause, toggleSpeed } from '../src/game.js';
import { COLS, ROWS, TILE } from '../src/path.js';
import { draw } from '../src/render.js';
import { THEME } from '../src/theme.js';

// A canvas stand-in that records each call with the styles it was made under and the
// vertical offset translate has carried it to, so a call's absolute y can be read.
function recordingContext() {
  const calls = [];
  let state = { fillStyle: '', strokeStyle: '', dy: 0 };
  const stack = [];
  const methods = {
    save: () => stack.push({ ...state }),
    restore: () => (state = stack.pop()),
    translate: (x, y) => (state.dy += y),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name === 'fillStyle' || name === 'strokeStyle') return state[name];
        if (name in target) return target[name];
        return (...args) => {
          calls.push({ name, args, fillStyle: state.fillStyle, strokeStyle: state.strokeStyle, dy: state.dy });
          return methods[name]?.(...args);
        };
      },
      set(target, name, value) {
        if (name === 'fillStyle' || name === 'strokeStyle') state[name] = value;
        else target[name] = value;
        return true;
      },
    },
  );
}

// The absolute y a drawing call lands at: fillText's y is its third argument, a rect's its second.
const absoluteY = (call) => (call.name === 'fillText' ? call.args[2] : call.args[1]) + call.dy;
const SHAPES = ['fillRect', 'roundRect', 'fillText'];
const shapes = (ctx) => ctx.calls.filter((c) => SHAPES.includes(c.name));
const HUD_COLOURS = [THEME.hudBg, THEME.hudMuted, THEME.hudInk, THEME.hudAccent, THEME.hudDanger, THEME.hudGhost];
const centre = (rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

function drawn(game) {
  const ctx = recordingContext();
  draw(ctx, game, null);
  return ctx;
}

test('hudModel on a new game', () => {
  assert.deepEqual(hudModel(createGame()), {
    lives: START_LIVES,
    gold: START_GOLD,
    wave: 1,
    totalWaves: TOTAL_WAVES,
    paused: false,
    speed: 1,
    livesDanger: false,
    bossWave: false,
  });
});

test('livesDanger is false at 4 lives and true at 3', () => {
  assert.deepEqual(
    [4, 3, 0].map((lives) => hudModel(createGame({ lives })).livesDanger),
    [false, true, true],
  );
});

test('hudModel reflects gold and wave after they change', () => {
  const game = createGame();
  game.gold = 77;
  game.wave = 4;
  const { gold, wave } = hudModel(game);
  assert.deepEqual([gold, wave], [77, 4]);

  const played = createGame({ waveSize: 1, spawnInterval: 1, lives: 1000 });
  for (let i = 0; i < 2000 && played.wave === 1; i++) step(played, 0.05);
  assert.equal(hudModel(played).wave, 2);

  togglePause(played);
  toggleSpeed(played);
  const { paused, speed } = hudModel(played);
  assert.deepEqual([paused, speed], [true, 2]);
});

test('hudModel does not change the state it reads', () => {
  const game = createGame();
  placeTower(game, 1, 1);
  spawnEnemy(game);
  game.shots.push({ from: { x: 60, y: 60 }, to: { x: 100, y: 100 }, ttl: 0.1 });
  const before = structuredClone(game);
  hudModel(game);
  assert.deepEqual(game, before);
});

// The board is drawn below the bar: the bar holds y 0 to HUD_HEIGHT, and row 0 starts at HUD_HEIGHT.
test('the bar sits above the board, and row 0 is drawn whole below it', () => {
  const ctx = drawn(createGame());
  const hud = shapes(ctx).filter((c) => HUD_COLOURS.includes(c.fillStyle) || (c.name === 'roundRect' && HUD_COLOURS.includes(c.strokeStyle)));
  assert.equal(hud.length > 0, true);
  assert.deepEqual(
    hud.filter((c) => absoluteY(c) < 0 || absoluteY(c) > HUD_HEIGHT),
    [],
  );

  const grass = ctx.calls.filter((c) => c.name === 'fillRect' && c.args[0] === 0 && c.args[2] === TILE && c.args[3] === TILE);
  assert.equal(absoluteY(grass[0]), HUD_HEIGHT);

  const below = shapes(ctx).filter((c) => absoluteY(c) >= HUD_HEIGHT);
  assert.deepEqual(
    [...new Set(below.map((c) => c.fillStyle))].sort(),
    [THEME.grassA, THEME.grassB].sort(),
  );
});

test('row 0 is placeable from a pointer on it, and the bar is no cell', () => {
  assert.deepEqual(boardCellAt(5, HUD_HEIGHT + 5), { col: 0, row: 0 });
  assert.equal(placeTower(createGame(), 0, 0), true);
  assert.equal(boardCellAt(5, 5), null);
  assert.equal(boardCellAt(5, HUD_HEIGHT - 1), null);
  assert.deepEqual(boardCellAt(COLS * TILE - 1, HUD_HEIGHT + ROWS * TILE - 1), { col: COLS - 1, row: ROWS - 1 });
});

test('hudButtonAt finds each button, and nothing else on the bar', () => {
  const pause = centre(PAUSE_BUTTON);
  const speed = centre(SPEED_BUTTON);
  assert.equal(hudButtonAt(pause.x, pause.y), 'pause');
  assert.equal(hudButtonAt(speed.x, speed.y), 'speed');
  const gap = (PAUSE_BUTTON.x + PAUSE_BUTTON.width + SPEED_BUTTON.x) / 2;
  assert.deepEqual(
    [hudButtonAt(5, 5), hudButtonAt(gap, pause.y), hudButtonAt(pause.x, HUD_HEIGHT), hudButtonAt(speed.x, HUD_HEIGHT + 5)],
    [null, null, null, null],
  );
  for (const button of [PAUSE_BUTTON, SPEED_BUTTON]) {
    assert.equal(button.y >= 0 && button.y + button.height <= HUD_HEIGHT, true);
    assert.equal(button.x >= 0 && button.x + button.width <= COLS * TILE, true);
  }
});

test('hudKey: P and F, either case', () => {
  assert.deepEqual(['p', 'P', 'f', 'F', '1', ' '].map(hudKey), ['pause', 'pause', 'speed', 'speed', null, null]);
});

test('the bar shows each value in its token', () => {
  const textsWithFill = (ctx) => ctx.calls.filter((c) => c.name === 'fillText').map((c) => [c.args[0], c.fillStyle]);
  assert.deepEqual(textsWithFill(drawn(createGame())), [
    ['Lives', THEME.hudMuted],
    [String(START_LIVES), THEME.hudInk],
    ['Gold', THEME.hudMuted],
    [String(START_GOLD), THEME.hudAccent],
    ['Wave', THEME.hudMuted],
    [`1 / ${TOTAL_WAVES}`, THEME.hudGhost],
    ['Pause', THEME.hudInk],
    ['1x', THEME.hudInk],
  ]);

  const tense = createGame({ lives: 3 });
  togglePause(tense);
  toggleSpeed(tense);
  const ctx = drawn(tense);
  const texts = textsWithFill(ctx);
  assert.deepEqual(texts[1], ['3', THEME.hudDanger]);
  assert.deepEqual(texts.slice(-2), [
    ['Resume', THEME.hudInk],
    ['2x', THEME.hudAccentInk],
  ]);
  const { x, y, width, height } = SPEED_BUTTON;
  const speedFills = ctx.calls.filter((c) => c.name === 'roundRect' && JSON.stringify(c.args.slice(0, 4)) === JSON.stringify([x, y, width, height]));
  assert.equal(speedFills.length, 1);
  assert.equal(speedFills[0].fillStyle, THEME.hudAccent);
});
