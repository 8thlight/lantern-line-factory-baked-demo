# Plan: a round that ends, and a board drawn to its design (24)

Fast follower of print line-factory-baked-demo-ov2, which was retired red. Beads:
lantern-line-factory-baked-demo-ov2 (issue #3, win and lose with a restart) and
lantern-line-factory-baked-demo-vd6 (issue #4, the board drawn to design/screens/Board.png),
taken together because both change src/render.js. Class: fix. This re-cut also answers PR #23's
two review notes: every lantern's light pool is drawn before any lantern body, and
src/theme.js's `THEME` is the only colour name (no `PALETTE` left in src/render.js).

## Inputs verified

- docs/changes/24/triage.md: read. It carries both briefs, the signed `touches:` and
  `reproduces:` lists and the acceptance criterion.
- spec.md: not in the worktree (no docs/changes/24/spec.md, and none anywhere in the tree).
  Nothing is read from it; the triage's briefs and lists stand in for it.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers the whole of both briefs.
- Source read at def84a9 (main taken in at cab3d7f): src/game.js, src/main.js, src/render.js,
  src/enemy.js, src/wave.js, src/tower.js, src/path.js, test/game.test.js, test/enemy.test.js,
  work/m1-03-win-lose-restart.md, work/m1-04-board-art.md.
- Design read: design/screens.yaml, design/screens/Board.dc.html (the source of every colour
  token below), design/screens/Win.dc.html and design/screens/Lose.dc.html.

### What the base already holds, which the triage's brief predates

The base moved after triage (print line-factory-baked-demo-a8h landed in cab3d7f):

- Waves are built: src/wave.js, and `createGame` holds `wave: 1` and a `spawner` that starts the
  next wave once the last has spawned out and the board is clear. So `totalWaves` is laid on that
  wave counter, not on a counter of this change's own.
- Ghosts have health: `createEnemy` gives `health` and `maxHealth`, and src/enemy.js exports
  `healthFraction`. `drawGhost` reads that. The brief's fallback for a ghost with no health
  fields (draw a full bar) is kept, since it costs one check, but no ghost the game makes lacks them.
- src/render.js already exports `PALETTE` and `drawHealthBar`, and test/enemy.test.js's
  health-bar test imports `PALETTE` from it. Dropping `PALETTE` (review note 2) makes that test
  fail unless it reads `THEME`, and test/enemy.test.js is not in the signed touches. Hence the
  amendment below.

## Who meets it

- person: the player, on the board drawn at design/screens/Board.png (source design/screens/Board.dc.html) and the round's end cards at design/screens/Win.png and design/screens/Lose.png (sources design/screens/Win.dc.html, design/screens/Lose.dc.html, all listed in design/screens.yaml), sees paper lanterns with light pools, ghosts with heads, hems and eyes, a stone path and glowing beams; sees the round stop with "The ghosts got through" when the last life is lost or "The path is safe" when the last wave is held, with "Click to play again"; and clicks to start a fresh round at wave 1.

## Refusals

- none: this change adds no refusal; a finished round is not refused but frozen (`step` returns it unchanged) and a click on it restarts rather than places, and tower placement keeps its existing refusals (path, taken cell, off the board) unchanged.

## Touches amendment

- reason: review note 2 removes `PALETTE` from src/render.js, and test/enemy.test.js's health-bar test imports `PALETTE` from it, so that test must read `THEME` from src/theme.js instead; test/enemy.test.js is not in the signed list, and it is not a test the `reproduces:` block locks (that is test/game.test.js alone, which this change leaves unedited).

touches:
  - src/game.js
  - src/main.js
  - src/render.js
  - src/theme.js
  - test/game-over.test.js
  - test/render.test.js
  - test/enemy.test.js

suite: node --test test/game-over.test.js test/render.test.js test/enemy.test.js test/game.test.js

test/game.test.js is run, not edited: it is the locked reproducer, and read against the plan
below every test in it stays green (its waves go no higher than 2 under the default
`totalWaves` of 5, its quiet games have waves of no ghosts and so never reach `'won'`, and
'lives never go below zero' still ends at 0 lives, now also `'lost'`).

## Build order (each step red first, then green)

### 1. Win, lose and restart: src/game.js, test/game-over.test.js

Write test/game-over.test.js first, red against today's src/game.js:

- A new game has `status` `'playing'`, `wave` 1 and `totalWaves` 5;
  `createGame({ totalWaves: 2 }).totalWaves` is 2.
- Losing the last life sets `'lost'`: a game with `lives: 1`, `waveSize: 0`, one spawned ghost,
  stepped past the path's length; `status` is `'playing'` before and `'lost'` after, lives 0.
- Clearing every wave with lives left sets `'won'`: `createGame({ totalWaves: 2, waveSize: 1,
  spawnInterval: 1 })`, stepped until both waves' ghosts have leaked (each costs one life, 10
  lives cover it); `status` is `'playing'` with `wave` 2 after wave 1 clears, and `'won'` with
  `wave` still 2 (not 3) after wave 2 clears, lives 8.
- A ghost leaking the last life on the step that clears the last wave ends `'lost'`, not `'won'`
  (`totalWaves: 1, waveSize: 1, lives: 1`).
- `step` on a lost game and on a won game leaves `enemies`, `lives`, `towers`, `shots`, `wave`
  and `kills` deep-equal to a copy taken before the step, with a ghost and a lantern on the board
  so there is something that could have moved (the ghost is pushed with `spawnEnemy` after the
  round ended).
- `restart` on a finished game that had towers, enemies, lost lives and reached wave 2 returns
  full lives (the `lives` option it was made with), no towers, no enemies, no shots, `wave` 1,
  `kills` 0 and `status` `'playing'`; a game made with `{ lives: 4, totalWaves: 3 }` restarts with
  4 lives and `totalWaves` 3. The returned game is a new object, and stepping it spawns ghosts
  again.

Then src/game.js:

- `export const TOTAL_WAVES = 5;` `createGame` takes `totalWaves = TOTAL_WAVES`, keeps the
  options it was made with on `state.options` (`{ waypoints, spawnInterval, waveSize, lives,
  totalWaves }`), and holds `status: 'playing'` and `totalWaves`.
- `step` returns at once, unchanged, while `status !== 'playing'`.
- After `leakEnemies`, if `lives === 0`, `status = 'lost'` and `step` returns: nothing else moves
  on the step the round is lost.
- Where a cleared wave today starts the next: if `state.wave >= state.totalWaves`,
  `status = 'won'`; otherwise the next wave starts as now. Lives are above 0 here, since the lost
  check came first.
- `export function restart(state) { return createGame(state.options); }`
- `leakEnemies` keeps clamping at 0; the clamp stays its own concern.

### 2. The theme: src/theme.js, test/enemy.test.js

src/theme.js exports one frozen `THEME`, the Board artboard's colours by name (values from
design/screens/Board.dc.html; opacities folded into `rgba()`):

