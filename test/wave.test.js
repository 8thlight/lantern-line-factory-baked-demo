import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWave, updateWave, waveDone } from '../src/wave.js';

test('a wave of 5 at 1 second spawns 1 at t=0, then one per second, and exactly 5 in all', () => {
  const wave = createWave({ count: 5, interval: 1 });
  assert.equal(updateWave(wave, 0), 1);
  assert.equal(updateWave(wave, 0.5), 0);
  assert.equal(updateWave(wave, 0.5), 1);
});

test('a wave of 5 at 1 second spawns each ghost one second after the last, and 5 in all', () => {
  const wave = createWave({ count: 5, interval: 1 });
  const dt = 0.25; // exact in binary, so the clock lands on each second
  const spawnedAt = [];
  for (let tick = 0; tick <= 80; tick++) {
    const n = updateWave(wave, tick === 0 ? 0 : dt);
    for (let i = 0; i < n; i++) spawnedAt.push(tick * dt);
  }
  assert.deepEqual(spawnedAt, [0, 1, 2, 3, 4]);
});

test('a single large dt spawns the backlog but never more than count', () => {
  const wave = createWave({ count: 5, interval: 1 });
  assert.equal(updateWave(wave, 10), 5);
  assert.equal(updateWave(wave, 10), 0);
});

test('waveDone is false until the last ghost has spawned, then true', () => {
  const wave = createWave({ count: 5, interval: 1 });
  for (let i = 0; i < 4; i++) {
    assert.equal(updateWave(wave, i === 0 ? 0 : 1), 1);
    assert.equal(waveDone(wave), false);
  }
  assert.equal(updateWave(wave, 1), 1);
  assert.equal(waveDone(wave), true);
});
