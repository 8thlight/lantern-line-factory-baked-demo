import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_GOLD, createGame, hoverAt, placeTower, placementError } from '../src/game.js';
import { BRAZIER, LANTERN } from '../src/tower.js';
import { COLS, TILE, WAYPOINTS } from '../src/path.js';
import { draw } from '../src/render.js';
import { THEME } from '../src/theme.js';

// A game whose waves hold no ghosts. Cell (3, 1) is free grass; WAYPOINTS[0] is path.
function quietGame(options) {
  return createGame({ ...options, waveSize: 0 });
}

// A canvas stand-in that records each call with the fill style it was made under.
function recordingContext() {
  const calls = [];
  const styles = {};
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name in styles) return styles[name];
        if (name in target) return target[name];
        return (...args) => {
          calls.push({ name, args, fillStyle: styles.fillStyle });
          return name.startsWith('create') ? { addColorStop() {} } : undefined;
        };
      },
      set(target, name, value) {
        styles[name] = value;
        return true;
      },
    },
  );
}

// The fill style of the last fillRect drawn exactly over cell (col, row): the grass first, then the hover.
function lastCellFill(ctx, col, row) {
  const rect = JSON.stringify([col * TILE, row * TILE, TILE, TILE]);
  return ctx.calls.filter((c) => c.name === 'fillRect' && JSON.stringify(c.args) === rect).at(-1)?.fillStyle;
}

test('a lantern costs 20 and a brazier 30', () => {
  assert.deepEqual([LANTERN.cost, BRAZIER.cost], [20, 30]);
});

test('with 50 gold, placing a lantern leaves 30, and a brazier costs 30', () => {
  assert.equal(START_GOLD, 50);
  const lit = quietGame();
  assert.equal(placeTower(lit, 3, 1, LANTERN), true);
  assert.equal(lit.gold, 30);

  const burning = quietGame();
  assert.equal(placeTower(burning, 3, 1, BRAZIER), true);
  assert.equal(burning.gold, 20);

  const plain = quietGame();
  assert.equal(placeTower(plain, 3, 1), true);
  assert.deepEqual([plain.towers[0].range, plain.gold], [LANTERN.range, 30]);
});

test('with 10 gold, placing a lantern is refused, no tower is added and gold stays 10', () => {
  const game = quietGame({ gold: 10 });
  assert.equal(placeTower(game, 3, 1, LANTERN), false);
  assert.deepEqual([game.towers.length, game.gold], [0, 10]);

  const exact = quietGame({ gold: 20 });
  assert.equal(placeTower(exact, 3, 1, LANTERN), true);
  assert.deepEqual([exact.towers.length, exact.gold], [1, 0]);
});

test('placementError names each refusal', () => {
  const game = quietGame();
  assert.equal(placeTower(game, 3, 1, LANTERN), true);
  const start = WAYPOINTS[0];
  assert.deepEqual(
    [
      placementError(game, start.col, start.row, LANTERN),
      placementError(game, 3, 1, LANTERN),
      placementError(game, -1, 0, LANTERN),
      placementError(game, COLS, 0, LANTERN),
      placementError(game, 4, 1, LANTERN),
      placementError(game, 4, 1),
    ],
    ['path', 'taken', 'bounds', 'bounds', null, null],
  );
  game.gold = 10;
  assert.deepEqual([placementError(game, 4, 1, LANTERN), placementError(game, 4, 1)], ['gold', 'gold']);
});

test('a refused placement spends nothing on the path, on a taken cell or off the board', () => {
  const game = quietGame();
  assert.equal(placeTower(game, 3, 1, LANTERN), true);
  const start = WAYPOINTS[0];
  assert.deepEqual(
    [placeTower(game, start.col, start.row, LANTERN), placeTower(game, 3, 1, BRAZIER), placeTower(game, -1, 0, LANTERN)],
    [false, false, false],
  );
  assert.deepEqual([game.towers.length, game.gold], [1, 30]);
});

test('draw paints a free cell the player cannot afford in the refusal colour', () => {
  const poor = quietGame({ gold: 10 });
  const hover = hoverAt(poor, 3, 1, LANTERN);
  assert.deepEqual(hover, { col: 3, row: 1, kind: LANTERN, ok: false });
  const refused = recordingContext();
  draw(refused, poor, hover);
  assert.equal(lastCellFill(refused, 3, 1), THEME.hoverBad);

  const rich = quietGame();
  const welcome = recordingContext();
  draw(welcome, rich, hoverAt(rich, 3, 1, LANTERN));
  assert.equal(lastCellFill(welcome, 3, 1), THEME.hover);
});

test('a kind with no cost places free and spends nothing', () => {
  const game = quietGame({ gold: 0 });
  const free = { range: 50, cooldown: 1, damage: 1 };
  assert.deepEqual([placementError(game, 3, 1, free), placeTower(game, 3, 1, free)], [null, true]);
  assert.deepEqual([game.towers.length, game.gold], [1, 0]);
});
