# Plan: rising tower prices and armoured ghosts (print line-factory-baked-demo-xev)

GitHub issue #66, with issue #67 bundled (bead lantern-line-factory-baked-demo-mp0), opened
again as issue #72, bead lantern-line-factory-baked-demo-xev. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-xev/triage.md: read. It carries both briefs, the signed
  `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is none under docs/changes/line-factory-baked-demo-xev/
  and none anywhere else in the tree, so nothing is read from it. The triage's briefs and lists
  stand in for it, as they did for prints 36 to 9oy.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers both briefs in full.
- The base: the print branch was cut from 6658250, the line's first merge. At that commit
  there is no src/difficulty.js, no src/theme.js and no gold, so the triage's claims were
  false of the print's own tree. origin/main had moved on to 542a64a (print 9oy, PR #71,
  which the triage's ruling says this builds on). 83a64c9 takes origin/main in at 542a64a.
  The branch held only triage files, so the merge was clean. Every claim below is checked
  against that base.
- I checked the triage's claims against that base:
  - True: `placementError` compares `state.gold < (kind.cost ?? 0)`, and `placeTower`
    deducts `kind.cost ?? 0`. Nothing named `towerPrice` exists.
  - True: `upgradeError` and `upgradeTower` read `tower.upgrade.cost`, which `createTower`
    copies from the kind's `upgradeCost`. That cost does not depend on tower count.
  - True: `createEnemy` in src/enemy.js has no `armour`. `damageEnemy` takes the full
    `amount`. `tick` sends every hit through `damageEnemy`, including a splash's whole `hit`
    list and a frost tower's hit, and it slows only the hit ghosts that are not `dead`.
  - True: `spawnEnemy` and `spawnBoss` both build through `createEnemy`, and tick sends the
    boss as a wave's last spawn.
  - True: `DIFFICULTIES` entries are exactly `{ name, health, gold, lives }`, and
    test/difficulty.test.js deep-equals them. Any new per-difficulty number therefore goes
    in a sibling table.
  - True: `drawHud` draws `kind.name` alone at `HUD_KIND.valueX` (348). `draw` passes the
    `kind` it was handed. render.js already imports from ./game.js.
  - True: src/main.js boots `createGame({ status: 'ready' })` with no difficulty.
    test/pause-speed.test.js boots main.js and pins the Tower value as `Lantern`.
  - The numbers hold. LANTERN costs 20 and BRAZIER 30 (src/tower.js). WAVES[3] (wave 4) has
    `count: 8` and no boss. WAVES[4] (wave 5) has a boss. FROST's damage is 0.5, so a frost
    hit on an armoured ghost takes `Math.max(0.5, 0.5 - 1)` = 0.5 and leaves a 5-health
    ghost alive to be slowed.
- Existing tests I read for shapes this change adds to: test/enemy.test.js, test/frost.test.js,
  test/brazier.test.js, test/boss.test.js (`waveSpawner` reassigned in `atWave`),
  test/waves.test.js (spawner `count` and `interval` read field by field),
  test/pause-speed.test.js:60 (a view compared between two runs of the same code),
  test/render.test.js, test/tower-cost.test.js, test/upgrade.test.js and
  test/difficulty.test.js. None of them deep-equals a whole enemy, a whole spawner or the
  exports of src/difficulty.js. So an `armour` field on every ghost, a `plain` counter on
  every spawner, and a new export beside `DIFFICULTIES` break none of them. No existing test
  draws a game made with a difficulty, so the priced Tower value reaches none of them.
- Standards: tests/architecture/assertion_baseline.json holds `negative-assertion-unpaired`
  and `substring-binding` at 0. The new tests prove absence only by exact `deepEqual` of a
  whole list, each paired with a positive check on the same draw or spawn. They write no
  prefix or substring filter.
- Knowledge vault (0-Inbox), all met:
  - "A print branch cut before main moved must merge main before the plan reads it": met by
    83a64c9.
  - "A triage can describe code the print's tree does not have yet": met by the checks above.
  - "Two issues that each forbid editing a test can together break one it pins": met. This
    print leaves src/main.js alone, so test/pause-speed.test.js still reads `Lantern`.
  - "A no-such-text check written as a prefix filter trips the assertion baseline": met by
    the exact-list rule above.

## Who meets it

- agent: a caller of src/game.js that makes a game with a difficulty, such as a test or the
  later print for issue #68, which opens src/main.js on normal. On normal or hard, it reads
  a kind's rising price from `towerPrice(state, kind)`. It sees `placementError` refuse
  `'gold'` at that price, and `placeTower` charge it. From wave 4 on, every third plain ghost
  carries `armour: 1`, and `damageEnemy` takes `Math.max(0.5, amount - 1)` from it. `draw`
  shows the price beside the Tower name and strokes an armoured ghost in `THEME.armour`. No
  person meets this change yet. src/main.js still opens a game with no difficulty, and such
  a game prices every tower at its cost, sends no armoured ghost and draws the Tower value
  as today. No screen offers a difficulty, and no artboard under design/screens/ draws a
  price in the HUD or an armoured ghost.

## Refusals

- none: this change adds no new refusal. The one refusal it touches is placement's existing
  `'gold'` reason from `placementError`, which now compares the gold held against
  `towerPrice` instead of `kind.cost`. Its name and meaning stay the same. The new
  per-difficulty lookup reaches an unknown key only through `difficultyEntry`. That lookup
  throws the `difficulty/unknown-key` RangeError that print 9oy introduced, unchanged, and
  `createGame` has already refused such a key before any price or spawn reads it.

## Touches

The signed list holds the whole change, so it is not amended:

touches:
  - src/difficulty.js
  - src/game.js
  - src/enemy.js
  - src/render.js
  - src/theme.js
  - test/tower-price.test.js
  - test/armour.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with `node --test`.

`reproduces:` stays as signed: test/tower-price.test.js and test/armour.test.js. Both are
new, so each is written and committed red first, and both stay in `touches:`. No existing
file under test/ is edited.

## Build steps

Every new check is an exact `assert.equal` or `assert.deepEqual`. No `notEqual`,
`notDeepEqual`, `ok(!…)`, `doesNotMatch`, prefix or substring filter is written, so neither
baseline count can rise. Drawing tests use a small recording context in the test file: each
call records `name`, `args`, and the `fillStyle`, `strokeStyle` and `lineWidth` in force. This
is the same pattern test/frost.test.js and test/boss.test.js use.

### 1. test/tower-price.test.js, red first

Imports `test`, `assert` (node:assert/strict), `createGame`, `placeTower`, `placementError`,
`towerPrice` and `upgradeError`/`upgradeTower` from ../src/game.js, `LANTERN` and `BRAZIER`
from ../src/tower.js, and `SPRITES`, `HUD_KIND` and `draw` from ../src/render.js. Free cells
are taken from row 0, off the path: (0, 0), (1, 0), (2, 0) and (3, 0). The path's highest
row in WAYPOINTS is 2, and `placementError` on a fresh game returns `null` for all four.

- 'on normal a lantern costs 20, then 25, then 30, and a brazier stays 30 beside two
  lanterns': a normal game with `gold: 1000`. `towerPrice(game, LANTERN)` is read with none,
  one and two lanterns placed, and deep-equals `[20, 25, 30]`. `towerPrice(game, BRAZIER)`
  with those two lanterns placed is 30.
- 'on normal a second lantern with 24 gold is refused for gold and changes nothing': a normal
  game, one lantern placed, `game.gold = 24`. `placementError(game, 1, 0, LANTERN)` is
  `'gold'`. `placeTower` returns `false`, and `[game.towers.length, game.gold]` is `[1, 24]`.
- 'on normal a second lantern with 25 gold is placed and leaves 0 gold': as above with
  `game.gold = 25`. `placeTower` returns `true`, and `[towers.length, gold]` is `[2, 0]`.
- 'on easy, and with no difficulty, a third lantern costs 20': for `createGame({ difficulty:
  'easy', gold: 1000 })` and `createGame({ gold: 1000 })`, two lanterns are placed. Then
  `towerPrice` is 20, and placing the third takes exactly 20 gold.
- 'an upgrade costs the same however many towers stand': a normal game with `gold: 1000` and
  one lantern placed. Record the gold `upgradeTower` takes. Then place three more lanterns
  and a brazier, and upgrade a second lantern. Both takes equal `LANTERN.upgradeCost` (25).
- 'the HUD reads Lantern 25 on normal with one lantern placed': draw a normal game holding
  one lantern, with `LANTERN` handed as the kind. The `fillText` calls at `HUD_KIND.valueX`
  deep-equal `[['Lantern 25', HUD_KIND.valueX]]` by `[args[0], args[1]]`.
- 'the HUD reads Lantern with no difficulty': the same draw of `createGame()` with one
  lantern placed gives `[['Lantern', HUD_KIND.valueX]]`.

It is red against the base because `towerPrice` is not exported, so the import fails.
Commit it alone as `test(xev): tower-price.test.js reproducer, red first`.

### 2. test/armour.test.js, red first

Imports `createGame`, `spawnBoss`, `spawnEnemy`, `step` and `waveSpawner` from
../src/game.js, `createEnemy` and `damageEnemy` from ../src/enemy.js, `FROST` from
../src/tower.js, `WAVES` from ../src/waves.js, `drawGhost` from ../src/render.js, `THEME`
from ../src/theme.js and `WAYPOINTS` from ../src/path.js. A helper `atWave(n, options)`
makes `createGame(options)`, sets `wave = n` and `spawner = waveSpawner(game, n)` (the same
pattern as boss.test.js). A helper `plainArmour(options, n)` spawns
`WAVES[n - 1].count` plain ghosts through `spawnEnemy` on `atWave(n, options)` and returns
their `armour` values.

- 'on normal the eight plain ghosts of wave 4 have armour 0, 0, 1, 0, 0, 1, 0, 0':
  `plainArmour({ difficulty: 'normal' }, 4)` deep-equals that list.
- 'on normal the tick sends wave 4's ghosts armoured in spawn order': `atWave(4, { difficulty:
  'normal' })`, then step the game 0.01 s at a time until the spawner has spawned all 8.
  There are no towers, and a ghost needs far longer than 8 × 1.2 s to cross the board.
  `game.enemies.map((e) => e.armour)` deep-equals the same list. This proves the counter
  follows `tick`'s spawn order, not only direct calls.
- 'on normal no ghost of waves 1 to 3 has armour': for n in 1, 2, 3, `plainArmour` deep-equals
  `Array(WAVES[n - 1].count).fill(0)`.
- 'on normal the boss of wave 5 has armour 0': `atWave(5, { difficulty: 'normal' })`, spawn
  its 9 plain ghosts, then `spawnBoss`. `[boss.boss, boss.armour]` is `[true, 0]`, and the
  plain list is `[0, 0, 1, 0, 0, 1, 0, 0, 1]`, so the boss is counted apart from them.
- 'on easy, and with no difficulty, no ghost of any wave has armour': for `{ difficulty:
  'easy' }` and `{}`, every wave 1 to 10's `plainArmour` deep-equals its zero list.
- 'a hit of 1, 3 and 0.5 takes 0.5, 2 and 0.5 from an armoured ghost': a fresh
  `createEnemy({ id: 1, waypoints: WAYPOINTS, health: 10, armour: 1 })` per hit. The health
  lost deep-equals `[0.5, 2, 0.5]`.
- 'each hit takes its full amount from a ghost with no armour': the same with `armour: 0`
  and with an enemy whose `armour` field is deleted. Both give `[1, 3, 0.5]`.
- 'a frost tower's hit on an armoured ghost slows it': a normal game, `waveSize: 0`, and
  one frost tower placed by `placeTower` beside the path's start. Push an armoured ghost
  (`armour: 1`, health 5) placed in range, then step one tick. `[ghost.health, ghost.slow,
  ghost.slowLeft > 0]` deep-equals `[4.5, FROST.slow, true]`.
- 'an armoured ghost's outline is stroked in THEME.armour at 2 pixels; a plain ghost's is
  not': `drawGhost` of an armoured ghost and of a plain one. The strokes' `[strokeStyle,
  lineWidth]` lists deep-equal `[[THEME.armour, 2], [THEME.ghostSheen, 2]]` and
  `[[THEME.ghostEdge, 1.6], [THEME.ghostSheen, 2]]` respectively, followed by the
  health bar's strokes if any. The build writes the exact full list it records from the
  plain ghost before the change, so the plain list proves today's drawing is unchanged.
- 'THEME.armour is #c9ced6': `assert.equal(THEME.armour, '#c9ced6')`.

It is red against the base because no ghost carries `armour` and `THEME.armour` is undefined.
Commit it alone as `test(xev): armour.test.js reproducer, red first`.

### 3. src/difficulty.js: the per-difficulty challenge table

Below `difficultyEntry`, add:

```js
// What each difficulty adds to the challenge, kept beside DIFFICULTIES rather than in its
// entries: how much each further tower of a kind costs, and from which wave every how-many-th
// plain ghost comes armoured (armourFrom null: none ever does).
export const CHALLENGES = Object.freeze({
  easy: Object.freeze({ priceStep: 0, armourFrom: null, armourEvery: 0 }),
  normal: Object.freeze({ priceStep: 5, armourFrom: 4, armourEvery: 3 }),
  hard: Object.freeze({ priceStep: 5, armourFrom: 4, armourEvery: 3 }),
});

