// Tower kinds. The Lantern fires a beam at the nearest enemy; Frost slows the one it hits.

import { cellCenter } from './path.js';
import { nearestInRange } from './targeting.js';

export const LANTERN = { name: 'Lantern', range: 100, cooldown: 0.6, cost: 0 }; // pixels, seconds, gold
// Frost does no damage: it sets a hit ghost's speed to `slow` times its own for `slowFor` seconds.
export const FROST = { name: 'Frost', range: 90, cooldown: 1.0, cost: 40, slow: 0.5, slowFor: 2 };

// The tower picker: key 1 the lantern, key 3 frost. Any other key keeps the current kind.
export function kindForKey(key, current) {
  if (key === '1') return LANTERN;
  if (key === '3') return FROST;
  return current;
}

export function createTower(col, row, kind = LANTERN) {
  const { x, y } = cellCenter({ col, row });
  return {
    col, row, x, y, kind,
    range: kind.range, cooldown: kind.cooldown, slow: kind.slow, slowFor: kind.slowFor,
    reload: 0,
  };
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
