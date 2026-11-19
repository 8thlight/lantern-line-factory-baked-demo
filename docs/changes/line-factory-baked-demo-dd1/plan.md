# Plan: save the best wave reached and show it on the start screen (print line-factory-baked-demo-dd1)

GitHub issue #17, filed again as issue #60, bead lantern-line-factory-baked-demo-dd1. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-dd1/triage.md: read. It carries the issue, the brief,
  the 2026-11-19 ruling (build on current main, add the Best line to the existing start
  screen), the signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no spec.md under docs/changes/line-factory-baked-demo-dd1/
  and none anywhere in the tree. The triage's brief and lists stand in for it, as they did
  for prints 36 to 58.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The base: the print branch was cut from 6658250, before the start screen. The ruling says to
  build on current main, so c8da6c3 takes origin/main in at bd50fcf (print 58, PR #59). Every
  claim below is checked against that base.
- I checked the triage's claims against that base:
  - True: there is no src/best.js, and nothing under src/ or test/ reads or writes storage.
  - True: src/main.js holds one `let state`. When a click lands on a `'won'` or `'lost'`
    game, it replaces the state with `restart(state)` and records nothing about
    `state.wave`.
  - True: `draw` in src/render.js calls `drawStartScreen(ctx)` while
    `state.status === 'ready'`. That function draws the title, the tagline, the Start button,
    the hint and the three steps (START_STEPS), and nothing about a best.
  - True: `state.wave` is the wave the run reached. `tick` in src/game.js raises it only when
    a wave is cleared and another one follows. A win leaves it at `totalWaves`, and a loss
    leaves it at the wave the run lost on.
- Something the triage leaves out: Node 22.18 in this container has no `localStorage` global
  (`typeof localStorage` is `'undefined'`, and `'localStorage' in globalThis` is false).
  test/start-screen.test.js, test/pause-speed.test.js and test/upgrade.test.js all import
  src/main.js with only `document`, `window` and `requestAnimationFrame` stubbed. A bare
  `localStorage` reference at boot would throw a ReferenceError and turn all three red.
  Those files are outside `touches:`. So main.js reads the storage as
  `globalThis.localStorage`, and best.js treats a missing storage as an empty one. In a browser
  with storage turned off, reading `localStorage` can throw a SecurityError. best.js catches
  that error, so a game whose storage is broken still runs. It just has no best.
- Standards: tests/architecture/assertion_baseline.json holds `negative-assertion-unpaired`
  and `substring-binding` at 0. Print 58 met that by matching drawn text exactly
  (a7e38f9). The new test asserts exact strings, and its one "no Best" assertion is paired
  with a positive assertion on the same draw.
- Source read: src/main.js, src/render.js (`draw`, `drawStartScreen`, START_STEPS, its
  imports), src/hud.js (CANVAS_HEIGHT, START_BUTTON), and src/game.js (`createGame`,
  `restart`, `start`, `step`, `tick`'s wave and status changes). Tests read: the
  test/start-screen.test.js recording context and its main.js boot, plus the boot stubs in
  test/pause-speed.test.js and test/upgrade.test.js. Design read: design/hud.md (Start screen),
  design/screens.yaml (StartScreen) and design/screens/StartScreen.dc.html. None of them
  draws a Best line. .hydraflow/layout.yaml gives the test paths `e2e/**` and `test/**`.

## Who meets it

- person: the player, on the start screen drawn at design/screens/StartScreen.png (source
  design/screens/StartScreen.dc.html, listed in design/screens.yaml). Once a run has ended,
  won or lost, the start screen that follows the restart, and the one shown on every later
  visit, carries one more line, "Best: wave N". N is the highest wave any run has reached.
  A player who has never finished a run sees the start screen exactly as the artboard draws
  it, with no Best line. The artboard does not draw this line. design/ is outside
  `touches:`, so its placement and tokens are named below from the tokens design/hud.md
  already declares.

## Refusals

- none: this change refuses nothing new. A missing, unreadable or broken storage reads as no
  best, and the write that follows is attempted anyway. A lower wave leaves the saved best as
  it was. None of these is a refusal: no function returns or shows a reason, and the player
  is never told no.

## Touches

The signed list holds the work as it is, with no amendment:

- src/best.js (new)
- src/render.js
- src/main.js
- test/best.test.js (new, the reproducer, written red first)

## Build steps

### 1. test/best.test.js, red first

Commit it before any src change, so that it fails: src/best.js does not exist yet, and
`draw` takes no best. It uses `node:test` and `node:assert/strict`. The storage is a plain
object `{ getItem(k) { return k in this.items ? this.items[k] : null }, setItem(k, v)
{ this.items[k] = String(v) }, items: {} }`, the same shape as the browser's `Storage`. It
uses its own recording context and `textsOf`, copied in shape from
test/start-screen.test.js.

- After a run that reached wave 7, `writeBest(storage, 7)` is called, and then `readBest(storage)` is
  `7`.
- On that storage, `writeBest(storage, 4)` leaves `readBest` at `7`, and then
  `writeBest(storage, 9)` makes it `9`.
- An empty storage gives `readBest` of `null`.
- A storage whose key holds `'seven'` gives `readBest` of `null`. Then `writeBest(storage, 3)`
  makes `readBest` `3`.
- A storage whose `getItem` and `setItem` throw: `readBest` is `null`, and `writeBest` does
  not throw.
- `readBest(undefined)` is `null`, and `writeBest(undefined, 5)` does not throw.
- Drawing `createGame({ status: 'ready' })` with best `7` gives exactly one `fillText` text
  starting with `'Best'`. With `deepEqual`, that list is `['Best: wave 7']`.
- Drawing it with best `null` gives `[]` for that list. On the same draw, the texts still
  include the title `'Lantern Line'`, which is the positive assertion the negative one is
  paired with.
- Drawing a `'playing'` game with best `7` gives `[]` for that list, paired with a positive
  assertion that the HUD drew. So the Best line is the start screen's alone.

### 2. src/best.js (new)

The header comment says that the best wave any run has reached is kept in a `Storage`
handed in, so that a plain object stands in for the browser's.

- `export const BEST_KEY = 'lantern-line.best-wave';`
- `export function readBest(storage)`: inside `try`, it reads `storage.getItem(BEST_KEY)` and
  returns `Number(raw)` when `raw` is not null and `Number.isInteger(Number(raw))` and the
  value is at least 1. Otherwise it returns `null`. A `catch` returns `null` too. That
  covers a missing storage (`undefined.getItem` throws) and a browser that refuses access.
- `export function writeBest(storage, wave)`: `const best = readBest(storage);` If
  `best !== null && best >= wave`, it returns `best`. Otherwise, inside `try`, it calls
  `storage.setItem(BEST_KEY, String(wave))`, and an empty `catch` ignores a failure. It
  returns `wave`. An unreadable value reads as `null`, so a write replaces it.
- Neither function touches the game state.

### 3. src/render.js: the Best line

- `draw(ctx, state, hover, sprites = SPRITES, kind = null, selected = null, best = null)`.
  `if (state.status === 'ready') drawStartScreen(ctx, best);`. The comment above `draw`
  names `best` as the saved best wave, or null, shown only on the start screen.
- `drawStartScreen(ctx, best)`: after the tagline, `if (best !== null)` it draws
  `` `Best: wave ${best}` `` in `bold 14px system-ui, sans-serif`, `THEME.hudInk`, centred,
  at y `titleY + 62` (216). That is midway between the tagline (190) and the top of the
  Start button (242). No colour literal is added, so test/render.test.js passes unedited.
  With `best` null, the function draws exactly what it draws today.

### 4. src/main.js: save once when a run ends, and hand the best to draw

- `import { readBest, writeBest } from './best.js';`
- `const storage = globalThis.localStorage; // undefined outside a browser, where best.js reads it as empty`
- `let best = readBest(storage); // the best wave any run has reached, shown on the start screen`
- In `frame`, around `step`: `const before = state.status;` then `step(state, dt);` then
  `if (before === 'playing' && (state.status === 'won' || state.status === 'lost')) best =
  writeBest(storage, state.wave);`. Its comment says a run ends exactly once, on the step
  that wins or loses it, so the wave it reached is saved once. The run is saved even if the
  player never clicks to restart.
- `draw(ctx, state, hover, SPRITES, kind, selected, best);`
- The click handler, the restart and the keys are unchanged. The restarted game opens
  `'ready'` and its start screen shows the best that was just saved.

### 5. Green

Run `node --test test/best.test.js test/start-screen.test.js test/pause-speed.test.js
test/upgrade.test.js test/render.test.js test/game-over.test.js`. That covers the reproducer, the three suites that boot
main.js, and the suites that call `draw`. Then run `npm --prefix . run test` once, which is
the line's named check. The whole suite also runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/best.test.js is committed red first and is green
after. Every existing test passes unedited. Each of the issue's criteria is proven with a
plain object as the storage:

- After a run that reached wave 7, `readBest` returns 7.
- A later run that reached wave 4 leaves the best at 7, and one that reached wave 9 makes
  it 9.
- A storage holding text that is not a number reads as no best, and a write still works.
- The start screen's drawn text includes "Best: wave 7" when the best is 7, and no "Best"
  when there is none.
