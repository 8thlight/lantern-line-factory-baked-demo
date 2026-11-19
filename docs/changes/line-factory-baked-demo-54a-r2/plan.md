# Plan: Upgrade and Sell buttons on the tower card (print line-factory-baked-demo-54a-r2)

GitHub issue #79, opened again as issue #85, bead lantern-line-factory-baked-demo-54a. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-54a-r2/triage.md: read. It carries the brief in full, the
  signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is none under docs/changes/line-factory-baked-demo-54a-r2/
  and none anywhere else in the tree, so nothing is read from it. The triage's brief and lists
  stand in for it, as they did for the prints before this one (see the dli plan).
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the brief in full.
- The base: the print branch was cut from 6658250, the line's first merge. At that commit there
  is no src/hud.js, no `sellTower` and no test/sell.test.js or test/upgrade.test.js, so every
  claim in the triage was false of the print's own tree. origin/main had moved on to da17f8e
  (print dli, PR #83, which added selling). ed7d7b2 takes origin/main in at da17f8e. The branch
  held only triage files, so the merge was clean. Every claim below is checked against that base.
- I checked the triage's claims against that base:
  - True: `drawTowerCard` in src/render.js draws the card from
    `CARD = { width: 300, height: 69, radius: 6, pad: 10, line: 15 }`, clamped `CARD_INSET` (4)
    inside the board, in board coordinates under `ctx.translate(0, HUD_HEIGHT)`. It draws four
    text lines (name and level, range and damage, `upgradeLine`, `Press S to sell: N gold`) and
    nothing a pointer can press.
  - True: src/hud.js has `hudButtonAt`, `startButtonAt` and `difficultyButtonAt` over frozen
    rectangles, and nothing for the card.
  - True: the click handler in src/main.js, once the status is `'playing'`, goes from
    `hudButtonAt` straight to `boardCellAt` and `clickCell`, so a click on the card lands on the
    cell under it and places a tower or changes the selection.
  - True: upgrading and selling are reached only by `hudKey`'s `'upgrade'` and `'sell'` in the
    keydown handler, which call `upgradeTower` and `sellTower` (src/game.js). `upgradeTower`
    returns `upgradeError`'s reason and changes nothing when it refuses. `sellTower` returns
    `'over'` unless the status is `'playing'`.
  - The numbers hold. The board is 16 by 10 tiles of 40 (640 by 400), the canvas 640 by 440.
    `main.js` boots on normal with 50 gold. A lantern costs 20 (no towers standing), its upgrade
    25, and its sell value after one upgrade is `floor(45 / 2)` = 22.
- Existing tests I read for the shapes this change meets:
  - test/sell.test.js:116 'the card of a selected lantern … ends with Press S to sell: 10 gold'
    pins `texts(ctx).slice(0, 5)` with `'Lives'` fifth. The two button texts are drawn after the
    four lines, so this expectation becomes `slice(0, 7)` with `['Upgrade', THEME.hudInk]` and
    `['Sell', THEME.hudInk]` before `'Lives'`.
  - test/sell.test.js:129 'the card grows by one line …' pins the card's height at 69. It becomes
    108; the four inside-the-canvas checks are unchanged.
  - test/upgrade.test.js:214 'draw shows the selected tower's card' pins `slice(0, 5)` with
    `'Lives'` fifth. It becomes `slice(0, 7)` with the same two button texts inserted.
  - These are the updates the brief allows: each test still proves what it proved.
  - Unedited and still green: test/upgrade.test.js:244 checks the card's `roundRect` (the first
    one filled `THEME.hudBg`) lies on the board in board coordinates; the card is still drawn
    first and in board coordinates, and 108 high it is still clamped inside. Its other card checks
    read `texts(…)[2]`, which the buttons do not move. test/placement-preview-and-mode.test.js
    reads the card's first three lines and arcs and hover fills, which the buttons (roundRect and
    fillText only) do not add to. The main.js boots in test/sell.test.js and test/upgrade.test.js
    read the card's first lines or press keys and click cells the card does not cover at the
    moment of the click. test/hud.test.js:104 draws no selected tower.
- Standards: tests/architecture/assertion_baseline.json holds `negative-assertion-unpaired`
  and `substring-binding` at 0. The new test proves "changes nothing" and "no tower placed" only
  by exact `deepEqual`s of whole values, each paired with a positive check. It writes no
  `notEqual`, `ok(!…)`, prefix or substring filter.
- Knowledge vault (0-Inbox), all met:
  - "A print branch cut before main moved must merge main before the plan reads it": met by
    ed7d7b2.
  - "A triage can describe code the print's tree does not have yet": met by the checks above.
  - "A no-such-text check written as a prefix filter trips the assertion baseline": met by the
    exact-list rule above.
  - "A touches amendment must keep a new reproducer that the signed list named": no amendment;
    test/card-buttons.test.js stays in both `touches:` and `reproduces:`.

