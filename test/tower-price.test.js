import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeTower, placementError, towerPrice, upgradeTower } from '../src/game.js';
import { BRAZIER, LANTERN } from '../src/tower.js';
import { HUD_KIND, SPRITES, draw } from '../src/render.js';

// Cells on row 0, off the path (its highest row is 2), where a tower may stand on a fresh game.
const FREE = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
];

// A canvas stand-in that records each call; gradients hand back a stop-taking stub.
function recordingContext() {
  const calls = [];
  return new Proxy(
    { calls },
    {
      get(target, name) {
        if (name in target) return target[name];
        if (name === 'createRadialGradient' || name === 'createLinearGradient') return () => ({ addColorStop() {} });
        return (...args) => calls.push({ name, args });
      },
    },
  );
}

// The texts drawn where the HUD's Tower value goes, as [text, x].
function towerValues(game) {
  const ctx = recordingContext();
  draw(ctx, game, null, SPRITES, LANTERN);
  return ctx.calls.filter((c) => c.name === 'fillText' && c.args[1] === HUD_KIND.valueX).map((c) => [c.args[0], c.args[1]]);
}

test('free cells: a lantern may stand on each of them on a fresh game', () => {
  const game = createGame();
  assert.deepEqual(
    FREE.map(([col, row]) => placementError(game, col, row, LANTERN)),
    FREE.map(() => null),
  );
});

test('on normal a lantern costs 20, then 25, then 30, and a brazier stays 30 beside two lanterns', () => {
  const game = createGame({ difficulty: 'normal', gold: 1000 });
  const prices = [towerPrice(game, LANTERN)];
  assert.equal(placeTower(game, 0, 0, LANTERN), true);
  prices.push(towerPrice(game, LANTERN));
  assert.equal(placeTower(game, 1, 0, LANTERN), true);
  prices.push(towerPrice(game, LANTERN));
  assert.deepEqual(prices, [20, 25, 30]);
  assert.equal(towerPrice(game, BRAZIER), 30);
});

test('on hard a lantern costs 20, then 25, as on normal', () => {
  const game = createGame({ difficulty: 'hard', gold: 1000 });
  const prices = [towerPrice(game, LANTERN)];
  assert.equal(placeTower(game, 0, 0, LANTERN), true);
  prices.push(towerPrice(game, LANTERN));
  assert.deepEqual(prices, [20, 25]);
});

test('on normal a second lantern with 24 gold is refused for gold and changes nothing', () => {
  const game = createGame({ difficulty: 'normal' });
  assert.equal(placeTower(game, 0, 0, LANTERN), true);
  game.gold = 24;
  assert.equal(placementError(game, 1, 0, LANTERN), 'gold');
  assert.equal(placeTower(game, 1, 0, LANTERN), false);
  assert.deepEqual([game.towers.length, game.gold], [1, 24]);
});

test('on normal a second lantern with 25 gold is placed and leaves 0 gold', () => {
  const game = createGame({ difficulty: 'normal' });
  assert.equal(placeTower(game, 0, 0, LANTERN), true);
  game.gold = 25;
  assert.equal(placementError(game, 1, 0, LANTERN), null);
  assert.equal(placeTower(game, 1, 0, LANTERN), true);
  assert.deepEqual([game.towers.length, game.gold], [2, 0]);
});

test('on easy, and with no difficulty, a third lantern costs 20', () => {
  for (const options of [{ difficulty: 'easy', gold: 1000 }, { gold: 1000 }]) {
    const game = createGame(options);
    assert.equal(placeTower(game, 0, 0, LANTERN), true);
    assert.equal(placeTower(game, 1, 0, LANTERN), true);
    const before = game.gold;
    assert.equal(towerPrice(game, LANTERN), 20);
    assert.equal(placeTower(game, 2, 0, LANTERN), true);
    assert.equal(before - game.gold, 20);
  }
});

test('an upgrade costs the same however many towers stand', () => {
  const game = createGame({ difficulty: 'normal', gold: 1000 });
  assert.equal(placeTower(game, 0, 0, LANTERN), true);
  const first = game.towers[0].id;
  let before = game.gold;
  assert.equal(upgradeTower(game, first), null);
  const takes = [before - game.gold];
  for (const [col, row] of FREE.slice(1, 4)) assert.equal(placeTower(game, col, row, LANTERN), true);
  assert.equal(placeTower(game, 4, 0, BRAZIER), true);
  before = game.gold;
  assert.equal(upgradeTower(game, game.towers[1].id), null);
  takes.push(before - game.gold);
  assert.deepEqual(takes, [LANTERN.upgradeCost, LANTERN.upgradeCost]);
  assert.equal(LANTERN.upgradeCost, 25);
});

test('the HUD reads Lantern 25 on normal with one lantern placed', () => {
  const game = createGame({ difficulty: 'normal' });
  assert.equal(placeTower(game, 0, 0, LANTERN), true);
  assert.deepEqual(towerValues(game), [['Lantern 25', HUD_KIND.valueX]]);
});

test('the HUD reads Lantern with no difficulty', () => {
  const game = createGame();
  assert.equal(placeTower(game, 0, 0, LANTERN), true);
  assert.deepEqual(towerValues(game), [['Lantern', HUD_KIND.valueX]]);
});
