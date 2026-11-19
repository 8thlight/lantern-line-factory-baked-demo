// Enemies ("ghosts") drift along the path at their speed, slowed while frost holds them, and pay
// their bounty when banished.

import { pathLength, pointAlong } from './path.js';

export const ENEMY_SPEED = 60; // pixels per second
export const ENEMY_HEALTH = 3; // hits of 1 to banish a ghost
export const ENEMY_BOUNTY = 5; // gold paid when a ghost is banished

export function createEnemy({ id, waypoints, speed = ENEMY_SPEED, health = ENEMY_HEALTH, bounty = ENEMY_BOUNTY }) {
  const { x, y } = pointAlong(waypoints, 0);
  return { id, x, y, distance: 0, speed, slow: 1, slowLeft: 0, reachedEnd: false, health, maxHealth: health, bounty };
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

// Slow an enemy to `factor` of its speed for `duration` seconds. A second hit restarts the time
// and never multiplies, so two hits leave it at the factor; while a slow still runs, the stronger
// of the two factors holds, so a weaker slow never lifts a stronger one. Mutates and returns it.
export function slowEnemy(enemy, factor, duration) {
  enemy.slow = (enemy.slowLeft ?? 0) > 0 ? Math.min(enemy.slow ?? 1, factor) : factor;
  enemy.slowLeft = duration;
  return enemy;
}

// Move an enemy `dt` seconds along the path, at its slowed speed for as much of `dt` as its slow
// has left and at full speed for the rest; once the slow runs out it is back to full speed.
// A ghost built with no slow moves at full speed. Mutates and returns it.
export function advanceEnemy(enemy, waypoints, dt) {
  const end = pathLength(waypoints);
  const slowLeft = enemy.slowLeft ?? 0;
  const slowed = Math.min(dt, slowLeft);
  enemy.distance = Math.min(end, enemy.distance + enemy.speed * ((enemy.slow ?? 1) * slowed + (dt - slowed)));
  enemy.slowLeft = slowLeft - slowed;
  if (enemy.slowLeft === 0) enemy.slow = 1;
  const { x, y } = pointAlong(waypoints, enemy.distance);
  enemy.x = x;
  enemy.y = y;
  enemy.reachedEnd = enemy.distance >= end;
  return enemy;
}
