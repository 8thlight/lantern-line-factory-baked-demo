---
milestone: M3
---
# Read escalating waves from a waves table

**Milestone:** M3, Waves and economy

## Why

Every wave is the same, so the game never gets harder.

## What

- Add `src/waves.js` exporting `WAVES`: an array of `{ count, interval, health, speed }`, five entries that grow harder.
- The wave logic from M1 reads the current entry: how many to spawn, how often, and the health and speed each shade gets.
- `totalWaves` comes from `WAVES.length`.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] A test asserts every entry in `WAVES` has a positive `count`, `interval`, `health` and `speed`.
- [ ] A test asserts the table escalates: each wave's `count * health` is at least the previous wave's.
- [ ] In a game test, shades spawned in wave 2 carry wave 2's health and speed.
- [ ] Clearing the last entry ends the game as won.
- [ ] `npm test` passes.
