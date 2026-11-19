import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WAYPOINTS } from '../src/path.js';
import { ENEMY_HEALTH, createEnemy, damageEnemy, healthFraction } from '../src/enemy.js';
import { drawHealthBar } from '../src/render.js';
import { THEME } from '../src/theme.js';

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

test('a ghost made with no health has a fraction of 0, not NaN, and a fresh ghost has 1', () => {
  const empty = createEnemy({ id: 1, waypoints: WAYPOINTS, health: 0 });
  assert.equal(healthFraction(empty), 0);
  assert.equal(healthFraction(createEnemy({ id: 2, waypoints: WAYPOINTS })), 1);
});

// A canvas stand-in that records each filled rectangle and the colour it was filled with.
function recordingContext() {
  const fills = [];
  return {
    fills,
    fillStyle: '',
    fillRect(x, y, width, height) {
      fills.push({ x, y, width, height, colour: this.fillStyle });
    },
  };
}

test('the health bar is a 26x4 track whose fill shortens and turns green, yellow, red with each hit', () => {
  const enemy = createEnemy({ id: 1, waypoints: WAYPOINTS });
  const bars = [];
  for (let hit = 0; hit < 3; hit++) {
    const ctx = recordingContext();
    drawHealthBar(ctx, 100, 50, healthFraction(enemy));
    bars.push(ctx.fills);
    damageEnemy(enemy, 1);
  }
  for (const [track] of bars) {
    assert.deepEqual(track, { x: 87, y: 50, width: 26, height: 4, colour: THEME.healthTrack });
  }
  assert.deepEqual(bars.map(([, fill]) => [fill.width, fill.colour]), [
    [26, THEME.healthHigh],
    [26 * (2 / 3), THEME.healthMid],
    [26 * (1 / 3), THEME.healthLow],
  ]);
});
