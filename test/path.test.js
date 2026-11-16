import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILE, WAYPOINTS, cellKey, pathCells, pathLength, pointAlong } from '../src/path.js';
import { advanceEnemy, createEnemy } from '../src/enemy.js';

const L = [
  { col: 0, row: 0 },
  { col: 2, row: 0 },
  { col: 2, row: 2 },
];

test('pathCells covers every cell between the corners and nothing else', () => {
  const cells = pathCells(L);
  assert.deepEqual([...cells].sort(), ['0,0', '1,0', '2,0', '2,1', '2,2']);
  assert.equal(cells.has(cellKey(1, 1)), false);
});

test('the default map path starts on the left edge and ends on the right edge', () => {
  const cells = pathCells(WAYPOINTS);
  assert.ok(cells.has(cellKey(0, WAYPOINTS[0].row)));
  assert.ok(cells.has(cellKey(15, WAYPOINTS.at(-1).row)));
});

test('pathLength sums the straight segments in pixels', () => {
  assert.equal(pathLength(L), 4 * TILE);
});

test('pointAlong walks round the corner and clamps at both ends', () => {
  const half = TILE / 2;
  assert.deepEqual(pointAlong(L, -10), { x: half, y: half });
  assert.deepEqual(pointAlong(L, TILE), { x: TILE + half, y: half });
  assert.deepEqual(pointAlong(L, 3 * TILE), { x: 2 * TILE + half, y: TILE + half });
  assert.deepEqual(pointAlong(L, 99 * TILE), { x: 2 * TILE + half, y: 2 * TILE + half });
});

test('an enemy follows the path at its speed and flags the end', () => {
  const enemy = createEnemy({ id: 1, waypoints: L, speed: TILE });
  advanceEnemy(enemy, L, 3);
  assert.deepEqual({ x: enemy.x, y: enemy.y }, pointAlong(L, 3 * TILE));
  assert.equal(enemy.reachedEnd, false);
  advanceEnemy(enemy, L, 5);
  assert.equal(enemy.distance, 4 * TILE);
  assert.equal(enemy.reachedEnd, true);
});
