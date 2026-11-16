import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inRange, nearestInRange } from '../src/targeting.js';
import { createTower, updateTower } from '../src/tower.js';

const tower = { x: 0, y: 0, range: 100 };

test('nearestInRange picks the closest enemy within range', () => {
  const far = { id: 'far', x: 90, y: 0 };
  const near = { id: 'near', x: 0, y: 30 };
  const mid = { id: 'mid', x: 50, y: 0 };
  assert.equal(nearestInRange(tower, [far, near, mid]), near);
});

test('nearestInRange ignores enemies out of range and returns null when none qualify', () => {
  const outside = { x: 101, y: 0 };
  assert.equal(inRange(tower, outside), false);
  assert.equal(nearestInRange(tower, [outside]), null);
  assert.equal(nearestInRange(tower, []), null);
});

test('an enemy exactly on the range edge is in range', () => {
  const edge = { x: 60, y: 80 }; // distance 100
  assert.equal(nearestInRange(tower, [edge]), edge);
});

test('a tower fires, then waits out its cooldown before firing again', () => {
  const t = createTower(0, 0);
  const enemy = { x: t.x + 10, y: t.y };
  assert.equal(updateTower(t, [enemy], 0.016), enemy);
  assert.equal(updateTower(t, [enemy], t.cooldown / 2), null);
  assert.equal(updateTower(t, [enemy], t.cooldown / 2), enemy);
});
