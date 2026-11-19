# Plan: a start screen before the first wave (print 58)

This print follows print line-factory-baked-demo-3ct-r3 (GitHub issue #13, bead
lantern-line-factory-baked-demo-3ct), which the fail-forward skill retired as a train-wreck.
Its locked reproducer, test/start-screen.test.js, was a new file outside its `touches:`, so
the scope gate flagged it. This print's signed `touches:` names test/start-screen.test.js,
so the same work fits in it. Class: fix.

## Inputs verified

- docs/changes/58/triage.md: read. It carries the issue, the brief, the signed `touches:`
  and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no docs/changes/58/spec.md and none anywhere in the
  tree, so nothing is read from it. The triage's brief and lists stand in for it, as they did
  for prints 36, 42, 47 and 54.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The retired print's work: the triage says it is "complete and green (175/175) on
  print/line-factory-baked-demo-3ct-r3 at 9a3718c", with the red-first reproducer at 569754e.
  Neither commit is in this clone (`git cat-file -t 9a3718c`: not a valid object name, the
  same for 569754e), and origin is a local path that does not exist in this container, so
  neither can be fetched. This plan does not depend on them. Every change is spelled out
  below, so build can write it from scratch. If build can reach 9a3718c, it may take that
  work in, but only where it matches this plan.
- The base: 53f5ac9 has main in at 0bc4310 (print 54: the boss wave), so no further merge is
  needed before build.
- I checked the triage's claims against that base:
  - True: `createGame` in src/game.js takes no `status` option, returns `status: 'playing'`,
    and keeps `{ waypoints, spawnInterval, waveSize, lives, gold, totalWaves }` in `options`.
    `restart` returns `createGame(state.options)`.
  - Partly true: `step` returns early on `state.status !== 'playing' || state.paused`. That
    already holds a `'ready'` game still, so `step` needs no code change, only its comment.
    The plan's tests still prove it.
  - True: src/game.js exports no `start`.
  - True: src/main.js boots with a bare `createGame()`. Its click handler restarts on any
    status but `'playing'`. Its keydown does nothing with Enter or Space.
  - True: `draw` in src/render.js calls `drawEndCard` on any status but `'playing'`, and
    draws no start overlay.
  - True: the main.js boot helpers, `boot` in test/pause-speed.test.js and `bootMain` in
    test/upgrade.test.js, expect a game in play at the first frame. Once main.js opens
    `'ready'`, each needs one Enter press after the import.
- Source read: src/game.js, src/hud.js, src/main.js, src/render.js (`draw`, `drawHud`,
  `drawButton`, `drawEndCard`), src/tower.js `kindForKey`, src/theme.js tokens. Tests read:
  test/game-over.test.js, test/pause-speed.test.js (`boot` and its tests),
  test/upgrade.test.js (`bootMain` and its test), test/hud.test.js `hudKey`, and
  test/render.test.js (the colour-literal and THEME-colour checks, and the `draw` calls on
  `'lost'`/`'won'`). .hydraflow/layout.yaml gives test paths `e2e/**`, `test/**`.
  The knowledge vault's inbox note on print lbn says a new reproducer must stay in
  `touches:`, and test/start-screen.test.js does.
- Design read: design/hud.md (Tokens, Start screen), design/screens.yaml (the StartScreen
  entry), and design/screens/StartScreen.dc.html (its copy: the title, the tagline, Start,
  "or press Enter or Space", and three numbered steps). The artboard's own colours (#f6c95c,
  #d8d2c2, the step badge tints) are not THEME tokens. src/theme.js is outside `touches:`,
  and test/render.test.js forbids a colour literal in src/render.js, so the overlay draws
  with existing tokens only: `hudBg`, `hudAccent`, `hudMuted`, `hudInk`, `hudAccentInk`.
  The button's dark text (`#12241c` in the brief) is already `THEME.hudAccentInk`.

## Who meets it

