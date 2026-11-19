# Plan: upgrade a placed tower with gold (print line-factory-baked-demo-yym)

GitHub issue #15, opened as print issue #50. Class: fix. The player clicks a placed tower to
select it. A card beside the tower shows its level, damage, range and upgrade cost, and U
upgrades it, up to level 3. An upgraded tower wears one mark per level.

## Inputs verified

- docs/changes/line-factory-baked-demo-yym/triage.md: read. It carries the issue, the brief,
  the signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no docs/changes/line-factory-baked-demo-yym/spec.md
  and none anywhere in the tree, so nothing is read from it. The triage's brief and lists
  stand in for it, as they did for prints 36, 42 and 47.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The base: the print branch was cut from 6658250 (the line's start). That commit has no
  gold, no BRAZIER or FROST, no `placementError` and no src/hud.js, so none of the triage's
  claims could hold there. The triage was written against main as it stands. This stage
  merged origin/main at bb2ddcf (print 47) into the branch as f24dd32, with no conflict:
  the branch held only its triage files. Everything below is read from that merge.
- I checked the triage's claims against that base:
  - True: `createTower` in src/tower.js copies range, cooldown, damage, splash, slow and
    slowFor. It records no level, no kind and no id.
  - True: LANTERN, BRAZIER and FROST declare `cost` and nothing for an upgrade. There is no
    maximum level.
  - True: src/game.js has `placeTower` and `placementError` ('bounds', 'path', 'taken',
    'gold') and nothing like `upgradeTower`.
  - True: in src/main.js, a left click on a board cell calls `placeTower`, which
    `placementError` refuses as 'taken' when a tower stands there. No tower can be selected.
  - True: `hudModel` in src/hud.js reads only lives, gold, wave, totalWaves, paused and
    speed.
  - True: `bodySprite` in src/render.js picks a sprite by kind alone, and every level would
    draw alike.
- Source read: src/tower.js, src/game.js, src/hud.js, src/render.js, src/main.js,
  src/theme.js, src/path.js (TILE 40, a 16 × 10 board, 640 × 400). Tests read:
  test/hud.test.js, test/pause-speed.test.js, test/brazier.test.js, test/frost.test.js,
  test/render.test.js, test/range-preview.test.js and test/game.test.js.
  tests/architecture/assertion_baseline.json has javascript
  `negative-assertion-unpaired: 0`, and .hydraflow/layout.yaml gives test paths `test/**`.
- Design read: design/hud.md, design/screens.yaml and the Main artboard
  (design/screens/Main.dc.html, design/screens/Main.png). Main already draws a tower card
  beside a lantern (Main.dc.html:49-52): a dark panel with a gold border, a gold title
  "Lantern · level 1" and a stats line "Range 3 tiles · 1 damage · 0.6 s". The selected
  tower's card follows that card, with one more line for the upgrade. No artboard draws
  level marks.

## Who meets it

- person: the player, in a round in play on the Main artboard (design/screens/Main.png,
  source design/screens/Main.dc.html). They click a lantern they placed, and a card beside it
  reads "Lantern · level 1", "Range 2.5 tiles · 1 damage" and "Press U to upgrade: 25 gold".
  They press U. 25 gold leaves the bar, the card reads level 2, 3 tiles and 2 damage, the
  range ring grows, and two marks sit under the lantern. At level 3 the card says it is the
  most. With too little gold it says how much is needed and how much they hold, and nothing
  changes.

## Refusals

`upgradeError(state, id)` gives each refusal's reason, and `upgradeTower` returns it while
changing nothing. The sentence is the one `UPGRADE_REFUSALS` in src/hud.js holds, and the
card draws it in place of the upgrade line. `{cost}` and `{gold}` are filled with the
tower's `upgradeCost` and the gold held.

- upgrade/gold: Needs {cost} gold, you hold {gold}: banish more ghosts
- upgrade/max: Level 3 is the most: upgrade another tower
- upgrade/missing: No tower to upgrade: click a placed tower first

A selected tower always exists, so 'missing' is never drawn. It is the refusal for an id that
names no tower on the board. It is fail-closed: nothing changes, and no gold is spent.

## Touches

The signed list holds the whole change, so it is not amended:

touches:
  - src/tower.js
  - src/game.js
  - src/hud.js
  - src/render.js
  - src/main.js
  - test/upgrade.test.js

src/theme.js is not touched. The card and the marks paint only in existing THEME tokens:
`hudBg`, `rangeRing`, `hudAccent`, `hudInk`, `hudMuted` and `hudDanger`.

`reproduces:` stays as signed: test/upgrade.test.js, new, written red first.

Every other suite stays unedited and must pass as it stands. I checked each lock:
- test/hud.test.js `deepEqual`s `hudModel(createGame())` to its exact seven keys.
  `hudModel` is left unchanged, and the selected tower gets its own model, `selectedModel`.
- test/pause-speed.test.js `deepEqual`s the bar's whole text list after a click on row 0.
  That click places a tower and selects nothing, so no card is drawn and `hudAt` holds.
- test/brazier.test.js and test/frost.test.js hand `draw` a sprite table of counters. The
  marks and the card are drawn by private functions of render.js, not through the table,
  so the counts hold.
- test/hud.test.js 'the bar sits above the board' draws a game with no towers, so no mark
  or card lands below the bar in a HUD colour.
- test/range-preview.test.js counts `arc` calls with no tower placed. Marks are `fillRect`
  squares, never arcs, and only a level above 1 draws them. A level-1 tower is drawn
  exactly as today, as the Board artboard draws it.
- test/hud.test.js 'hudKey: P and F' maps only p, P, f, F, 1 and space. The new keys u, U
  and Escape are outside it.
- No test `deepEqual`s a whole tower or a whole new game against a literal. `restart`
  rebuilds from options, and hud.test's `structuredClone` compares like with like.
- test/render.test.js 'src/render.js holds no colour literal' holds, because no literal is
  added.

## Build order (red first, then green)

Every new check is an exact `equal` or `deepEqual`, with booleans asserted as
`equal(…, true)`. No `notEqual`, `notDeepEqual`, `ok(!…)` or `doesNotMatch` is written, so
the assertion baseline cannot rise. The upgrade amounts are whole numbers or 0.5, so every
sum is exact.

### 1. Reproducer: test/upgrade.test.js, committed red

It imports `LANTERN`, `BRAZIER`, `FROST`, `MAX_LEVEL`, `createTower` and `towerById` from
../src/tower.js. From ../src/game.js it imports `createGame`, `placeTower`, `upgradeError`,
`upgradeTower` and `clickCell`. From ../src/hud.js it imports `selectedModel`,
`UPGRADE_REFUSALS`, `upgradeLine` and `hudKey`, and from ../src/render.js `draw`,
`drawLevelMarks`, `SPRITES` and `LEVEL_MARK`. It also imports `THEME` from
../src/theme.js and `TILE` from ../src/path.js. Quiet games are
`createGame({ waveSize: 0 })`. A lantern placed at (1, 1) is off the path.

- 'every kind declares its upgrade, and the most is level 3': `MAX_LEVEL` is 3, and
  `[LANTERN, BRAZIER, FROST].map((k) => [k.upgradeCost, k.upgradeDamage, k.upgradeRange])`
  is `[[25, 1, 20], [35, 1, 10], [45, 0.5, 10]]`.
- 'a placed tower starts at level 1, knows its kind and has its own id': place two
  lanterns. `game.towers.map((t) => [t.id, t.level, t.kind])` is
  `[[1, 1, LANTERN], [2, 1, LANTERN]]`. `towerById(game, 2)` is `game.towers[1]`, and
  `towerById(game, 9)` is `null`. `createTower(1, 1).level` is 1.
- 'upgrading a level-1 lantern with enough gold' (acceptance 1): a quiet game with
  `gold: 100` and a lantern at (1, 1) (gold 80). `upgradeTower(game, 1)` is `null`.
  `[level, damage, range, game.gold]` is `[2, LANTERN.damage + LANTERN.upgradeDamage,
  LANTERN.range + LANTERN.upgradeRange, 80 - LANTERN.upgradeCost]`.
- 'with too little gold the upgrade is refused with gold and nothing changes'
  (acceptance 2): a game with `gold: LANTERN.cost + LANTERN.upgradeCost - 1` and one
  lantern. `[upgradeError(game, 1), upgradeTower(game, 1)]` is `['gold', 'gold']`, and
  `[level, damage, range, game.gold]` is `[1, LANTERN.damage, LANTERN.range,
  LANTERN.upgradeCost - 1]`.
- 'a level-3 tower refuses with max' (acceptance 3): a game with `gold: 1000` and one
  lantern, upgraded twice (both `null`), reads level 3. Then `upgradeTower` is `'max'`, and
  level, damage, range and gold are unchanged from before that call. With `gold: 0` it is
  still `'max'`, because max is checked before gold.
- 'an id that names no tower is refused with missing': `upgradeTower(createGame(), 7)` is
  `'missing'`, and gold is still `START_GOLD`.
- 'each kind rises by its own amounts': in games with `gold: 1000`, a frost tower upgraded once reads damage
  `FROST.damage + FROST.upgradeDamage` (1) and range 100, and a brazier upgraded once reads
  range 90 and splash unchanged.
- 'a click on a tower selects it and places nothing; a click elsewhere places and selects
  nothing': with a lantern at (1, 1), `clickCell(game, 1, 1, LANTERN)` is 1, and gold and
  `towers.length` are unchanged. `clickCell(game, 3, 1, LANTERN)` is `null` and places a
  second lantern. `clickCell(game, 2, 2, LANTERN)` on the path is `null` and places nothing.
- 'the HUD model of a selected tower' (the triage's HUD criterion): with a lantern at
  (1, 1) and 30 gold, `selectedModel(game, 1)` is `{ name: 'Lantern', level: 1, maxLevel:
  3, damage: 1, range: 100, upgradeCost: 25, refusal: null }`. After one upgrade (5 gold) it
  is `{ …, level: 2, damage: 2, range: 120, upgradeCost: 25, refusal: 'gold' }`. At level 3
  it reads `upgradeCost: null, refusal: 'max'`. `selectedModel(game, 9)` and
  `selectedModel(game, null)` are each `null`.
- 'the upgrade line says what U does, or why it cannot': `upgradeLine(model, game.gold)` on
  the three models above gives `'Press U to upgrade: 25 gold'`, `'Needs 25 gold, you hold 5: banish more
  ghosts'` and `'Level 3 is the most: upgrade another tower'`. `UPGRADE_REFUSALS` has keys
  `['gold', 'max', 'missing']`, and its 'missing' text is `'No tower to upgrade: click a
  placed tower first'`.
- 'U upgrades and Escape clears the selection': `['u', 'U', 'Escape'].map(hudKey)` is
  `['upgrade', 'upgrade', 'deselect']`.
- 'draw makes one level mark per level above the first': with a recording context, each
  `fillRect` of size `LEVEL_MARK` × `LEVEL_MARK` in `THEME.hudAccent` is counted.
  `drawLevelMarks` on towers of level 1, 2 and 3 gives `[0, 2, 3]`. Then `draw` on a game
  with a level-3 lantern gives 3. The marks sit in a row centred on the tower, their top at
  `tower.y + TILE * 0.4`.
- 'draw shows the selected tower's card': in `createGame()` with a lantern placed at
  (1, 1), which leaves 30 gold, `draw(ctx, game, null, SPRITES, null, 1)` writes texts
  starting `['Lantern · level 1', 'Range 2.5 tiles · 1 damage', 'Press U to upgrade: 25
  gold', 'Lives', …]`. The card is drawn before the bar, so the bar's texts come after it. The title is in `hudAccent`, the stats in `hudInk`, and
  the upgrade line in `hudAccent`. A 'gold' line is in `hudDanger`, and a 'max' line in
  `hudMuted`. With no selection, `draw` writes exactly the bar's texts.
- 'the selected tower's card stays on the board': for towers at (0, 0) and (15, 0), the
  card's `fillRect` lies within `0 ≤ x`, `x + width ≤ 640` and `0 ≤ y` in board
  coordinates.

It is red against the base: `MAX_LEVEL`, `upgradeTower` and `selectedModel` are not
exported.

### 2. src/tower.js: the level, the kind, and what an upgrade adds

- Each kind declares its upgrade, flat beside its cost, with the trailing unit comment
  extended: LANTERN gets `upgradeCost: 25, upgradeDamage: 1, upgradeRange: 20`, BRAZIER
  gets `35, 1, 10`, and FROST gets `45, 0.5, 10`. Each kind's range stays a quarter-tile
  multiple, so the card's tiles have at most two decimals.
- `export const MAX_LEVEL = 3; // the most a tower is upgraded to`.
- `createTower` adds `level: 1, kind`. The tower keeps a reference to the kind it was built
  from, so an upgrade reads the kind's declared amounts.
- `export function towerById({ towers }, id)` returns the tower with that id, or `null`.
- The header comment says that a placed tower rises to level 3 by the amounts its kind
  declares.

### 3. src/game.js: ids, the refusal and the upgrade, and a board click

- `createGame` adds `nextTowerId: 1`. `placeTower` pushes `{ id: state.nextTowerId++,
  ...createTower(col, row, kind) }`.
- `export function upgradeError(state, id)`: 'missing' when `towerById` finds none, then
  'max' when `tower.level >= MAX_LEVEL` or its kind declares no `upgradeCost`, then 'gold'
  when `state.gold < tower.kind.upgradeCost`. Otherwise it returns `null`. The comment
  orders the reasons the way `placementError`'s comment does.
- `export function upgradeTower(state, id)`: returns `upgradeError`'s reason when it
  refuses, having changed nothing. Otherwise it raises the level by one, adds
  `kind.upgradeDamage` and `kind.upgradeRange`, takes `kind.upgradeCost` from gold, and
  returns `null`.
- `export function clickCell(state, col, row, kind = LANTERN)`: a tower standing on the
  cell is selected, its id is returned and nothing is placed. Any other cell is handed to
  `placeTower`, and the click returns `null`, which selects nothing.

### 4. src/hud.js: the selected tower's model and its sentences

- `export const UPGRADE_REFUSALS = Object.freeze({ gold: 'Needs {cost} gold, you hold
  {gold}: banish more ghosts', max: 'Level 3 is the most: upgrade another tower', missing:
  'No tower to upgrade: click a placed tower first' })`.
- `export function selectedModel(state, id)` returns `null` when `towerById` finds none.
  Otherwise it returns `{ name: tower.kind.name, level, maxLevel: MAX_LEVEL, damage, range,
  upgradeCost, refusal: upgradeError(state, id) }`, where `upgradeCost` is `null` at the
  most. It reads the state and never writes it. `hudModel` is unchanged.
- `export function upgradeLine(model, gold)` gives `'Press U to upgrade: {cost} gold'` when
  `refusal` is null. Otherwise it gives the refusal's sentence with `{cost}` and `{gold}`
  filled in.
- `hudKey` also maps u and U to 'upgrade' and Escape to 'deselect', and its comment says so.
- hud.js imports `MAX_LEVEL` and `towerById` from ./tower.js, and `upgradeError` from
  ./game.js. game.js imports nothing from hud.js, so there is no cycle.

### 5. src/render.js: level marks and the selected tower's card

- `export const LEVEL_MARK = 5;` gives the side of a mark in pixels.
  `export function drawLevelMarks(ctx, tower)` draws nothing at level 1. At a higher level
  it draws `tower.level` squares in `THEME.hudAccent`, `LEVEL_MARK` apart, in a row centred
  on `tower.x` with their top at `tower.y + TILE * 0.4`. `draw` calls it for each tower,
  straight after the tower bodies and not through the sprite table.
- `draw(ctx, state, hover, sprites = SPRITES, kind = null, selected = null)`: the selection
  goes last, so every existing call is unchanged. When `selectedModel(state, selected)` is a
  model, `draw` strokes that tower's range ring with `drawRangeRing`, unless the hover
  already rings it. It then draws the card after the beams and before the end card, in
  board coordinates.
- The card follows Main.dc.html:49-52 as `drawTowerCard(ctx, tower, model, gold)`. It is a
  300 × 54 rounded rect filled `THEME.hudBg` and stroked `THEME.rangeRing`, with three
  11px lines:
  - `${name} · level ${level}` in `hudAccent`.
  - `Range ${range / TILE} tiles · ${damage} damage` in `hudInk`.
  - `upgradeLine(model, gold)` in `hudAccent`. A 'gold' line is in `hudDanger`, and a 'max'
  line in `hudMuted`.
- The card's left edge is `tower.x + TILE * 0.6`, and its top is `tower.y - TILE - 14`. Each
  is clamped to stay 4px inside the 640 × 400 board, at fixed sizes with no text measured.
- No colour literal is added.

### 6. src/main.js: click to select, U to upgrade

- `let selected = null; // the id of the tower the card shows, chosen by a click on it`.
- The click's board branch becomes `if (cell) selected = clickCell(state, cell.col,
  cell.row, kind);`. The restart branch sets `selected = null`.
- The keydown handler reads `hudKey`. 'upgrade' calls `upgradeTower(state, selected)` while
  the round is playing, a tower is selected, and the key is not a repeat. 'deselect' sets
  `selected = null`. 'pause' and 'speed' still reach `TOGGLES` as today. Upgrading works
  while paused, as placing does.
- The frame calls `draw(ctx, state, hover, SPRITES, kind, selected)`.
- The comments on the click and on keydown name the selection, U and Escape.

### 7. Green

`node --test test/upgrade.test.js test/hud.test.js test/pause-speed.test.js
test/brazier.test.js test/frost.test.js test/render.test.js test/range-preview.test.js
test/game.test.js test/tower-cost.test.js test/targeting-mode.test.js` runs the reproducer
and every unedited suite that calls `createTower`, `placeTower`, `hudModel`, `hudKey`,
`draw` or main.js. Then `npm --prefix . run test` runs once, which is the line's named
check. The whole suite also runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/upgrade.test.js is committed red first and green
after, and every other suite is unedited. Each of the triage's criteria is proven:

- Upgrading a level-1 lantern with enough gold makes it level 2. Its damage and range rise
  by LANTERN's `upgradeDamage` and `upgradeRange`, and LANTERN's `upgradeCost` is deducted.
- With too little gold the upgrade is refused with 'gold', and level, damage, range and
  gold are unchanged.
- A level-3 tower is refused with 'max'.
- The HUD model of a selected tower, `selectedModel`, carries its level, damage, range and
  upgrade cost.
- `draw` makes one level mark per level on an upgraded tower. A level-1 tower is drawn as
  the Board artboard draws it.
