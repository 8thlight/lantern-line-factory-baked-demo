# Plan: sell a placed tower for half the gold spent on it (print line-factory-baked-demo-dli)

GitHub issue #78, opened again as issue #80, bead lantern-line-factory-baked-demo-dli. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-dli/triage.md: read. It carries the brief in full, the
  signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is none under docs/changes/line-factory-baked-demo-dli/
  and none anywhere else in the tree, so nothing is read from it. The triage's brief and lists
  stand in for it, as they did for the prints before this one.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the brief in full.
- The base: the print branch was cut from 6658250, the line's first merge. At that commit there
  is no gold, no `towerPrice`, no `upgradeTower`, no src/hud.js and no test/upgrade.test.js, so
  every claim in the triage was false of the print's own tree. origin/main had moved on to
  e0336f7 (print xev, PR #75, which added `towerPrice` and the price step). 6c389a6 takes
  origin/main in at e0336f7. The branch held only triage files, so the merge was clean. Every
  claim below is checked against that base.
- I checked the triage's claims against that base:
  - True: `placeTower` in src/game.js deducts `towerPrice(state, kind)` and pushes
    `{ id, ...createTower(col, row, kind) }`. `upgradeTower` deducts `tower.upgrade.cost`.
    Neither records the gold spent, and `createTower` in src/tower.js has no `spent` field.
  - True: there is no `sellValue` or `sellTower` anywhere in src/.
  - True: `towerPrice` counts the towers of the kind's name standing in `state.towers`, so
    removing one from that list lowers the next price with no other change.
  - True: `cellError` calls a cell `'taken'` only while a tower in `state.towers` stands on it,
    so removing the tower frees the cell.
  - True: `hudKey` in src/hud.js knows Escape, P, F and U, and nothing else.
  - True: the keydown handler in src/main.js handles `'deselect'`, `'upgrade'`, and the
    `TOGGLES` pause and speed. It has no sell action. It returns early unless the status is
    `'playing'`, and on a repeat, but not when paused.
  - True: `drawTowerCard` in src/render.js draws three lines in a card of
    `CARD = { width: 300, height: 54, radius: 6, pad: 10, line: 15 }`, clamped `CARD_INSET`
    (4) inside the board. The board is drawn under `ctx.translate(0, HUD_HEIGHT)`, so a card
    inside the board is inside the canvas.
  - The numbers hold. LANTERN costs 20 and its upgrade 25 (src/tower.js). `(20 + 25) / 2`
    rounded down is 22. On normal `priceStep` is 5 (src/difficulty.js `CHALLENGES`), so with two
    lanterns standing the next costs 30, and with one it costs 25. The board is 16 by 10 tiles of
    40, so a 69-high card fits with room to spare.
- src/tower.js is not in the signed `touches:`, and it does not need to be. `placeTower` already
  spreads `createTower`'s result into the tower it pushes, so `spent` is set there.
- Existing tests I read for the shapes this change meets:
  - test/upgrade.test.js:214 'draw shows the selected tower's card' pins
    `texts(ctx).slice(0, 4)` with `'Lives'` fourth. The new sell line is drawn fourth, so this one
    expectation moves `'Lives'` to fifth and adds the sell line before it. This is the update the
    brief allows: the test still proves that the card draws its lines in order, then the HUD.
  - test/upgrade.test.js:165 deep-equals `selectedModel`. The sell value is therefore not added
    to `selectedModel`; render reads it from `sellValue` directly.
  - test/upgrade.test.js:244 checks that the card stays on the board at three corners. A taller
    card is still clamped inside, so it stays green unedited.
  - test/upgrade.test.js:289, test/placement-preview-and-mode.test.js:72 read only the card's
    first three lines. test/hud.test.js:147 maps P, F, 1 and Space through `hudKey`, not S. No
    test deep-equals a whole tower (`spent` is a new field), and no test presses S.
- Standards: tests/architecture/assertion_baseline.json holds `negative-assertion-unpaired`
  and `substring-binding` at 0. The new test proves "changes nothing" only by an exact
  `deepEqual` of the whole before and after, each paired with a positive check. It writes no
  `notEqual`, `ok(!…)`, prefix or substring filter.
- Knowledge vault (0-Inbox), all met:
  - "A print branch cut before main moved must merge main before the plan reads it": met by
    6c389a6.
  - "A triage can describe code the print's tree does not have yet": met by the checks above.
  - "A no-such-text check written as a prefix filter trips the assertion baseline": met by the
    exact-list rule above.
  - "Two issues that each forbid editing a test can together break one it pins": the one pinned
    expectation this change breaks (upgrade.test.js:214) is the one the brief names as editable.

## Who meets it

- person: a player in a round in play, the Main artboard's player (design/screens/Main.dc.html:49-52,
  the tower card). They click a placed tower, and its card now ends with `Press S to sell: N gold`.
  When they press S, once per press, paused or not, the tower is gone, its cell takes a new
  tower, the gold rises by N and the card closes. The artboard's card draws no upgrade or sell
  line. The code's card has carried a line past the artboard since the upgrade print, and this
  adds one more in the same style.
