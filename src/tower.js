// The one tower type today: the Lantern. It fires a beam at the nearest enemy.

import { COLS, ROWS, cellCenter, cellKey } from './path.js';
import { nearestInRange } from './targeting.js';

export const LANTERN = { range: 100, cooldown: 0.6, damage: 1 }; // pixels, seconds, health

// A kind with no damage of its own hits for the lantern's, so its beams always land.
export function createTower(col, row, kind = LANTERN) {
  const { x, y } = cellCenter({ col, row });
  const damage = kind.damage ?? LANTERN.damage;
  return { col, row, x, y, range: kind.range, cooldown: kind.cooldown, damage, reload: 0 };
}

// A tower may stand on any in-bounds cell that is not path and not taken.
export function canPlace({ path, towers }, col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return false;
  if (path.has(cellKey(col, row))) return false;
  return !towers.some((t) => t.col === col && t.row === row);
}

// Count the reload down; when ready and an enemy is in range, fire.
// Returns the enemy fired at, or null.
export function updateTower(tower, enemies, dt) {
  tower.reload = Math.max(0, tower.reload - dt);
  if (tower.reload > 0) return null;
  const target = nearestInRange(tower, enemies);
  if (target) tower.reload = tower.cooldown;
  return target;
}
