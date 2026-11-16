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
