# Plan: a frost tower that slows ghosts (print 47)

This print follows print line-factory-baked-demo-ywd (GitHub issue #14), which the
fail-forward skill retired as a train-wreck. PR #46 was green locally but red on
hydraflow/verify at cd026f7, with no log kept, after verify_rounds.max. The review of record
also asked for changes. Its P1 was that the HUD names no kind at boot. This is the re-cut
against main as it stands now, and it answers that P1. Class: fix.

## Inputs verified

- docs/changes/47/triage.md: read. It carries the issue, the brief, the signed `touches:`
  and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no docs/changes/47/spec.md and none anywhere in the
  tree, so nothing is read from it. The triage's brief and lists stand in for it, as they did
  for prints 36 and 42.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The base: 987d925 has main in at 4072152 (print 42: the HUD bar, pause and speed), so no
  further merge is needed before build.
- I checked the triage's claims against that base:
  - True: src/tower.js declares only `LANTERN` (cost 20, damage 1) and `BRAZIER` (cost 30).
    `kindForKey` maps '1' and '2' and keeps `current` for '3'. `createTower` copies range,
    cooldown, damage and splash, and nothing else.
  - True: in src/enemy.js, `advanceEnemy` moves a ghost `enemy.speed * dt`, with no slow
    and no timer.
  - True: in src/game.js, the private `tick` (which `step` runs `speed` times) applies
    `damageEnemy` to each ghost a tower hits, and nothing else.
  - True: src/render.js draws every tower with `splash > 0` as a brazier and every other
    tower as a lantern, with its pool. Every ghost's body is `THEME.ghostBody`.
  - True: src/theme.js holds no frost colour and no slowed-ghost tint.
  - **Stale:** "drawLives is the only text drawn". Print 42 replaced `drawLives` with
    `drawHud`, a bar showing Lives, Gold, Wave, Pause and 1x/2x, drawn from
    `hudModel(state)` in src/hud.js. The HUD still names no kind, so the P1 stands. The kind
    now goes into that bar (step 6).
  - True: `placementError` returns `'gold'` when `state.gold < kind.cost`, so frost's cost is
    refused with no new code.
  - True: in test/brazier.test.js, 'key 1 chooses the lantern, key 2 the brazier, and any
    other key keeps the kind chosen' expects `kindForKey('3', BRAZIER)` to be `BRAZIER`.
- Source read: src/tower.js, src/enemy.js, src/game.js, src/render.js, src/hud.js,
  src/main.js, src/theme.js; test/brazier.test.js, test/path.test.js,
  test/pause-speed.test.js, test/hud.test.js, test/render.test.js;
  tests/architecture/assertion_baseline.json (javascript `negative-assertion-unpaired: 0`);
  .hydraflow/layout.yaml (test paths `test/**`).
- Design read: design/hud.md, design/screens.yaml, and design/screens/ (the Board, Main and
  HudStates artboards). No artboard draws a frost tower, a slowed ghost or a kind in the
  HUD. The new colours are new THEME tokens in the board's palette (step 5). The kind's name
  sits in the bar as a fourth label and value pair, styled like the three before it.

## Who meets it

- person: the player, in a round in play on the Main artboard (design/screens/Main.png,
  source design/screens/Main.dc.html). They press 3 and the HUD bar reads "Tower Frost". A
  click then places a frost tower for 40 gold, drawn in its own icy colours. Each ghost it
  hits is tinted and moves at half speed until the slow runs out. From boot, the bar reads
  "Tower Lantern". Keys 1 and 2 switch it to "Lantern" and "Brazier". No artboard draws
  frost yet, so Main is the screen it is played on.

## Refusals

- none: this change refuses nothing new. Placing a frost tower with less than 40 gold is
  refused by the existing `'gold'` from `placementError`, with the same reason and hover as
  any kind that costs more than the gold held. A second frost hit refreshes the slow and is
  not turned down. Key 3 always selects frost.

## Touches amendment

- reason: the signed list cannot hold the review's P1. test/pause-speed.test.js boots
  src/main.js against stubbed DOM globals. Through its `hudAt` helper, four of its tests
  `deepEqual` the HUD's whole text list as exactly `['Lives', '10', 'Gold', '50', 'Wave',
  '1 / 10', Pause|Resume, 1x|2x]`. Once main.js hands `draw` the selected kind, the bar
  draws two more texts, 'Tower' and the kind's name. Those four tests then go red unless
  `hudAt` learns the kind. The edit is confined to that helper, plus one new test of the
  key-3 wiring through main.js, which belongs in the only suite with a main.js harness.
  `reproduces:` locks only test/path.test.js, which stays unedited and must pass.

touches:
  - src/tower.js
  - src/enemy.js
  - src/game.js
  - src/render.js
  - src/theme.js
  - src/main.js
  - test/frost.test.js
  - test/brazier.test.js
  - test/pause-speed.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with
`node --test`.

`reproduces:` stays as signed: test/path.test.js. It is run and not edited. Its two
`advanceEnemy` tests must stay exact for an unslowed ghost, and step 3 keeps them exact. The
new test/frost.test.js is written red first.

Every other suite stays unedited and must pass as it stands. I checked each one:
- test/hud.test.js and test/render.test.js call `draw(ctx, game, null)` without a kind, so
  their exact HUD text lists hold.
- No test `deepEqual`s a whole tower or ghost. test/game.test.js compares an empty `towers`
  list. pause-speed's `{ ...fast, speed: 1 }` compares two games built the same way.
- `rangePreview` reads `hover.kind.range`, which FROST has.

## Build order (red first, then green)

Every new check is an exact `equal`/`deepEqual`, with booleans asserted as `equal(…, true)`.
No `notEqual`, `notDeepEqual`, `ok(!…)` or `doesNotMatch` is written, so the assertion
baseline cannot rise. Times are powers of two (1/16 s ticks, `slowFor` 2), so every
distance below is exact in floating point.

### 1. Reproducer: test/frost.test.js, committed red

Imports `FROST`, `LANTERN`, `BRAZIER`, `createTower`, `kindForKey` from ../src/tower.js;
`ENEMY_SPEED`, `ENEMY_HEALTH`, `createEnemy`, `advanceEnemy`, `slowEnemy` from
../src/enemy.js; `createGame`, `placeTower`, `placementError`, `spawnEnemy`, `step` from
../src/game.js; `WAYPOINTS` from ../src/path.js; `SPRITES`, `draw`, `drawGhost` from
../src/render.js; `THEME` from ../src/theme.js.

Board facts used (the same as test/brazier.test.js's `crowdBeside`): a tower at (1, 1) has
its centre at (60, 60), beside the path's first stretch on row 2 (y = 100). A ghost at
distance 0 stands at (20, 100), within FROST's range. Quiet games are
`createGame({ waveSize: 0 })`.

- 'FROST is the third kind': `FROST.cost` is 40. `FROST.damage < LANTERN.damage`,
  `FROST.slow` is 0.5 and `FROST.slowFor >= 1` are each `true`.
  `[FROST.name, LANTERN.name, BRAZIER.name]` is `['Frost', 'Lantern', 'Brazier']`.
- 'createTower carries slow and slowFor, and other kinds slow nothing':
  `createTower(1, 1, FROST)` reads `[slow, slowFor, damage, range, cooldown]` equal to
  FROST's. `createTower(1, 1)` and `createTower(1, 1, BRAZIER)` read `[slow, slowFor]` as
  `[0, 0]`.
- 'key 3 chooses frost': `[kindForKey('3', LANTERN), kindForKey('3', BRAZIER),
  kindForKey('1', FROST)]` is `[FROST, FROST, LANTERN]`.
- 'a frost tower costs 40 and is refused when gold is short':
  `placementError(createGame({ waveSize: 0, gold: 39 }), 1, 1, FROST)` is `'gold'`.
  `placeTower` on a game with `gold: 40` is `true`, and leaves `gold` at 0 and one tower
  whose `slow` is `FROST.slow`.
- 'a ghost hit by frost covers half the distance in the next second that an unhit ghost
  covers' (acceptance 1), through `step`. There are two quiet games, A with a frost tower at
  (1, 1) and B with none, each with one `spawnEnemy`. Step each once by 1/16 s, so A's
  tower fires and A's ghost reads `slow === FROST.slow` and `slowLeft === FROST.slowFor`.
  Record both distances, then `step` each 16 times by 1/16. The ghost in B covers
  `ENEMY_SPEED`. The ghost in A covers `ENEMY_SPEED * FROST.slow`, exactly half, re-hits
  and all. That ghost stays within reach throughout and takes two hits of `FROST.damage`,
  so it is not banished.
- 'slowEnemy then a second: half the distance' (acceptance 1, the unit): `createEnemy({ id:
  1, waypoints: WAYPOINTS })`, then `slowEnemy(e, FROST.slow, FROST.slowFor)` and
  `advanceEnemy(e, WAYPOINTS, 1)`. The distance is `ENEMY_SPEED * 0.5`.
- 'after slowFor seconds without another hit, the ghost is back to full speed'
  (acceptance 2): slow a ghost, then `advanceEnemy` by `FROST.slowFor`. The distance is
  `ENEMY_SPEED * FROST.slow * FROST.slowFor`, and `[slow, slowLeft]` is `[1, 0]`. One more
  second adds exactly `ENEMY_SPEED`.
- 'a step that outlasts the slow is split where it runs out': a fresh slowed ghost and one
  `advanceEnemy(e, WAYPOINTS, FROST.slowFor + 1)`. The distance is
  `ENEMY_SPEED * FROST.slow * FROST.slowFor + ENEMY_SPEED`, and `[slow, slowLeft]` is
  `[1, 0]`.
- 'two frost hits in a row leave the speed at the factor, not its square' (acceptance 3):
  - Unit: `slowEnemy` twice, then 1 s moves `ENEMY_SPEED * 0.5`, and `slow` is
    `FROST.slow`.
  - Through `step`: a quiet game with frost at (1, 1) and one ghost, stepped by 1/16 s until
    its health is `ENEMY_HEALTH - 2 * FROST.damage` (two hits, bounded at 64 steps). `slow`
    is then `FROST.slow`, and `slowLeft` is `FROST.slowFor` less the 1/16-s ticks since the
    second hit.
- 'a refreshed slow restarts its time left': slow a ghost, advance 1 s, slow it again.
  `slowLeft` is `FROST.slowFor`.
- 'only frost slows': a quiet game with a lantern at (1, 1) and one ghost, stepped once.
  The ghost's `[slow, slowLeft]` is `[1, 0]`.
- 'draw gives a frost tower its own sprite and no lantern pool': with the sprite-counting
  table from test/brazier.test.js extended by `drawFrost`, a game with one FROST tower
  draws counts `{ drawLanternLight: 0, drawLanternBody: 0, drawBrazier: 0, drawFrost: 1 }`.
  `SPRITES.drawFrost` is a function.
- 'the frost sprite and a slowed ghost paint in their own THEME tokens': a recording
  context records each fill with its `fillStyle`.
  - `SPRITES.drawFrost(ctx, createTower(1, 1, FROST))` fills first in `THEME.frostBody`, then
    `THEME.frostCore`.
  - `drawGhost` on a ghost with `slowLeft > 0` fills its body in `THEME.ghostSlowed`. The
    same ghost with `slowLeft: 0` fills it in `THEME.ghostBody`.
- 'the HUD names the kind draw is handed': `draw(ctx, createGame(), null, SPRITES, FROST)`
  writes texts ending `['Wave', '1 / 10', 'Tower', 'Frost', 'Pause', '1x']`. 'Tower' is in
  `hudMuted` and 'Frost' in `hudInk`, both at y `HUD_HEIGHT / 2`. Handed LANTERN, the bar
  reads 'Lantern'.

Red against the base: `FROST` and `slowEnemy` are not exported.

### 2. test/brazier.test.js: the one assertion the issue changes

In 'key 1 chooses the lantern, key 2 the brazier, and any other key keeps the kind chosen',
the expected list `[LANTERN, BRAZIER, BRAZIER, LANTERN]` becomes
`[LANTERN, BRAZIER, FROST, LANTERN]`, and `FROST` joins the import from ../src/tower.js.
The test's name becomes 'key 1 chooses the lantern, key 2 the brazier, key 3 frost, and any
other key keeps the kind chosen'. No other line changes. This edit is red until step 3
lands, and is committed with step 1.

### 3. src/tower.js and src/enemy.js: the kind and the slow

src/tower.js:
- Each kind gains a `name`: `LANTERN.name = 'Lantern'` and `BRAZIER.name = 'Brazier'`.
- `export const FROST = { name: 'Frost', range: 90, cooldown: 0.8, damage: 0.5, slow: 0.5,
  slowFor: 2, cost: 40 }`, with a trailing unit comment like the others' (pixels, seconds,
  health, factor, seconds, gold).
- `kindForKey`: `if (key === '3') return FROST;`. Its comment and the header comment name
  frost.
- `createTower` adds `slow: kind.slow ?? 0, slowFor: kind.slowFor ?? 0`. A kind with no slow
  slows nothing.

src/enemy.js:
- `createEnemy` adds `slow: 1, slowLeft: 0`, meaning full speed and no slow running.
- `export function slowEnemy(enemy, factor, duration)` sets `enemy.slow = factor` and
  `enemy.slowLeft = duration`. It sets the factor and never multiplies, so a second hit
  refreshes the time and leaves the speed at the factor. It mutates and returns the enemy.
- `advanceEnemy`: `const slowed = Math.min(dt, enemy.slowLeft ?? 0);` then
  `enemy.distance = Math.min(end, enemy.distance + enemy.speed * ((enemy.slow ?? 1) *
  slowed + (dt - slowed)))`, `enemy.slowLeft = (enemy.slowLeft ?? 0) - slowed`, and once
  `slowLeft` is 0, `enemy.slow = 1`. A step that outlasts the slow is split where it runs
  out. An unslowed ghost moves `speed * (1 * 0 + dt)`, exactly `speed * dt`, so
  test/path.test.js holds to the bit. The `?? ` defaults keep ghosts that tests build by hand
  working. The header comment says ghosts drift at their speed, slowed while frost holds
  them.

### 4. src/game.js: a frost hit slows

In `tick`, after `damageEnemy` decides `dead`: `if (tower.slow > 0) for (const enemy of hit)
if (!dead.includes(enemy)) slowEnemy(enemy, tower.slow, tower.slowFor);`. `slowEnemy` is
imported from ./enemy.js. A comment says that a hit sets the slow and restarts its time,
and never deepens it. A splash-less frost tower hits its target alone, as the lantern does.

### 5. src/theme.js: the frost tokens

Under a `// frost tower and a slowed ghost (no artboard yet: icy tones beside the board's)`
heading: `frostBody: '#7fc8e8'`, `frostCore: '#e6f7ff'`, and
`ghostSlowed: 'rgba(127, 200, 232, 0.93)', // #7fc8e8 at 0.93, the ghost body's opacity`.

