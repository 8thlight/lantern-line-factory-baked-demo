# Plan: a boss ghost every fifth wave (print 55)

This is a fast follower of the retired print line-factory-baked-demo-lbn, from GitHub issue #16.
Class: fix. Waves 5 and 10 each send one boss ghost after their ordinary ghosts. The boss has
its own health, a slower speed and a bounty several times 5. It takes three lives if it leaks
and is drawn larger. While it is still to come, the HUD announces the boss wave.

## Inputs verified

- docs/changes/55/triage.md: read. It carries the ask word for word, the issue's brief, the
  signed `touches:` and `reproduces:` lists, and why print line-factory-baked-demo-lbn was
  retired: its plan dropped test/boss.test.js from `touches:`.
- spec.md: not in the worktree. There is no docs/changes/55/spec.md and none anywhere in the
  tree. The triage's brief and lists stand in for it, as they did for prints 36, 42, 47 and
  line-factory-baked-demo-yym.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The retired print's work (744b1a8) and its plan (76db626) are not objects in this clone.
  This plan is written fresh from the base, 8a98dc1, which already has main's 3d433a5 merged.
- I checked the triage's claims against that base:
  - True: `WAVES` in src/waves.js is ten plain `{ count, interval, health, speed }` entries.
  - True: `spawnEnemy` in src/game.js reads `health` and `speed` from `waveEntry(state.wave)`
    and passes no bounty. `createEnemy` in src/enemy.js defaults `bounty` to
    `ENEMY_BOUNTY` (5). It already accepts a `bounty`, so src/enemy.js needs no change.
  - True: `leakEnemies` takes `leaked.length` lives, which is one per ghost.
  - True: `hudModel` in src/hud.js, and `drawHud` and `drawGhost` in src/render.js, have no
    notion of a boss.
  - True: in test/waves.test.js, 'the table holds ten waves…' pins every entry's keys to
    exactly `['count', 'health', 'interval', 'speed']`. 'clearing the last entry wins the
    round' expects `1000 - total` lives, one per ghost.
- Source read: src/waves.js, src/wave.js, src/game.js, src/enemy.js, src/hud.js and
  src/render.js (`draw`, `drawGhost`, `drawHud`). Tests read: test/waves.test.js,
  test/game.test.js and test/hud.test.js. I also grepped test/pause-speed.test.js,
  test/render.test.js and test/frost.test.js for their `fillText` and sprite-count locks.
  .hydraflow/layout.yaml gives test paths `test/**`.
- Design read: design/screens.yaml, design/hud.md, and the Main and Board artboards. No
  artboard draws a boss or a boss-wave banner. The banner uses the existing HUD tokens and the
  `--hud-bg` overlay panel that design/hud.md gives "overlay panels".
- Vault: /knowledge/0-Inbox/'A touches amendment must keep a new reproducer that the signed
  list named' is why test/boss.test.js stays in every `touches:` list below.

## Who meets it

- person: the player, in a round in play on the Main artboard (design/screens/Main.png, source
  design/screens/Main.dc.html), with ghosts drawn as on the Board artboard
  (design/screens/Board.png). When wave 5 starts, a banner under the HUD bar reads "Boss wave:
  a great ghost follows this wave". It stays until the boss appears after the wave's last
  ghost. The boss is a ghost drawn half again as large, and it is slower and much tougher. It
  pays its declared gold when banished and takes three lives if it reaches the gate. Wave 10
  does the same. Waves 1 to 4 and 6 to 9 look as they do today.

## Refusals

- none: this change refuses nothing new. The boss is sent by the wave table, not asked for by
  the player, and no call it adds can be turned down. `placementError`, `upgradeError` and
  their sentences are unchanged.

## Touches amendment

- reason: the signed list holds src/waves.js, src/game.js, test/boss.test.js and
  test/waves.test.js. The brief also asks for "a boss-wave flag that render announces when
  the wave starts" and asks that render "draws it larger". The boss-wave flag is HUD state, so
  it lives in src/hud.js beside `hudModel`. The banner and the larger ghost are canvas
  drawing, which only src/render.js does. Neither file is on the signed list. src/enemy.js
  stays off it, because `createEnemy` already takes a bounty. test/game.test.js is the signed
  `reproduces:` and is locked, so it stays off `touches:` and is not edited. It must pass as it
  stands. test/boss.test.js is new, is written red first and stays on the list.

touches:
  - src/waves.js
  - src/game.js
  - src/hud.js
  - src/render.js
  - test/boss.test.js
  - test/waves.test.js

`reproduces:` stays as signed: test/game.test.js, unedited. The boss's own red-first proof is
test/boss.test.js, which is on `touches:` above.

Every suite other than test/waves.test.js stays unedited and must pass as it stands. I checked
each lock:
- test/hud.test.js `deepEqual`s `hudModel(createGame())` to its exact seven keys. `hudModel`
  is unchanged, and the boss-wave flag gets its own function, `bossWarning(state)`.
