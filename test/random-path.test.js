import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, PATHS, ROWS, TILE, WAYPOINTS, cellCenter, pathLength, pickPath } from '../src/path.js';
import { chooseDifficulty, createGame, nextRound, placementError, placeTower, spawnEnemy } from '../src/game.js';

const corners = (list) => list.map(([col, row]) => ({ col, row }));

test('PATHS holds the five paths of the table, the first WAYPOINTS itself', () => {
  assert.equal(PATHS.length, 5);
  assert.deepEqual(PATHS[0], WAYPOINTS);
  assert.deepEqual(PATHS, [
    corners([[0, 2], [5, 2], [5, 7], [10, 7], [10, 3], [15, 3]]),
    corners([[0, 7], [4, 7], [4, 2], [11, 2], [11, 6], [15, 6]]),
    corners([[0, 4], [3, 4], [3, 8], [8, 8], [8, 3], [15, 3]]),
    corners([[0, 1], [7, 1], [7, 8], [12, 8], [12, 4], [15, 4]]),
    corners([[0, 8], [6, 8], [6, 3], [13, 3], [13, 7], [15, 7]]),
  ]);
});

test('every path runs from column 0 to column 15 on the board in straight segments, 24 to 26 tiles long', () => {
  for (const path of PATHS) {
    const segments = path.slice(1).map((b, i) => [path[i], b]);
    const checks = [
      path[0].col === 0,
      path[path.length - 1].col === COLS - 1,
      ...path.map((c) => c.col >= 0 && c.col < COLS && c.row >= 0 && c.row < ROWS),
      // Exactly one coordinate shared: horizontal or vertical, never of zero length.
      ...segments.map(([a, b]) => (a.col === b.col) !== (a.row === b.row)),
      pathLength(path) / TILE >= 24,
      pathLength(path) / TILE <= 26,
    ];
    assert.deepEqual(checks, checks.map(() => true));
  }
  assert.deepEqual(PATHS.map((p) => pathLength(p) / TILE), [24, 24, 24, 26, 24]);
});

test('pickPath gives path 1 for 0, path 3 for 0.5 and path 5 for 0.99', () => {
  assert.deepEqual([pickPath(() => 0), pickPath(() => 0.5), pickPath(() => 0.99)], [PATHS[0], PATHS[2], PATHS[4]]);
  assert.equal(pickPath(() => 0.5), PATHS[2]);
});

test("a game made with path 4 refuses a tower on path 4, takes one on a cell only path 1 covers, and spawns its first ghost at path 4's first corner", () => {
  const game = createGame({ waypoints: PATHS[3] });
  // (0, 1) is its first corner, (7, 5) mid-way down its second leg.
  assert.deepEqual([placementError(game, 0, 1), placementError(game, 7, 5)], ['path', 'path']);
  // (0, 2) is path 1's first corner and on no leg of path 4.
  assert.equal(placeTower(game, 0, 2), true);
  assert.deepEqual(game.towers.map((t) => [t.col, t.row]), [[0, 2]]);
  const { x, y } = spawnEnemy(game);
  assert.deepEqual({ x, y }, cellCenter({ col: 0, row: 1 }));
  assert.deepEqual({ x, y }, { x: 20, y: 60 });
});

test('nextRound on a hard game with 3 lives left gives a hard game with 8 lives on the picked path', () => {
  const game = createGame({ difficulty: 'hard', waypoints: PATHS[1] });
  game.lives = 3;
  const next = nextRound(game, () => 0.5);
  assert.deepEqual([next.difficulty, next.lives, next.gold, next.status, next.wave], ['hard', 8, 60, 'playing', 1]);
  assert.equal(next.waypoints, PATHS[2]);
  assert.equal(next.options.waypoints, PATHS[2]);

  const ready = nextRound(createGame({ status: 'ready', difficulty: 'normal' }), () => 0.99);
  assert.deepEqual([ready.status, ready.difficulty, ready.waypoints], ['ready', 'normal', PATHS[4]]);
});

test('chooseDifficulty on a ready game made with path 2 keeps path 2', () => {
  const chosen = chooseDifficulty(createGame({ status: 'ready', difficulty: 'normal', waypoints: PATHS[1] }), 'hard');
  assert.deepEqual([chosen.difficulty, chosen.lives], ['hard', 8]);
  assert.equal(chosen.waypoints, PATHS[1]);
});