### 6. src/render.js: the frost sprite, the tint and the kind in the HUD

- `drawFrost(ctx, { x, y })` is the frost tower's placeholder, on the brazier's pattern: a
  diamond, filled `THEME.frostBody` (a `TILE * 0.6` square rotated 45° about the centre),
  with a `THEME.frostCore` square core. It is added to `SPRITES`.
- `draw`: the pool loop casts a pool only for a lantern, and the body loop chooses
  `tower.splash > 0` → `drawBrazier`, `tower.slow > 0` → `drawFrost`, else
  `drawLanternBody`. A small private `isLantern(tower)` keeps the two loops agreeing. The
  comment above `draw` names frost.
- `drawGhost`: the body fills `enemy.slowLeft > 0 ? THEME.ghostSlowed : THEME.ghostBody`.
  The comment says that a slowed ghost is tinted frost.
- `draw(ctx, state, hover, sprites = SPRITES, kind = null)`: the kind goes last, so every
  existing call is unchanged. `drawHud(ctx, hudModel(state), kind)`.
- `drawHud` draws one more label and value pair after Wave, only when handed a kind:
  'Tower' in `hudMuted` at x 300, then `kind.name` in `hudInk` at x 348. That stays clear
  of the Pause button at x 504, at fixed offsets, with no text measured. With no kind it
  draws exactly what it draws today, so test/hud.test.js and test/render.test.js hold
  unedited. src/hud.js and `hudModel` are untouched: the kind is the player's selection,
  held in main.js, not game state.
