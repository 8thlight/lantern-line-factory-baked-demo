# Plan: ghosts with health, spawned in waves (line-factory-baked-demo-a8h)

Beads: lantern-line-factory-baked-demo-a8h (issue #1, enemy health) and
lantern-line-factory-baked-demo-7r8 (issue #2, waves), taken together because both rewrite
`step()` in src/game.js and the same tests in test/game.test.js. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-a8h/triage.md: read. It carries the brief for both
  beads, the signed `touches:` and `reproduces:` lists and the acceptance criterion. This plan
  works inside that `touches:` list and amends nothing.
- spec.md: not present in the worktree (no docs/changes/line-factory-baked-demo-a8h/spec.md, and
  none anywhere in the tree). Nothing is read from it; the triage's brief and lists stand in
  for it.
- plan/research.md: not present in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers the whole of both briefs.
- Source read: src/enemy.js, src/tower.js, src/game.js, src/render.js, src/path.js,
  test/game.test.js, work/m1-01-enemy-health.md, work/m1-02-waves.md, and, for what must stay
  out of this change, work/m1-03-win-lose-restart.md, work/m1-04-board-art.md and
  work/m3-03-waves-table.md.
- Design read: design/screens.yaml (the Board artboard owns the health bar) and
  design/screens/Board.dc.html.

## Who meets it

- person: the player, on the board drawn at design/screens/Board.png (source design/screens/Board.dc.html, listed in design/screens.yaml), sees a ghost survive a lantern's first beams with a health bar above it that shortens and reddens with each hit, and sees ghosts arrive in waves of a fixed size, the next wave starting only once the board is clear.

## Refusals

- none: this change adds no refusal; it refuses no input or action a player or agent can take, since `damageEnemy` clamps health at 0 rather than refusing an overkill and `updateWave` caps a long tick at `count` rather than refusing it, and tower placement keeps its existing refusals unchanged.

## Touches

As signed in triage.md, unchanged:

- src/enemy.js
- src/tower.js
- src/game.js
- src/wave.js (new)
- src/render.js
- test/enemy.test.js (new, reproduces)
- test/wave.test.js (new, reproduces)
- test/game.test.js

No other path changes. In particular test/path.test.js and test/targeting.test.js stay
unedited, and no test/render.test.js is added (render tests belong to work/m1-04).

## Build order (each step red first, then green)

### 1. Enemy health: src/enemy.js, test/enemy.test.js

Write test/enemy.test.js first, red against today's src/enemy.js:

- `createEnemy({ id, waypoints })` gives `health` 3 and `maxHealth` 3; `createEnemy({ ..., health: 5 })`
  gives 5 and 5.
- `damageEnemy` on a 3-health ghost with 1 damage leaves `health` 2 and returns `false`.
- Three hits of 1 on a 3-health ghost: the first two return `false`, the third returns `true`
  and `health` is exactly 0.
- An overkill (`damageEnemy(enemy, 10)` on 3 health) returns `true` with `health` 0, not
  negative.
- `healthFraction(enemy)` is 1 for a fresh ghost, 2/3 after one hit of 1, 0 when dead.

Every `false` asserted is paired in the same test with the `true` that follows it, so the
testing standard's negative-assertion-unpaired count stays at 0.

Then src/enemy.js:

- `export const ENEMY_HEALTH = 3;`
- `createEnemy({ id, waypoints, speed = ENEMY_SPEED, health = ENEMY_HEALTH })` returns the
  existing fields plus `health` and `maxHealth: health`.
- `export function damageEnemy(enemy, amount)`: `enemy.health = Math.max(0, enemy.health - amount)`;
  returns `enemy.health === 0`. Mutates the enemy, as `advanceEnemy` does.
- `export function healthFraction(enemy)`: `enemy.health / enemy.maxHealth`, the one number
  the renderer's bar reads, kept here so it is tested with the module that owns health.

### 2. Waves: src/wave.js, test/wave.test.js

Write test/wave.test.js first (red: the module does not exist):

- A wave of 5 at 1 second: `updateWave(wave, 0)` returns 1 (one at t=0); stepping 0.5 returns
  0; stepping another 0.5 returns 1; summing over steps of 0.1 for 20 seconds gives exactly 5.
- A fresh wave of 5 at 1 second given a single `updateWave(wave, 10)` returns 5, not 11, and a
  further `updateWave(wave, 10)` returns 0.
- `waveDone` is `false` after each of the first four spawns and `true` after the fifth.

Then src/wave.js, pure and with no DOM, in the style of the other modules:

- `createWave({ count, interval })` returns `{ count, interval, spawned: 0, timer: 0 }`.
- `updateWave(wave, dt)`: `wave.timer -= dt`; then while `wave.timer <= 0` and
  `wave.spawned < count`, spawn one (`spawned += 1`, `timer += interval`). Returns how many it
  spawned this call. The first call spawns at t=0 because `timer` starts at 0; a large `dt`
  spawns the backlog but never past `count`.
- `waveDone(wave)`: `wave.spawned >= wave.count`.

### 3. The game loop: src/tower.js, src/game.js, test/game.test.js

src/tower.js:

- `LANTERN = { range: 100, cooldown: 0.6, damage: 1 }`; `createTower` copies `damage` onto the
  tower alongside `range` and `cooldown`.

src/game.js:

- Drop `spawnTimer`. `createGame` takes `waveSize` (new `WAVE_SIZE = 5`) and keeps
  `spawnInterval` (`SPAWN_INTERVAL` stays 1.5), and holds `wave: 1` and
  `spawner: createWave({ count: waveSize, interval: spawnInterval })`.
- `step` spawns `updateWave(state.spawner, dt)` ghosts via `spawnEnemy`.
- In the tower loop, a beam always pushes its shot; then
  `if (damageEnemy(target, tower.damage))` removes the target and adds 1 to `kills`. The
  "Today one hit removes a ghost" comment goes.
- At the end of `step`, when `waveDone(state.spawner)` and `state.enemies.length === 0`,
  `state.wave += 1` and `state.spawner` becomes a fresh wave of the same size and interval.
  A ghost that leaked counts as gone. Every wave is the same size for now; growing waves are
  work/m3-03, and the final wave and win/lose are work/m1-03, both out of this change.

test/game.test.js, changed where it describes the old behaviour, and only there:

- `quietGame` becomes `createGame({ ...options, waveSize: 0 })`: waves of no ghosts, so each
  test controls its enemies. (Its wave number may climb while the board is empty; no quiet
  test reads it.)
- 'enemies spawn on the interval' becomes 'a wave spawns one ghost at once, then one per
  interval, and no more than its size', on `createGame({ waveSize: 2, spawnInterval: 1 })`:
  1 ghost after 0.01s, still 1 after 0.5s more, 2 after 0.5s more, still 2 after another 1s.
- 'a tower beside the path shoots an enemy that walks into range' becomes the health game
  test: a lantern at (1, 1), one 3-health ghost; after the first shot the ghost is still on the
  board at 2 health with `kills` 0; after the third shot it is gone and `kills` is 1, with lives
  untouched. Steps are sized to the lantern's cooldown (0.6s) plus a small margin so each
  step fires exactly one beam; the build confirms the ghost stays inside the 100px range for
  all three (it walks 60px/s, under 80px in that time).
- New: 'the wave number moves from 1 to 2 only after wave 1 has spawned out and its ghosts are
  gone', on a game with a small wave: `state.wave` is 1 while the wave is still spawning, still
  1 once it has spawned out but its ghosts are on the board, and 2 once they have left the
  board (by leaking off the end of the path, with no towers).
- The other tests (new game, a leak costs one life, lives never below zero, tower placement)
  keep what they prove; only their use of `quietGame` changes beneath them.

### 4. The health bar: src/render.js

`drawGhost` takes the enemy and, after the diamond, draws the Board artboard's bar above it:

- a track 26px wide and 4px tall, its top 12px above the sprite's top
  (`y - TILE * 0.3 - 12`), centred on `x`, in `#0c1a13` at 0.7 opacity;
- a fill from the track's left edge, `26 * healthFraction(enemy)` wide;
- coloured by fraction as the artboard's three ghosts are: green `#7fd68a` above 2/3, yellow
  `#e9c75a` above 1/3, red `#e65a5a` at or below 1/3. With 3 health that is green at full,
  yellow after one hit, red after two.

The colours go into `PALETTE` beside the others (moving every colour into src/theme.js is
work/m1-04). No test file is added for render.js in this change; its one computed input,
`healthFraction`, is tested in test/enemy.test.js, and the bar is checked by eye against
design/screens/Board.png by running the game.

## Proof

- Run only the touched test files: `node --test test/enemy.test.js test/wave.test.js test/game.test.js`
  then `npm --prefix . run test` once, which is the
  build's named check for this line and runs the small suite under test/.
- The reproduces tests (test/enemy.test.js, test/wave.test.js) are committed red before the
  source that turns them green.
- Acceptance is met when every criterion in triage.md's acceptance line has its test above and
  `npm --prefix . run test` passes.
