import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hudModel } from '../src/hud.js';
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