## Who meets it

- person: a player in a round in play with a mouse or a touch screen, the Main artboard's player
  (design/screens/Main.dc.html:49-52, the tower card). They click a placed tower and its card now
  ends in two buttons, `Upgrade` and `Sell`, side by side. Pressing Upgrade does what U does: the
  tower goes up a level and the gold drops by the upgrade's cost; when U would be refused the
  button is drawn dimmed, the card's refusal line stays, and pressing it changes nothing. Pressing
  Sell does what S does: the tower is gone, its sell value is paid and the card closes. Neither
  press ever places a tower or selects another on the cell under the button. The key lines stay,
  so the keys remain discoverable. The artboard's card draws no buttons; the code's card has
  carried lines past the artboard since the upgrade print, and the buttons follow the HUD's own
  Pause button style (design/hud.md).
- agent: a caller of src/hud.js, such as src/main.js, a test or a later print. It reads
  `cardRect(tower)`, `cardButtons(tower)` (`{ upgrade, sell }`, canvas pixels) and
  `cardButtonAt(tower, x, y)` (`'upgrade'`, `'sell'` or `null`), the one source render.js draws
  from and main.js hit-tests against.

## Refusals

- none: the Upgrade button refuses only through `upgradeTower`'s existing `upgradeError` reasons,
  whose sentences `UPGRADE_REFUSALS` already spells and the card already shows; Sell is pressable
  only while the round is in play, where `sellTower` does not refuse a selected tower. No new
  reason or sentence is added.

## Touches

The signed list holds the whole change, so it is not amended:

touches:
  - src/hud.js
  - src/render.js
  - src/main.js
  - test/card-buttons.test.js
  - test/sell.test.js
  - test/upgrade.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with `node --test`.

`reproduces:` stays as signed: test/card-buttons.test.js. It is new, so it is written and
committed red first, and it stays in `touches:`. The only existing tests edited are the three
expectations named above.

## Geometry