- test/pause-speed.test.js and test/hud.test.js `deepEqual` the whole `fillText` list of a
  drawn frame in wave 1. The banner is drawn only while `bossWarning` returns a sentence, and
  it returns null in wave 1, so those lists hold.
- test/render.test.js, test/brazier.test.js and test/frost.test.js count sprite-table calls.
  A boss is still drawn by one `sprites.drawGhost` call, so the counts hold. `drawGhost` on an
  enemy with no `boss` makes exactly the calls it makes today, which the 'curved body' test
  records.
- test/hud.test.js 'hudModel does not change the state it reads' `structuredClone`s a game.
  The new spawner fields are plain data, so the clone still compares like with like.
- test/game.test.js spawns with `spawnEnemy` in wave 1 and expects one life per leak. A
  wave-1 ghost carries no `boss`, so it still costs one life.
- test/render.test.js 'src/render.js holds no colour literal' holds, because the banner and
  the boss use only THEME tokens: `hudBg`, `hudAccent` and `hudInk`.

## Build order (red first, then green)

Every new check is an exact `equal` or `deepEqual`, with booleans asserted as
`equal(…, true)`. No `notEqual`, `notDeepEqual`, `ok(!…)` or `doesNotMatch` is written, so
the assertion baseline (javascript `negative-assertion-unpaired: 0`) cannot rise.

### 1. Reproducer: test/boss.test.js, committed red

It imports `WAVES` and `BOSS_LIVES` from ../src/waves.js. From ../src/game.js it imports
`START_LIVES`, `createGame`, `placeTower`, `spawnBoss`, `spawnEnemy` and `step`. It imports
`damageEnemy` and `ENEMY_BOUNTY` from ../src/enemy.js, `bossWarning` and `BOSS_WARNING` from
../src/hud.js, `draw`, `drawGhost` and `BOSS_SCALE` from ../src/render.js, `LANTERN` from
../src/tower.js, and `WAYPOINTS` and `pathLength` from ../src/path.js. A helper
`atWave(n, options)` makes `createGame({ lives: 1000, ...options })` and steps it by 0.5 s
until `game.wave === n`.

- 'waves 5 and 10 each declare exactly one boss, and waves 1 to 4 none' (acceptance 1):
  `WAVES.map((w) => w.boss !== undefined)` is `[false, false, false, false, true, false,
  false, false, false, true]`. Each boss's keys, sorted, are `['bounty', 'health',
  'speed']`. Each boss is slower than its wave's ghosts, has at least five times their
  health, and has a bounty at least three times `ENEMY_BOUNTY`, each asserted
  `equal(…, true)`.
- 'wave 5 spawns its count of ghosts and then exactly one boss' (acceptance 1): in
  `atWave(5)`, every id seen until the wave moves to 6 is recorded with its `boss` flag.
  `[ordinary, bosses]` is `[WAVES[4].count, 1]`, and the boss is the last spawned. The same
  holds for wave 10, run until `status` is 'won'. Waves 1 to 4 record 0 bosses.
- 'a boss has the health and speed its entry declares and takes that many hits'
  (acceptance 2): in `atWave(5)`, `spawnBoss(game)` gives `[health, maxHealth, speed, bounty,
  boss]` equal to `[b.health, b.health, b.speed, b.bounty, true]`, where `b` is
  `WAVES[4].boss`. Then `damageEnemy(boss, 1)` returns false `b.health - 1` times and true on
  the next hit, so the results list is `b.health - 1` falses and then one true.
- 'banishing a boss adds its declared gold' (acceptance 3): a quiet game
  (`waveSize: 0, gold: LANTERN.cost`) places a lantern beside the path's first cell. Its wave
  is set to 5, the boss is spawned and its health set to 1, and one 0.01 s step is run. Gold
  is then `b.bounty` and `kills` is 1.
- 'a boss reaching the end costs three lives' (acceptance 3): in a quiet game set to wave 5,
  a spawned boss is stepped by `pathLength(WAYPOINTS) / b.speed + 0.1`. Lives are then
  `START_LIVES - BOSS_LIVES`, `BOSS_LIVES` is 3, and the board is empty. In the same step an
  ordinary `spawnEnemy` ghost still costs one: two leaks cost `BOSS_LIVES + 1`.
- 'the HUD announces a boss wave until its boss appears': in `createGame()`, `bossWarning`
  is null. In `atWave(5)` it is `BOSS_WARNING`, which is `'Boss wave: a great ghost follows
  this wave'`. Once the boss has spawned it is null again, and it stays null in wave 6.
- 'draw shows the banner in a boss wave and not otherwise': with a recording context,
  `draw(ctx, atWave(5), null)` writes `BOSS_WARNING` once, in `THEME.hudAccent`, below
  `HUD_HEIGHT`. `draw` on `createGame()` writes no banner text.
- 'a boss is drawn larger': on a recording context, `drawGhost` with `{ boss: true }` calls
  `scale` with `GHOST_SCALE * BOSS_SCALE` where an ordinary ghost calls `GHOST_SCALE`. Its
  health bar sits `BOSS_SCALE` times as far above it. `BOSS_SCALE` is 1.5.

