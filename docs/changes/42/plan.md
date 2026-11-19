# Plan: a HUD of lives, gold and wave, with pause and speed (print 42)

A fast follower that re-cuts print line-factory-baked-demo-aic, which retired at the landing
with hydraflow/verify red and review.json reading changes-required with three P1s. It carries
two M4 "HUD and polish" items on one seam, as the triage took them:
bead lantern-line-factory-baked-demo-aic (GitHub issue #11, work/m4-01-hud.md) and
bead lantern-line-factory-baked-demo-l3s (GitHub issue #12, work/m4-02-pause-and-speed.md).
The HUD bar draws the Pause and Speed buttons, and `hudModel` returns the `paused` and `speed`
fields that #12 adds. Class: fix.

## Inputs verified

- docs/changes/42/triage.md: read. It carries both briefs, the signed `touches:` and
  `reproduces:` lists, the acceptance criterion and the four extra musts (1)–(4) from the
  parent's review. This plan stays inside that `touches:` list and amends nothing.
- spec.md: not in the worktree (there is no docs/changes/42/spec.md and none anywhere in the
  tree). Nothing is read from it. The triage's briefs and lists stand in for it, as they did
  for print line-factory-baked-demo-15s.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers both briefs whole along with the
  triage's four musts.
- The base: c3f9b01 has main in at 7f86a31, which includes M3 (src/waves.js, tower costs,
  `placementError`, `hoverAt`). No further merge is needed before build.
- I checked the triage's claims against that base one by one, and all are true:
  - src/render.js: `draw` ends with `drawLives(ctx, state.lives)` and then the end card.
    `drawLives` writes `` `Lives: ${lives}` `` at (8, 20) in `THEME.text`. Gold and wave are
    never drawn.
  - There is no src/hud.js and no `hudModel`.
  - src/game.js: `createGame` holds no `paused` or `speed`, and there is no `togglePause` or
    `toggleSpeed`. `step(state, dt)` runs `updateWave`, `advanceEnemy` and `updateTower` on
    the raw `dt`.
  - src/main.js: the canvas is `COLS * TILE` by `ROWS * TILE`. A click places a tower, the
    keys choose only a kind (`kindForKey`), and there is no Pause or Speed wiring. Its frame
    clamps `dt` to 0.05 s.
  - test/render.test.js: 'a finished round draws its end card, and a round in play draws
    none' asserts `texts(playing)` is `['Lives: 10']`. It also asserts the end cards with
    `texts(...).slice(1)`, which skips that one lives text.
- Source read: src/game.js, src/render.js, src/main.js, src/theme.js, src/tower.js,
  src/wave.js, src/waves.js, src/enemy.js, src/path.js; test/render.test.js,
  test/tower-cost.test.js, test/range-preview.test.js, test/enemy.test.js (each test that
  calls `draw` or builds a canvas stand-in); index.html and style.css (the canvas is
  `width: 100%; height: auto`, so a taller canvas keeps its aspect);
  tests/architecture/assertion_baseline.json (javascript `negative-assertion-unpaired: 0`);
  .hydraflow/layout.yaml (test paths `test/**`).
- Design read: design/hud.md (tokens, HUD bar), design/screens.yaml,
  design/screens/Main.dc.html, design/screens/HudStates.dc.html. Where the brief and the
  artboard differ, the brief says the artboard wins. That decides one detail: the active 2x
  button is filled `--hud-accent` and carries dark text `#12241c` (HudStates.dc.html:44).
  The artboard's icons and wave pips are art beyond the brief's bar (labels and values) and
  are not built here.

## The parent's review, answered

1. The board's top row. The artboard lays the bar over the map, and design/hud.md says it
   "may cover the top row". This plan takes the review's first option instead: **the bar
   sits above the board.** The canvas grows to `COLS * TILE` by `HUD_HEIGHT + ROWS * TILE`
   (640 × 440), `draw` paints the board translated down by `HUD_HEIGHT`, and pointer
   coordinates come off the bar before they become cells. Row 0 is then fully visible and
   placeable, and the bar is never over a cell. Tests cover both.
2. The main.js wiring is tested by importing src/main.js itself against stubbed DOM globals
   (step 2). The pointer and key decisions are pure functions in src/hud.js, tested directly
   (step 1). A click on the bar never places a tower, the hover clears over the bar, and
   P and F reach the toggles while the round is playing.
3. The speed cap. A 2x frame does not scale `dt` into one longer tick. **`step` runs the
   tick `speed` times at the raw `dt`**, so no tick at 2x is longer than a tick at 1x, and
   main.js still clamps a frame's `dt` at 0.05 s. A 2x frame therefore cannot carry a ghost
   further in one tick, or past a tower's reach, than a 1x frame, and it cannot fold two
   reloads into one shot. The issue's acceptance, "one `step(state, 0.5)` at speed 2 moves a
   ghost as far as two at speed 1", holds exactly, because it is the same sequence of ticks.
   A long-frame test at 2x proves no shot is skipped (step 2).
4. The "board below the bar" comment: test/hud.test.js is new in this print, and with the
   bar above the board, a comment saying the board sits below the bar is now true. The
   build writes no comment that places the board anywhere else.

## Who meets it

- person: the player, in a round in play on the Main artboard (design/screens/Main.png,
  source design/screens/Main.dc.html, listed in design/screens.yaml for
  work/m4-01-hud.md), reads lives, gold and "Wave current / total" in a bar across the top
  of the canvas above the board. Lives turn red at 3 or fewer.
- person: the player, holding a round as drawn at design/screens/HudStates.png (source
  design/screens/HudStates.dc.html, listed in design/screens.yaml for
  work/m4-02-pause-and-speed.md), clicks Pause or presses P to freeze the board. The button
  then reads Resume, and they can still place towers while paused. They click 1x or press F
  to run the round at 2x, and the button fills gold while 2x is active.

## Refusals

- none: nothing here refuses an action with a reason. A paused `step` leaves the state as it
  was, which is what pause means, and the HUD shows it as Resume. A click on the bar is a
  click on the bar, not a placement turned down, so it says nothing. P and F after the round
  is over do nothing, as every key but 1 and 2 already does. The placement refusals
  (`'bounds'`, `'path'`, `'taken'`, `'gold'`) refuse exactly as before.

## Touches

As signed in triage.md, unchanged:

- src/hud.js (new)
- src/render.js
- src/theme.js
- src/game.js
- src/main.js
- test/hud.test.js (new, reproducer)
- test/pause-speed.test.js (new, reproducer)
- test/render.test.js (the edit the issue allows, step 7)

`reproduces:` stays as signed: test/hud.test.js and test/pause-speed.test.js, both written
red first. Every other suite stays unedited and must pass as it stands. I checked this
against the translated board: `draw` keeps passing board-space coordinates to `fillRect`
under a `ctx.translate(0, HUD_HEIGHT)`. So test/tower-cost.test.js's `lastCellFill`
(`[col * TILE, row * TILE, TILE, TILE]`) and test/range-preview.test.js's ring arcs still see
the numbers they see today. The HUD draws no `fillRect` that is TILE × TILE: its buttons are
`roundRect`s 28 tall. test/brazier.test.js counts sprite calls only. Every stand-in that
`draw` reaches is a Proxy that answers any method (`translate`, `roundRect`), and none
answers `measureText`, so the HUD lays out on fixed offsets and never measures text.

## Build order (red first, then green)

Every new check is an exact `equal`/`deepEqual`. No `notEqual`, `notDeepEqual`, `ok(!…)` or
`doesNotMatch` is written, so the assertion baseline cannot rise.

### 1. Reproducer: test/hud.test.js, committed red

Imports `hudModel`, `HUD_HEIGHT`, `PAUSE_BUTTON`, `SPEED_BUTTON`, `hudButtonAt`,
`boardCellAt`, `hudKey` from ../src/hud.js; `createGame`, `START_LIVES`, `START_GOLD`,
`TOTAL_WAVES`, `step`, `placeTower`, `togglePause`, `toggleSpeed` from ../src/game.js;
`COLS`, `ROWS`, `TILE` from ../src/path.js; `draw` from ../src/render.js; `THEME` from
../src/theme.js.

- 'hudModel on a new game': `hudModel(createGame())` deep-equals `{ lives: START_LIVES, gold:
  START_GOLD, wave: 1, totalWaves: TOTAL_WAVES, paused: false, speed: 1, livesDanger: false }`.
- 'livesDanger is false at 4 lives and true at 3': `[4, 3].map(lives =>
  hudModel(createGame({ lives })).livesDanger)` is `[false, true]`. 0 lives is `true` too.
- 'hudModel reflects gold and wave after they change': set `game.gold = 77; game.wave = 4;`,
  then the model's `[gold, wave]` is `[77, 4]`. Separately, a game stepped through wave 1
  with `createGame({ waveSize: 1, spawnInterval: 1, lives: 1000 })` reads `wave: 2`, and
  `togglePause` and `toggleSpeed` show as `paused: true, speed: 2`.
- 'hudModel does not change the state it reads': `structuredClone` a busy game (towers,
  ghosts, a shot), call `hudModel` on it, and the game deep-equals its clone.
- 'the bar sits above the board, and row 0 is drawn whole below it'. A recording context in
  this file tracks the current vertical offset through `translate`/`save`/`restore` and
  records each `fillRect`/`roundRect`/`fillText` with its absolute y. Drawing a new game:
  - every call drawn in `THEME.hudBg`, `hudMuted`, `hudInk`, `hudAccent`, `hudDanger` or
    `hudGhost` has its absolute y within `[0, HUD_HEIGHT]`;
  - the grass tile at (0, 0) is filled at absolute y `HUD_HEIGHT`;
  - nothing but the board is drawn below `HUD_HEIGHT`.

  The comment above this test says the board is drawn below the bar.
- 'row 0 is placeable from a pointer on it, and the bar is no cell': `boardCellAt(5,
  HUD_HEIGHT + 5)` is `{ col: 0, row: 0 }`, and `placeTower(game, 0, 0)` on a new game is
  `true`. `boardCellAt(5, 5)` and `boardCellAt(5, HUD_HEIGHT - 1)` are `null`.
  `boardCellAt(COLS * TILE - 1, HUD_HEIGHT + ROWS * TILE - 1)` is `{ col: COLS - 1, row:
  ROWS - 1 }`.
- 'hudButtonAt finds each button, and nothing else on the bar': the centre of
  `PAUSE_BUTTON` gives `'pause'` and the centre of `SPEED_BUTTON` gives `'speed'`. (5, 5),
  the gap between the two buttons, and any point at y ≥ `HUD_HEIGHT` give `null`. Both
  buttons lie inside the bar and inside the canvas width.
- 'hudKey: P and F, either case': `['p', 'P', 'f', 'F', '1', ' '].map(hudKey)` is
  `['pause', 'pause', 'speed', 'speed', null, null]`.
- 'the bar shows each value in its token': draw a new game and pair each `fillText` with
  its `fillStyle`. The result is `[['Lives', hudMuted], ['10', hudInk], ['Gold', hudMuted],
  ['50', hudAccent], ['Wave', hudMuted], ['1 / 10', hudGhost], ['Pause', hudInk], ['1x',
  hudInk]]`. With `lives: 3`, paused and at 2x, the lives value is `hudDanger`, the pause
  button reads `'Resume'`, the speed button reads `'2x'` in `hudAccentInk`, and a
  `roundRect` at `SPEED_BUTTON` is filled `hudAccent`.

Red against the base: src/hud.js does not exist.

### 2. Reproducer: test/pause-speed.test.js, committed red

Imports `createGame`, `step`, `togglePause`, `toggleSpeed`, `placeTower`, `spawnEnemy` from
../src/game.js; `HUD_HEIGHT`, `PAUSE_BUTTON`, `SPEED_BUTTON` from ../src/hud.js; `TILE`
from ../src/path.js.

- 'togglePause flips paused; toggleSpeed moves between 1 and 2': on a new game, `paused` is
  `false` and `speed` is `1`. Two `togglePause` calls read `[true, false]`, and two
  `toggleSpeed` calls read `[2, 1]`.
- 'a paused step leaves enemy positions, spawn timers and tower reloads unchanged': a game
  with a lantern beside the path, stepped until a ghost is in reach and the lantern has
  fired, so its `reload > 0`. Then `togglePause`, `structuredClone` the game, `step(game,
  0.5)` five times, and the game deep-equals the clone. That covers `enemies[*].distance/x/y`,
  `spawner.timer/spawned`, `towers[*].reload`, shots, gold and kills. After `togglePause`
  again, one `step` moves the ghost again (`distance` is greater, asserted as
  `equal(after > before, true)`).
- 'at speed 2, one step(state, 0.5) moves a ghost as far as two step(state, 0.5) at speed 1':
  two quiet games, each with one `spawnEnemy`. One is at speed 2 and stepped once, the other
  is at speed 1 and stepped twice. Their ghosts' `[distance, x, y]` are deep-equal.
- 'a long frame at 2x is two ticks, so no shot and no stretch of path is skipped': two
  identical games with lanterns and a running wave. A is at speed 2 and gets `step(A, 0.6)`
  repeatedly; B is at speed 1 and gets `step(B, 0.6)` twice as often. After each A step, A
  and B deep-equal on `enemies`, `towers`, `spawner`, `gold`, `kills`, `lives`, `wave` and
  `status`. A single lantern with `cooldown` 0.6 and a ghost in reach throughout fires twice
  in one 2x `step(…, 0.6)`, so `kills` and the ghost's health show two hits. A scaled
  `dt` of 1.2 in one tick would fire once. This is the cap's red test.
- main.js wiring. The test stubs `globalThis.document` (`getElementById` returns a fake
  canvas with `addEventListener` capturing handlers, `getBoundingClientRect` returning `{
  left: 0, top: 0, width: canvas.width, height: canvas.height }`, and `getContext`
  returning a text-and-fill recording context), `globalThis.window` (`addEventListener`
  capturing `keydown`) and `globalThis.requestAnimationFrame` (queues the frame). Each test
  then imports a fresh instance, `import('../src/main.js?case=<n>')`, fires events, runs one
  queued frame, and reads the drawn HUD text and fills:
  - 'the canvas is tall enough for the bar and the whole board': `canvas.height` is
    `HUD_HEIGHT + ROWS * TILE`.
  - 'a click on the bar never places a tower': click at (5, 5), at (5, HUD_HEIGHT - 1), and
    between the buttons. After a frame the gold text still reads `'50'` and no lantern body
    is drawn. A click at (5, HUD_HEIGHT + 5), row 0, then reads `'30'`: that click does
    place, and costs 20.
  - 'a click on Pause or 1x toggles them and places nothing': click the centre of
    `PAUSE_BUTTON` and the HUD reads `'Resume'`; click the centre of `SPEED_BUTTON` and it
    reads `'2x'`. The gold text is still `'50'`.
  - 'the hover clears over the bar': mousemove at (TILE * 3 + 5, HUD_HEIGHT + TILE + 5) and
    the frame fills one hover cell (`THEME.hover`). Then mousemove at (5, 5), and the next
    frame fills no `THEME.hover` and no `THEME.hoverBad`.
  - 'P and F reach the toggles while the round is playing': keydown `'p'` reads `'Resume'`
    and keydown `'F'` reads `'2x'`. A keydown with `repeat: true` changes nothing.
  - The wiring tests restore the globals they set (`after`).

Red against the base: `togglePause` and `toggleSpeed` are not exported, src/hud.js does not
exist, and main.js's canvas is `ROWS * TILE` tall.

### 3. src/hud.js (new): the HUD's model and where the pointer lands

Pure, no DOM. It imports `COLS`, `ROWS`, `TILE` from ./path.js.

    export const HUD_HEIGHT = 40; // design/hud.md --hud-height; the board is drawn below it
    export const LIVES_DANGER = 3; // lives at or below this turn the HUD's lives red
    const WIDTH = COLS * TILE;
    // Right-aligned buttons, 28 tall, --hud-pad from the edge and --hud-gap apart.
    export const SPEED_BUTTON = Object.freeze({ x: WIDTH - 8 - 40, y: 6, width: 40, height: 28 });
    export const PAUSE_BUTTON = Object.freeze({ x: SPEED_BUTTON.x - 16 - 72, y: 6, width: 72, height: 28 });

- `hudModel(state)` returns `{ lives, gold, wave, totalWaves, paused, speed, livesDanger:
  lives <= LIVES_DANGER }`, read from `state`. It writes nothing.
- `hudButtonAt(x, y)` returns `'pause'` or `'speed'` when (x, y) lies inside that button's
  rect, else `null`.
- `boardCellAt(x, y)` returns `null` for `y < HUD_HEIGHT`, else `{ col: Math.floor(x /
  TILE), row: Math.floor((y - HUD_HEIGHT) / TILE) }`. Off-board cells stay for `cellError`
  to call `'bounds'`, as today.
- `hudKey(key)` returns `'pause'` for p/P, `'speed'` for f/F, else `null`.

### 4. src/game.js: paused and speed

- `createGame` adds `paused: false` and `speed: 1` to the state (not to `options`, so
  `restart` brings a fresh round in at 1x, unpaused).
- `export function togglePause(state)` flips `state.paused` and returns it.
  `export function toggleSpeed(state)` sets `state.speed = state.speed === 2 ? 1 : 2` and
  returns it.
- `step(state, dt)`: after the `status` guard, `if (state.paused) return state;`. Then
  `for (let i = 0; i < state.speed; i++) tick(state, dt)`, stopping early once `status` is
  no longer `'playing'`. The body of today's `step` moves unchanged into a private
  `tick(state, dt)`. A comment says why: 2x is two ticks of the frame's `dt`, never one
  tick of twice the `dt`, so a long frame cannot carry a ghost past a tower's reach or fold
  two reloads into one shot.

### 5. src/theme.js and src/render.js: the bar

- src/theme.js, under a `// HUD bar (design/hud.md tokens; HudStates.dc.html for the active
  2x)` heading: `hudBg: 'rgba(18, 36, 28, 0.85)'`, `hudInk: '#f4efe1'`, `hudMuted:
  '#b8c4b0'`, `hudAccent: '#f2c14e'`, `hudDanger: '#e65a5a'`, `hudGhost: '#8e6bd8'`,
  `hudAccentInk: '#12241c'`. The file's header comment gains design/hud.md as a source.
- src/render.js imports `HUD_HEIGHT`, `PAUSE_BUTTON`, `SPEED_BUTTON`, `hudModel` from
  ./hud.js. `draw` does `ctx.save(); ctx.translate(0, HUD_HEIGHT);`, then everything it
  draws today minus `drawLives`, the end card included (it veils the board, and the bar
  stays readable above it), then `ctx.restore(); drawHud(ctx, hudModel(state));`. The comment
  on `draw` says the board sits below the HUD bar.
- `drawLives` is removed. `drawHud(ctx, model)` reads only `model`:
  - It fills the bar `0, 0, WIDTH, HUD_HEIGHT` in `THEME.hudBg`, with `font` set to
    `'16px system-ui, sans-serif'`, `textBaseline` `'middle'` at `HUD_HEIGHT / 2`, and
    fixed x offsets starting at `--hud-pad` (8). It never calls `measureText`.
  - It writes 'Lives' (`hudMuted`), then `String(lives)` (`hudDanger` if `livesDanger`,
    else `hudInk`); 'Gold' (`hudMuted`) and `String(gold)` (`hudAccent`); 'Wave'
    (`hudMuted`) and `` `${wave} / ${totalWaves}` `` (`hudGhost`).
  - It draws the Pause button: a `roundRect` at `PAUSE_BUTTON`, radius 6, stroked
    `hudMuted`, with centred text `paused ? 'Resume' : 'Pause'` in `hudInk`.
  - It draws the Speed button: a `roundRect` at `SPEED_BUTTON`. At 2x it is filled
    `hudAccent` and reads '2x' in `hudAccentInk`. At 1x it is stroked `hudMuted` and reads
    '1x' in `hudInk`.
  - It holds no colour literal. It uses `save`/`restore` so nothing leaks.

### 6. src/main.js: the wiring

- Imports `togglePause` and `toggleSpeed` from ./game.js, and `HUD_HEIGHT`, `boardCellAt`,
  `hudButtonAt`, `hudKey` from ./hud.js. `canvas.height = HUD_HEIGHT + ROWS * TILE`.
- `cellAt` becomes `pointAt(event)`, which returns the canvas `{ x, y }` with the same
  `getBoundingClientRect` scaling.
- click: a round that is over restarts, as today. Otherwise the click toggles pause or speed
  when `hudButtonAt` names a button. When `boardCellAt` gives a cell, it places a tower
  there. Anything else on the bar does nothing.
- contextmenu: `preventDefault`. It toggles a mode only when `boardCellAt` gives a cell.
- keydown: `kind = kindForKey(...)` as today. While `state.status === 'playing'` and not
  `event.repeat`, `hudKey(event.key)` toggles pause or speed.
- mousemove: `hover` is `hoverAt(...)` on a board cell, and `null` over the bar.
- The frame is unchanged. Its 0.05 s clamp stays the bound on each tick at any speed.

### 7. The edit the issue allows to test/render.test.js

Only in 'a finished round draws its end card, and a round in play draws none', and only to
the lines that read the old lives text:

- `assert.deepEqual(texts(playing), ['Lives: 10'])` becomes `['Lives', '10', 'Gold', '50',
  'Wave', '1 / 10', 'Pause', '1x']`.
- The two end-card asserts read `texts(lost).slice(0, 2)` and `texts(won).slice(0, 2)`
  instead of `.slice(1)`. The end card is now drawn before the HUD, and these asserts used
  `.slice(1)` only to step past the lives text. They prove the same title and line.

No other line in that suite changes. 'every colour draw paints with is a THEME colour' and
'src/render.js holds no colour literal' pass unedited over the HUD's new tokens.

### 8. Green

`node --test test/hud.test.js test/pause-speed.test.js test/render.test.js
test/tower-cost.test.js test/range-preview.test.js test/brazier.test.js test/game.test.js
test/game-over.test.js test/gold.test.js test/waves.test.js test/enemy.test.js` runs the
two reproducers, the edited suite, and every unedited suite that calls `draw` or `step`.
Then `npm --prefix . run test` runs once, the line's named check. The whole suite also runs
on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes, with test/hud.test.js and test/pause-speed.test.js green
and both committed red first.

- test/hud.test.js proves:
  - `hudModel` on a new game returns full lives, starting gold, wave 1 of `TOTAL_WAVES`,
    unpaused at 1x;
  - `livesDanger` is false at 4 lives and true at 3;
  - the model follows gold, wave, pause and speed;
  - `hudModel` leaves the state it reads unchanged;
  - the bar is drawn above the board in the brief's tokens, with row 0 drawn whole and
    placeable below it.
- test/pause-speed.test.js proves:
  - the toggles flip;
  - a paused `step` changes nothing;
  - one 2x `step(…, 0.5)` moves a ghost as far as two at 1x;
  - a long 2x frame skips no shot;
  - through src/main.js itself, a click on the bar never places a tower, the buttons and
    P/F toggle while playing, and the hover clears over the bar.

The only edit to an existing suite is step 7.
