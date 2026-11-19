// Enemies ("ghosts") drift along the path at their speed, times a slow factor while slowed.

import { pathLength, pointAlong } from './path.js';

export const ENEMY_SPEED = 60; // pixels per second

export function createEnemy({ id, waypoints, speed = ENEMY_SPEED }) {
  const { x, y } = pointAlong(waypoints, 0);
  return { id, x, y, distance: 0, speed, slow: 1, slowLeft: 0, reachedEnd: false };
}

// Slow an enemy to `factor` of its speed for `seconds`. A second hit replaces the
// factor and refreshes the time; it never multiplies, so slows do not stack.
export function slowEnemy(enemy, factor, seconds) {
  enemy.slow = factor;
  enemy.slowLeft = seconds;
  return enemy;
}

// Move an enemy `dt` seconds along the path. Mutates and returns it.
// A slow that runs out part way through the step ends exactly when it runs out.
export function advanceEnemy(enemy, waypoints, dt) {
  const end = pathLength(waypoints);
  const slowed = Math.min(dt, enemy.slowLeft);
  enemy.distance = Math.min(end, enemy.distance + enemy.speed * (enemy.slow * slowed + (dt - slowed)));
  enemy.slowLeft -= slowed;
  if (enemy.slowLeft <= 0) {
    enemy.slowLeft = 0;
    enemy.slow = 1;
  }
  const { x, y } = pointAlong(waypoints, enemy.distance);
  enemy.x = x;
  enemy.y = y;
  enemy.reachedEnd = enemy.distance >= end;
  return enemy;
}
