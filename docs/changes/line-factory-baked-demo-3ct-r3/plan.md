# Plan: a simple start screen (print line-factory-baked-demo-3ct-r3)

GitHub issue #13, opened as print issue #53. Class: fix. Today the game spawns ghosts as soon
as the page loads. After this change it opens on the StartScreen artboard: the title "Lantern
Line", the tagline, a Start button and the three how-to-play steps. Nothing moves until the
player clicks Start or presses Enter or Space. A restart brings the start screen back.

## Inputs verified

- docs/changes/line-factory-baked-demo-3ct-r3/triage.md: read. It carries the issue, the
  brief, the signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no docs/changes/line-factory-baked-demo-3ct-r3/spec.md
  and no spec.md anywhere in the tree, so nothing is read from it. The triage's brief and lists
  stand in for it, as they did for prints 36, 42, 47 and line-factory-baked-demo-yym.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers the whole brief.
- The base: the print branch was cut from 6658250, the line's start. That commit has no
  `status`, no `restart` and no src/hud.js, so none of the triage's claims could hold there.
  The triage was written against main. This stage merged origin/main at 3d433a5 (print
  line-factory-baked-demo-yym) into the branch as a3e69b0. The merge had no conflict, because
  the branch held only its triage files. Everything below is read from that merge.
- I checked the triage's claims against that base:
  - True: `createGame` in src/game.js takes no `status`. It always returns
    `status: 'playing'`, and it stores `options` that `restart` rebuilds from.
  - True: `step` returns early on `status !== 'playing' || paused`. That guard already holds
    a `'ready'` game still. Only its comment changes.
  - True: src/game.js exports no `start`.
  - True: src/main.js boots with `createGame()`. Its click handler restarts on any status
    other than `'playing'`, and its keydown handler does nothing with Enter or Space.
  - True: `draw` in src/render.js puts up the end card for any status other than `'playing'`,
    and it has no start overlay.
  - True: src/hud.js holds PAUSE_BUTTON, SPEED_BUTTON and `hudButtonAt`, and nothing for
    Start.
- Design read: design/hud.md (Start screen section and tokens), design/screens.yaml (the
  StartScreen entry: "show the title, the line …, a Start button that begins wave 1 (or Enter
  or Space), and the three how-to-play steps"), design/screens/StartScreen.dc.html and
  StartScreen.png. Where the brief and the artboard differ, the artboard wins (hud.md says
  so). The artboard's button is 184 × 48 with radius 10, not hud.md's 160 × 44 with radius 6.
- Source read: src/game.js, src/main.js, src/hud.js, src/render.js, src/theme.js, src/wave.js.
  Tests read: test/game-over.test.js, test/render.test.js, test/hud.test.js,
  test/pause-speed.test.js and test/upgrade.test.js.
- The standards: tests/architecture/assertion_baseline.json has javascript
  `negative-assertion-unpaired: 0` and `substring-binding: 0`. .hydraflow/layout.yaml gives
  test paths `test/**` and `e2e/**`.

## Who meets it

- person: the player opening the game, on the StartScreen artboard
  (design/screens/StartScreen.png, source design/screens/StartScreen.dc.html). The page opens
  on the board veiled in the HUD's dark green, with the lantern, "Lantern Line" in gold, "Light
  the lanterns. Stop the ghosts before they reach the gate.", a gold Start button with "or
  press Enter or Space" under it, and the three numbered steps. No ghost moves. A click on
  Start, or Enter or Space, lifts the screen and wave 1 begins. A click anywhere else does
  nothing. When a round is won or lost, a click on the end card brings the start screen back.

## Refusals

- none: this change refuses nothing new. `start` on a game that is not `'ready'` returns it
  unchanged and has no reason to give. It is how a second Enter or a click mid-round is
  absorbed, and the player sees nothing happen because nothing should. A click off the Start
  button while the start screen shows does nothing. The screen itself says what to do: "or
  press Enter or Space".

