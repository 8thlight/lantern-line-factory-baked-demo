import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWave, updateWave, waveDone } from '../src/wave.js';

test('a wave of 5 at 1 second spawns 1 at t=0, then one per second, and exactly 5 in all', () => {
  const wave = createWave({ count: 5, interval: 1 });
  assert.equal(updateWave(wave, 0), 1);
  assert.equal(updateWave(wave, 0.5), 0);
  assert.equal(updateWave(wave, 0.5), 1);
  let total = 2;
  for (let i = 0; i < 200; i++) total += updateWave(wave, 0.1);
  assert.equal(total, 5);
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
