---
milestone: M4
---
# Draw a HUD showing lives, gold and wave

**Milestone:** M4, HUD and polish

## Why

Lives sit in a corner as plain text, and gold and the wave number are not shown at all.

## What

Follows the design board in `design/hud.md` (the HUD bar section and its tokens).

- Add `src/hud.js` with a pure `hudModel(state)` returning `{ lives, gold, wave, totalWaves, paused, speed, livesDanger }`, where `livesDanger` is true at 3 lives or fewer.
- `src/render.js` replaces its lives text with the HUD bar drawn from `hudModel`, using the brief's tokens.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] `hudModel` on a new game returns full lives, starting gold, wave 1 and the total wave count.
- [ ] `livesDanger` is `false` at 4 lives and `true` at 3.
- [ ] `hudModel` reflects gold and wave after they change in state.
- [ ] `hudModel` does not change the state it reads.
- [ ] `npm test` passes.
