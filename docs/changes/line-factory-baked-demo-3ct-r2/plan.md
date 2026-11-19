# Plan: Add a simple start screen (line-factory-baked-demo-3ct-r2)

Bead lantern-line-factory-baked-demo-3ct, GitHub issue #13 (opened here as #49). Class: fix.

## What this plan read, and what it verified

- `docs/changes/line-factory-baked-demo-3ct-r2/triage.md`: read, and checked against the tree at b6091cc.
- `spec.md` and `plan/research.md`: **absent** from `docs/changes/line-factory-baked-demo-3ct-r2/`. Neither
  was committed by an earlier stage, so this plan reads neither. With no research there is no
  declared scope, and there is no ratified spec `touches:`. The only signed list is triage's.
- `src/game.js`, `src/render.js`, `src/main.js`, `test/*.test.js`, `design/hud.md`,
  `design/screens.yaml`, `design/screens/StartScreen.dc.html`, `work/m4-03-start-screen.md`: read.

### Where the triage does not match the tree

The defect is real: `createGame` has no start state, and the first frame of `src/main.js` calls
`step`, which spawns wave 1's first ghost. But triage describes the tree after M1 to M3, and this
tree has not had that work yet:

- `createGame` returns no `status` field. `step` never checks a status, so nothing stops a game.
- There is no `restart`, no `END_TITLES` and no end card in `src/render.js`. The win, lose and
  restart work is `work/m1-03-win-lose-restart.md`, and it has not landed.
- `test/game-over.test.js`, `test/pause-speed.test.js`, `test/gold.test.js`, `test/waves.test.js`,
  `test/brazier.test.js` and `test/hud.test.js` do not exist. The only suites are
  `test/game.test.js`, `test/path.test.js` and `test/targeting.test.js`.
- `src/main.js` has no keydown handler. Its click handler only places towers.

So this plan covers what the tree can hold. It adds the status that the start screen needs.
It does not build M1's restart or end cards (see "Not in this change").

## Who meets it

- person: the player, on the Start screen drawn at design/screens/StartScreen.png (source design/screens/StartScreen.dc.html; tokens and layout in design/hud.md under "Start screen"), who opens the game, sees the Start overlay before any ghost spawns, and starts wave 1 with the Start button, Enter or Space.

## Refusals

- none: `start` on a game that is not `'ready'` leaves it unchanged and returns quietly, and a
  click or key outside the Start screen does what it did before. Nothing new is refused or
  reported to a person or an agent.

## Changes

### src/game.js

- `createGame(...)` adds `status: 'ready'` to the state it returns. Any later restart that
  calls `createGame` with the same options starts at `'ready'` too.
- `export function start(state)`: if `state.status === 'ready'`, set it to `'playing'`. Any
  other status (`'playing'`, or `'won'`/`'lost'` when M1 adds them) is left alone. Returns `state`.
- `step(state, dt)`: first line `if (state.status !== 'playing') return state;`. While the game
  is ready nothing moves: no spawn timer, no enemies, no shots and no towers. Because the
  timer starts at 0, the first `step` after `start` spawns the first ghost.

### src/render.js

- Add the start-screen tokens from `design/hud.md` to a `HUD` constant: `bg`
  `rgba(18, 36, 28, 0.85)`, `ink` `#f4efe1`, `muted` `#b8c4b0`, `accent` `#f2c14e`,
  `titleFont` `bold 40px system-ui, sans-serif`, `font` `16px system-ui, sans-serif`,
  `buttonInk` `#12241c` and `buttonRadius` 6.
- Export `START_BUTTON`, the button's rectangle in canvas pixels: 160 by 44, centred
  horizontally, with its centre at 60% of `ROWS * TILE`. `main.js` hit-tests against it, so
  the drawing and the click use the same rectangle.
- In `draw`, after the board is drawn, if `state.status === 'ready'` call `drawStartScreen(ctx)`.
  It draws:
  - a full-canvas `HUD.bg` veil, so the path still shows faintly behind;
  - "Lantern Line", centred, in `titleFont` and `accent`, at 35% height;
  - "Light the lanterns. Stop the ghosts before they reach the gate." in `muted`, under the title;
  - the Start button, filled `accent` with rounded corners, labelled "Start" in `buttonInk`;
  - "or press Enter or Space" in `muted`, under the button;
  - the artboard's three how-to-play steps in `ink`: "1 Hang lanterns on the grass beside the
    path", "2 Each one shines on the nearest ghost in range", "3 A ghost that reaches the gate
    costs a life".

  The artboard takes precedence over the brief where they differ (design/hud.md says so). So
  the hint line and the three steps are drawn as well.
  Rounded corners use `ctx.roundRect` when the context has it, and `fillRect` when it does not,
  so a test can use a plain fake context. There is no end card in this tree, so nothing else
  in `draw` changes.

