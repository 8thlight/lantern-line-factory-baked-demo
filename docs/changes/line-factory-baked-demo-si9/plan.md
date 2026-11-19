# Plan: hide the placement preview off the board, and show a tower's targeting mode (print line-factory-baked-demo-si9)

GitHub issue #63, bead lantern-line-factory-baked-demo-si9, opened as issue #64. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-si9/triage.md: read. It carries the issue, the brief,
  the signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no docs/changes/line-factory-baked-demo-si9/spec.md
  and none anywhere in the tree, so nothing is read from it. The triage's brief and lists
  stand in for it, as they did for print 58.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The base: the print branch was cut from main at 6658250, which has no src/hud.js, no
  src/theme.js and no test/upgrade.test.js, the files the triage reads. origin/main at bd50fcf
  (print 58) has them. I took main in at bd50fcf with a merge (e1c6cf6, clean, no conflict)
  before planning, as the fail-forward skill says to for a base that has moved. Every line
  number below is read on that merge.
- I checked the triage's claims against that base. All of them hold:
  - `draw` in src/render.js calls `if (hover) drawHover(ctx, hover);` and
    `drawRangeRing(ctx, rangePreview(state, hover));` at lines 32-33, whatever `state.status`
    is.
  - `selectedModel` in src/hud.js (lines 38-45) returns `{ name, level, maxLevel, damage,
    range, upgradeCost, refusal }`, with no `mode`.
  - `drawTowerCard` writes `` `Range ${model.range / TILE} tiles · ${model.damage} damage` ``
    at line 435.
  - `createTower` in src/tower.js gives every tower `mode: 'nearest'`. `toggleModeAt(state,
    col, row)` flips it through `nextMode`, and only while the status is `'playing'`.
  - test/upgrade.test.js expects the old range line at lines 221, 295 and 299. Its
    `deepEqual` of three selected-tower models at line 168 builds each from
    `const lantern = { name: 'Lantern', maxLevel: 3 }` (line 167).
- The triage misses one thing. Line 34 draws the selected tower's own ring only when the
  hover is not on that tower's cell, because the hover's preview ring is that same ring. If
  only the hover's two lines are gated, then on a `'won'` or `'lost'` game with the pointer
  on the selected tower, neither ring draws. That breaks the triage's own "the selected
  tower's own ring and card are untouched". So the gate is put on the hover itself, once, and
  every reader of it in `draw` reads the gated value (step 2).
- Other tests that call `draw` with a hover: test/render.test.js (lines 86-87, 110),
  test/range-preview.test.js (100, 113, 115), test/tower-cost.test.js (108, 113), and the
  browser frames in test/pause-speed.test.js ('the hover clears over the bar'). Every one of
  them draws a `'playing'` game, either from `createGame()` with no `status` or paused, which
  is still `'playing'`. So none changes. test/render.test.js's `'lost'`/`'won'` draws pass
  `null` as the hover.
- No other test reads the range line or deep-equals `selectedModel`. I grepped test/ for
  `Range `, `tiles ·` and `selectedModel`.
