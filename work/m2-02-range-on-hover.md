---
milestone: M2
---
# Show a tower's range when the pointer is over it

**Milestone:** M2, Towers and targeting

## Why

Players cannot see how far a lantern reaches, so placement is guesswork.

## What

- Add `towerAt(state, col, row)` in `src/game.js` returning the tower on that cell or `null`.
- Add `rangePreview(state, hover)` returning `{ x, y, radius }` for the tower under the pointer, or for the tower that would be placed on an empty grass cell, or `null` on a path cell.
- `src/render.js` draws that circle as a faint outline.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] `towerAt` finds a placed tower and returns `null` on an empty cell.
- [ ] `rangePreview` over a placed tower returns its centre and its range.
- [ ] `rangePreview` over empty grass returns the range of the tower kind that would be placed.
- [ ] `rangePreview` over a path cell returns `null`.
- [ ] `npm test` passes.
