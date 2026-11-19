# Plan: escalating waves from a table, and towers that cost gold (print line-factory-baked-demo-15s)

Two M3 "Waves and economy" items on one seam, taken together by the triage:
bead lantern-line-factory-baked-demo-15s (GitHub issue #10, work/m3-03-waves-table.md) and
bead lantern-line-factory-baked-demo-9c4 (GitHub issue #9, work/m3-02-tower-cost.md).
Both change `createGame`/`placeTower` in src/game.js and both edit test/game.test.js. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-15s/triage.md: read. It carries both briefs, the
  signed `touches:` and `reproduces:` lists and the acceptance criterion. This plan works
  inside that `touches:` list and amends nothing.
- spec.md: not present in the worktree (no docs/changes/line-factory-baked-demo-15s/spec.md,
  and none anywhere in the tree). Nothing is read from it; the triage's briefs and lists stand
  in for it.
- plan/research.md: not present in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers both briefs whole.
- The base: this branch was cut from main at 6658250, before M1, M2 and gold-per-kill landed,
  so its src/ had no `createWave`, `WAVE_SIZE`, `TOTAL_WAVES`, `ENEMY_HEALTH`, `BRAZIER` or
  `state.gold`, and test/game-over.test.js and test/gold.test.js did not exist. The triage was
  written against main at 639f168, which has all of them. This stage took main in at
  639f168 (the merge commit before this plan), as print 36 did, so src/ and test/ are main's
  and the triage's account of them holds. No further merge is needed before build.
- The triage checked against that base, claim by claim:
  - src/game.js: `createGame` builds `spawner: createWave({ count: waveSize, interval:
    spawnInterval })` from `WAVE_SIZE = 5` and `SPAWN_INTERVAL = 1.5`; `step` starts the next
    wave with `const { count, interval } = state.spawner; ... createWave({ count, interval })`;
    `spawnEnemy` calls `createEnemy({ id, waypoints })` with no health or speed; `totalWaves`
    defaults to `TOTAL_WAVES = 5`; `placeTower` checks only `canPlace` and never reads
    `state.gold`. `START_GOLD = 50`. No src/waves.js. All true.
  - src/enemy.js: `ENEMY_HEALTH = 3`, `ENEMY_SPEED = 60`, `ENEMY_BOUNTY = 5`. True.
  - src/tower.js: `LANTERN = { range: 100, cooldown: 0.6, damage: 1 }`, `BRAZIER = { range:
    80, cooldown: 1.2, damage: 1, splash: 40 }`, neither with a `cost`; `canPlace` returns a
    bare boolean for bounds, path and taken. True.
  - src/main.js builds `hover = { col, row, ok: canPlace(state, col, row), kind }` on
    mousemove and refreshes `ok` from `canPlace` each frame; src/render.js's `drawHover` fills
    `THEME.hover` when `ok`, else `THEME.hoverBad`. So lack of gold never shows. True.
- Source read: src/game.js, src/enemy.js, src/tower.js, src/wave.js, src/render.js,
  src/main.js; test/game.test.js, test/game-over.test.js, test/gold.test.js,
  test/brazier.test.js, test/render.test.js, test/range-preview.test.js;
  tests/architecture/assertion_baseline.json (javascript `negative-assertion-unpaired: 0`,
  `substring-binding: 0`); .hydraflow/layout.yaml (test paths `test/**`).
- Work and design read: work/m3-02-tower-cost.md, work/m3-03-waves-table.md (the line's own
  copies; the issue bodies in triage.md supersede them where they differ: ten waves, not five,
  and a brazier cost of 30), design/screens.yaml, design/hud.md,
  design/screens/HudStates.dc.html is the artboard work/m3-02-tower-cost.md follows.

## Who meets it

- person: the player, pointing at a free grass cell with a tower kind they cannot afford: the
  hover cell turns the refusal colour (`THEME.hoverBad`), as it already does on the path or a
  taken cell, and a click there places nothing and spends nothing. This follows the refused
  placement in design/screens/HudStates.dc.html (design/screens/HudStates.png). That
  artboard's "Not enough gold" line with the cost and gold held is drawn by the HUD, which is
  work/m4-01-hud.md and not in either brief here; this print only gives that line its cause,
  `placementError(...) === 'gold'`.
- person: the player holding the line wave by wave: each wave sends more, tougher and faster
  ghosts than the one before, and holding the tenth wins the round, as the Win artboard's ten
  waves (design/screens/Win.dc.html) count them.

## Refusals

- placement/gold: `placementError(state, col, row, kind)` returns `'gold'` and `placeTower`
  returns `false`, adding no tower and leaving gold as it was, because the gold held is below
  this kind's cost; banish ghosts to earn the difference, or pick a cheaper kind (the lantern,
  20), then place again.

The three refusals that already existed (off the board, on the path, on a taken cell) refuse
exactly as before; this change only names them, as `'bounds'`, `'path'` and `'taken'` from
`placementError`, so they are not new.

## Touches

As signed in triage.md, unchanged:

- src/waves.js (new)
- src/game.js
- src/tower.js
- src/render.js (listed; the plan needs no change to it, since `drawHover` already paints
  `THEME.hoverBad` for any hover whose `ok` is false; build leaves it unedited unless a
  comment there goes stale)
- src/main.js
- test/waves.test.js (new, reproducer)
- test/tower-cost.test.js (new, reproducer)
- test/game-over.test.js (edits the waves issue allows)
- test/game.test.js (edits both issues allow)
- test/gold.test.js (edits the tower-cost issue allows)

`reproduces:` stays as signed: test/waves.test.js and test/tower-cost.test.js, both written
red first. Every other suite stays unedited and must pass as it stands. Checked against the
new costs (lantern 20, brazier 30, 50 gold to start): test/render.test.js places two lanterns
per game (40), test/range-preview.test.js a lantern and a brazier (50), test/brazier.test.js
at most a brazier and a lantern (50), and every other placement is a single tower, so all
are funded. test/render.test.js and test/range-preview.test.js pass `ok` on the hover
themselves, so `draw` keeps reading `ok`. Wave 1's table entry equals today's constants
(5 ghosts, 1.5 s, health 3, speed 60), so every quiet wave-1 game in test/brazier.test.js,
test/gold.test.js and test/enemy.test.js sees the ghosts it sees today.

## Build order (red first, then green)

No assertion in the new or edited tests is a negative one (`notEqual`, `notDeepEqual`,
`ok(!...)`, `doesNotMatch`): every check is an exact `equal`/`deepEqual`, so the assertion
baseline cannot rise.

### 1. Reproducer: test/waves.test.js, committed red

Imports `WAVES` from ../src/waves.js, `START_LIVES`, `TOTAL_WAVES`, `createGame`, `step`
from ../src/game.js.

- 'the table holds ten waves, each with a positive count, interval, health and speed':
  `WAVES.length` is 10; for each entry, `[count > 0, interval > 0, health > 0, speed > 0]`
  deep-equals `[true, true, true, true]`, and its keys sorted are
  `['count', 'health', 'interval', 'speed']`.
- 'the table escalates: each wave's count * health is at least the one before': for each
  i ≥ 1, `WAVES[i].count * WAVES[i].health >= WAVES[i - 1].count * WAVES[i - 1].health` is
  `true`; and no wave is slower than the one before (`speed` non-decreasing), which the
  game-over walk below relies on.
- 'wave 2 is not wave 1 again': `[WAVES[1].health > WAVES[0].health, WAVES[1].speed >
  WAVES[0].speed]` is `[true, true]`, so the next test cannot pass on wave 1's numbers.
- 'a new game reads its waves from the table': `TOTAL_WAVES` and `createGame().totalWaves`
  are `WAVES.length`; `createGame().spawner` has `count` `WAVES[0].count` and `interval`
  `WAVES[0].interval`.
- 'ghosts spawned in wave 2 carry wave 2's health and speed': `createGame({ lives: 1000 })`;
  step by 0.5 until `game.wave` is 2 (bounded loop); then `game.spawner`'s `count` and
  `interval` are `WAVES[1]`'s; `step(game, 0.01)` spawns a ghost whose
  `[health, maxHealth, speed]` deep-equals `[WAVES[1].health, WAVES[1].health,
  WAVES[1].speed]`. The wave-1 ghosts seen on the way carried `WAVES[0]`'s health and speed
  (recorded by id as they appear, asserted with one `deepEqual`).
- 'clearing the last entry wins the round': `createGame({ lives: 1000 })`, no towers; step by
  0.5 while `status` is `'playing'` (bounded loop). Then `[status, wave, lives]` deep-equals
  `['won', WAVES.length, 1000 - total]`, where `total` is the sum of every entry's `count`:
  every ghost of every wave spawned and leaked, and holding wave ten won.
- 'explicit waveSize and spawnInterval still override the table, in every wave':
  `createGame({ waveSize: 1, spawnInterval: 2, lives: 1000 })`; step through to wave 2; the
  wave-2 spawner's `[count, interval]` is `[1, 2]`, while the ghost it spawns still carries
  `WAVES[1]`'s health and speed. And `restart` of that game keeps the override (its spawner
  `count` is 1).

