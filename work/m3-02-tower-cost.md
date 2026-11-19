---
milestone: M3
---
# Make towers cost gold and refuse placement when short

**Milestone:** M3, Waves and economy

## Why

Gold has to be spent on something, and free towers make the game trivial.

## What

- Give each tower kind a `cost` in `src/tower.js` (lantern 20).
- `placeTower` in `src/game.js` refuses when `state.gold` is below the cost, and deducts the cost when it places.
- Return a reason from a new `placementError(state, col, row, kind)`: `'path'`, `'taken'`, `'bounds'`, `'gold'` or `null`.
- The hover highlight in `src/render.js` shows refused cells in the refusal colour, including for lack of gold.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] With 50 gold, placing a 20-gold lantern leaves 30.
- [ ] With 10 gold, placing a lantern is refused, no tower is added, and gold stays 10.
- [ ] `placementError` returns `'gold'`, `'path'`, `'taken'` and `'bounds'` in the matching cases, and `null` for a valid cell with enough gold.
- [ ] The gold-per-kill tests may be updated so their totals account for the tower's cost, with every bounty amount unchanged; every other existing suite stays unedited.
- [ ] `npm test` passes.

## Design

Follow the Claude Design artboard for this task, as design/screens.yaml describes:

- design/screens/HudStates.png (source design/screens/HudStates.dc.html)
