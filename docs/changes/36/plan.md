# Plan: earn gold for each ghost defeated (print 36)

Fast follower of print line-factory-baked-demo-qxi (GitHub issue #8, task
work/m3-01-gold-per-kill.md), which was retired as a train-wreck: its locked reproducer
assumed one-hit kills and a spawner quieted with `spawnTimer = Infinity`, and main has since
moved to 3-health ghosts and wave spawning. This is the re-cut against main's semantics.
Class: fix.

## Inputs verified

- docs/changes/36/triage.md: read. It carries the brief, the signed `touches:` and
  `reproduces:` lists and the acceptance criterion. This plan works inside that `touches:`
  list and amends nothing.
- spec.md: not present in the worktree (no docs/changes/36/spec.md, and none anywhere in the
  tree). Nothing is read from it; the triage's brief and lists stand in for it.
- plan/research.md: not present in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers the whole brief.
- The base: this branch already holds main at 62a48eb (commit fc85d06 took it in), so src/ and
  test/ are main's: `ENEMY_HEALTH = 3`, `createWave`/`updateWave` spawning, the `BRAZIER` with
  `splash: 40`, and `towerAt`/`rangePreview` in src/game.js. No merge is needed before build.
- Source read: src/game.js, src/enemy.js, src/tower.js, src/path.js, src/render.js (it draws
  only `Lives: N`; no gold); test/game.test.js, test/game-over.test.js, test/brazier.test.js,
  test/path.test.js; tests/architecture/assertion_baseline.json
  (`negative-assertion-unpaired: 0`).
- Work and design read: work/m3-01-gold-per-kill.md (the issue, word for word),
  work/m3-02-tower-cost.md (the next consumer of `state.gold`), design/screens.yaml,
  design/hud.md.

## Who meets it

- none: no screen shows gold yet. design/screens.yaml lists work/m3-01-gold-per-kill.md under
  no artboard, src/render.js draws only `Lives: N`, and the HUD that shows gold
  (design/screens/Main.dc.html, design/hud.md) is work/m4-01-hud.md, outside this print. The
  change is game state alone; the first thing to read `state.gold` is `placeTower` in
  work/m3-02-tower-cost.md.

## Refusals