- grass: `grassA` `#17311f`, `grassB` `#1a3623`, `grassBlade` `#2c5236`
- path stones: `pathShadow` (`#0c1a13` at 0.45), `pathEdge` `#8f6f40`, `pathStone` `#c9a66b`,
  `pathStoneDark` (`#b18d55` at 0.55)
- lantern: `lanternPost` `#5a4326`, `lanternCap` `#4a3720`, `lanternPaper` `#e8a83a`,
  `lanternPaperLit` `#f6c95c`, `lanternCore` `#fff4c9`, `lanternRib` (`#b97a22` at 0.45),
  `lanternTassel` `#d9534f`
- lantern glow: `glowInner` (`#ffd27a` at 0.42), `glowMid` (`#f2b84e` at 0.18), `glowOuter`
  (`#f2b84e` at 0)
- ghost: `ghostBody` (`#9b7be6` at 0.93), `ghostEdge` `#4d3586`, `ghostSheen` (`#d9c9ff` at 0.55),
  `ghostEyes` `#1c1233`, `ghostEyeShine` `#f4efe1`
- beam: `beam` `#fff4c9`, `beamGlow` `#ffe7a3`
- health bar: `healthTrack` (`#0c1a13` at 0.7), `healthHigh` `#7fd68a`, `healthMid` `#e9c75a`,
  `healthLow` `#e65a5a`
