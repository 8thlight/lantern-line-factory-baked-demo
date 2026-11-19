import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WAYPOINTS } from '../src/path.js';
import { ENEMY_HEALTH, createEnemy, damageEnemy, healthFraction } from '../src/enemy.js';

test('a ghost starts at full health, 3 by default', () => {
  const enemy = createEnemy({ id: 1, waypoints: WAYPOINTS });
  assert.equal(ENEMY_HEALTH, 3);
  assert.equal(enemy.health, 3);
  assert.equal(enemy.maxHealth, 3);
  const tough = createEnemy({ id: 2, waypoints: WAYPOINTS, health: 5 });
  assert.equal(tough.health, 5);
  assert.equal(tough.maxHealth, 5);
});

test('one hit of 1 on a 3-health ghost leaves 2 health and does not kill it', () => {
  const enemy = createEnemy({ id: 1, waypoints: WAYPOINTS });
  assert.equal(damageEnemy(enemy, 1), false);
  assert.equal(enemy.health, 2);
  assert.equal(damageEnemy(enemy, 2), true);
});

test('three hits of 1 kill a 3-health ghost, the third returning true with health exactly 0', () => {
  const enemy = createEnemy({ id: 1, waypoints: WAYPOINTS });
  assert.equal(damageEnemy(enemy, 1), false);
  assert.equal(damageEnemy(enemy, 1), false);
  assert.equal(damageEnemy(enemy, 1), true);
  assert.equal(enemy.health, 0);
});

test('an overkill clamps health at 0 rather than going negative', () => {
  const enemy = createEnemy({ id: 1, waypoints: WAYPOINTS });
  assert.equal(damageEnemy(enemy, 10), true);
  assert.equal(enemy.health, 0);
});

test('healthFraction is 1 when fresh, 2/3 after one hit of 1, and 0 when dead', () => {
  const enemy = createEnemy({ id: 1, waypoints: WAYPOINTS });
  assert.equal(healthFraction(enemy), 1);
  damageEnemy(enemy, 1);
  assert.equal(healthFraction(enemy), 2 / 3);
  damageEnemy(enemy, 5);
  assert.equal(healthFraction(enemy), 0);
});