- No colour literal is added (test/render.test.js 'src/render.js holds no colour literal'
  passes).

### 7. src/main.js: the HUD names the kind from boot

- The frame calls `draw(ctx, state, hover, SPRITES, kind)`, with `SPRITES` imported from
  ./render.js. `kind` starts as LANTERN, so the first frame reads 'Tower Lantern'. This is
  the review's P1: the current kind, never a null.
- The comments on `kind` and on keydown say that 1, 2 and 3 choose lantern, brazier and
  frost.

### 8. test/pause-speed.test.js: the amended helper and the key-3 wiring

- `hudAt(gold, pause, speed, kind = 'Lantern')` returns `['Lives', …, 'Wave',
  `1 / ${TOTAL_WAVES}`, 'Tower', kind, pause, speed]`. Each existing call stays as written,
  and its assertion still proves the same thing, with the boot kind in the bar.
- A new test, 'the HUD names the kind from boot, and 1, 2 and 3 change it': booted, the
  first frame is `hudAt(START_GOLD)`. After `key('3')` it is `hudAt(START_GOLD, 'Pause',
  '1x', 'Frost')`, and after `key('2')` it reads 'Brazier'. A click on row 0 after `key('3')`
  then reads gold `START_GOLD - FROST.cost`.

### 9. Green

