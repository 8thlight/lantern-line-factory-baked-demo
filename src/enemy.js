// Enemies ("ghosts") drift along the path at a fixed speed.

import { pathLength, pointAlong } from './path.js';

export const ENEMY_SPEED = 60; // pixels per second
export const ENEMY_HEALTH = 3; // hits of 1 to banish a ghost

export function createEnemy({ id, waypoints, speed = ENEMY_SPEED, health = ENEMY_HEALTH }) {
  const { x, y } = pointAlong(waypoints, 0);
  return { id, x, y, distance: 0, speed, reachedEnd: false, health, maxHealth: health };
}

// Lower an enemy's health by `amount`, never below 0. Mutates it.
// Returns true when the hit leaves it dead.
export function damageEnemy(enemy, amount) {
  enemy.health = Math.max(0, enemy.health - amount);
  return enemy.health === 0;
}

// Health left as a share of full health, 0 to 1: what the health bar draws.
// A ghost made with no health at all has none left, rather than NaN.
export function healthFraction(enemy) {
  return enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 0;
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
