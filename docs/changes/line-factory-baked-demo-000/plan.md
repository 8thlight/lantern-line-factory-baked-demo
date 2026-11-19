# Plan: show a lantern's range when the pointer is over it

Print: line-factory-baked-demo-000 · Class: fix · Issue #6 (opened as #29) · Bead lantern-line-factory-baked-demo-000

## What was read

- `docs/changes/line-factory-baked-demo-000/triage.md`: the brief, its touches, its reproduces and its acceptance criterion.
- `spec.md` and `plan/research.md` are not in the worktree. For this fix-class print the triage is the signed spec: it carries the `touches:` and `reproduces:` this plan holds to. No research ran, so no scope was declared (see below).
- `src/game.js`, `src/tower.js`, `src/render.js`, `src/main.js`, `src/path.js`, `package.json`, `test/game.test.js`.
- `design/screens.yaml`, `design/screens/Main.dc.html`, `design/screens/Board.dc.html`, `work/m2-02-range-on-hover.md`.

## Corrections to the triage, read off the tree

- **`src/theme.js` does not exist.** The colours live in `PALETTE`, exported from `src/render.js` and used only there. The triage's `THEME.hover`/`THEME.hoverBad` are really `PALETTE.hover`/`PALETTE.hoverBad`. `src/theme.js` is already in the signed touches, so the plan creates it as a new file (step 3). The touches still hold the work, so they do not need amending.
- `src/game.js` does not export `restart`. This does not affect the plan.
- `cellCenter` is in `src/path.js`, and `LANTERN` is in `src/tower.js`. `game.js` imports both from there.

## Declared scope

None. `plan/research.md` is absent, so research declared no scope. The plan covers the whole brief: everything listed under "What" and every acceptance criterion in the triage.

## Who meets it

- person: the player, pointing at a placed lantern or at empty grass while choosing where to build, who sees the faint range ring the Main artboard shows (design/screens/Main.png, source design/screens/Main.dc.html; the ring itself is drawn in design/screens/Board.dc.html, which Main imports).

## Refusals

- none: `towerAt` and `rangePreview` are pure lookups that return `null` when there is no tower or nothing to preview, and drawing a ring only adds to the canvas. The change refuses nothing new, and no new message reaches a person or an agent.

## Touches

As signed in triage.md, unchanged:

touches:
  - src/game.js
  - src/render.js
  - src/theme.js
  - test/range-preview.test.js

reproduces:
  - test/range-preview.test.js

## Steps

1. **Red first: `test/range-preview.test.js`** (node:test and `node:assert/strict`, in the style of `test/game.test.js`). Build the game with `createGame()`. Choose cells from the default `WAYPOINTS`: (0,2) is a path cell, and (3,5) is grass. Tests:
   - `towerAt` returns the placed tower object (the same entry as in `state.towers`) after `placeTower(state, 3, 5)`, and returns `null` on an empty grass cell.
   - `rangePreview(state, { col: 3, row: 5 })` over that placed tower deep-equals `{ x: tower.x, y: tower.y, radius: tower.range }`. To prove the range comes from the tower and not from `LANTERN`, set the tower's `range` to a value other than `LANTERN.range` before the call.
   - Over empty grass, `rangePreview` deep-equals `{ ...cellCenter({ col, row }), radius: LANTERN.range }`.
   - Over a path cell, `rangePreview` returns `null`. With `hover` `null`, it also returns `null`.
   - `draw(ctx, state, hover)`, called with a recording fake 2D context (a Proxy that records each method call and property set and stubs everything else), strokes an `arc(x, y, radius, …)` at the tower's centre and range while `strokeStyle === THEME.rangeRing`. With `hover` `null`, it draws no arc of that radius.
   Run `node --test test/range-preview.test.js`. It must fail because the exports are missing. Commit it red.
2. **`src/game.js`**: import `LANTERN` from `./tower.js` (beside `canPlace` and `createTower`) and `cellCenter` from `./path.js`, then add:
   - `export function towerAt(state, col, row)`, which returns `state.towers.find((t) => t.col === col && t.row === row) ?? null`.
   - `export function rangePreview(state, hover)`, which returns `null` when there is no hover, and the tower's `{ x, y, radius: range }` when `towerAt` finds one on the hovered cell. Otherwise it returns `{ ...cellCenter(hover), radius: LANTERN.range }` when `canPlace(state, col, row)`, and `null` for a path cell or an out-of-bounds cell.
3. **`src/theme.js`** (new): `export const THEME = { … }` holds every colour now in `PALETTE`, unchanged, plus two new tokens taken from the Board artboard's ring (`stroke="#f2c14e" stroke-width="1.5" stroke-dasharray="6 6"`, `fill-opacity="0.07"`): `rangeRing: 'rgba(242, 193, 78, 0.7)'` and `rangeFill: 'rgba(242, 193, 78, 0.07)'`. This keeps one copy of the palette: `PALETTE` moves into `THEME` and is not duplicated.
4. **`src/render.js`**: delete `PALETTE`, import `THEME` from `./theme.js` and replace each `PALETTE.` with `THEME.`, then import `rangePreview` from `./game.js`. Add `drawRange(ctx, ring)`, which draws `ctx.arc(x, y, radius, 0, Math.PI * 2)`, fills it with `THEME.rangeFill` and strokes it with `THEME.rangeRing` at `lineWidth = 1.5` and `setLineDash([6, 6])`, then resets the dash to `[]`. `draw` calls it after `drawHover` and before the towers. Rendering still never changes state. `src/main.js` already passes `hover`, so it stays untouched.
5. **Green**: `node --test test/range-preview.test.js`, then `npm --prefix . run test` (the line's test command; the repo has three small test files besides this one). Commit.

## Acceptance

The triage's criterion: the new `test/range-preview.test.js` proves `towerAt` (a placed tower and `null`) and `rangePreview` (a tower's centre and range, an empty grass cell's centre and `LANTERN.range`, `null` on path). It also proves that `draw` strokes an arc of that radius in `THEME.rangeRing` while a tower is hovered. `npm --prefix . run test` passes.

## Risks

- The fake context must stub `setLineDash`. The Proxy stub covers it.
- A future `src/theme.js` from M4 HUD work (work/m4-01) should extend `THEME`, not start a second palette.