- agent: a caller of src/game.js, such as a test or a later print. It reads `tower.spent` and
  `sellValue(tower)`, and calls `sellTower(state, id)`, which returns `null` when it sells,
  `'missing'` for an id that names no tower and `'over'` while the round is not playing.

## Refusals

`sellTower` refuses in two ways. Each is a reason it returns, and src/hud.js gains a
`SELL_REFUSALS` table that spells the sentence for each, beside `UPGRADE_REFUSALS`:

- sell/missing: No tower to sell: click a placed tower first
- sell/over: The round is not in play: start a round before selling

## Touches

The signed list holds the whole change, so it is not amended:

touches:
  - src/game.js
  - src/hud.js
  - src/render.js
  - src/main.js
  - test/sell.test.js
  - test/upgrade.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with `node --test`.

`reproduces:` stays as signed: test/sell.test.js. It is new, so it is written and committed red
first, and it stays in `touches:`. The only existing test edited is the one expectation in
test/upgrade.test.js named above.

## Build steps

Every new check is an exact `assert.equal` or `assert.deepEqual`. No `notEqual`,
`notDeepEqual`, `ok(!…)`, `doesNotMatch`, prefix or substring filter is written. Drawing tests
use a small recording context in the test file, the pattern test/upgrade.test.js uses: each call
records `name`, `args` and the `fillStyle` in force.

### 1. test/sell.test.js, red first

Imports `test` and `after` (node:test), `assert` (node:assert/strict), `createGame`,
`placeTower`, `placementError`, `sellTower`, `sellValue`, `towerPrice` and `upgradeTower` from
../src/game.js, `LANTERN` and `towerById` from ../src/tower.js, `CANVAS_HEIGHT`, `HUD_HEIGHT`,
`SELL_REFUSALS` and `hudKey` from ../src/hud.js, `SPRITES` and `draw` from ../src/render.js,
`THEME` from ../src/theme.js and `COLS`, `ROWS` and `TILE` from ../src/path.js. Towers stand on
(1, 1) and on row 0, all off the path.

- 'a lantern placed for 20 gold has spent 20 and a sell value of 10; after a 25-gold upgrade,
  45 and 22': `createGame({ waveSize: 0, gold: 1000 })`, place a lantern at (1, 1). Read
  `[tower.spent, sellValue(tower)]` before and after `upgradeTower(game, 1)`. They deep-equal
  `[[20, 10], [45, 22]]`.
- 'on normal a lantern placed at the stepped price remembers that price': a normal game with
  `gold: 1000`, two lanterns placed. `game.towers.map((t) => t.spent)` deep-equals `[20, 25]`.
- 'selling removes the tower, pays its sell value, returns null and frees the cell': a game with
  `gold: 100`, a lantern at (1, 1), leaving 80. `sellTower(game, 1)` is `null`, then
  `[game.towers.length, game.gold, placementError(game, 1, 1, LANTERN)]` deep-equals
  `[0, 90, null]`. `placeTower(game, 1, 1, LANTERN)` is then `true`.