### src/main.js

- Import `start` from `game.js` and `START_BUTTON` from `render.js`.
- Click: if `state.status === 'ready'`, call `start(state)` when the click lands inside
  `START_BUTTON` (canvas coordinates, worked out the way `cellAt` does), and place no tower
  either way. Otherwise place a tower as today.
- `window` keydown: when `state.status === 'ready'` and `event.key` is `'Enter'` or `' '`, call
  `preventDefault()` (so Space does not scroll the page) and then `start(state)`.
- Hover on the Start screen is left as it is. The overlay covers it.
- When M1 adds restart, a click on a finished round should still restart. That branch belongs
  to M1's handler. This change keeps the click handler's `'ready'` branch separate so M1 can
  add it.

### test/start-screen.test.js (new, the reproducer, written red first)

Uses `node:test` and `node:assert/strict`, as the other suites do. Each "nothing" assertion is
paired with a positive one, as the testing standard's negative-assertion-unpaired count requires:

1. A new game, and a second game from `createGame` with the same options (the restart path,
   because M1's restart is `createGame` with the same options), has `status` `'ready'`. After
   `step(game, 5)` it has `enemies.length === 0`, its `spawnTimer` is unchanged and its status
   is still `'ready'`.
2. `start(game)` returns with `status === 'playing'`, and the next `step(game, 0.01)` gives
   `enemies.length === 1`.
3. `start` on a game whose status is `'playing'`, `'won'` or `'lost'` (set by hand, because M1
   has not built them yet) leaves the status and the rest of the state deep-equal to before.
4. `draw(fakeCtx, readyGame, null)` records a `fillText` of "Lantern Line" and of "Start".
   `draw(fakeCtx, playingGame, null)` records neither, and records "Lives:". The fake context
   is a small recorder object with no-op path methods. That is how "draws the Start overlay and
   not an end card" is tested in a tree with no end card.

### test/game.test.js

`step` does nothing while the game is ready, so each test that steps a game must start it first:

- `quietGame` calls `start(game)` after it sets `spawnTimer = Infinity`.
- "enemies spawn on the interval" calls `start(game)` before its first `step`.
- "a new game starts with full lives and an empty board" is left as it is.

`test/path.test.js` and `test/targeting.test.js` never call `createGame` or `step`. They are
left unchanged.

## Touches amendment

- reason: the signed list in triage names six test files that do not exist in this tree
  (`test/game-over.test.js`, `test/pause-speed.test.js`, `test/gold.test.js`,
  `test/waves.test.js`, `test/brazier.test.js`, `test/hud.test.js`). They were written against
  a tree that already had M1 to M3. Writing them here would create suites with nothing to test.
  The fix needs only the source files, the reproducer and the one existing suite that steps a
  fresh game.

touches:
  - src/game.js
  - src/render.js
  - src/main.js
  - test/start-screen.test.js
  - test/game.test.js

reproduces:
  - test/start-screen.test.js

The suite is `node --test` over `test/`, the line's test paths, run as `npm --prefix . run test`.
No existing test is locked by `reproduces:`. The only locked test is the new
`test/start-screen.test.js`, which stays in both lists.

## Not in this change

- Restart, the win and lose cards, and "a finished round restarts on a click": these are
  `work/m1-03-win-lose-restart.md`. That work builds on this one. Its restart should call
  `createGame` with the same options, so it returns to `'ready'`. Its click handler should
  restart a `'won'`/`'lost'` game and leave the `'ready'` branch alone. Its end-card lookup in
  `draw` should skip `'ready'`.

## Verification for build

- Red first: `node --test test/start-screen.test.js` fails before the source changes.
- Green: `node --test test/start-screen.test.js test/game.test.js`, then `npm --prefix . run test`.
- The standards counts in `tests/architecture/*_baseline.json` stay at 0. No suppressions are
  added, and every negative assertion is paired.