- person: the player, opening the game, on the StartScreen artboard
  (design/screens/StartScreen.png, source design/screens/StartScreen.dc.html). The page
  loads to the board under a dark veil, with the title "Lantern Line", the line "Light the
  lanterns. Stop the ghosts before they reach the gate.", a gold Start button, "or press
  Enter or Space", and the three how-to-play steps. No ghost moves. A click on Start, or
  Enter or Space, takes the veil away and wave 1 begins. After a won or lost round, a click
  restarts the game and the start screen shows again.

## Refusals

- none: this change refuses nothing new. `start` on a game that is not `'ready'` leaves it
  as it was, the way `step` leaves a finished round. No function returns a reason, and the
  player is told nothing new is refused.

## Touches

The signed list holds the whole change, so it is not amended:

touches:
  - src/game.js
  - src/render.js
  - src/hud.js
  - src/main.js
  - test/start-screen.test.js
  - test/pause-speed.test.js
  - test/upgrade.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with
`node --test`.

`reproduces:` stays as signed: test/game-over.test.js. It is run and not edited, and it must
pass. Every game it makes is built without `status`, so it starts `'playing'`, and its
restart test still reads `'playing'`. test/start-screen.test.js is new, so it is written red
first.

src/theme.js is not in `touches:` and needs no change (see Inputs verified).

Every other suite stays unedited and must pass as it stands. I checked each one:
- test/render.test.js draws `createGame()` games (playing) and `'lost'`/`'won'` copies. The
  end card still draws for those two, and no start overlay draws for any of them. No colour
  literal is added to src/render.js.
- test/hud.test.js asserts `hudKey(' ')` is `null`. `hudKey` is not changed. Enter and Space
  get their own `startKey`.
- test/game.test.js, test/boss.test.js and the rest build games without `status`.

## Build order (red first, then green)

Every new check is an exact `equal`/`deepEqual`, with booleans asserted as `equal(…, true)`
or `equal(…, false)`. No `notEqual`, `notDeepEqual`, `ok(!…)` or `doesNotMatch` is written,
so the assertion baseline (javascript `negative-assertion-unpaired: 0`) cannot rise.

### 1. Reproducer: test/start-screen.test.js, committed red

Imports `START_GOLD`, `createGame`, `restart`, `start`, `step` from ../src/game.js;
`HUD_HEIGHT`, `PAUSE_BUTTON`, `START_BUTTON`, `startButtonAt`, `startKey` from
../src/hud.js; `draw` from ../src/render.js; `THEME` from ../src/theme.js; `TILE` from
../src/path.js. It has its own recording context (the Proxy one from
test/pause-speed.test.js, keeping `fillStyle` on each call) and `textsOf(calls)`. A helper,
`startTexts(calls)`, keeps only the texts `'Lantern Line'` and `'Start'`.

- 'a game created ready is ready, and stepping it spawns nothing': `createGame({ status:
  'ready' })` has status `'ready'`. After `step(game, 5)`, `[status, enemies.length, wave]`
  is `['ready', 0, 1]`.
- 'start moves a ready game to playing, and the next step spawns the first ghost':
  `start(game)` returns the game, and its status is `'playing'`. After `step(game, 0.01)`,
  `enemies.length` is 1.
- 'start on any other status changes nothing': for each of `'playing'`, `'won'`, `'lost'`,
  a game with that status, stepped 0.01 s first when playing. A `structuredClone` of
  `{ status, wave, enemies, lives, gold }` before `start` deep-equals one after.
- 'a game created without status starts playing': `createGame().status` is `'playing'`.
- 'restarting a game created ready gives a ready game': `createGame({ status: 'ready',
  lives: 4 })`, started, stepped, then set `'lost'`. `restart` of it has
  `[status, lives]` equal to `['ready', 4]`.
- 'drawing a ready game draws the title and Start, a playing game neither': `draw` of a
  ready game, then `startTexts` is `['Lantern Line', 'Start']`. The texts also hold the
  tagline "Light the lanterns. Stop the ghosts before they reach the gate." and
  "or press Enter or Space", each `includes` asserted `equal(…, true)`. For a playing game
  and for `'won'`/`'lost'` copies, `startTexts` is `[]`.