Red against the base: src/waves.js does not exist, so the import fails.

### 2. Reproducer: test/tower-cost.test.js, committed red

Imports `START_GOLD`, `createGame`, `hoverAt`, `placeTower`, `placementError` from
../src/game.js, `LANTERN`, `BRAZIER` from ../src/tower.js, `COLS`, `TILE`, `WAYPOINTS` from ../src/path.js,
`draw` from ../src/render.js, `THEME` from ../src/theme.js.
Quiet games are `createGame({ waveSize: 0 })`. Cell (3, 1) is free grass; `WAYPOINTS[0]` is
path.

- 'a lantern costs 20 and a brazier 30': `[LANTERN.cost, BRAZIER.cost]` is `[20, 30]`.
- 'with 50 gold, placing a lantern leaves 30, and a brazier costs 30': a quiet game,
  `START_GOLD` is 50, `placeTower(game, 3, 1, LANTERN)` is `true` and gold is 30; a second
  quiet game, `placeTower(game, 3, 1, BRAZIER)` is `true` and gold is 20. `placeTower` with no
  kind places a lantern and charges 20.
- 'with 10 gold, placing a lantern is refused, no tower is added and gold stays 10':
  `createGame({ waveSize: 0, gold: 10 })`; `placeTower(game, 3, 1, LANTERN)` is `false`;
  `[game.towers.length, game.gold]` is `[0, 10]`. Exactly 20 gold places a lantern and leaves
  0 (the boundary: refused only when gold is below the cost).