## Touches amendment

- reason: the signed list cannot hold `src/main.js` opening with `createGame({ status:
  'ready' })` while the suite stays green. Two unlocked suites boot src/main.js against
  stand-in DOM globals, and both assume the boot is a round already in play.
  - test/pause-speed.test.js `boot()`: 'the HUD names the kind from boot' `deepEqual`s the
    first frame's texts to exactly `hudAt(START_GOLD)`, the bar alone. 'P and F reach the
    toggles…' expects `p` to pause before any start. 'a click on Pause or 1x…' expects the
    first click to toggle. 'a click on the bar never places a tower' expects a board click to
    place a lantern.
  - test/upgrade.test.js `bootMain()`: its one test expects the first board click to place a
    lantern and the first frame to start with 'Lives'.

  Each of those tests goes red on a `'ready'` boot, whatever the overlay draws. A boot with no
  input must now draw the start screen. Only two outcomes would avoid that edit. One is to
  open main.js `'playing'`, which drops the issue's reason for being ("spawns the moment the
  page loads"). The other is to keep the title out of `fillText`, which dodges the assertion.
  This plan takes neither.

  The edit is one line in each boot helper, after the `import` of main.js: press Enter once,
  as a player does, so the harness hands its tests the round in play it always handed them.
  No test body, assertion or expected value changes. This is the same harness, and the same
  kind of amendment, that print 47 made. The issue's "no existing test file is edited" was
  written in the belief that a default of `'playing'` keeps every suite green (its own words:
  "so every existing test under `test/` keeps passing unedited"). It holds for every suite that
  builds games with `createGame()`: game-over, render, hud, game, tower-cost and the rest stay
  unedited. It cannot hold for the two suites that boot main.js itself. `reproduces:` locks
  only test/start-screen.test.js, a new file, so no locked test is touched.

touches:
  - src/game.js
  - src/render.js
  - src/hud.js
  - src/main.js
  - test/start-screen.test.js
  - test/pause-speed.test.js
  - test/upgrade.test.js

The suite these paths match: `test/**` (.hydraflow/layout.yaml), run with `node --test`.

`reproduces:` stays as signed: test/start-screen.test.js. It is new, written red first, and
stays in both lists. src/theme.js is not touched: the overlay paints only in existing THEME
tokens (see step 4).

Every other suite stays unedited and must pass as it stands. I checked each lock:
- test/game-over.test.js: `restart` of a default game is `'playing'` and spawns on its first
  step, which still holds because the default stays `'playing'`. 'restart keeps the options'
  holds, and `options` gains `status`, which no test `deepEqual`s.
- test/render.test.js: 'a round in play draws none' `deepEqual`s a playing game's texts to
  the bar alone, and the overlay draws only on `'ready'`. 'a finished round draws its end card'
  holds, because the end card moves to `'won'`/`'lost'` only. 'holds no colour literal' holds,
  because no literal is added. 'every colour draw paints with is a THEME colour' draws no
  `'ready'` game, and the new test proves the overlay's colours are THEME's too.
- test/hud.test.js 'hudKey: P and F' maps `' '` to `null`, so Space must not go through
  `hudKey`. Enter and Space get their own `isStartKey` instead.
- test/brazier.test.js and test/frost.test.js count sprite-table calls on playing games, and
  the overlay draws its lantern by direct call, never through the table.

## Build order (red first, then green)

Every new check is an exact `equal` or `deepEqual`, with booleans asserted as
`equal(…, true)`. Each "draws neither" is a `deepEqual` to `[]`, paired in the same test with
the positive `deepEqual` on the `'ready'` game. No `notEqual`, `ok(!…)`, `includes` or `match`
is written, so neither baseline count can rise.

### 1. Reproducer: test/start-screen.test.js, committed red