All in src/hud.js, in canvas pixels (the board's coordinates plus `HUD_HEIGHT` down):

- `CARD = Object.freeze({ width: 300, height: 108 })`, `CARD_INSET = 4`. The four text lines end
  by y + 63 (last line centred at y + 57, 11px), then the button row.
- `cardRect(tower)`: `x = clamp(tower.x + TILE * 0.6, CARD_INSET, WIDTH - CARD_INSET - CARD.width)`,
  `y = HUD_HEIGHT + clamp(tower.y - TILE - 14, CARD_INSET, ROWS * TILE - CARD_INSET - CARD.height)`,
  `width`, `height` from `CARD`. The same placement render.js uses today, moved here.
- Buttons: `CARD_BUTTON = { width: 136, height: 28, top: 70, pad: 10, gap: 8 }`.
  `upgrade = { x: card.x + 10, y: card.y + 70, width: 136, height: 28 }`,
  `sell = { x: card.x + 10 + 136 + 8, … }`, so sell's right edge is `card.x + 290` and both
  bottoms are `card.y + 98`, 10 inside the card's bottom.
- Worked numbers, used by the test: a lantern at (1, 1) stands at (60, 60) on the board, so its
  card is `{ x: 84, y: 46, width: 300, height: 108 }`, Upgrade `{ x: 94, y: 116, width: 136,
  height: 28 }` and Sell `{ x: 238, y: 116, width: 136, height: 28 }`. Sell's centre (306, 130)
  is board cell (7, 2), grass off the path. At (COLS - 1, ROWS - 1) the card is
  `{ x: 336, y: 328, … }`, bottom 436 ≤ 440.

## Build steps

Every new check is an exact `assert.equal` or `assert.deepEqual`. No `notEqual`,
`notDeepEqual`, `ok(!…)`, `doesNotMatch`, prefix or substring filter is written. Drawing tests
use the recording context test/sell.test.js uses: each call records `name`, `args` and the
`fillStyle` in force.

### 1. test/card-buttons.test.js, red first

Imports `test` and `after` (node:test), `assert` (node:assert/strict), `createGame`,
`placeTower`, `placementError` and `upgradeTower` from ../src/game.js, `LANTERN` and `towerById`
from ../src/tower.js, `CANVAS_HEIGHT`, `HUD_HEIGHT`, `boardCellAt`, `cardButtonAt`,
`cardButtons` and `cardRect` from ../src/hud.js, `SPRITES` and `draw` from ../src/render.js,
`THEME` from ../src/theme.js and `COLS`, `ROWS` and `TILE` from ../src/path.js.

- 'cardButtons gives two rectangles that do not overlap, each at least 44 by 28, inside the card
  and the canvas, for a corner tower and a mid-board one': for lanterns placed at (0, 0),
  (COLS - 1, ROWS - 1) and (8, 5) (all checked off the path by `placeTower` returning `true`),
  read `cardRect` and `cardButtons` of the placed tower. For each, the list
  `[upgrade.width >= 44, upgrade.height >= 28, sell.width >= 44, sell.height >= 28,
  upgrade.x + upgrade.width <= sell.x || sell.x + sell.width <= upgrade.x,
  ...[upgrade, sell].flatMap((b) => [b.x >= card.x, b.x + b.width <= card.x + card.width,
  b.y >= card.y, b.y + b.height <= card.y + card.height]),
  card.x >= 0, card.x + card.width <= COLS * TILE, card.y >= 0, card.y + card.height <= CANVAS_HEIGHT]`
  deep-equals all `true`. Beside it, the (1, 1) lantern's `cardButtons` deep-equals the worked
  numbers above, so the rectangles are pinned, not only bounded.
- 'cardButtonAt returns upgrade and sell inside each, null on the card outside both and off the
  card': for the (1, 1) lantern, `[cardButtonAt(t, 162, 130), cardButtonAt(t, 306, 130),
  cardButtonAt(t, 234, 130), cardButtonAt(t, 100, 60), cardButtonAt(t, 600, 400)]` deep-equals
  `['upgrade', 'sell', null, null, null]` (the gap between the buttons, the card's text, off the
  card). `cardButtonAt(undefined, 162, 130)` is `null`.
- 'drawing a selected tower's card draws Upgrade and Sell, Upgrade dimmed when refused':
  `createGame({ waveSize: 0 })` (50 gold), a lantern at (1, 1), drawn with `selected` 1. The
  first seven texts' `[text, fillStyle]` deep-equal the four lines as today, then
  `['Upgrade', THEME.hudInk]`, `['Sell', THEME.hudInk]`, `['Lives', THEME.hudMuted]`. The
  Upgrade and Sell texts' `args[1..2]` deep-equal the centres of the (1, 1) buttons less
  `HUD_HEIGHT` in y, `[[162, 90], [306, 90]]`, so what is drawn is what is pressed. After
  `upgradeTower(game, 1)` (5 gold left, refused for gold), the fifth and sixth deep-equal
  `[['Upgrade', THEME.hudMuted], ['Sell', THEME.hudInk]]` and the third is still
  `'Needs 25 gold, you hold 5: banish more ghosts'`.
- 'in the browser, a click on Upgrade upgrades the selected tower once and a refused one changes
  nothing; a click on Sell sells it, clears the selection and places nothing': boot src/main.js
  against DOM stand-ins as test/sell.test.js:149 does (a fresh `?card=N` query, globals saved and
  restored in `after`), with a `press(x, y)` helper beside `click(col, row)` that hands the
  canvas point straight to the click handler, then press Enter. Click (1, 1) to place a lantern
  (30 gold left) and again to select it. `press(162, 130)`: the frame's first ten texts deep-equal
  `['Lantern · level 2', 'Range 3 tiles · 2 damage · targets nearest',
  'Needs 25 gold, you hold 5: banish more ghosts', 'Press S to sell: 22 gold', 'Upgrade', 'Sell',
  'Lives', '10', 'Gold', '5']`. `press(162, 130)` again: the next frame's first ten texts
  deep-equal the same list. Beside it, `[boardCellAt(306, 130), placementError(createGame({
  difficulty: 'normal' }), 7, 2, LANTERN)]` deep-equals `[{ col: 7, row: 2 }, null]`, so the cell
  under Sell would take a lantern. `press(306, 130)`: the next frame's first four texts deep-equal
  `['Lives', '10', 'Gold', '27']`: no card (nothing selected), 5 + 22 gold, and no 20-gold
  lantern bought on (7, 2).

It is red against the base because `cardButtons`, `cardButtonAt` and `cardRect` are not exported
by src/hud.js, so the import fails. Commit it alone as
`test(54a): card-buttons.test.js reproducer, red first`.

### 2. src/hud.js: the card's rectangle and its buttons

- Below the start screen's rectangles, add `CARD`, `CARD_INSET`, `CARD_BUTTON` and a local
  `clamp`, as in the Geometry section, with a comment: the selected tower's card, beside the
  tower and kept `CARD_INSET` inside the board, its Upgrade and Sell buttons side by side along
  its bottom; render.js draws from these and main.js presses them.
- Export `cardRect(tower)` and `cardButtons(tower)` (`{ upgrade, sell }`, each a fresh
  `{ x, y, width, height }`).
- Beside `hudButtonAt`, export:

  ```js
  // The card button under a canvas point for the card of `tower`: 'upgrade', 'sell', or null off
  // them both and when there is no tower.
  export function cardButtonAt(tower, x, y) {
    if (!tower) return null;
    const { upgrade, sell } = cardButtons(tower);
    if (inside(upgrade, x, y)) return 'upgrade';
    if (inside(sell, x, y)) return 'sell';
    return null;
  }
  ```

- The header comment adds "and the selected tower's card buttons" to what main.js asks.

### 3. src/render.js: draw the card and its buttons from hud.js

- Import `cardButtons` and `cardRect` from ./hud.js; drop `CARD.height`, `CARD_INSET` and
  `clamp` from render.js (`CARD` keeps `radius`, `pad` and `line`).
- `drawTowerCard` reads `const card = cardRect(tower)` and draws the panel at
  `(card.x, card.y - HUD_HEIGHT, card.width, card.height)`, since it is drawn under the board's
  `HUD_HEIGHT` shift. The four lines are drawn as today from `card.x` and `card.y - HUD_HEIGHT`.
- Then, from `cardButtons(tower)` each moved up by `HUD_HEIGHT`:
  `drawButton(ctx, upgrade, 'Upgrade', false, model.refusal ? THEME.hudMuted : THEME.hudInk)` and
  `drawButton(ctx, sell, 'Sell', false)`.
- `drawButton` gains a last parameter `ink = active ? THEME.hudAccentInk : THEME.hudInk`, the
  text's colour; the HUD and start-screen calls pass nothing and draw as today. Its comment adds
  "in `ink` when handed one, the card's dimmed Upgrade".
- The comment above `CARD` adds: "then its Upgrade and Sell buttons, Upgrade dimmed when U would
  be refused; the rectangles are src/hud.js's, so what is drawn is what is pressed."

### 4. src/main.js: a click on a card button does what U or S does

- Import `cardButtonAt` from ./hud.js and `towerById` from ./tower.js.
- In the click handler, after the `hudButtonAt` branch and before `boardCellAt`:

  ```js
  const press = selected === null ? null : cardButtonAt(towerById(state, selected), x, y);
  if (press === 'upgrade') {
    upgradeTower(state, selected);
    return;
  }
  if (press === 'sell') {
    sellTower(state, selected);
    selected = null;
    return;
  }
  ```

  The status is `'playing'` here (ready, won and lost return earlier), paused or not, as the keys
  are. A refused upgrade changes nothing and keeps the selection.
- The comment above the handler adds: "A click on the selected tower's Upgrade or Sell button
  does what U or S does, before the board, so it never lands on the cell beneath; Sell clears the
  selection."

Commit steps 2 to 4, with step 5, as
`fix(54a): the tower card's Upgrade and Sell buttons, pressed as U and S`.

