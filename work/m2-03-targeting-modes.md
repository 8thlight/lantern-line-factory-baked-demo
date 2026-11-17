---
milestone: M2
---
# Let a tower target the first ghost or the nearest

**Milestone:** M2, Towers and targeting

## Why

Nearest is not always best: the ghost furthest along the path is the one about to cost a life.

## What

- Add `firstInRange(tower, enemies)` in `src/targeting.js`: the in-range enemy with the greatest `distance` travelled.
- Add `pickTarget(tower, enemies)` that dispatches on `tower.mode` (`'nearest'` default, or `'first'`).
- `updateTower` uses `pickTarget`.
- Right-clicking a tower in `src/main.js` toggles its mode.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] With two ghosts in range, `firstInRange` picks the one further along the path even when the other is closer to the tower.
- [ ] `firstInRange` ignores ghosts out of range and returns `null` when none qualify.
- [ ] `pickTarget` returns the nearest for mode `'nearest'` and the first for mode `'first'`, on the same enemies.
- [ ] A new tower's mode is `'nearest'`.
- [ ] `npm test` passes.
