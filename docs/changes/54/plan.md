# Plan: a boss ghost every fifth wave (print 54)

This print follows print line-factory-baked-demo-lbn (GitHub issue #16), which the
fail-forward skill retired as a train-wreck. Its plan left the new reproducer
test/boss.test.js out of `touches:`, and the scope gate reads `touches:` alone. This print's
signed `touches:` names test/boss.test.js, so the same work fits in it. Class: fix.

## Inputs verified

- docs/changes/54/triage.md: read. It carries the issue, the brief, the signed `touches:`
  and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no docs/changes/54/spec.md and none anywhere in the
  tree, so nothing is read from it. The triage's brief and lists stand in for it, as they did
  for prints 36, 42, 47 and line-factory-baked-demo-yym.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The retired print's work: the triage says it is "green on branch
  print/line-factory-baked-demo-lbn at 744b1a8". That commit is not in this clone
  (`git cat-file -t 744b1a8`: not a valid object), and origin is a local path that does not
  exist in this container, so it cannot be fetched. This plan does not depend on it. Every
  change is spelled out below, so build can write it from scratch. If build can reach
  744b1a8, it may take that work in, but only where it matches this plan.
- The base: 664cc09 has main in at 3d433a5 (print line-factory-baked-demo-yym: upgrades), so
  no further merge is needed before build.
- I checked the triage's claims against that base:
  - True: `WAVES` in src/waves.js holds ten entries, each exactly
    `{ count, interval, health, speed }`.
  - True: in src/game.js, `waveEntry`/`createSpawner` read count and interval, and
    `spawnEnemy` gives every ghost of the wave the entry's health and speed. `createEnemy` in
    src/enemy.js defaults `bounty` to `ENEMY_BOUNTY` (5), and `tick` pays `e.bounty` per kill.
  - True: `leakEnemies` takes `leaked.length` lives, one per ghost.
  - True: `hudModel` in src/hud.js returns
    `{ lives, gold, wave, totalWaves, paused, speed, livesDanger }`. `drawHud` and `drawGhost`
    in src/render.js draw no boss.
  - True: test/waves.test.js 'the table holds ten waves…' pins each entry's keys to exactly
    count/health/interval/speed. 'clearing the last entry wins the round' expects
    `1000 - total`, one life per ghost.
- Source read: src/waves.js, src/wave.js, src/game.js, src/enemy.js, src/hud.js, and
  src/render.js (`draw`, `drawGhost`, `drawHealthBar`, `drawHud`). Tests read:
  test/waves.test.js, test/game.test.js, test/game-over.test.js, test/hud.test.js, and the
  test names and uses of WAVES, spawner and hudModel across test/. The knowledge vault's
  inbox note on print lbn says a new reproducer must stay in `touches:`, and this one does.
  .hydraflow/layout.yaml gives test paths `e2e/**`, `test/**`.
- Design read: design/hud.md, design/screens.yaml, and the design/screens/ list. No artboard
  draws a boss or a boss-wave announcement. The announcement uses the HUD's existing
  `--hud-danger` token (THEME.hudDanger), and the boss sprite is the ghost symbol drawn
  larger. No new colour is added.

## Who meets it

- person: the player, in a round in play on the Main artboard (design/screens/Main.png,
  source design/screens/Main.dc.html). When wave 5 starts, the HUD bar reads "Boss wave" in
  the danger red beside the wave counter, and it stays there until wave 6. The wave's ghosts
  come as before, and then one large ghost comes last. It is slower and takes many more hits
  to banish. Banishing it pays 30 gold. If it reaches the gate, it costs three lives. Wave 10
  does the same with a tougher boss. No artboard draws a boss yet, so Main is the screen it
  is played on.

## Refusals

- none: this change refuses nothing new. It adds a ghost and a HUD flag. No player action
  gains a reason to be turned down, and no new function returns a refusal.

## Touches

The signed list holds the whole change, so it is not amended:

touches:
  - src/waves.js
  - src/game.js
  - src/hud.js
  - src/render.js
  - test/boss.test.js
  - test/waves.test.js
  - test/hud.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with
`node --test`.

`reproduces:` stays as signed: test/game.test.js. It is run and not edited, and it must
pass. Its quiet games (`waveSize: 0`) and its wave 1 and 2 games never reach a boss wave, and
`spawnEnemy` stays a plain ghost, so every one of its tests holds. test/boss.test.js is new,
so it is written red first.

src/enemy.js is not in `touches:` and needs no change. `createEnemy` already takes `health`,
`speed` and `bounty`, and game.js sets `boss: true` on the ghost it returns.

Every other suite stays unedited and must pass as it stands. I checked each one:
- test/game-over.test.js only plays waves 1 and 2. Its `WALK` reads `w.speed` and never
  `boss`, and that is safe: its tests only walk ghosts of waves 1 and 2.
- test/pause-speed.test.js boots at wave 1. Its HUD text lists stay exact, because the bar
  draws "Boss wave" only on a boss wave. Its `view` compares two games built the same way.
- test/render.test.js draws fresh games (wave 1) and hand-built ghosts with no `boss`, which
  draw at today's scale.

## Build order (red first, then green)

Every new check is an exact `equal`/`deepEqual`, with booleans asserted as `equal(…, true)`.
No `notEqual`, `notDeepEqual`, `ok(!…)` or `doesNotMatch` is written, so the assertion
baseline (javascript `negative-assertion-unpaired: 0`) cannot rise.

### 1. Reproducer: test/boss.test.js, committed red

Imports `WAVES` from ../src/waves.js; `BOSS_LIVES`, `createGame`, `spawnBoss`, `spawnEnemy`,
`step` from ../src/game.js; `ENEMY_BOUNTY`, `damageEnemy` from ../src/enemy.js; `WAYPOINTS`,
`pathLength` from ../src/path.js; `hudModel` from ../src/hud.js; `draw`, `drawGhost` from
../src/render.js; `THEME` from ../src/theme.js. A helper, `atWave(n, options)`, builds
`createGame({ lives: 1000, ...options })` and sets `game.wave = n` and
`game.spawner = waveSpawner(game, n)`, using the `waveSpawner` that game.js exports
(step 3). A second helper, `spawnedIn(n)`, steps such a game by 0.25 s until the wave
number passes n or the round ends (bounded at 20000 steps). It records each ghost's
`[boss, health, speed, bounty]` the first time its id appears.

- 'waves 5 and 10 declare one boss each, and waves 1 to 4 none' (acceptance 1, the table):
  `WAVES.map((w) => w.boss !== undefined)` is
  `[false, false, false, false, true, false, false, false, false, true]`. Each `boss`'s keys,
  sorted, are `['bounty', 'health', 'speed']`.
- 'a boss is many times tougher, slower, and pays several times a ghost': for waves 5 and
  10, `boss.health >= 5 * entry.health`, `boss.speed < entry.speed` and
  `boss.bounty >= 3 * ENEMY_BOUNTY` are each `true`.
- 'waves 5 and 10 each spawn exactly one boss, last, and waves 1 to 4 none' (acceptance 1,
  through `step`): for n in 1 to 4, `spawnedIn(n)` holds no ghost with `boss` true, and
  `entry.count` ghosts in all. For n of 5 and 10, it holds exactly one boss, as the last
  ghost spawned, after `entry.count` plain ghosts.
- 'the boss has its entry's health and speed' (acceptance 2): in `spawnedIn(5)` and
  `spawnedIn(10)`, the boss reads `[true, boss.health, boss.speed, boss.bounty]`. Through
  the unit, `spawnBoss(atWave(5))` has `[health, maxHealth, speed, bounty, boss]` equal to
  `[b.health, b.health, b.speed, b.bounty, true]`.
- 'a boss takes its health in hits of 1 to banish' (acceptance 2): `spawnBoss(atWave(5))`,
  then `damageEnemy(boss, 1)` called `b.health - 1` times. Each call returns `false`, so the
  list of results equals `Array(b.health - 1).fill(false)`. One more returns `true`.
- 'banishing a boss pays its declared gold' (acceptance 3): a quiet `atWave(5, { waveSize:
  0, gold: 0 })`. `spawnBoss`, then set its health to 1 and place a lantern beside the
  path's start at (1, 1). Step by 1/16 s until the boss is gone (bounded at 64 steps).
  `[gold, kills]` is `[WAVES[4].boss.bounty, 1]`.
- 'a boss reaching the end takes three lives, a ghost one' (acceptance 3): `BOSS_LIVES` is 3.
  A quiet `atWave(5, { waveSize: 0, lives: 10 })` with one `spawnBoss` and one `spawnEnemy`,
  stepped by `pathLength(WAYPOINTS) / WAVES[4].boss.speed + 0.1`, ends with `lives` 6 and no
  enemies.
- 'a boss that takes the last lives loses the round, and lives stop at 0': a quiet
  `atWave(5, { waveSize: 0, lives: 2 })` with one `spawnBoss`, walked to the end. It reads
  `[lives, status]` as `[0, 'lost']`.
- 'the HUD model flags a boss wave': `hudModel(createGame()).bossWave` is `false`, and
  `hudModel(atWave(5)).bossWave` and `hudModel(atWave(10)).bossWave` are `true`.
  `hudModel(atWave(4)).bossWave` is `false`.
- 'the bar announces a boss wave': a recording context, the one from test/hud.test.js, with
  `draw(ctx, atWave(5), null)`. The bar's `fillText` texts end
  `['Wave', '5 / 10', 'Boss wave', 'Pause', '1x']`. 'Boss wave' is filled in
  `THEME.hudDanger` at x `HUD_BOSS_X` (420) and y `HUD_HEIGHT / 2`. Drawn on wave 4, no text
  reads 'Boss wave'.
- 'a boss is drawn larger than a ghost': `drawGhost` on a plain ghost and on a ghost with
  `boss: true`, each at the same point. Read the first `scale` call's arguments in each.
  The boss's equal the plain ghost's times `BOSS_SCALE`, and `BOSS_SCALE > 1` is `true`.

Red against the base: `spawnBoss`, `BOSS_LIVES` and `waveSpawner` are not exported, and no
entry has a `boss`.

### 2. test/waves.test.js: the two assertions the issue changes, with what each proves kept

- 'the table holds ten waves, each with a positive count, interval, health and speed': the
  keys line becomes
  `assert.deepEqual(Object.keys(wave).sort(), wave.boss ? ['boss', 'count', 'health',
  'interval', 'speed'] : ['count', 'health', 'interval', 'speed']);`. Its name gains ', and
  a boss on a boss wave'. It still proves that no entry carries a stray key.
- 'clearing the last entry wins the round': `total` becomes
  `WAVES.reduce((sum, w) => sum + w.count + (w.boss ? BOSS_LIVES : 0), 0)`, and
  `BOSS_LIVES` joins the import from ../src/game.js. It still proves the round is won on the
  last entry with exactly the lives the leaks took. Now a leaked boss counts three.
- 'a game holding more waves than the table sends the last entry again': the expected
  `last.count` becomes `last.count + 1`, because wave 11 repeats entry 10, boss and all.
  `enemies.at(-1)` after the first 0.01 s step is still a plain ghost. Its name gains ',
  boss and all'.
- No other line changes. These edits are red until step 3 lands, and they are committed with
  step 1.

### 3. src/waves.js and src/game.js: the boss

src/waves.js:
- Entry 5 becomes `{ count: 9, interval: 1.1, health: 5, speed: 75, boss: { health: 40,
  speed: 45, bounty: 30 } }`.
- Entry 10 becomes `{ count: 15, interval: 0.8, health: 8, speed: 90, boss: { health: 80,
  speed: 55, bounty: 50 } }`.
- The header comment says that every fifth wave also sends one boss, last: a single ghost
  with its own health, slower speed and bounty.

src/game.js:
- `export const BOSS_LIVES = 3; // lives a boss takes when it reaches the end`.
- `createSpawner` becomes `export function waveSpawner({ options }, wave)`. It is exported
  for the tests, and the two call sites pass `state`, or `{ options }` inside `createGame`.
  It reads `count = options.waveSize ?? entry.count` and
  `boss = count > 0 ? entry.boss ?? null : null`, then returns
  `{ ...createWave({ count: count + (boss ? 1 : 0), interval: … }), boss }`. A wave of no
  ghosts sends no boss either, so quiet games stay quiet. The comment says the boss is the
  wave's last spawn.
- `export function spawnBoss(state)` reads `waveEntry(state.wave).boss` and creates the
  ghost with `createEnemy({ id, waypoints, health, speed, bounty })`. It sets `boss: true`,
  pushes the ghost and returns it. It is only called on a wave whose entry has a boss.
- `spawnEnemy` is unchanged. Its comment notes that it sends a plain ghost.
- In `tick`: `for (let i = 0; i < due; i++) { const last = state.spawner.spawned - due + i +
  1 === state.spawner.count; if (last && state.spawner.boss) spawnBoss(state); else
  spawnEnemy(state); }`. This puts the boss on the wave's last spawn, even when a long tick
  owes a backlog.
- `leakEnemies` takes `leaked.reduce((sum, e) => sum + (e.boss ? BOSS_LIVES : 1), 0)` lives,
  never below 0, and still returns `leaked.length`. Its comment says that a boss takes
  `BOSS_LIVES`.
- A boss's kill is already paid by `tick`'s `sum + e.bounty`, so it needs no change.

### 4. src/hud.js: the boss-wave flag

- `hudModel({ lives, gold, wave, totalWaves, paused, speed, spawner })` adds
  `bossWave: Boolean(spawner?.boss)`. It is true for the whole of a boss wave, from its
  start. The `?.` keeps hand-built states working. The comment on the model names the flag.

### 5. test/hud.test.js: the model's new field

- In 'hudModel on a new game', the expected object gains `bossWave: false`. No other line
  changes. It still proves the whole model of a new game.

### 6. src/render.js: the announcement and the larger sprite

- `export const HUD_BOSS_X = 420;`. `drawHud` reads `bossWave` from the model. When it is
  true, it draws, after the kind's pair and before the buttons, `fillText('Boss wave',
  HUD_BOSS_X, HUD_HEIGHT / 2)` in `THEME.hudDanger`. At 16px it ends near x 495, which is
  clear of the "Brazier" name ending near 403 and of the Pause button at 504. No text is
  measured. Off a boss wave, it draws exactly what it draws today. The comment above
  `HUD_ITEMS` names the announcement.
- `export const BOSS_SCALE = 1.6;`. `drawGhost` scales by
  `GHOST_SCALE * (enemy.boss ? BOSS_SCALE : 1)` and draws the health bar at
  `y - 29 * (enemy.boss ? BOSS_SCALE : 1)`, so the bar clears the larger head. The comment
  says that a boss is the same ghost, drawn larger.
- No colour literal is added, so test/render.test.js 'src/render.js holds no colour literal'
  passes.

### 7. Green

`node --test test/boss.test.js test/waves.test.js test/hud.test.js test/game.test.js
test/render.test.js test/game-over.test.js test/pause-speed.test.js test/gold.test.js
test/enemy.test.js` runs the reproducer, the two edited suites, the locked reproducer, and
the unedited suites that call `step`, `hudModel`, `draw` or `drawGhost`. Then
`npm --prefix . run test` runs once, the line's named check. The whole suite also runs on the
pull request's required checks.

## Acceptance

`npm --prefix . run test` passes, with test/boss.test.js committed red first and green
after, and test/game.test.js green and unedited. Each of the issue's criteria is proven:

- Waves 5 and 10 each include exactly one boss, and waves 1 to 4 include none. This is
  proven in the table and through `step`.
- A boss has its entry's health and speed, and takes that many hits of 1 to banish.
- Banishing a boss adds its declared gold. A boss reaching the end removes three lives.
- The HUD model flags a boss wave, and the bar announces it. A boss is drawn larger.
