import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstInRange, nearestInRange, pickTarget } from '../src/targeting.js';
import { BRAZIER, createTower, nextMode, towerAt, updateTower } from '../src/tower.js';

const tower = { x: 0, y: 0, range: 100 };
const near = { id: 'near', x: 10, y: 0, distance: 50 };
const leader = { id: 'leader', x: 90, y: 0, distance: 200 };

test('firstInRange picks the ghost further along the path even when the other is nearer', () => {
  assert.equal(nearestInRange(tower, [near, leader]), near);
  assert.equal(firstInRange(tower, [near, leader]), leader);
  assert.equal(firstInRange(tower, [leader, near]), leader);
});

test('firstInRange ignores ghosts out of range and returns null when none qualify', () => {
  const beyond = { id: 'beyond', x: 101, y: 0, distance: 999 };
  const inside = { id: 'inside', x: 50, y: 0, distance: 10 };
  assert.equal(firstInRange(tower, [beyond, inside]), inside);
  assert.equal(firstInRange(tower, [beyond]), null);
  assert.equal(firstInRange(tower, []), null);
  const edge = { id: 'edge', x: 60, y: 80, distance: 1 }; // distance 100
  assert.equal(firstInRange(tower, [edge]), edge);
});

test('pickTarget returns the nearest for mode nearest and the first for mode first', () => {
  assert.equal(pickTarget({ ...tower, mode: 'nearest' }, [near, leader]), near);
  assert.equal(pickTarget({ ...tower, mode: 'first' }, [near, leader]), leader);
  assert.equal(pickTarget(tower, [near, leader]), near);
});

test("a new tower's mode is nearest, and the toggle flips it", () => {
  assert.equal(createTower(1, 1).mode, 'nearest');
  assert.equal(createTower(1, 1, BRAZIER).mode, 'nearest');
  assert.equal(nextMode('nearest'), 'first');
  assert.equal(nextMode('first'), 'nearest');
});

test('towerAt finds the tower on a cell, or null', () => {
  const placed = createTower(1, 1);
  const towers = [placed];
  assert.equal(towerAt({ towers }, 1, 1), placed);
  assert.equal(towerAt({ towers }, 2, 1), null);
});

test('updateTower fires at the first ghost for a tower in mode first', () => {
  const t = createTower(0, 0);
  t.mode = 'first';
  const close = { x: t.x + 10, y: t.y, distance: 5 };
  const ahead = { x: t.x + 80, y: t.y, distance: 300 };
  assert.equal(updateTower(t, [close, ahead], 0.016), ahead);
  assert.equal(updateTower(createTower(0, 0), [close, ahead], 0.016), close);
});