### 5. test/sell.test.js and test/upgrade.test.js: the expectations the buttons move

- test/sell.test.js 'the card of a selected lantern placed for 20 gold ends with Press S to
  sell: 10 gold': `slice(0, 5)` becomes `slice(0, 7)`, with `['Upgrade', THEME.hudInk]` and
  `['Sell', THEME.hudInk]` inserted before `['Lives', THEME.hudMuted]`.
- test/sell.test.js 'the card grows by one line and its whole rectangle lies inside the canvas':
  `[69, true, true, true, true]` becomes `[108, true, true, true, true]`.
- test/upgrade.test.js 'draw shows the selected tower's card': `slice(0, 5)` becomes
  `slice(0, 7)`, with the same two entries inserted before `['Lives', THEME.hudMuted]`.

Nothing else in either file changes.

### 6. Green

Run `node --test test/card-buttons.test.js test/sell.test.js test/upgrade.test.js
test/hud.test.js test/placement-preview-and-mode.test.js test/render.test.js
test/pause-speed.test.js test/start-screen.test.js test/difficulty-choice.test.js
test/best.test.js test/range-preview.test.js`. That covers the reproducer, the two edited files,
and every unedited file that draws the card or a HUD button or boots src/main.js. The whole suite
runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/card-buttons.test.js is committed red first and is green
after. Every other existing file under test/ is unedited and green, and test/sell.test.js and
test/upgrade.test.js change only in the three expectations named above.
test/card-buttons.test.js proves each criterion:

- `cardButtons` gives two non-overlapping rectangles, each at least 44 by 28, inside the card's
  rectangle and the canvas, for a corner tower and a mid-board one.
- `cardButtonAt` returns `'upgrade'` and `'sell'` for a point inside each, and `null` on the card
  outside both and off the card.
- Drawing a selected tower's card draws the texts `Upgrade` and `Sell`, at the buttons' centres,
  with Upgrade dimmed when the upgrade is refused.
- In the browser, a click on Upgrade raises an upgradable tower one level and takes 25 gold; a
  click on it when refused changes nothing.
- A click on Sell removes the tower, pays its sell value, leaves no tower selected and places no
  tower on the cell under the button.