- 'placementError names each refusal': on a quiet game with a lantern placed at (3, 1),
  `[placementError(game, WAYPOINTS[0].col, WAYPOINTS[0].row, LANTERN), placementError(game,
  3, 1, LANTERN), placementError(game, -1, 0, LANTERN), placementError(game, 4, 1, LANTERN)]`
  is `['path', 'taken', 'bounds', null]` (30 gold left, enough for a lantern); then with
  `game.gold = 10`, `placementError(game, 4, 1, LANTERN)` is `'gold'`. Off the far edge
  (`COLS`, 0) is `'bounds'` too. A kind given no argument is a lantern.
- 'a refused placement spends nothing on the path, on a taken cell or off the board': each
  `placeTower` there is `false` and gold is unchanged.
- 'draw paints a free cell the player cannot afford in the refusal colour': a quiet game with
  10 gold; `draw(ctx, game, hoverAt(game, 3, 1, LANTERN))` with a recording context (a small
  Proxy stand-in like test/render.test.js's `recordingContext`, written in this file, since
  that suite stays unedited) records a `fillRect` at `[3 * TILE, 1 * TILE, TILE, TILE]` whose
  `fillStyle` is `THEME.hoverBad`; the same cell in a 50-gold game is filled `THEME.hover`.
  `hoverAt(game, 3, 1, LANTERN)` itself deep-equals `{ col: 3, row: 1, kind: LANTERN, ok:
  false }` at 10 gold.