It is red against the base, because `spawnBoss`, `BOSS_LIVES` and `bossWarning` are not
exported.

### 2. src/waves.js: the boss entries

- Entry 5 gains `boss: { health: 40, speed: 45, bounty: 25 }` and entry 10 gains
  `boss: { health: 80, speed: 55, bounty: 50 }`. That is 8 and 10 times their waves'
  health, slower than their waves' 75 and 90, and 5 and 10 times `ENEMY_BOUNTY`. The
  ordinary `count`, `interval`, `health` and `speed` keys are unchanged, so the escalation
  test still holds.
- `export const BOSS_LIVES = 3; // lives a boss takes when it reaches the end`.
- The header comment says every fifth wave ends with one boss, declared by its own health,
  speed and bounty.

### 3. src/game.js: spawn it once, pay it, and charge three lives

- `createSpawner` returns `{ ...createWave(…), boss: entry.boss ?? null, bossLeft:
  entry.boss ? 1 : 0 }`. `count` is still the ordinary ghosts, so `spawner.count` reads as
  it does today. The table's boss comes even when `waveSize` is overridden.
- `export function spawnBoss(state)` creates an enemy from `waveEntry(state.wave).boss`, with
  its health, speed and bounty, sets `boss: true` on it, pushes it and returns it.
- In `tick`, after the ordinary spawns, the boss is spawned once when `spawner.bossLeft > 0`,
  `waveDone(spawner)` and `spawner.timer <= 0`. So it follows the last ordinary ghost by one
  interval, and `bossLeft` becomes 0. The wave-advance condition also requires
  `bossLeft === 0`, so a wave cannot end before its boss has spawned.
- `leakEnemies` takes `BOSS_LIVES` for each leaked enemy marked `boss` and 1 for any other,
  never going below 0. It still returns the number of ghosts that leaked. The comment names
  the boss.
- `spawnEnemy` is unchanged, so an ordinary ghost still pays `ENEMY_BOUNTY`.

### 4. src/hud.js: the boss-wave flag

- `export const BOSS_WARNING = 'Boss wave: a great ghost follows this wave';`
- `export function bossWarning({ status, spawner })` returns `BOSS_WARNING` while `status`
  is 'playing' and `spawner.bossLeft > 0`. Otherwise it returns null. It reads the state and
  never writes it. `hudModel` is unchanged.

### 5. src/render.js: the banner and the larger boss

- `export const BOSS_SCALE = 1.5;` `drawGhost` scales by `GHOST_SCALE * BOSS_SCALE` when
  `enemy.boss`, and by `GHOST_SCALE` otherwise. The health bar's offset of 29 is multiplied
  by the same factor. An ordinary ghost's calls are unchanged.
- `draw` calls `drawBossBanner(ctx, text)` after `drawHud` when `bossWarning(state)` is a
  sentence. The banner is a 340 × 28 rounded rect, centred on the board's width, with its top
  at `HUD_HEIGHT + HUD_PAD`. It is filled `THEME.hudBg` and edged `THEME.hudAccent`, with the
  sentence centred in 14px system-ui in `THEME.hudAccent`. No colour literal is added.
- The comment on `draw` says the boss banner is drawn over the board, under the bar.

### 6. test/waves.test.js: brought up to date, with what each test proves kept

- 'the table holds ten waves…' still asserts ten entries, each with a positive count,
  interval, health and speed. Its keys are now `['count', 'health', 'interval', 'speed']`,
  plus `'boss'` exactly on the entries that declare one. Those entries are exactly waves 5
  and 10, and each boss has exactly `['bounty', 'health', 'speed']`, all positive. The title
  says so. The test still refuses any other key.
- 'clearing the last entry wins the round' expects lives of `1000 - total - BOSS_LIVES *
  bosses`, where `total` sums the counts and `bosses` counts the entries with a boss. It
  still pins one life per ordinary ghost.
- No other test in the file changes. 'a game holding more waves than the table…' still holds,
  because the boss comes last and `spawner.count` is the ordinary count.

### 7. Green

`node --test test/boss.test.js test/waves.test.js test/game.test.js test/hud.test.js
test/render.test.js test/pause-speed.test.js test/frost.test.js test/brazier.test.js
test/gold.test.js test/game-over.test.js` runs the reproducer, the updated table tests and
every unedited suite that calls `spawnEnemy`, `leakEnemies`, `hudModel`, `draw` or
`drawGhost`. Then `npm --prefix . run test` runs once, which is the line's named check. The
whole suite also runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/boss.test.js is committed red first and green after.
test/game.test.js is unedited, and test/waves.test.js changes only its two named tests. Each
of the issue's criteria is proven in test/boss.test.js:

- Waves 5 and 10 each include exactly one boss, and waves 1 to 4 include none.
- A boss has the health and speed its table entry declares, and takes that many hits to
  defeat.
- Defeating a boss adds its declared gold, and a boss reaching the end removes three lives.
- The HUD announces a boss wave when it starts, and the boss is drawn larger.
