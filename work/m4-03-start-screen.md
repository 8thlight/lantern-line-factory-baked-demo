---
milestone: M4
---
# Add a simple start screen

**Milestone:** M4, HUD and polish

## Why

The game starts spawning the moment the page loads, before the player has read anything.

## What

Follows the design board in `design/hud.md` (the Start screen section).

- Add a `'ready'` status in `src/game.js`; a new game starts in it and `step` changes nothing while ready.
- Add `start(state)` that moves `'ready'` to `'playing'`.
- `src/render.js` draws the start overlay per the brief; a click on Start, or Enter or Space, calls `start` in `src/main.js`.
- After a restart (M1) the game returns to `'ready'`.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] A new game's status is `'ready'`, and stepping it spawns nothing.
- [ ] `start` moves status to `'playing'`, and the next step spawns the first ghost.
- [ ] `start` on a game already playing changes nothing.
- [ ] `npm test` passes.
