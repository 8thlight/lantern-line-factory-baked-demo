// The map: a grid of square tiles and the paths across it.
// Pure logic, no DOM: safe to import from tests.

export const TILE = 40;
export const COLS = 16;
export const ROWS = 10;

// Corners of path 1, the path a game made without waypoints walks, in grid cells. The path runs
// straight between them.
export const WAYPOINTS = [
  { col: 0, row: 2 },
  { col: 5, row: 2 },
  { col: 5, row: 7 },
  { col: 10, row: 7 },
  { col: 10, row: 3 },
  { col: 15, row: 3 },
];

const corners = (list) => list.map(([col, row]) => ({ col, row }));

// Five paths on the same board, each from column 0 to column 15 in straight runs and 24 to 26
// tiles long, so a round takes about as long on any of them. The first is WAYPOINTS.
export const PATHS = [
  WAYPOINTS,
  corners([[0, 7], [4, 7], [4, 2], [11, 2], [11, 6], [15, 6]]),
  corners([[0, 4], [3, 4], [3, 8], [8, 8], [8, 3], [15, 3]]),
  corners([[0, 1], [7, 1], [7, 8], [12, 8], [12, 4], [15, 4]]),
  corners([[0, 8], [6, 8], [6, 3], [13, 3], [13, 7], [15, 7]]),
];

// One of PATHS, each equally likely, for a `random` answering 0 up to but not including 1, such
// as Math.random.
export function pickPath(random) {
  return PATHS[Math.floor(random() * PATHS.length)];
}

export const cellKey = (col, row) => `${col},${row}`;

export function cellCenter({ col, row }) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

// Every grid cell the path covers, as a Set of cellKey strings.
export function pathCells(waypoints = WAYPOINTS) {
  const cells = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const dc = Math.sign(b.col - a.col);
    const dr = Math.sign(b.row - a.row);
    const steps = Math.max(Math.abs(b.col - a.col), Math.abs(b.row - a.row));
    for (let s = 0; s <= steps; s++) cells.add(cellKey(a.col + dc * s, a.row + dr * s));
  }
  return cells;
}

// Total length of the path in pixels, centre of first cell to centre of last.
export function pathLength(waypoints = WAYPOINTS) {
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = cellCenter(waypoints[i]);
    const b = cellCenter(waypoints[i + 1]);
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

// The pixel point reached after travelling `distance` pixels along the path.
// Clamped to the start and the end.
export function pointAlong(waypoints, distance) {
  let left = Math.max(0, distance);
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = cellCenter(waypoints[i]);
    const b = cellCenter(waypoints[i + 1]);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= len) {
      const t = len === 0 ? 0 : left / len;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    left -= len;
  }
  return cellCenter(waypoints[waypoints.length - 1]);
}