- 'a ready game draws no end card': `draw` of a ready game, and the texts include neither
  end title. Asserted as `textsOf(calls).filter((t) => t === 'The ghosts got through' ||
  t === 'The path is safe')` deep-equal `[]`.
- 'the Start button sits as the brief places it': `START_BUTTON` deep-equals
  `{ x: 240, y: 242, width: 160, height: 44 }`, centred across the 640-wide canvas at 60% of
  its 440 height. The `roundRect` filled in `THEME.hudAccent` in a ready game's draw has
  those four values as its first four arguments.
- 'startButtonAt hits only the Start button': its centre and its top-left corner are
  `true`; one pixel left of it, one pixel below it, and the Pause button's centre are
  `false`.
- 'startKey is Enter and Space only': `['Enter', ' ', 'p', 'Escape', 'a'].map(startKey)` is
  `[true, true, false, false, false]`.
- In the browser, with a `boot` like test/pause-speed.test.js's (the DOM stand-ins, the
  window's keydown, the frame queue, a fresh `?start=N` import each case):
  - 'main.js opens on the start screen, and a click off Start does nothing': the first
    frame's `startTexts` is `['Lantern Line', 'Start']`. A click on board cell (1, 1) and
    a press of 'p' leave the next frame's texts holding the title, with gold still
    `String(START_GOLD)` in the bar.
  - 'Enter starts the round': after `key('Enter')`, the next frame's `startTexts` is `[]`
    and its texts start `['Lives', …]` as a playing game's bar.
  - 'Space starts the round': the same with `key(' ')`.
  - 'a click on Start starts the round': a click at `START_BUTTON`'s centre, then the same.
  - 'a held Enter does not start': `key('Enter', true)` leaves the title drawn.

Red against the base: `start`, `START_BUTTON`, `startButtonAt` and `startKey` are not
exported, `createGame` ignores `status`, and main.js boots playing.

### 2. src/game.js: `status` and `start`

- `createGame` takes `status = 'playing'` and keeps it in `options`, so
  `options = { waypoints, spawnInterval, waveSize, lives, gold, totalWaves, status }`, and
  returns `status` in place of the literal. The comment on the field becomes `'ready'`
  until started, `'playing'`, then `'won'` or `'lost'`. The comment above `createGame` says
  that `status` left out starts the game playing, and `'ready'` holds it on the start
  screen, and `restart` brings it back the same way.
- `export function start(state)`: `if (state.status === 'ready') state.status = 'playing';
  return state;`. Its comment: begin a ready game's first wave; any other status is left as
  it is.
- `step` is unchanged in code. Its comment gains that a ready game stays as it is, like a
  finished or paused one.

### 3. src/hud.js: the Start button and its keys

- `const CANVAS_HEIGHT = HUD_HEIGHT + ROWS * TILE;` (440), with `ROWS` joining the import
  from ./path.js.
- `export const START_BUTTON = Object.freeze({ x: WIDTH / 2 - 80, y: Math.round(0.6 *
  CANVAS_HEIGHT) - 22, width: 160, height: 44 });`, which is `{ x: 240, y: 242, width: 160,
  height: 44 }`. Its comment: design/hud.md's Start button, 160 by 44, centred across the
  canvas at 60% of its height.
- `export function startButtonAt(x, y)`: `inside(START_BUTTON, x, y)`.
- `export function startKey(key)`: `key === 'Enter' || key === ' '`. Its comment says that
  Enter or Space starts a ready round, and `hudKey` leaves them alone.
- The header comment names the Start button among the hit tests.

### 4. src/render.js: the start overlay, and the end card for won or lost only

- In `draw`, `if (state.status !== 'playing') drawEndCard(…)` becomes
  `if (state.status === 'won' || state.status === 'lost') drawEndCard(…)`. After
  `drawHud(…)`: `if (state.status === 'ready') drawStartScreen(ctx);`. The comment above
  `draw` says the start screen covers the whole canvas, bar included, while the game is
  ready. A playing, won or lost game draws exactly what it draws today.