`node --test test/frost.test.js test/brazier.test.js test/pause-speed.test.js
test/path.test.js test/hud.test.js test/render.test.js test/enemy.test.js test/game.test.js
test/game-over.test.js test/gold.test.js test/tower-cost.test.js test/range-preview.test.js`
runs the reproducer, the two edited suites, the locked reproducer, and every unedited suite
that calls `draw`, `step`, `createEnemy` or `advanceEnemy`. Then `npm --prefix . run test`
runs once, the line's named check. The whole suite also runs on the pull request's required
checks.

## Acceptance

`npm --prefix . run test` passes, with test/frost.test.js committed red first and green
after, and test/path.test.js green and unedited. Each of the issue's criteria is proven:

- A ghost hit by a frost tower covers exactly half the distance in the next second that an
  unhit ghost covers, through `step` and through `advanceEnemy`.
- After `slowFor` seconds without another hit, the ghost is back to full speed, including
  when one step outlasts the slow.
- Two frost hits leave the speed at 0.5, not 0.25.
- FROST's `cost` is 40, and with 39 gold `placementError` returns `'gold'`.
- Key 3 selects frost (test/brazier.test.js's one changed assertion).
- Frost and slowed ghosts draw in their own THEME tokens.
- The HUD names the selected kind from boot, through src/main.js (the review's P1).
