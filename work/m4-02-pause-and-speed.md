---
milestone: M4
---
# Add a pause and a speed toggle

**Milestone:** M4, HUD and polish

## Why

Players cannot stop to think, and early waves drag.

## What

Follows the design board in `design/hud.md` (the Pause and Speed buttons).

- Add `state.paused` and `state.speed` (1 or 2) in `src/game.js`, with `togglePause(state)` and `toggleSpeed(state)`.
- `step` does nothing while paused and multiplies `dt` by `speed` otherwise.
- Draw the two HUD buttons; clicking them, or pressing P and F, toggles them in `src/main.js`.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] `togglePause` flips `paused`; `toggleSpeed` moves between 1 and 2.
- [ ] A paused `step` leaves enemy positions, spawn timers and tower reloads unchanged.
- [ ] At speed 2, one `step(state, 0.5)` moves a ghost as far as two `step(state, 0.5)` calls at speed 1.
- [ ] `npm test` passes.

## Design

Follow the Claude Design artboard for this task, as design/screens.yaml describes:

- design/screens/HudStates.png (source design/screens/HudStates.dc.html)