// The challenge for `key`, or null when `key` is null or left out; any other key is refused as
// difficultyEntry refuses it.
export function challengeEntry(key) {
  return difficultyEntry(key) && CHALLENGES[key];
}
```

The header comment gains "and what each adds to the challenge". The `DIFFICULTIES` entries
are untouched.

### 4. src/enemy.js: armour

- `createEnemy` takes `armour = 0` and keeps it on the ghost as `armour`.
- `damageEnemy` takes
  `const taken = (enemy.armour ?? 0) > 0 ? Math.max(0.5, amount - enemy.armour) : amount;`
  and lowers health by `taken`. Its comment gains: an armoured ghost takes its armour off
  each hit, but never less than 0.5. A ghost with no `armour` field takes the full amount.
- The file's header comment notes that some ghosts come armoured.

### 5. src/game.js: towerPrice, the placement that pays it, and armoured spawns

- Import `challengeEntry` beside `difficultyEntry`.
- New, exported, placed above `placementError`:

  ```js
  // What the next tower of `kind` costs on this game: its cost, plus the difficulty's price step
  // for every tower of the same name already standing. With no difficulty the step is 0.
  export function towerPrice(state, kind = LANTERN) {
    const step = challengeEntry(state.difficulty)?.priceStep ?? 0;
    return (kind.cost ?? 0) + step * state.towers.filter((t) => t.name === kind.name).length;
  }
  ```

- `placementError` compares `state.gold < towerPrice(state, kind)`, and `placeTower` deducts
  `towerPrice(state, kind)` read before the push. Their comments say "price" where they said
  "cost". Upgrade functions are untouched.
- `waveSpawner` returns `{ ...createWave(...), boss, plain: 0 }`. `plain` counts the plain
  ghosts spawned this wave.
- `spawnEnemy` increments `state.spawner.plain` and passes `armour: armoured(state,
  state.spawner.plain)` to `createEnemy`. A private helper:

  ```js
  // A plain ghost's armour: 1 for every armourEvery-th of its wave, counted from 1, from the
  // difficulty's armourFrom wave on; 0 for the rest, and always with no difficulty.
  function armoured(state, nth) {
    const { armourFrom = null, armourEvery = 0 } = challengeEntry(state.difficulty) ?? {};
    return armourFrom !== null && state.wave >= armourFrom && armourEvery > 0 && nth % armourEvery === 0 ? 1 : 0;
  }
  ```

  If a spawner predates `plain` (for example, one a caller builds by hand), the count starts
  from `(state.spawner.plain ?? 0) + 1`.
- `spawnBoss` passes nothing new, so `createEnemy`'s default gives every boss `armour: 0`. The
  boss does not advance `plain`.
- `tick` is unchanged. Its splash and frost hits already go through `damageEnemy`, and a hit
  ghost that is not dead is still slowed.
- The comments on `spawnEnemy` and `waveSpawner` mention the armour count.

### 6. src/theme.js and src/render.js: the armour colour, the outline, the priced Tower value

- src/theme.js: under the ghost group, add
  `armour: '#c9ced6', // an armoured ghost's outline (no artboard yet: a pale steel beside the ghost's tones)`.
