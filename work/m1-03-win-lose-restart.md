---
labels: [hydraflow]
milestone: M1
---
# Add win and lose states with a restart

**Milestone:** M1, Core loop

## Why

At zero lives the game carries on, and there is no end to reach, so a round never resolves.

## What

- Add `state.status` to `src/game.js`: `'playing'`, `'won'` or `'lost'`.
- Lives reaching 0 sets `'lost'`. Clearing the final wave from `work/m1-02-waves.md` (a `totalWaves` option, default 5) with lives left sets `'won'`.
- While not `'playing'`, `step` changes nothing.
- Add `restart(state)` that returns a fresh game with the same options.
- `src/render.js` draws "The ghosts got through" or "The path is safe" and "Click to play again"; a click in `src/main.js` calls `restart` when the round is over.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] Losing the last life sets `status` to `'lost'`.
- [ ] Clearing every wave with lives left sets `status` to `'won'`.
- [ ] Calling `step` on a lost or won game leaves enemies, lives and towers unchanged.
- [ ] `restart` returns full lives, no towers, no enemies, wave 1 and `status` `'playing'`.
- [ ] `npm test` passes.
