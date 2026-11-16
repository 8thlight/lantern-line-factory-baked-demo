// Enemies ("shades") drift along the path at a fixed speed.

import { pathLength, pointAlong } from './path.js';

export const ENEMY_SPEED = 60; // pixels per second

export function createEnemy({ id, waypoints, speed = ENEMY_SPEED }) {
  const { x, y } = pointAlong(waypoints, 0);
  return { id, x, y, distance: 0, speed, reachedEnd: false };
}

// Move an enemy `dt` seconds along the path. Mutates and returns it.
export function advanceEnemy(enemy, waypoints, dt) {
  const end = pathLength(waypoints);
  enemy.distance = Math.min(end, enemy.distance + enemy.speed * dt);
  const { x, y } = pointAlong(waypoints, enemy.distance);
  enemy.x = x;
  enemy.y = y;
  enemy.reachedEnd = enemy.distance >= end;
  return enemy;
}