It imports `createGame`, `step`, `start`, `restart` and `START_GOLD` from ../src/game.js,
`draw` from ../src/render.js, `START_BUTTON`, `startButtonAt`, `isStartKey`, `HUD_HEIGHT`,
`PAUSE_BUTTON` and `SPEED_BUTTON` from ../src/hud.js, `THEME` from ../src/theme.js and `TILE`
from ../src/path.js. It uses its own recording context: a Proxy that records each call with
the `fillStyle` and `strokeStyle` set when it was made, like test/render.test.js's. It also
uses its own main.js harness, copied from test/pause-speed.test.js's `boot()`.

- 'a game created ready is ready, and stepping it spawns nothing' (acceptance 1):
  `createGame({ status: 'ready' })` has status `'ready'`. After `step(game, 1)` five times,
  `[game.status, game.enemies.length, game.spawner.spawned]` is `['ready', 0, 0]`.
- 'start moves ready to playing, and the next step spawns the first ghost' (acceptance 2):
  `start(game)` returns `game`, status is `'playing'`, and after `step(game, 0.01)`,
  `game.enemies.length` is 1.
- 'start on a game already playing changes nothing' (acceptance 3): for a default game, and
  for a game stepped to one ghost, `structuredClone` the game before `start`. The game after
  `deepEqual`s the clone, and status is still `'playing'`. The same holds for `'won'` and
  `'lost'`.
- 'restarting a game created ready gives a ready game' (acceptance 4): create
  `{ status: 'ready' }`, `start` it, step it to one ghost, and set `status = 'lost'`.
  `restart(game).status` is `'ready'`, and the restarted game steps to no ghost.
  `createGame().options.status` is `'playing'`.
- 'drawing a ready game draws the title and Start; a playing game draws neither'
  (acceptance 5): the texts of `draw(ctx, createGame({ status: 'ready' }), null)` end with
  exactly `['Lantern Line', 'Light the lanterns. Stop the ghosts before they reach the
  gate.', 'Start', 'or press Enter or Space', '1', 'Hang lanterns on the grass', 'beside the
  path', '2', 'Each one shines on the nearest', 'ghost in range', '3', 'A ghost that reaches
  the gate', 'costs a life']`. Filtered to `'Lantern Line'` and `'Start'`, they give both, and
  the same filter over a playing game's texts gives `[]`. The ready game draws no end-card
  title.
- 'the start screen paints only in THEME colours, title in lanternPaperLit, button in
  hudAccent': every recorded colour is a THEME value. The `'Lantern Line'` `fillText` is in
  `THEME.lanternPaperLit`, and the `'Start'` `fillText` is in `THEME.hudAccentInk`. The
  `roundRect` filled `THEME.hudAccent` has args `[START_BUTTON.x, START_BUTTON.y,
  START_BUTTON.width, START_BUTTON.height, 10]`. A full-canvas `fillRect` in `THEME.hudBg`
  has args `[0, 0, 640, HUD_HEIGHT + 400]`.