- src/render.js `drawGhost`: the body's stroke reads
  `ctx.strokeStyle = enemy.armour > 0 ? THEME.armour : THEME.ghostEdge;` and
  `ctx.lineWidth = enemy.armour > 0 ? 2 : 1.6;`. Every other call is unchanged, so a ghost
  with no armour draws exactly as today. The comment above it gains: an armoured ghost's
  outline is THEME.armour, 2 pixels.
- src/render.js `draw`: import `towerPrice` from ./game.js beside `rangePreview`, and hand
  `drawHud` the Tower value's text instead of the kind:
  `kind && (state.difficulty ? \`${kind.name} ${towerPrice(state, kind)}\` : kind.name)`.
  `drawHud` takes `kindText` and draws it at `HUD_KIND.valueX` when it is truthy. The
  label, colours and positions are unchanged. The comment on `draw` says that on a game with
  a difficulty the bar names the kind and its current price.

Commit steps 3 to 6 as
`fix(xev): towers of a kind cost more on normal and hard, and armoured ghosts shrug off weak hits`.

### 7. Green

Run `node --test test/tower-price.test.js test/armour.test.js test/difficulty.test.js
test/enemy.test.js test/frost.test.js test/brazier.test.js test/boss.test.js
test/waves.test.js test/game.test.js test/gold.test.js test/tower-cost.test.js
test/upgrade.test.js test/render.test.js test/hud.test.js test/pause-speed.test.js
test/placement-preview-and-mode.test.js test/range-preview.test.js`. That covers both
reproducers and every unedited file that places, prices, upgrades, spawns, damages or draws
a ghost or the HUD. The whole suite runs on the pull request's required checks.

