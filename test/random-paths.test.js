import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, TILE, PATHS, WAYPOINTS, cellKey, pathCells, pathLength, pickPath } from '../src/path.js';
import { chooseDifficulty, createGame, nextRound, placementError, spawnEnemy } from '../src/game.js';

// The brief's table of corners, written as `col,row` pairs.
const corners = (list) => list.map(([col, row]) => ({ col, row }));

test('PATHS holds exactly the five listed paths, the first WAYPOINTS', () => {
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

test('every path starts in column 0, ends in column 15, stays on the board, turns only at right angles and is 24 to 26 tiles long', () => {
  for (const path of PATHS) {
    const first = path[0];
    const last = path[path.length - 1];
    assert.deepEqual(
      [
        first.col === 0,
        last.col === COLS - 1,
        path.every(({ col, row }) => col >= 0 && col < COLS && row >= 0 && row < ROWS),
        path.slice(1).every((b, i) => b.col === path[i].col || b.row === path[i].row),
        pathLength(path) / TILE >= 24,
        pathLength(path) / TILE <= 26,
      ],
      [true, true, true, true, true, true],
    );
  }
  assert.deepEqual(PATHS.map((path) => pathLength(path) / TILE), [24, 24, 24, 26, 24]);
});

test('pickPath returns path 1 for 0, path 3 for 0.5 and path 5 for 0.99', () => {
  assert.deepEqual([pickPath(() => 0), pickPath(() => 0.5), pickPath(() => 0.99)], [PATHS[0], PATHS[2], PATHS[4]]);
});

test('a game on path 4 refuses a tower on path 4, accepts one on a cell only path 1 covers, and its first ghost starts at path 4\'s first corner', () => {
  const game = createGame({ waypoints: PATHS[3] });
  assert.deepEqual(
    [placementError(game, 3, 1), placementError(game, 5, 5), pathCells(PATHS[0]).has(cellKey(5, 5)), pathCells(PATHS[3]).has(cellKey(5, 5))],
    ['path', null, true, false],
  );
  spawnEnemy(game);
  assert.deepEqual([game.enemies[0].x, game.enemies[0].y], [20, 60]); // the centre of (0, 1)
});

test('nextRound on a hard game with 3 lives gives a hard game with 8 lives on the path its random picks', () => {
  const game = createGame({ difficulty: 'hard' });
  game.lives = 3;
  const next = nextRound(game, () => 0.7);
  assert.deepEqual([next.difficulty, next.lives, next.waypoints, next.path], ['hard', 8, PATHS[3], pathCells(PATHS[3])]);
});

test('chooseDifficulty on a ready game on path 2 keeps path 2', () => {
  const next = chooseDifficulty(createGame({ status: 'ready', waypoints: PATHS[1] }), 'hard');
  assert.deepEqual([next.difficulty, next.waypoints], ['hard', PATHS[1]]);
});