- none: this change refuses nothing new; gold only rises (by each dead ghost's bounty) and is
  never spent here, a leaked ghost simply pays nothing, and placing a tower is not yet limited
  by gold (that refusal, `'gold'` from `placementError`, belongs to work/m3-02-tower-cost.md).

## Touches

As signed in triage.md, unchanged:

- src/game.js
- src/enemy.js
- test/gold.test.js (new)

`reproduces:` stays as signed: test/game.test.js is run and not edited. No other path
changes; every existing suite stays unedited and must pass as it stands. Adding `gold` to
the state and `bounty` to a ghost breaks no existing test: no test `deepEqual`s a whole game
state or a whole ghost (test/game-over.test.js's `snapshot` picks named fields;
test/brazier.test.js's `deepEqual(game.enemies, [])` compares an empty list).

## Build order (red first, then green)

### 1. The reproducer: test/gold.test.js, committed red

Written and committed before any source change. Imports `START_GOLD`, `createGame`,
`placeTower`, `restart`, `spawnEnemy`, `step` from ../src/game.js, `WAYPOINTS`,
`pathLength` from ../src/path.js, `ENEMY_SPEED`, `createEnemy` from ../src/enemy.js, and
`LANTERN`, `BRAZIER` from ../src/tower.js.

Board facts used (the same as test/brazier.test.js's `crowdBeside`): a tower at (1, 1) has
centre (60, 60), beside the path's first stretch on row 2 (y = 100); a ghost at distance 0,
10 or 20 stands at x = 20, 30 or 40 on that stretch, within a lantern's 100 and a brazier's
80 of (60, 60), and within the brazier's 40 splash of each other. Quiet games are
`createGame({ waveSize: 0 })`, so no wave ghost ever arrives.

A helper `ghostsBeside(game, n)` spawns `n` ghosts with `spawnEnemy`, at distances 0, 10, …,
each set to `health = maxHealth = 1` so one hit banishes it (main's 3-health ghost otherwise
takes three lantern shots).

- 'a new game starts with 50 gold': `assert.equal(START_GOLD, 50)`,
  `assert.equal(createGame().gold, 50)`, and `createGame({ gold: 7 }).gold` is 7.
- 'every ghost carries a bounty of 5 unless made with another':
  `createEnemy({ id: 1, waypoints: WAYPOINTS }).bounty` is 5; with `bounty: 8` it is 8; and
  `spawnEnemy(createGame({ waveSize: 0 })).bounty` is 5.
- 'killing one ghost with bounty 5 raises gold by exactly 5': quiet game, `placeTower(game,
  1, 1, LANTERN)` is `true`, one ghost from the helper, `step(game, 0.01)`;
  `assert.deepEqual([game.kills, game.enemies.length, game.gold], [1, 0, 55])`.
- 'a ghost that takes three lantern shots pays its bounty once, on the shot that banishes
  it': quiet game, a lantern at (1, 1), one `spawnEnemy` at full health with distance held at
  0 (the test sets `ghost.speed = 0` so it stays in range); steps of `LANTERN.cooldown` until
  `kills` is 1, recording gold after each step; the record is `[50, 50, 55]` (gold unchanged
  after the first two hits, +5 on the third). Pins that gold is paid on death, not per hit.
- 'a ghost reaching the end leaves gold unchanged': quiet game with no towers, one
  `spawnEnemy`, `step(game, pathLength(WAYPOINTS) / ENEMY_SPEED + 0.1)`;
  `assert.deepEqual([game.lives, game.enemies.length, game.gold], [START_LIVES - 1, 0, 50])`
  (`START_LIVES` imported too). An exact equality, not a negative assertion, so the
  assertion baseline does not rise.
- 'two ghosts killed in the same step each pay their bounty exactly once': quiet game,
  `placeTower(game, 1, 1, BRAZIER)` is `true`, two ghosts from the helper, `step(game,
  0.01)`; `assert.deepEqual([game.kills, game.enemies.length, game.shots.length, game.gold],
  [2, 0, 1, 60])`: one shot, one splash, two kills, gold up by 10. A further
  `step(game, 0.01)` leaves gold at 60 (no ghost pays twice).
- 'a ghost pays its own bounty': quiet game, a lantern at (1, 1), one ghost from the helper
  with `bounty = 12`; after `step(game, 0.01)` gold is 62.
- 'restart puts gold back to the game's start': `createGame({ waveSize: 0, gold: 20 })`,
  a lantern at (1, 1), one ghost from the helper, one step (gold 25); `restart(game).gold` is
  20, the gold it was made with.

Red against the base: `START_GOLD` is not exported, the state has no `gold`, and a ghost has
no `bounty`.

### 2. src/enemy.js

- `export const ENEMY_BOUNTY = 5; // gold paid when a ghost is banished`, beside
  `ENEMY_HEALTH`.
- `createEnemy` takes `bounty = ENEMY_BOUNTY` in its options and returns it on the ghost,
  beside `health` and `maxHealth`.
- The header comment adds that a ghost pays its bounty when banished.

### 3. src/game.js

- `export const START_GOLD = 50;` beside `START_LIVES`.
- `createGame` takes `gold = START_GOLD` among its options, keeps it in `options` (so
  `restart` makes a game with the same starting gold), and sets `gold` on the state beside
  `lives` and `kills`.
- In `step`'s dead-ghost branch, beside `state.kills += dead.length`:

      state.gold += dead.reduce((sum, e) => sum + e.bounty, 0);

  `dead` holds each ghost once (a splash takes in its own target, and `hit` comes from
  `splashTargets` or `[target]`), and the dead are removed from `state.enemies` in the same
  branch, so no later tower in the step can kill and pay for them again. The comment above
  the branch says each kill is counted and paid once.
- `leakEnemies` is unchanged: a ghost reaching the end pays nothing.

### 4. Green

`node --test test/gold.test.js test/game.test.js test/game-over.test.js test/brazier.test.js`
(the new file, the `reproduces:` lock, and the two suites that step games with kills or
snapshot state), then `npm --prefix . run test` once, the line's named check. The whole suite
also runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes with test/gold.test.js proving: a new game starts with 50
gold; killing one ghost with bounty 5 raises gold by exactly 5, paid on the hit that banishes
it; a ghost reaching the end leaves gold unchanged; two ghosts killed in the same step by one
splash raise gold by exactly 10; and test/game.test.js passes unedited.
