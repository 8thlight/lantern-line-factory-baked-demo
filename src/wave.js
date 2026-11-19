// A wave: `count` ghosts, one at once and then one every `interval` seconds.
// Pure logic, no DOM: safe to import from tests.

export function createWave({ count, interval }) {
  return { count, interval, spawned: 0, timer: 0 };
}

// Count the wave's timer down by `dt` seconds. Mutates the wave.
// Returns how many ghosts to spawn this tick: the backlog a long tick owes,
// but never past `count`.
export function updateWave(wave, dt) {
  wave.timer -= dt;
  let spawn = 0;
  while (wave.timer <= 0 && wave.spawned < wave.count) {
    wave.spawned += 1;
    wave.timer += wave.interval;
    spawn += 1;
  }
  return spawn;
}

export function waveDone(wave) {
  return wave.spawned >= wave.count;
}
