---
milestone: M2
---
# Add a second tower type with splash damage

**Milestone:** M2, Towers and targeting

## Why

With one tower type there is no choice to make. A slower tower that hits a crowd gives the player a decision.

## What

- In `src/tower.js`, add a `BRAZIER` kind: shorter range, slower cooldown, and a `splash` radius in pixels.
- Add `splashTargets(center, enemies, radius)` in `src/targeting.js` returning every enemy within `radius` of `center`.
- When a brazier fires at its target, every shade in `splashTargets` around the target takes damage.
- Let the player choose the kind to place with keys 1 and 2 in `src/main.js`; draw the brazier as an orange square in `src/render.js`.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] `splashTargets` returns the enemies within the radius, includes one exactly on the edge, and excludes one just outside.
- [ ] In a game test, a brazier firing at a group of three close shades damages all three; a lantern in the same spot damages one.
- [ ] `createTower(col, row, BRAZIER)` carries the brazier's range, cooldown and splash.
- [ ] `npm test` passes.
