// Choosing what a tower shoots at.

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function inRange(tower, enemy) {
  return distance(tower, enemy) <= tower.range;
}

// The enemy closest to the tower among those within its range, or null.
export function nearestInRange(tower, enemies) {
  let best = null;
  let bestDist = Infinity;
  for (const enemy of enemies) {
    const d = distance(tower, enemy);
    if (d <= tower.range && d < bestDist) {
      best = enemy;
      bestDist = d;
    }
  }
  return best;
}

// The enemy furthest along the path among those within the tower's range, or null.
export function firstInRange(tower, enemies) {
  let best = null;
  for (const enemy of enemies) {
    if (inRange(tower, enemy) && (best === null || enemy.distance > best.distance)) best = enemy;
  }
  return best;
}

// The enemy the tower's mode chooses: 'first' the leader, anything else the nearest.
export function pickTarget(tower, enemies) {
  return tower.mode === 'first' ? firstInRange(tower, enemies) : nearestInRange(tower, enemies);
}

// Every enemy within `radius` of `center`, an enemy exactly on the edge included.
export function splashTargets(center, enemies, radius) {
  return enemies.filter((enemy) => distance(center, enemy) <= radius);
}