- the rest render.js draws: `hover`, `hoverBad` (today's values), `text` `#f4efe1`, `dim`
  (`#07130d` at 0.7, the end cards' veil)

test/enemy.test.js: the health-bar test imports `THEME` from `../src/theme.js` and reads
`THEME.healthTrack`, `THEME.healthHigh`, `THEME.healthMid`, `THEME.healthLow` where it read
`PALETTE`. It keeps importing `drawHealthBar` from src/render.js. Nothing else in the file changes.
It goes red when `PALETTE` leaves render.js in step 3 only if this edit is missing, so this edit
lands with step 3's render.js change.

### 3. The sprites: src/render.js, test/render.test.js

Write test/render.test.js first, red against today's src/render.js. It uses a recording fake
context: every method call is pushed as `{ name, args, fillStyle, strokeStyle, shadowBlur,
lineWidth }` (the style properties as they stand at the call), `createRadialGradient` and
`createLinearGradient` return a gradient that records its `addColorStop` colours, and
`save`/`restore` push and pop the style properties as a canvas does.

- No hex colour literal: src/render.js read as text matches no `/#[0-9a-f]{3,8}\b/i` and no
  `rgba?\(`; and src/render.js exports no `PALETTE`.
- Every colour drawn is a theme colour: `draw` on a game with two lanterns, three ghosts at full,
  two-thirds and one-third health, a shot, a hover (both a good and a bad cell) and then a lost
  and a won round records only `fillStyle`, `strokeStyle`, `shadowColor` and gradient-stop values
  that are values of `THEME` (gradient objects themselves excepted).
- `drawLantern(ctx, tower)` calls `createRadialGradient` (the light pool) and at least one `arc`,
  `ellipse`, `quadraticCurveTo`, `bezierCurveTo` or `roundRect` (the body).
- Light pools are drawn first (review note 1): `draw` with two lanterns and a hover records both
  `createRadialGradient` calls before the hover's `fillRect` and before the first body call, and
  every body call after both pools.
- `drawGhost(ctx, enemy)` records an `arc` or bezier/quadratic curve (the head and hem), exactly
  two fills in `THEME.ghostEyes` (the eyes), and a health bar whose fill `fillRect` width is 26
  at full health and smaller after `damageEnemy(enemy, 1)`. A ghost object with no `health` or
  `maxHealth` draws a 26-wide fill.
- `drawBeam(ctx, from, to)` records a `moveTo(from.x, from.y)` and `lineTo(to.x, to.y)` and a
  `stroke` made while `shadowBlur > 0`, and leaves `shadowBlur` at 0 after it returns.
- `drawPath(ctx, state)` strokes the path (a `stroke` in `THEME.pathEdge` and one in
  `THEME.pathStone`), and its grass fills alternate `THEME.grassA` and `THEME.grassB`.
- `draw` on a fresh game, given counting sprite functions, calls `drawPath` once and
  `drawGhost` never.
- The end card: `draw` on a lost game records `fillText` of "The ghosts got through" and "Click to
  play again"; on a won game "The path is safe" and "Click to play again"; on a playing game
  neither line.

Then src/render.js:

- Imports `THEME` from ./theme.js; every `fillStyle`, `strokeStyle`, `shadowColor` and gradient
  stop reads a `THEME` token. `PALETTE` goes; nothing re-exports a colour under another name.
- `draw(ctx, state, hover, sprites = SPRITES)`: `SPRITES` is the module's own
  `{ drawPath, drawLanternLight, drawLanternBody, drawGhost, drawBeam }` table, so a test can
  count calls; the browser passes nothing. In order: `drawPath`; every tower's light pool; the
  hover cell; every tower's body; every ghost; every shot's beam; lives; and, while
  `status !== 'playing'`, the end card.
- `drawLanternLight(ctx, tower)` (exported): the radial pool on the grass, gradient
  `glowInner` → `glowMid` → `glowOuter`, radius about a tile and a half.
- `drawLanternBody(ctx, tower)` (exported): post, cap, rounded paper body (`roundRect` or arcs)
  with a lit inner panel and core, two ribs, base and tassel, as the artboard's lantern symbol,
  sized to the 40px tile.
- `drawLantern(ctx, tower)` (exported): `drawLanternLight` then `drawLanternBody`, the whole
  sprite on its own; `draw` calls the two halves separately so no pool lands on a body.
- `drawGhost(ctx, enemy)` (exported): an arc for the head, a zigzag hem with curved points, the
  sheen, two eyes with shine, and `drawHealthBar` above it with
  `enemy.maxHealth === undefined ? 1 : healthFraction(enemy)`.
- `drawBeam(ctx, from, to)` (exported): inside `save`/`restore`, a wide soft stroke in `beamGlow`
  with `shadowBlur` 12 and `shadowColor` `beamGlow`, then a 2.5px core stroke in `beam`.
- `drawPath(ctx, state)` (exported): grass as alternating `grassA`/`grassB` tiles, then the path
  as the artboard's layered polyline through the waypoints' cell centres (shadow 44px, edge 40px,
  stone 34px, dashed darker stones 22px) with round joins.
- `drawHealthBar` keeps its signature and output, reading `THEME`.
- `drawEndCard(ctx, status)`: a `dim` veil over the board, the title ("The ghosts got through"
  for `'lost'`, "The path is safe" for `'won'`) and "Click to play again" in `text`, centred.
  The artboards' stat lines, Menu button and gold are not drawn: gold and a menu do not exist
  yet (work/m3-01, work/m4-03), and the brief names these lines word for word.

### 4. The click: src/main.js

- `state` becomes `let`. A click, when `state.status !== 'playing'`, sets
  `state = restart(state)` (and places nothing); otherwise it places a tower as today.
- main.js is the DOM entry and has no test; it is checked by reading and by running the game
  (`npx serve` or opening index.html) to lose a round, see the card and click back to wave 1.

## Proof

- Run only the touched files and the locked reproducer:
  `node --test test/game-over.test.js test/render.test.js test/enemy.test.js test/game.test.js`.
  The full suite runs on the pull request's required checks.
- test/game-over.test.js and test/render.test.js are committed red before the source that turns
  them green.
- Acceptance is met when every criterion of issue #3 and issue #4 has its test above, both review
  notes have theirs (pools-before-bodies order, no `PALETTE`), and the suite line above passes.