Red against the base: `placementError` and `hoverAt` are not exported, and towers have no
`cost`.

### 3. src/waves.js (new)

    // The waves of a round, in order: how many ghosts, how often, and how tough and fast each is.
    // Wave 1 is the M1 wave (5 ghosts every 1.5 s, health 3, speed 60); each wave after it
    // sends at least as much health in all (count * health) and no slower ghosts.
    export const WAVES = [
      { count: 5, interval: 1.5, health: 3, speed: 60 },   // 15
      { count: 6, interval: 1.4, health: 4, speed: 65 },   // 24
      { count: 7, interval: 1.3, health: 4, speed: 70 },   // 28
      { count: 8, interval: 1.2, health: 5, speed: 70 },   // 40
      { count: 9, interval: 1.1, health: 5, speed: 75 },   // 45
      { count: 10, interval: 1.0, health: 6, speed: 75 },  // 60
      { count: 11, interval: 0.9, health: 6, speed: 80 },  // 66
      { count: 12, interval: 0.9, health: 7, speed: 80 },  // 84
      { count: 13, interval: 0.8, health: 7, speed: 85 },  // 91
      { count: 15, interval: 0.8, health: 8, speed: 90 },  // 120
    ];

Pure data, no imports. The trailing `count * health` comments may be dropped if the line's
style prefers; the numbers are the plan.

### 4. src/game.js: waves from the table