- 'the Start button is the artboard's, centred under the bar': `START_BUTTON` is `{ x: 228,
  y: HUD_HEIGHT + 236, width: 184, height: 48 }`. `startButtonAt` is `true` at its centre and
  at its top-left corner, and `false` one pixel left of it, one pixel below it, and at the
  centres of PAUSE_BUTTON and SPEED_BUTTON.
- 'Enter and Space start; no other key does': `['Enter', ' ', 'p', 'Escape', 'u', '1']
  .map(isStartKey)` is `[true, true, false, false, false, false]`.
- 'in the browser, the game opens on the start screen and a click off Start does nothing':
  boot main.js. The first frame's texts end with the overlay's list above. Click a board cell
  (col 1, row 1), then the Pause centre. The next frame's texts are the same list, with
  `'Gold', String(START_GOLD)` and `'Pause'` still in the bar ahead of it. No lantern is placed
  and nothing is paused.
- 'in the browser, a click on Start begins the round': boot, click `START_BUTTON`'s centre.
  The next frame's texts are exactly the bar: `['Lives', '10', 'Gold', '50', 'Wave', '1 / 10',
  'Tower', 'Lantern', 'Pause', '1x']`. Clicking (col 1, row 1) then places a lantern, and the
  next frame's gold is `START_GOLD - LANTERN.cost`.
- 'in the browser, Enter or Space begins the round, and a held key's repeat does not': boot,
  then `key('Enter', true)` leaves the overlay drawn, and `key('Enter')` lifts it. A second
  boot does the same with `' '`.

It is red against the base: `start`, `START_BUTTON`, `startButtonAt` and `isStartKey` are not
exported.

### 2. src/game.js: the status option, `start`, and the comments

- `createGame` takes `status = 'playing'` and stores it in `options` (`const options = {
  waypoints, spawnInterval, waveSize, lives, gold, totalWaves, status }`). The game's `status`
  is that option. The field's comment becomes `// 'ready' on the start screen, 'playing',
  then 'won' or 'lost', and the round is over`. The comment above `createGame` adds that
  `status: 'ready'` opens a game on its start screen, still until `start`.
- `export function start(state)`, placed beside `restart`, is commented `// Begin a round
  that waits on its start screen: 'ready' becomes 'playing'; any other status is left as it
  is.` It sets `status = 'playing'` only when it is `'ready'`, and returns `state`.
- `restart`'s comment adds that a game opened `'ready'` comes back `'ready'`.
- `step`'s comment: "A round on its start screen or finished stays as it is, and a paused one
  as it was." The guard is unchanged, because `status !== 'playing'` already covers
  `'ready'`.

### 3. src/hud.js: the Start button and its keys

- After SPEED_BUTTON and PAUSE_BUTTON: `// The start screen's button (StartScreen.dc.html:
  184 × 48, 236px down the board), centred under the bar.` followed by `export const
  START_BUTTON = Object.freeze({ x: (WIDTH - 184) / 2, y: HUD_HEIGHT + 236, width: 184,
  height: 48 });`.
- `export function startButtonAt(x, y)` returns `inside(START_BUTTON, x, y)`, with the
  comment `// Whether a canvas point is on the Start button.`
- `export function isStartKey(key)` returns `key === 'Enter' || key === ' '`, with the comment
  `// Enter and Space start the round from the start screen; hudKey leaves both alone.`
- The header comment adds that main.js asks whether a pointer is on Start.

### 4. src/render.js: the start overlay, and the end card for won and lost only

- In `draw`, the end-card line becomes `if (state.status === 'won' || state.status === 'lost')
  drawEndCard(ctx, state.status);`. After `drawHud(…)`: `if (state.status === 'ready')
  drawStartScreen(ctx);`. It is drawn last, in canvas coordinates, over both the bar and the
  board. The comment above `draw` says so.