## Reported, not moved

- The priced Tower value can run into "Boss wave". The value starts at x 348 and
  `HUD_BOSS_X` is 420. At the HUD's 16px font, `Lantern 25` or `Brazier 30` takes about
  75–85 px, so on waves 5 and 10 of a game with a difficulty the two texts touch. No person
  can reach that today, because src/main.js opens with no difficulty. No artboard sets where
  a price goes. The first print that puts a difficulty in front of a player (issue #68) is
  the one to lay out the bar, so this print does not move `HUD_BOSS_X`.

## Acceptance

`npm --prefix . run test` passes. test/tower-price.test.js and test/armour.test.js are each
committed red first and are green after. Every existing file under test/ is unedited and
green. The new files prove each criterion of both issues:

- On normal, a lantern costs 20, 25 and 30 with none, one and two placed, and a brazier is
  still 30 beside two lanterns.
- On normal with one lantern and 24 gold, a second lantern is refused with `'gold'`, no tower
  is added and gold stays 24. With 25 gold it is placed and gold is 0.
- On easy, and with no difficulty, a third lantern costs 20.
- An upgrade costs the same whatever number of towers stand.
- The HUD reads `Lantern 25` on a normal game with one lantern placed and `Lantern` with no
  difficulty.
- On normal, wave 4's eight plain ghosts have armour 0, 0, 1, 0, 0, 1, 0, 0, and no ghost of
  waves 1 to 3 has any.
- On normal, wave 5's boss has armour 0.
- On easy, and with no difficulty, no ghost of any wave has armour.
- Hits of 1, 3 and 0.5 take 0.5, 2 and 0.5 from an armoured ghost, and the full amount from
  one with no armour.
- A frost hit slows an armoured ghost.
- An armoured ghost's outline is stroked in `THEME.armour` (#c9ced6), and a plain ghost's is
  not.
- No refusal is added.