- 'on normal, with two lanterns placed, selling one makes the next lantern cost 25':
  a normal game with `gold: 1000`, lanterns at (0, 0) and (1, 0). `towerPrice` is 30 before. Sell
  the first, and it is 25 after: `[before, after]` deep-equals `[30, 25]`.
- 'an unknown id is refused with missing and nothing changes': a game with one lantern. Take
  `structuredClone` of `[game.towers, game.gold]`. `sellTower(game, 9)` is `'missing'`, and
  `[game.towers, game.gold]` deep-equals the clone.
- 'a won, lost or ready game is refused with over and nothing changes': for each of `'won'`,
  `'lost'` and `'ready'`, set `game.status`. `sellTower(game, 1)` is `'over'`, and the towers
  and gold deep-equal their clone.
- 'each refusal spells what to do next': `SELL_REFUSALS` deep-equals
  `{ missing: 'No tower to sell: click a placed tower first', over: 'The round is not in play: start a round before selling' }`.
- 'hudKey returns sell for s and S': `['s', 'S'].map(hudKey)` deep-equals `['sell', 'sell']`.
- 'the card of a selected lantern placed for 20 gold ends with Press S to sell: 10 gold':
  `createGame({ waveSize: 0 })`, a lantern at (1, 1), drawn with `selected` 1. The first four
  texts' `[text, fillStyle]` deep-equal the three lines as today, then
  `['Press S to sell: 10 gold', THEME.hudInk]`. The fifth text is `'Lives'`.