- Design read: design/screens.yaml (the Main entry, "draw the hovered lantern's range ring
  and its stats") and design/screens/Main.dc.html, whose card line is
  "Range 3 tiles · 1 damage · 0.6 s". The issue sets the new text, and the artboard's
  cooldown is not on the card today, so it is not added. The card is 300 wide at 11px. The
  longest new line, "Range 2.5 tiles · 1 damage · targets nearest" (44 characters), is
  shorter than the refusal line the card already holds ("Needs 25 gold, you hold 5: banish
  more ghosts", 45 characters), so it fits as it is.
- tests/architecture/assertion_baseline.json: javascript `negative-assertion-unpaired: 0`
  and `substring-binding: 0`. Every new check is an exact `equal` or `deepEqual`.
- .hydraflow/layout.yaml: test paths `e2e/**`, `test/**`, and the unit ring is
  `test/{slug}.test.js`.

## Who meets it

- person: the player meets it. Under the start screen (design/screens/StartScreen.png) and
  the end cards (design/screens/Win.png, design/screens/Lose.png), the board no longer shows
  a highlighted cell or a dashed range ring under the pointer. During play, the selected
  tower's card, drawn as the Main artboard draws it (design/screens/Main.png, source
  design/screens/Main.dc.html, listed in design/screens.yaml), reads "Range 2.5 tiles · 1
  damage · targets nearest". After a right-click on that tower it reads "· targets first".

## Refusals

- none: this change refuses nothing new. It stops drawing a preview off the board and adds
  the mode to the card. No function gains a refusal or a reason, and the card's existing
  upgrade refusals (`UPGRADE_REFUSALS`) are unchanged.

## Touches

The signed list holds the whole change, so it is not amended:

touches:
  - src/render.js
  - src/hud.js
  - test/upgrade.test.js
  - test/placement-preview-and-mode.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with `node --test`.

`reproduces:` stays as signed: test/placement-preview-and-mode.test.js. It is new, so it is
written red first and committed red before any src/ change. src/tower.js and src/game.js are
read and not changed.

test/upgrade.test.js changes in exactly these four places, which the triage allows, and
nowhere else:
- line 167: `const lantern = { name: 'Lantern', maxLevel: 3, mode: 'nearest' };`. This is the
  one shared object the line-168 `deepEqual` spreads into all three models, so all three gain
  `mode: 'nearest'` with no other edit.
- line 221: `['Range 2.5 tiles · 1 damage · targets nearest', THEME.hudInk],`
- line 295: `'Range 2.5 tiles · 1 damage · targets nearest'` in the `slice(0, 3)` expectation.
- line 299: `'Range 3 tiles · 2 damage · targets nearest'` in the same.

## Build order (red first, then green)

### 1. Reproducer: test/placement-preview-and-mode.test.js, committed red

Imports `createGame`, `placeTower` from ../src/game.js; `LANTERN`, `toggleModeAt` from
../src/tower.js; `selectedModel` from ../src/hud.js; `SPRITES`, `draw` from ../src/render.js;
`THEME` from ../src/theme.js. It has its own recording context, the Proxy one from
test/range-preview.test.js, which records `fillStyle`, `strokeStyle`, `lineWidth` and the line
dash on each call. Board facts, as in test/range-preview.test.js: TILE is 40, and (3, 1) and
(1, 1) are grass, centred at (140, 60) and (60, 60). Helpers:

- `quietGame = (status) => ({ ...createGame({ waveSize: 0 }), status })`
- `hoverFills(ctx)`: the `fillRect` calls whose `fillStyle` is `THEME.hover` or
  `THEME.hoverBad`, mapped to their `args`.
- `ringArcs(ctx)`: the `arc` calls whose `strokeStyle` is `THEME.rangeRing` and whose dash is
  `[6, 6]`, mapped to their first three `args`. The dash keeps the card's border (also
  `THEME.rangeRing`, undashed) out of the count. Only `drawRangeRing` sets the `[6, 6]` dash,
  between its own `save` and `restore`, so the lantern pool's arc and the sprites' arcs are
  never counted.
- `cardLines(game, id)`: `draw(ctx, game, null, SPRITES, null, id)`, then the first three
  `fillText` texts.

The tests:

- 'a playing game draws the pointed cell and its range ring': `draw` of `quietGame('playing')`
  with hover `{ col: 3, row: 1, ok: true }`. `[hoverFills, ringArcs]` deep-equals
  `[[[120, 40, 40, 40]], [[140, 60, LANTERN.range]]]`.
- 'a ready, won or lost game draws neither, whatever cell is pointed': for each of
  `'ready'`, `'won'` and `'lost'`, the same draw and hover give `[[], []]`. The same holds for
  hover `{ col: 2, row: 2, ok: false }` (a path cell), so the bad-hover fill is gated too.
