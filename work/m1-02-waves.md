---
labels: [hydraflow]
milestone: M1
---
# Spawn ghosts in waves of N at an interval

**Milestone:** M1, Core loop

## Why

Ghosts arrive forever at one fixed rate, so there is no rhythm, no breather and nothing to count.

## What

- Add `src/wave.js` with `createWave({ count, interval })` and `updateWave(wave, dt)` that returns how many ghosts to spawn this tick, and `waveDone(wave)` once all `count` have spawned.
- `src/game.js` replaces its endless spawn timer with the current wave: spawn what `updateWave` returns, and start the next wave when the current one has finished spawning and the board is clear.
- Keep a `state.wave` number starting at 1.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] A wave of 5 at 1 second spawns 1 at t=0, then one per second, and exactly 5 in total however long it runs.
- [ ] A single large `dt` (for example 10 seconds) still spawns no more than `count`.
- [ ] `waveDone` is `false` until the last ghost has spawned, then `true`.
- [ ] In a game test, `state.wave` moves from 1 to 2 only after wave 1 has spawned out and its ghosts are gone.
- [ ] `npm test` passes.
