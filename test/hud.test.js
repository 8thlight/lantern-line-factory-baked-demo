import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HUD_BUTTONS, hudButtonAt, hudButtonForKey, hudModel } from '../src/hud.js';
import { START_GOLD, START_LIVES, TOTAL_WAVES, createGame } from '../src/game.js';

test('hudModel on a new game shows full lives, starting gold, wave 1 of the total, running at 1x', () => {
  assert.deepEqual(hudModel(createGame()), {
    lives: START_LIVES,
    gold: START_GOLD,
    wave: 1,
    totalWaves: TOTAL_WAVES,
    paused: false,
    speed: 1,
    livesDanger: false,
  });
  assert.equal(hudModel(createGame({ totalWaves: 2 })).totalWaves, 2);
});

test('livesDanger is false at 4 lives and true at 3', () => {
  assert.equal(hudModel(createGame({ lives: 4 })).livesDanger, false);
  assert.equal(hudModel(createGame({ lives: 3 })).livesDanger, true);
  assert.equal(hudModel(createGame({ lives: 0 })).livesDanger, true);
});

test('hudModel reflects gold and wave after they change in state', () => {
  const game = createGame();
  game.gold = 120;
  game.wave = 3;
  game.paused = true;
  game.speed = 2;
  const hud = hudModel(game);
  assert.equal(hud.gold, 120);
  assert.equal(hud.wave, 3);
  assert.equal(hud.paused, true);
  assert.equal(hud.speed, 2);
});

test('hudModel does not change the state it reads', () => {
  const game = createGame();
  const snapshot = () => structuredClone({ ...game, path: [...game.path] });
  const before = snapshot();
  const first = hudModel(game);
  const second = hudModel(game);
  assert.deepEqual(snapshot(), before);
  assert.deepEqual(second, first);
});

test('hudButtonAt names the button under a point, and null beside or below them', () => {
  const { pause, speed } = HUD_BUTTONS;
  assert.equal(hudButtonAt(pause.x, pause.y), 'pause');
  assert.equal(hudButtonAt(speed.x + speed.width - 1, speed.y + speed.height - 1), 'speed');
  assert.equal(hudButtonAt(pause.x + pause.width, pause.y), null); // the gap between them
  assert.equal(hudButtonAt(speed.x, speed.y + speed.height), null); // the board below the bar
  assert.equal(hudButtonAt(0, 0), null);
});

test('hudButtonForKey names the button P and F press, either case, and null for any other key', () => {
  assert.equal(hudButtonForKey('p'), 'pause');
  assert.equal(hudButtonForKey('P'), 'pause');
  assert.equal(hudButtonForKey('f'), 'speed');
  assert.equal(hudButtonForKey('F'), 'speed');
  assert.equal(hudButtonForKey('1'), null);
});
