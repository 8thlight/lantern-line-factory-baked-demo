# Plan: a boss ghost every fifth wave (print line-factory-baked-demo-lbn)

GitHub issue #16 (triaged as #52), bead lantern-line-factory-baked-demo-lbn. Waves 5 and
10 each send one boss: a single ghost with its own health, a slower speed and a bounty
several times 5. A boss that leaks costs three lives, it is drawn larger, and the HUD
announces a boss wave. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-lbn/triage.md: read. It carries the issue, the
  brief, the signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no docs/changes/line-factory-baked-demo-lbn/spec.md
  and none anywhere in the tree, so nothing is read from it. The triage's brief and lists
  stand in for it, as they did for prints 36, 42 and 47.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The base: the print branch was cut at 6658250, before waves, gold, the HUD and the frost
  tower existed. There, src/waves.js, src/hud.js and test/waves.test.js did not exist, so the
  triage's account did not match the tree. This plan's branch takes main in at bb2ddcf
  (print 47: fix (#48)), cleanly and with no conflict. The account below is checked against
  that base.
- I checked the triage's claims against that base. All are true:
  - src/waves.js exports `WAVES`, ten entries of exactly `{ count, interval, health, speed }`.
  - In src/game.js, `waveEntry` gives every ghost of a wave the entry's health and speed
    through `spawnEnemy`. `createSpawner` builds the wave's spawner from `createWave` in
    src/wave.js. A game holding more waves than the table repeats the last entry.
  - In src/enemy.js, `createEnemy` defaults `bounty` to `ENEMY_BOUNTY` (5), and already takes
    `health`, `speed` and `bounty`. So src/enemy.js needs no change and stays untouched.
  - `leakEnemies` takes exactly one life per ghost that reaches the end.
  - `hudModel` in src/hud.js returns `{ lives, gold, wave, totalWaves, paused, speed,
    livesDanger }`. `drawHud` and `drawGhost` in src/render.js know nothing of a boss.
  - test/waves.test.js pins each entry's keys to exactly count/health/interval/speed, and
    'clearing the last entry wins the round' expects `1000 - total` lives, one per ghost.
- One claim the triage does not make, which the build would meet: test/hud.test.js 'hudModel
  on a new game' `deepEqual`s the whole model, seven keys exactly. A boss-wave flag in the
  model turns it red. See '## Touches amendment'.
- Source read: src/waves.js, src/wave.js, src/game.js, src/enemy.js, src/hud.js,
  src/render.js, src/theme.js. Tests read: test/waves.test.js, test/hud.test.js,
  test/render.test.js, test/game-over.test.js, test/gold.test.js, test/pause-speed.test.js,
  test/wave.test.js. Also read: tests/architecture/assertion_baseline.json (javascript
  `negative-assertion-unpaired: 0`, `substring-binding: 0`) and .hydraflow/layout.yaml
  (test paths `test/**`).
- Design read: design/hud.md, design/screens.yaml, and design/screens/ (the Board, Main and
  HudStates artboards). No artboard draws a boss or a boss-wave announcement. The boss is
  the Board artboard's ghost symbol, scaled up. The announcement uses only design/hud.md's
  tokens (`--hud-bg`, `--hud-danger`, `--hud-font`), which are THEME's `hudBg`, `hudDanger`
  and the bar's font. No new colour is added.

## Who meets it

- person: the player, in a round in play on the Main artboard (design/screens/Main.png,
  source design/screens/Main.dc.html). From the moment wave 5 or wave 10 starts until it is
  cleared, a "Boss wave" banner sits just under the HUD bar. The wave's ordinary ghosts come
  first, then one boss: a ghost drawn 1.6 times the size, slower, and many hits tougher.
  Banishing it pays its declared gold. Letting it reach the end costs three lives. No
  artboard draws a boss yet, so Main is the screen it is played on.

## Refusals

- none: this change refuses nothing new. It adds a ghost, a bounty, a leak cost and a
  banner. No action of the player's or an agent's is turned down, and placement keeps its
  existing reasons.

## Touches amendment

- reason: the signed list cannot hold the HUD's boss-wave flag. The acceptance criterion
  asks that "the HUD model flags a boss wave", so `hudModel` gains `bossWave`.
  test/hud.test.js 'hudModel on a new game' `deepEqual`s the model's whole object, exactly
  `{ lives, gold, wave, totalWaves, paused, speed, livesDanger }`. That turns it red unless
  the expected object gains `bossWave: false`. That one property is the only edit to the
  file, and the test still proves what it proved: the whole model of a new game.
  `reproduces:` locks only test/boss.test.js, which this print writes red first, so no
  locked test is edited.

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

`reproduces:` stays as signed: test/boss.test.js, new and written red first.

Every other suite stays unedited and must pass as it stands. I checked each one that
reaches what changes:
- test/render.test.js, test/hud.test.js's drawing tests, test/frost.test.js and
  test/pause-speed.test.js pin the bar's whole text list, but only in wave 1. The banner is
  drawn only in a boss wave, so those lists hold.
- test/game-over.test.js's `WALK` reads `WAVES.map((w) => w.speed)`, the entries' own
  speeds, which are unchanged. None of its games reaches wave 5.
- test/gold.test.js spawns with `spawnEnemy` in wave 1. Its bounties stay 5.
- test/pause-speed.test.js `deepEqual`s two games' spawners built the same way. Both carry
  the same `boss: null`.
- render.test.js's drawGhost test draws an ordinary ghost. Its scale and bar are unchanged.

## Build order (red first, then green)

Every new check is an exact `equal`/`deepEqual`, with booleans asserted as `equal(…, true)`.
No `notEqual`, `notDeepEqual`, `ok(!…)`, `doesNotMatch` or substring match is written, so
the assertion baseline cannot rise.

### 1. Reproducer: test/boss.test.js, committed red

Imports `WAVES` from ../src/waves.js; `BOSS_LIVES`, `START_GOLD`, `START_LIVES`,
`createGame`, `placeTower`, `spawnBoss`, `step` from ../src/game.js; `damageEnemy` from
../src/enemy.js; `WAYPOINTS`, `pathLength` from ../src/path.js; `LANTERN` from
../src/tower.js; `hudModel` from ../src/hud.js; `BOSS_SCALE`, `draw`, `drawGhost` from
../src/render.js; `THEME` from ../src/theme.js. It uses a recording context like
test/render.test.js's.

- 'waves 5 and 10 declare a boss, and waves 1 to 4 none': `WAVES.map((w) => w.boss !==
  undefined)` is `[false, false, false, false, true, false, false, false, false, true]`.
  Each declared boss's `Object.keys(...).sort()` is `['bounty', 'health', 'speed']`. For
  each boss, `[boss.health > 4 * entry.health, boss.speed < entry.speed, boss.bounty >= 3 *
  5]` is `[true, true, true]`.
- 'waves 5 and 10 each spawn exactly one boss, and waves 1 to 4 none' (acceptance 1):
  `createGame({ lives: 1000 })` is stepped by 0.5 s until it is not `playing` (bounded at
  20000 steps). After each step it records every ghost on the board by id, as `[wave when
  first seen, boss === true]`. Bosses counted per wave 1..10 are `[0, 0, 0, 0, 1, 0, 0, 0,
  0, 1]`. Ordinary ghosts per wave equal each entry's `count`.
- 'a boss has the health and speed its entry declares' (acceptance 2): in that same run,
  each boss seen reads `[health, maxHealth, speed, bounty, boss]` equal to `[b.health,
  b.health, b.speed, b.bounty, true]`, where `b` is its wave's entry's `boss`. Unit form:
  `spawnBoss(game)` on a `createGame({ waveSize: 0 })` with `game.wave = 5` gives the same.
- 'a boss comes last in its wave': in that run, the wave-5 boss's id is the highest of
  wave 5's ids.
- 'a boss takes its health in hits of 1 to banish': `damageEnemy(boss, 1)` returns `false`
  `health - 1` times and `true` on the next. The list of returns is exactly that.
- 'banishing a boss adds its declared gold' (acceptance 3): a quiet game at wave 5. Place a
  lantern at (1, 1), then `spawnBoss`, with the boss's `speed = 0` so it stays at (20, 100)
  in reach. Step by `LANTERN.cooldown` until `kills === 1` (bounded). The steps taken equal
  `WAVES[4].boss.health / LANTERN.damage`. Gold is `START_GOLD - LANTERN.cost +
  WAVES[4].boss.bounty`.
- 'a boss reaching the end removes three lives' (acceptance 3): a quiet game at wave 5 with
  one `spawnBoss`, stepped `pathLength(WAYPOINTS) / boss.speed + 0.1`. `[lives,
  enemies.length]` is `[START_LIVES - 3, 0]`, and `BOSS_LIVES` is 3. A boss and an ordinary
  ghost leaking together cost 4.
- 'the HUD model flags a boss wave' (acceptance 4): `hudModel(createGame()).bossWave` is
  `false`. A `createGame({ totalWaves: 10, lives: 1000 })` stepped until `wave === 5` reads
  `true`. Once wave 6 starts it reads `false` again. A game of more waves than the table
  repeats the last entry, boss included (step 3).
- 'draw announces a boss wave and draws the boss larger': `draw` on a wave-5 game writes
  'Boss wave' in `THEME.hudDanger`. On a wave-1 game it does not, and the texts are exactly
  the bar's. `drawGhost` on a boss records `scale` with `GHOST_SCALE * BOSS_SCALE`, compared
  as the first `scale` call's args equal to an ordinary ghost's times `BOSS_SCALE`.

Red against the base: `spawnBoss`, `BOSS_LIVES` and `BOSS_SCALE` are not exported, and no
entry has a `boss`.

### 2. test/waves.test.js: the two tests the boss changes

- 'the table holds ten waves, …': the keys check becomes: an entry with a boss has
  `['boss', 'count', 'health', 'interval', 'speed']`, and every other entry exactly
  `['count', 'health', 'interval', 'speed']`. The four positive checks stay as written.
  It still proves that no entry carries an unknown key.
- 'clearing the last entry wins the round': `total` becomes `WAVES.reduce((sum, w) => sum
  + w.count + (w.boss ? BOSS_LIVES : 0), 0)`, with `BOSS_LIVES` imported from
  ../src/game.js. It still proves the round is won on the last entry, with every life lost
  to a leak counted.

No other line changes. Both are red until step 3 lands, and they are committed with step 1.

### 3. src/waves.js and src/game.js: the boss in the table and the game

src/waves.js: entries 5 and 10 gain a `boss`. The header comment says that every fifth
wave ends on one boss of its own health, speed and bounty.
- Wave 5: `boss: { health: 40, speed: 40, bounty: 30 }`, 8 times the wave's health, about
  half its speed, 6 times a ghost's 5.
- Wave 10: `boss: { health: 80, speed: 50, bounty: 50 }`, 10 times the wave's health and 10
  times a ghost's 5.
- The escalation test reads only `count`, `health` and `speed`, so it holds.

src/game.js:
- `export const BOSS_LIVES = 3; // lives a boss takes when it reaches the end`.
- `createSpawner` builds `{ ...createWave({ count: n + (entry.boss ? 1 : 0), interval }),
  boss: entry.boss ?? null }`, where `n` is `waveSize ?? entry.count`. The boss is one more
  ghost on top of the wave's own count, including with an explicit `waveSize`.
  src/wave.js is unchanged.
- `export function spawnBoss(state, boss = waveEntry(state.wave).boss)`: `createEnemy` with
  the boss's `health`, `speed` and `bounty`, then `enemy.boss = true`, pushed and returned.
  src/enemy.js is unchanged.
- In `tick`, the spawn loop knows which slot each due ghost fills. `first = spawner.spawned
  - due`, and the slot `spawner.count - 1` of a spawner with a `boss` is `spawnBoss`;
  every other slot is `spawnEnemy`. The boss comes last, after the wave's ghosts, even in a
  backlog. So waves.test's 'more waves than the table' still finds an ordinary ghost at
  `enemies.at(-1)` after its first step.
- `leakEnemies` takes `e.boss ? BOSS_LIVES : 1` for each leaked ghost, never below 0, and
  still returns how many ghosts leaked. Its comment says so.
- A game holding more waves than the table repeats the last entry whole, boss included.

### 4. src/hud.js: the boss-wave flag

`hudModel({ …, spawner })` adds `bossWave: Boolean(spawner?.boss)`, true for the whole of
a wave whose entry declares a boss. The `?.` keeps hand-built states working. The comment
names it. Other fields are unchanged.

### 5. test/hud.test.js: the amended expectation

'hudModel on a new game' gains `bossWave: false` in its expected object. No other line
changes.

### 6. src/render.js: the larger boss and the announcement

- `export const BOSS_SCALE = 1.6;` beside `GHOST_SCALE`. `drawGhost` scales by
  `GHOST_SCALE * (enemy.boss ? BOSS_SCALE : 1)`, and lifts its health bar to `y - 29 *` that
  same factor. The bar stays 26 wide, so the drawGhost test in render.test.js holds. The
  comment says a boss is the same ghost, drawn larger.
- `drawHud` reads `bossWave`. When it is true, it draws a banner centred under the bar: a
  `THEME.hudBg` rounded rect `BOSS_BANNER = { width: 120, height: 28 }` at `y = HUD_HEIGHT +
  HUD_PAD`, and 'Boss wave' in `THEME.hudDanger`, centred in it. With `bossWave` false it
  draws exactly what it draws today. No colour literal is added (render.test.js 'src/render.js
  holds no colour literal' passes).

### 7. Green

`node --test test/boss.test.js test/waves.test.js test/hud.test.js test/render.test.js
test/game-over.test.js test/gold.test.js test/pause-speed.test.js test/frost.test.js
test/game.test.js test/wave.test.js` runs:
- the reproducer and the two edited suites;
- every unedited suite that calls `draw`, `step`, `spawnEnemy`, `leakEnemies` or `hudModel`,
  or reads `WAVES`.

Then `npm --prefix . run test` runs once, the line's named check. The whole suite also runs
on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes, with test/boss.test.js committed red first and green
after. test/waves.test.js is changed only where the boss changes the table's shape and the
lives lost, and test/hud.test.js only by the model's new key. Each of the issue's criteria
is proven:

- Waves 5 and 10 each spawn exactly one boss, and waves 1 to 4 none.
- A boss has the health and speed its entry declares, and takes that many hits of 1 to
  banish.
- Banishing a boss adds its declared gold, and a boss reaching the end removes three lives.
- The HUD model flags a boss wave, and render announces it and draws the boss larger.