- `drawStartScreen(ctx)`, after `END_TITLES`, with its comment naming design/hud.md's Start
  screen and the StartScreen artboard. In canvas coordinates, `CANVAS_HEIGHT = HUD_HEIGHT +
  HEIGHT`, all centred on `WIDTH / 2`, `textBaseline` `'middle'`, between `save` and
  `restore`:
  - `fillRect(0, 0, WIDTH, CANVAS_HEIGHT)` in `THEME.hudBg`.
  - 'Lantern Line' in `bold 40px system-ui, sans-serif` (`--title-font`),
    `THEME.hudAccent`, at y `Math.round(0.35 * CANVAS_HEIGHT)` (154).
  - The tagline in `16px system-ui, sans-serif`, `THEME.hudMuted`, at y 190.
  - The button: `roundRect(START_BUTTON.x, START_BUTTON.y, START_BUTTON.width,
    START_BUTTON.height, BUTTON_RADIUS)` filled `THEME.hudAccent`, then 'Start' in
    `bold 17px system-ui, sans-serif`, `THEME.hudAccentInk`, at its centre.
  - 'or press Enter or Space' in `12px system-ui, sans-serif`, `THEME.hudMuted`, at y 302.
  - The three steps, from the artboard, in `12px system-ui, sans-serif`, `THEME.hudInk`,
    at y 340, 362 and 384: '1  Hang lanterns on the grass beside the path',
    '2  Each one shines on the nearest ghost in range',
    '3  A ghost that reaches the gate costs a life'.
  - `START_BUTTON` joins the import from ./hud.js.
- No colour literal is added, so test/render.test.js passes unedited.

### 5. src/main.js: open ready, and start on Start, Enter or Space

- `let state = createGame({ status: 'ready' });`. `start` joins the import from
  ./game.js, and `startButtonAt` and `startKey` join the import from ./hud.js.
- The click handler first: `if (state.status === 'ready') { const { x, y } = pointAt(event);
  if (startButtonAt(x, y)) start(state); return; }`. Then the won/lost branch, its test
  narrowed to `state.status === 'won' || state.status === 'lost'`, restarts as today. The
  restarted game opens `'ready'`, on the start screen. The comment above the handler says
  so.
- In keydown, after `kind = kindForKey(…)`: `if (state.status === 'ready' &&
  startKey(event.key) && !event.repeat) { start(state); return; }`. The comment above it
  names Enter and Space.
- Everything else is unchanged. P, F and U already do nothing unless the status is
  `'playing'`.

### 6. The boot helpers: one Enter press each

- test/pause-speed.test.js `boot`: after `await import(…)`, add
  `keys.keydown({ key: 'Enter', repeat: false }); // past the start screen, into the round`.
- test/upgrade.test.js `bootMain`: the same line after its import.
- No assertion changes in either file. Each test still proves what it proved, on a game in
  play.

### 7. Green

`node --test test/start-screen.test.js test/pause-speed.test.js test/upgrade.test.js
test/game-over.test.js test/render.test.js test/hud.test.js test/game.test.js` runs the
reproducer, the two edited suites, the locked reproducer, and the unedited suites that call
`createGame`, `step`, `draw` or the HUD hit tests. Then `npm --prefix . run test` runs once,
the line's named check. The whole suite also runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes, with test/start-screen.test.js committed red first and
green after, and test/game-over.test.js green and unedited. Each of the issue's criteria is
proven:

- A game created with `{ status: 'ready' }` has status `'ready'`, and stepping it spawns
  nothing.
- `start` moves status to `'playing'`, and the next step spawns the first ghost.
- `start` on a game already playing, won or lost changes nothing.
- Restarting a game that was created `'ready'` gives a game whose status is `'ready'`.
- Drawing a `'ready'` game draws the title "Lantern Line" and a Start button. Drawing a
  playing game draws neither.
- In the browser, the game opens on the start screen, and a click on Start, Enter or Space
  begins wave 1.