- Import `WAVES` from ./waves.js. Drop `WAVE_SIZE` and `SPAWN_INTERVAL` (nothing imports them;
  their values are `WAVES[0]`'s). `export const TOTAL_WAVES = WAVES.length; // waves to hold
  for the round to be won`.
- `createGame` takes `spawnInterval` and `waveSize` with no default: left out, the table
  decides; given, they override every wave. They stay in `options` as given (undefined when
  left out), so `restart` keeps the override or the table alike. `totalWaves` defaults to
  `TOTAL_WAVES`.
- A private `waveEntry(wave)` returns `WAVES[Math.min(wave, WAVES.length) - 1]` (a game made
  with more `totalWaves` than the table holds repeats the last entry), and a private
  `createSpawner(state)` (or the same from `options` and `wave`) returns
  `createWave({ count: options.waveSize ?? entry.count, interval: options.spawnInterval ??
  entry.interval })`. `createGame` builds wave 1's spawner with it, and `step` builds the next
  wave's after `state.wave += 1`, replacing the copy of the finished spawner's
  `{ count, interval }`. The comment "Every wave is the same size for now" goes; it says the
  next wave reads its entry in the table.
- `spawnEnemy` passes the current entry's `health` and `speed` to `createEnemy`. Wave 1's
  entry is the old defaults, so quiet wave-1 games are unchanged.
- The `state.spawner.count > 0` guard and the win check are unchanged: with `totalWaves`
  `WAVES.length`, clearing the tenth wave sets `'won'`.

### 5. src/tower.js and src/game.js: towers cost gold

- src/tower.js: `LANTERN` gains `cost: 20` and `BRAZIER` `cost: 30` (the trailing unit
  comments gain "gold"). `canPlace`'s three checks move into
  `export function cellError({ path, towers }, col, row)` returning `'bounds'`, `'path'`,
  `'taken'` or `null`, in that order, and `canPlace` becomes `cellError(...) === null`, so the
  cell rules are written once. `canPlace` stays exported: `rangePreview` still uses it, so a
  free cell shows the ring of the kind a click would place even when it is unaffordable.
- src/game.js: `export function placementError(state, col, row, kind = LANTERN)` returns
  `cellError(state, col, row) ?? (state.gold < (kind.cost ?? 0) ? 'gold' : null)`: the cell's
  reason first, then gold. A kind with no cost is free.
- `placeTower(state, col, row, kind = LANTERN)` returns `false` unless `placementError` is
  `null`; when it places, `state.gold -= kind.cost ?? 0` before pushing the tower.
- `export function hoverAt(state, col, row, kind = LANTERN)` returns `{ col, row, kind, ok:
  placementError(state, col, row, kind) === null }`: the hover main.js keeps and render.js
  draws, so the refusal colour has one source.

### 6. src/main.js

- Import `hoverAt` from ./game.js; drop `canPlace` from the tower.js import.
- `mousemove`: `hover = hoverAt(state, col, row, kind)`.
- The frame: `if (hover) hover = hoverAt(state, hover.col, hover.row, kind)`, so a hover
  turns red as gold is spent and back as bounties come in.

### 7. The edits the issues allow to existing suites

Only these, each keeping what its test proves:

- test/game-over.test.js: 'a new game is playing wave 1 of 5, and totalWaves can be set'
  asserts `TOTAL_WAVES` and `createGame().totalWaves` are `WAVES.length` (imported from
  ../src/waves.js) instead of 5, and its title says "wave 1 of the table's waves". `WALK`
  reads the table's slowest speed, `Math.min(...WAVES.map((w) => w.speed))`, instead of
  `ENEMY_SPEED`, so a wave-2 ghost's walk is measured on the table; the `ENEMY_SPEED` import
  goes. No other line changes.
- test/game.test.js: 'the wave number moves from 1 to 2 only when the lanterns banish the last
  ghost of wave 1' makes its game with `gold: 3 * LANTERN.cost` beside `waveSize: 2,
  spawnInterval: 1`, to fund its three lanterns. `LANTERN` is already imported. No other
  line changes.
- test/gold.test.js: totals account for the tower bought, bounty amounts unchanged
  (each placement in it is a single tower):
  - 'killing one ghost …': `[1, 0, 55]` → `[1, 0, 35]` (50 − 20 + 5).
  - 'a ghost that takes three lantern shots …': `[50, 50, 55]` → `[30, 30, 35]`.
  - 'two ghosts killed in the same step …': `[2, 0, 1, 60]` → `[2, 0, 1, 30]` and the
    follow-up `60` → `30` (50 − 30 + 5 + 5).
  - 'a ghost pays its own bounty': `62` → `42` (50 − 20 + 12).
  - 'restart puts gold back …': `25` → `5` (20 − 20 + 5); `restart(game).gold` stays 20.
  - The tests that place no tower are unchanged.

### 8. Green

`node --test test/waves.test.js test/tower-cost.test.js test/game.test.js
test/game-over.test.js test/gold.test.js test/brazier.test.js test/render.test.js
test/range-preview.test.js test/enemy.test.js test/wave.test.js` (the two reproducers, the
three edited suites, and every unedited suite that makes games, places towers or draws
hovers), then `npm --prefix . run test` once, the line's named check. The whole suite also
runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes with test/waves.test.js and test/tower-cost.test.js green,
both committed red first. The waves test proves: ten WAVES entries, each with a positive
count, interval, health and speed; each entry's `count * health` at least the previous
entry's; ghosts spawned in wave 2 carry `WAVES[1].health` and `WAVES[1].speed`; and clearing
the last entry sets status `'won'`. The tower-cost test proves: with 50 gold a lantern
(cost 20) leaves 30 and a brazier costs 30; with 10 gold placing a lantern is refused, no
tower is added and gold stays 10; `placementError` returns `'gold'`, `'path'`, `'taken'` and
`'bounds'` in the matching cases and `null` for a valid cell with enough gold; and `draw`
paints a free but unaffordable hover cell in `THEME.hoverBad`. The only edits to existing
suites are those in step 7; every other suite is unedited.