- `drawStartScreen(ctx)` is a private function placed after `drawEndCard`. It follows
  StartScreen.dc.html, with the board's y offsets moved down by HUD_HEIGHT. It uses fixed
  sizes and measures no text. Every colour is an existing THEME token, the nearest the theme
  holds where the artboard's own hex is not one:
  - The veil: `fillRect(0, 0, WIDTH, HUD_HEIGHT + HEIGHT)` in `THEME.hudBg`, hud.md's
    `--hud-bg` overlay.
  - The lantern: `drawLanternLight` and `drawLanternBody`, called directly at `(WIDTH / 2,
    HUD_HEIGHT + 78)` under `ctx.scale(2, 2)` about that point. They are the board's own
    sprites at the artboard's size.
  - The title: 'Lantern Line', `800 46px Inter, system-ui, sans-serif`, in
    `THEME.lanternPaperLit` (#f6c95c, the artboard's exact colour), centred at `HUD_HEIGHT +
    156`.
  - The tagline: `15px Inter, system-ui, sans-serif` in `THEME.hudMuted`, at `HUD_HEIGHT +
    188`.
  - The button: `roundRect(START_BUTTON.x, START_BUTTON.y, START_BUTTON.width,
    START_BUTTON.height, 10)` filled `THEME.hudAccent`. Then a play triangle, 12px wide at
    left of the text, filled `THEME.hudAccentInk`. Then 'Start', `800 17px Inter, system-ui,
    sans-serif`, in `THEME.hudAccentInk`, centred in the button.
  - The hint: 'or press Enter or Space', `12px …`, `THEME.hudMuted`, 16px below the button.
  - The steps: three rounded panels 170 × 46, radius 10, 10 apart and centred, with the panel
    bottoms 18px above the canvas foot, filled `THEME.dim`. Each panel has a numbered circle
    of radius 11 stroked in its colour (`hudAccent`, `hudGhost`, `hudDanger`) with the number
    in the same colour, then its text in `THEME.hudInk` at `11.5px` on two fixed lines.
  - The step texts are held as data, `const START_STEPS = [['Hang lanterns on the grass',
    'beside the path'], ['Each one shines on the nearest', 'ghost in range'], ['A ghost that
    reaches the gate', 'costs a life']];`. The wording is the artboard's, split where a 130px
    line breaks it.
  - Title and tagline are named once, as `const START_TITLE = 'Lantern Line'` and `const
    START_TAGLINE = 'Light the lanterns. Stop the ghosts before they reach the gate.'`.
- No colour literal is added. hud.js already imports nothing from render.js, so importing
  `START_BUTTON` into render.js makes no cycle.

### 5. src/main.js: open ready; Start, Enter and Space begin

- `let state = createGame({ status: 'ready' });`, with the comment `// on the start screen
  until Start, Enter or Space`.
- The click handler opens with: `if (state.status === 'ready') { if (startButtonAt(x, y))
  start(state); return; }`, with `pointAt` read first. The finished-round branch becomes
  `if (state.status !== 'playing')`, placed after the ready branch, and is unchanged otherwise:
  it restarts, and the fresh game is `'ready'` again. The comment above the handler says the
  start screen takes only a click on Start, and that a finished round's click goes back to the
  start screen.
- The keydown handler, after the kind: `if (state.status === 'ready' && isStartKey(event.key)
  && !event.repeat) { start(state); return; }`. The comment names Enter and Space. P, F and U
  stay blocked off the playing round by the existing guard.
- Imports gain `start` from ./game.js and `isStartKey` and `startButtonAt` from ./hud.js.

### 6. The two boot helpers (the amendment)

- test/pause-speed.test.js `boot()`, straight after `await import(…)`: `keys.keydown({ key:
  'Enter', repeat: false }); // main.js opens on the start screen; Enter begins the round, as
  a player does`.
- test/upgrade.test.js `bootMain()`: the same line after its `await import(…)`.
- Nothing else in either file changes.

### 7. Green

Run `node --test test/start-screen.test.js test/pause-speed.test.js test/upgrade.test.js
test/game-over.test.js test/render.test.js test/hud.test.js test/brazier.test.js
test/frost.test.js test/game.test.js`. That covers the reproducer, both amended harnesses and
every unedited suite that calls `createGame`, `restart`, `step`, `draw` or `hudKey`. Then run
`npm --prefix . run test` once, the line's named check. The whole suite also runs on the pull
request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/start-screen.test.js is committed red first and green
after. The only existing test files edited are the two boot helpers that the amendment names,
one line each, with no assertion changed. Each of the triage's criteria is proven by the new
file:

- A game created with `{ status: 'ready' }` has status `'ready'`, and stepping it spawns
  nothing.
- `start` moves it to `'playing'`, and the next step spawns the first ghost.
- `start` on a playing game changes nothing.
- Restarting a game created `'ready'` gives a `'ready'` game.
- Drawing a `'ready'` game draws "Lantern Line" and "Start", and drawing a playing game draws
  neither.

Beyond the triage, the new file proves the browser wiring the brief asks for: main.js opens
on the start screen, and a click on Start, Enter or Space begins the round.
