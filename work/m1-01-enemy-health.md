---
labels: [hydraflow]
milestone: M1
---
# Give ghosts health so a hit damages rather than kills

**Milestone:** M1, Core loop

## Why

Today one lantern beam removes a ghost outright, so a single lantern holds the path and there is no reason to build more.

## What

- In `src/enemy.js`, `createEnemy` takes a `health` option (default 3) and stores `health` and `maxHealth`.
- Add `damageEnemy(enemy, amount)` that lowers `health` (never below 0) and returns `true` when the ghost is dead.
- Give the lantern a `damage` of 1 in `src/tower.js`.
- In `src/game.js` `step`, a beam calls `damageEnemy`; only a dead ghost is removed and counted in `kills`.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] `damageEnemy` on a 3-health ghost with 1 damage leaves 2 health and returns `false`.
- [ ] Three hits of 1 kill a 3-health ghost: the third returns `true` and `health` is 0, not negative.
- [ ] In a game test, a ghost with 3 health beside a lantern is still on the board after the first shot and gone after the third, with `kills` going 0 then 1.
- [ ] `npm test` passes.

## Design

Follow the Claude Design artboard for this task, as design/screens.yaml describes:

- design/screens/Board.png (source design/screens/Board.dc.html)