- 'the card grows by one line and its whole rectangle lies inside the canvas': for a lantern on
  each corner cell (0, 0), (COLS - 1, 0), (0, ROWS - 1) and (COLS - 1, ROWS - 1) with
  `gold: 1000`, read the card's `roundRect` (filled `THEME.hudBg`). Its height is 69, and with
  the board's `HUD_HEIGHT` shift added, `[x >= 0, x + width <= COLS * TILE, y + HUD_HEIGHT >= 0,
  y + HUD_HEIGHT + height <= CANVAS_HEIGHT]` is all true. The whole list is deep-equaled.
- 'in the browser, S sells the selected tower once per press, paused or not, and clears the
  selection': boot src/main.js against DOM stand-ins, as test/upgrade.test.js:256 does (a fresh
  `?sell=N` query, globals saved and restored in `after`), then press Enter. Click (1, 1) to
  place a lantern, leaving 30 gold, then click it again to select it. The frame's first texts
  read the card. Press `s` with `repeat: true`, and the card is still drawn. Press P to pause,
  then `S`. The next frame's first text is `'Lives'`, and the drawn gold value reads `40`. Click
  (1, 1) again: the frame shows no card, because a lantern was placed rather than a tower
  selected, and gold reads `20`. Each frame is compared by its exact text list (or a fixed
  slice), never a filter.

It is red against the base because `sellTower`, `sellValue` and `SELL_REFUSALS` are not exported,
so the imports fail. Commit it alone as `test(dli): sell.test.js reproducer, red first`.

### 2. src/game.js: spent, sellValue, sellTower

- `placeTower` reads `const price = towerPrice(state, kind);` before the push, deducts it, and
  pushes `{ id: state.nextTowerId++, ...createTower(col, row, kind), spent: price }`. Its
  comment adds: the tower remembers the price it was placed for as `spent`.
- `upgradeTower` adds `tower.spent = (tower.spent ?? 0) + cost;` beside `state.gold -= cost`.
  Its comment adds "and counts it into the tower's `spent`". A tower built by hand with no
  `spent` counts from 0.
- New, exported, below `upgradeTower`:

  ```js
  // What selling a tower returns: half the gold spent on it, rounded down.
  export function sellValue(tower) {
    return Math.floor((tower.spent ?? 0) / 2);
  }

  // Remove the tower with `id` and pay its sell value. Returns 'over', having changed nothing,
  // while the round is not playing, 'missing' when no tower has the id; null when sold. Its cell
  // is free again, and the next tower of its kind costs one price step less.
  export function sellTower(state, id) {
    if (state.status !== 'playing') return 'over';
    const tower = towerById(state, id);
    if (!tower) return 'missing';
    state.towers = state.towers.filter((t) => t !== tower);
    state.gold += sellValue(tower);
    return null;
  }
  ```

  The status check comes first, so a finished round refuses with `'over'` even for an unknown id.

### 3. src/hud.js: the sell key and the sell refusals

- `hudKey` returns `'sell'` for `s` and `S` (`lower === 's'`). Its comment names S: "S sells the
  selected tower".
- Below `UPGRADE_REFUSALS`, add:

  ```js
  // What sellTower's refusals mean, by its reason, for a caller that reads them.
  export const SELL_REFUSALS = Object.freeze({
    missing: 'No tower to sell: click a placed tower first',
    over: 'The round is not in play: start a round before selling',
  });
  ```

- The header comment is unchanged. `selectedModel` and `upgradeLine` are unchanged.

### 4. src/render.js: the card's sell line

- Import `sellValue` from ./game.js beside `rangePreview` and `towerPrice`.
- `CARD.height` becomes 69, one `CARD.line` (15) more than 54.
- `drawTowerCard` adds a fourth line, `[\`Press S to sell: ${sellValue(tower)} gold\`, THEME.hudInk]`,
  after the upgrade line. `tower` is the placed tower `draw` already hands it as `chosen`.
- The comment above `CARD` says "and what U and S do".

### 5. src/main.js: S sells the selected tower

- Import `sellTower` from ./game.js.
- In the keydown handler, after the `'upgrade'` branch and behind the same playing and repeat
  check: `if (action === 'sell') { if (selected !== null) sellTower(state, selected); selected = null; return; }`.
- The comment above the handler names S: "S sells the selected tower and clears the selection".

Commit steps 2 to 5, with step 6, as
`fix(dli): a placed tower sells for half the gold spent on it, by S from its card`.

### 6. test/upgrade.test.js: the one expectation the new line moves

In 'draw shows the selected tower's card' (line 214), `texts(ctx).slice(0, 4)` becomes
`slice(0, 5)`, and `['Press S to sell: 10 gold', THEME.hudInk]` is inserted before
`['Lives', THEME.hudMuted]`. Nothing else in the file changes.

### 7. Green

Run `node --test test/sell.test.js test/upgrade.test.js test/hud.test.js
test/tower-price.test.js test/tower-cost.test.js test/game.test.js test/gold.test.js
test/placement-preview-and-mode.test.js test/range-preview.test.js test/render.test.js
test/pause-speed.test.js test/start-screen.test.js test/game-over.test.js`. That covers the
reproducer, the edited file, and every unedited file that places, upgrades, prices or draws a
tower or its card, or boots src/main.js. The whole suite runs on the pull request's required
checks.

## Acceptance

`npm --prefix . run test` passes. test/sell.test.js is committed red first and is green after.
Every other existing file under test/ is unedited and green, and test/upgrade.test.js changes
only in the one expectation named above. test/sell.test.js proves each criterion:

- A lantern placed for 20 gold has a sell value of 10, and 22 after a 25-gold upgrade.
- Selling it removes it from `state.towers`, adds its sell value to the gold, returns `null`, and
  frees the cell.
- On normal, with two lanterns placed, selling one makes the next lantern cost 25, not 30.
- `sellTower` with an unknown id returns `'missing'`, and on a won or lost game it returns
  `'over'`. Neither changes the towers or the gold.
- `hudKey` returns `'sell'` for `s` and `S`.
- The card of a selected lantern placed for 20 gold draws `Press S to sell: 10 gold` as its last
  line, and its whole rectangle lies inside the canvas.
- In the browser, S sells the selected tower once per press, paused or not, and clears the
  selection.