- 'off the board, a placed tower's preview ring is not drawn either': place a lantern at
  (1, 1) in a playing game and point at (1, 1) with no tower selected. Playing gives
  `ringArcs` `[[60, 60, LANTERN.range]]`. The same game set `'won'` gives `[]`.
- 'the selected tower's own ring still draws off the board, pointed at or not': the lantern
  at (1, 1), selected (id 1), status `'lost'`. Pointed at (1, 1) and pointed at (3, 1), each
  gives `ringArcs` `[[60, 60, LANTERN.range]]`. This pins the selected ring that step 2 must
  not drop.
- 'selectedModel returns the tower's targeting mode': a playing game, a lantern placed at
  (1, 1). `selectedModel(game, 1).mode` is `'nearest'`. After `toggleModeAt(game, 1, 1)` it is
  `'first'`, and after a second toggle `'nearest'` again.
- 'the card's range line ends with the mode, and follows the toggle': the same game.
  `cardLines(game, 1)[1]` is `'Range 2.5 tiles · 1 damage · targets nearest'`. After
  `toggleModeAt(game, 1, 1)` it is `'Range 2.5 tiles · 1 damage · targets first'`.

Red against the base: the ready, won and lost draws paint the hover fill and ring,
`selectedModel` has no `mode`, and the card line has no `· targets …`. The two tests that pin
what already holds (the playing draw and the selected ring) pass from the start. That is
intended, because they guard step 2.

### 2. src/render.js: gate the pointer's preview on play, and end the range line with the mode

- In `draw`, first line of the body: `const pointed = state.status === 'playing' ? hover :
  null;`. Then lines 32-34 read `pointed` in place of `hover`: `if (pointed) drawHover(ctx,
  pointed);`, `drawRangeRing(ctx, rangePreview(state, pointed));` and `if (chosen &&
  !(pointed && pointed.col === chosen.col && pointed.row === chosen.row))`. `rangePreview`
  already returns null for a null hover.
- The comment above `draw` gains one sentence: the pointed cell and its range ring draw only
  while the game is playing, and under the start screen and the end cards the pointer
  previews nothing, while a selected tower keeps its ring and card.
- In `drawTowerCard`, line 435 becomes
  `` [`Range ${model.range / TILE} tiles · ${model.damage} damage · targets ${model.mode}`, THEME.hudInk], ``.
- No colour literal is added, so test/render.test.js passes unedited.

### 3. src/hud.js: `selectedModel` returns `mode`

- `const { name, level, damage, range, mode } = tower;`, and the return gains `mode` after
  `range`: `{ name, level, maxLevel: MAX_LEVEL, damage, range, mode, upgradeCost, refusal }`.
- Its comment says the model carries the tower's targeting mode, which a right-click toggles.

### 4. test/upgrade.test.js: the four expectations

As listed under Touches: lines 167, 221, 295 and 299. No other line changes.

### 5. Green

`node --test test/placement-preview-and-mode.test.js test/upgrade.test.js
test/range-preview.test.js test/render.test.js test/tower-cost.test.js
test/pause-speed.test.js test/start-screen.test.js test/hud.test.js` covers the reproducer,
the edited suite, and the unedited suites that draw with a hover, draw the card, or read the
HUD. Then `npm --prefix . run test` runs once, the line's named check. The whole suite also
runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/placement-preview-and-mode.test.js is committed red
first and green after. test/upgrade.test.js changes only at lines 167, 221, 295 and 299, and
every other existing test is unedited. Each of the issue's criteria is proven:

- Drawing a playing game with a pointed cell draws the hover cell and its range ring.
  Drawing a `'ready'`, `'won'` or `'lost'` game with the same pointed cell draws neither.
- `selectedModel` of a new tower returns `mode: 'nearest'`, and `'first'` after
  `toggleModeAt` on its cell.
- The tower card of a selected tower reads `Range 2.5 tiles · 1 damage · targets nearest`
  for a new lantern, and `… · targets first` after the toggle.
