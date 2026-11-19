// Three tower kinds. The Lantern fires a beam; the Brazier reaches less far and fires more slowly,
// but its shot splashes onto every ghost around its target; Frost hits lightly but slows the ghost
// it hits for a while. Each shoots the nearest ghost by default, or the one furthest along the
// path once switched to first. A placed tower rises to MAX_LEVEL, each upgrade adding the damage
// and range its kind declares for the gold its kind asks.

import { COLS, ROWS, cellCenter, cellKey } from './path.js';
import { pickTarget } from './targeting.js';

export const LANTERN = { name: 'Lantern', range: 100, cooldown: 0.6, damage: 1, cost: 20, upgradeCost: 25, upgradeDamage: 1, upgradeRange: 20 }; // pixels, seconds, health, gold; per upgrade gold, health, pixels
export const BRAZIER = { name: 'Brazier', range: 80, cooldown: 1.2, damage: 1, splash: 40, cost: 30, upgradeCost: 35, upgradeDamage: 1, upgradeRange: 10 }; // pixels, seconds, health, pixels, gold; per upgrade gold, health, pixels
export const FROST = { name: 'Frost', range: 90, cooldown: 0.8, damage: 0.5, slow: 0.5, slowFor: 2, cost: 40, upgradeCost: 45, upgradeDamage: 0.5, upgradeRange: 10 }; // pixels, seconds, health, factor, seconds, gold; per upgrade gold, health, pixels
export const MAX_LEVEL = 3; // the most a tower is upgraded to

// The kind a key chooses: 1 the lantern, 2 the brazier, 3 frost; any other key keeps `current`.
export function kindForKey(key, current) {
  if (key === '1') return LANTERN;
  if (key === '2') return BRAZIER;
  if (key === '3') return FROST;
  return current;
}

// A kind with no damage of its own hits for the lantern's, so its beams always land;
// a kind with no splash hits its target alone, and a kind with no slow slows nothing.
// A tower starts at level 1 and keeps the kind it was built from, whose upgrade it reads.
export function createTower(col, row, kind = LANTERN) {
  const { x, y } = cellCenter({ col, row });
  const damage = kind.damage ?? LANTERN.damage;
  return { col, row, x, y, range: kind.range, cooldown: kind.cooldown, damage, splash: kind.splash ?? 0, slow: kind.slow ?? 0, slowFor: kind.slowFor ?? 0, reload: 0, mode: 'nearest', level: 1, kind };
}

// The mode a toggle switches to: 'first' gives 'nearest', anything else gives 'first'.
export function nextMode(mode) {
  return mode === 'first' ? 'nearest' : 'first';
}

// The tower standing on a cell, or null.
export function towerAt({ towers }, col, row) {
  return towers.find((t) => t.col === col && t.row === row) ?? null;
}

// The tower with an id, or null.
export function towerById({ towers }, id) {
  return towers.find((t) => t.id === id) ?? null;
}

// A right-click's toggle: while the round is playing, the tower on the cell switches mode.
// Returns that tower, or null when the round is over or the cell holds none.
export function toggleModeAt(state, col, row) {
  if (state.status !== 'playing') return null;
  const tower = towerAt(state, col, row);
  if (tower) tower.mode = nextMode(tower.mode);
  return tower;
}

// Why a tower may not stand on a cell: 'bounds' off the board, 'path' on it, 'taken' under
// another tower; null when the cell is free.
export function cellError({ path, towers }, col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return 'bounds';
  if (path.has(cellKey(col, row))) return 'path';
  if (towerAt({ towers }, col, row) !== null) return 'taken';
  return null;
}

// A tower may stand on any in-bounds cell that is not path and not taken.
export function canPlace(state, col, row) {
  return cellError(state, col, row) === null;
}

// Count the reload down; when ready and an enemy is in range, fire.
// Returns the enemy fired at, or null.
export function updateTower(tower, enemies, dt) {
  tower.reload = Math.max(0, tower.reload - dt);
  if (tower.reload > 0) return null;
  const target = pickTarget(tower, enemies);
  if (target) tower.reload = tower.cooldown;
  return target;
}
