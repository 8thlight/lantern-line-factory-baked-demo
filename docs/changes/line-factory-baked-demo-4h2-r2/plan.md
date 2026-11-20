# Plan: pick one of five paths at random for each round (print line-factory-baked-demo-4h2-r2)

GitHub issue #81, opened again as issue #89, bead lantern-line-factory-baked-demo-4h2. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-4h2-r2/triage.md: read. It carries the brief in full, the
  signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is none under docs/changes/line-factory-baked-demo-4h2-r2/
  and none anywhere else in the tree, so nothing is read from it. The triage's brief and lists
  stand in for it, as they did for the prints before this one (see the 54a-r2 plan).
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the brief in full.
- The base: the print branch was cut from 6658250, the line's first merge, which has no
  test/card-buttons.test.js, test/sell.test.js or test/upgrade.test.js. origin/main had moved on
  to 16d6fde (print hqr, PR #82). b643124 takes origin/main in at 16d6fde. The branch held only
  triage files, so the merge was clean. Every claim below is checked against that base.
- I checked the triage's claims against that base:
  - True: src/path.js exports `WAYPOINTS` (corners `0,2` `5,2` `5,7` `10,7` `10,3` `15,3`) and no
    `PATHS` or `pickPath`.
  - True: `createGame` in src/game.js takes `waypoints = WAYPOINTS`, keeps it in `options`, and
    builds `state.waypoints` and `state.path = pathCells(waypoints)` from it. `restart(state)` is
    `createGame(state.options)`. `chooseDifficulty` is
    `createGame({ ...state.options, status: 'ready', difficulty: key })`, so it already keeps the
    waypoints. There is no `nextRound`.
  - True: src/main.js opens with `createGame({ status: 'ready', difficulty: 'normal' })` and calls
    `restart` once, in the click handler when the status is `'won'` or `'lost'`. Nothing else in
    src/ calls `restart`.
  - True: enemies start at `pointAlong(state.waypoints, 0)` (src/enemy.js `createEnemy`, from
    `spawnEnemy` and `spawnBoss`), and placement refuses with `'path'` from `state.path`.
  - The numbers hold. On the 16 by 10 board, `pathLength` over `TILE` of the five paths is 24, 24,
    24, 26 and 24. DIFFICULTIES gives hard 8 lives and 60 gold.
- I built the change in a scratch copy and booted it with each of the five draws forced
  (`Math.random` set to `(i + 0.5) / 5` in a preload), running every file that imports
  src/main.js: test/card-buttons, difficulty-choice, best, pause-speed, sell, start-screen and
  upgrade. Paths 1, 2, 3 and 5 are all green. Path 4 (row 1, columns 0 to 7) reds four tests:
  - test/card-buttons.test.js 'in the browser, a click on Upgrade upgrades …' (clicks (1, 1));
  - test/sell.test.js 'in the browser, S sells the selected tower once per press …' (clicks (1, 1));
  - test/upgrade.test.js 'in the browser, a click selects a tower, U upgrades it …' (clicks (1, 1));
  - test/pause-speed.test.js 'the hover clears over the bar' (hovers (3, 1) and expects one
    `THEME.hover` fill; on path 4 it is `THEME.hoverBad`).
  The triage named the first three. The fourth is not in the signed `touches:`; see
  '## Touches amendment'. With `Math.random` pinned to `() => 0` around the `await import` of
  src/main.js in those four files, all seven files are green under all five forced draws (80 of
  80 each time). No boot in them reaches a won or lost round, so `nextRound` never draws in them.
- Standards: tests/architecture/assertion_baseline.json holds `negative-assertion-unpaired`
  and `substring-binding` at 0. The new test uses only exact `assert.equal` and
  `assert.deepEqual`, with no `notEqual`, `ok(!…)`, prefix or substring filter.
- Knowledge vault (0-Inbox), all met:
  - "A print branch cut before main moved must merge main before the plan reads it": met by
    b643124.
  - "A triage can describe code the print's tree does not have yet": met by the checks above.
  - "Randomness at main.js boot reds the tests that boot it unless they pin Math.random": met by
    the forced-draw runs above; it is why test/pause-speed.test.js is added.
  - "A touches amendment must keep a new reproducer that the signed list named":
    test/random-paths.test.js stays in both `touches:` and `reproduces:`.
  - "A no-such-text check written as a prefix filter trips the assertion baseline": met by the
    exact-assertion rule above.

## Who meets it

- person: a player starting a round, on the board every screen sits on
  (design/screens/Board.dc.html:16, the stone path that winds from the left edge to the right).
  Each time the game opens, and each time they press Play again or Try again after a round ends,
  the path is one of five, each equally likely, so the ghosts walk a different road and the
  good tower spots move. Choosing a difficulty on the start screen keeps the path already drawn.
  The board, the ghosts, the refusal of a tower on the path and the range ring follow it; nothing
  else on screen changes.
- agent: a caller of src/path.js and src/game.js, such as src/main.js, a test or a later print.
  It reads `PATHS` (five waypoint lists, the first `WAYPOINTS` itself), calls `pickPath(random)`
  with any function answering 0 up to but not including 1, and calls `nextRound(state, random)`
  for a fresh game on the same options and a newly drawn path. `restart(state)` is unchanged and
  keeps the path.

## Refusals

- none: a tower on a cell of the drawn path is refused through `placementError`'s existing
  `'path'` reason, whose sentence the HUD already shows; `pickPath` and `nextRound` refuse
  nothing. No new reason or sentence is added.

## Touches amendment

- reason: the signed list lets only test/card-buttons, sell and upgrade pin the boot's draw to
  path 1, but test/pause-speed.test.js also boots src/main.js and hovers (3, 1), a cell laid out
  for path 1 that path 4 covers. Without the pin, 'the hover clears over the bar' is red on one
  boot in five (shown above by forcing path 4), and red never lands. The brief's operator
  acceptance of 2026-11-19 covers it: an existing test that boots src/main.js on cells laid out
  for path 1 may fix the draw to path 1 while it boots. It gets the same three-line pin as the
  other three files and nothing else.

touches:
  - src/path.js
  - src/game.js
  - src/main.js
  - test/card-buttons.test.js
  - test/sell.test.js
  - test/upgrade.test.js
  - test/pause-speed.test.js
  - test/random-paths.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with `node --test`.

`reproduces:` stays as signed: test/random-paths.test.js. It is new, so it is written and
committed red first, and it stays in `touches:`. It does not lock any existing test.

## Build steps

### 1. test/random-paths.test.js, red first

Imports `test` (node:test), `assert` (node:assert/strict), `COLS`, `ROWS`, `TILE`, `PATHS`,
`WAYPOINTS`, `cellKey`, `pathCells`, `pathLength` and `pickPath` from ../src/path.js, and
`chooseDifficulty`, `createGame`, `nextRound`, `placementError` and `spawnEnemy` from
../src/game.js. A local `corners = (list) => list.map(([col, row]) => ({ col, row }))` writes
the brief's table.

- 'PATHS holds exactly the five listed paths, the first WAYPOINTS': `PATHS.length` is 5,
  `PATHS[0]` deep-equals `WAYPOINTS`, and `PATHS` deep-equals the five rows of the brief's table
  through `corners`.
- 'every path starts in column 0, ends in column 15, stays on the board, turns only at right
  angles and is 24 to 26 tiles long': for each path, the list
  `[first.col === 0, last.col === COLS - 1, every corner has 0 <= col < COLS and 0 <= row < ROWS,
  every consecutive pair shares its col or its row, pathLength(p) / TILE >= 24,
  pathLength(p) / TILE <= 26]` deep-equals all `true`; beside it, the lengths in tiles deep-equal
  `[24, 24, 24, 26, 24]`.
- 'pickPath returns path 1 for 0, path 3 for 0.5 and path 5 for 0.99':
  `[pickPath(() => 0), pickPath(() => 0.5), pickPath(() => 0.99)]` deep-equals
  `[PATHS[0], PATHS[2], PATHS[4]]`.
- 'a game on path 4 refuses a tower on path 4, accepts one on a cell only path 1 covers, and its
  first ghost starts at path 4's first corner': `const game = createGame({ waypoints: PATHS[3] })`.
  `[placementError(game, 3, 1), placementError(game, 5, 5), pathCells(PATHS[0]).has(cellKey(5, 5)),
  pathCells(PATHS[3]).has(cellKey(5, 5))]` deep-equals `['path', null, true, false]`.
  `spawnEnemy(game)`, then `[game.enemies[0].x, game.enemies[0].y]` deep-equals `[20, 60]`, the
  centre of (0, 1).
- 'nextRound on a hard game with 3 lives gives a hard game with 8 lives on the path its random
  picks': `const game = createGame({ difficulty: 'hard' }); game.lives = 3;`
  `const next = nextRound(game, () => 0.7);` `[next.difficulty, next.lives, next.waypoints,
  next.path]` deep-equals `['hard', 8, PATHS[3], pathCells(PATHS[3])]`.
- 'chooseDifficulty on a ready game on path 2 keeps path 2':
  `chooseDifficulty(createGame({ status: 'ready', waypoints: PATHS[1] }), 'hard')`'s
  `[difficulty, waypoints]` deep-equals `['hard', PATHS[1]]`.

It is red against the base because src/path.js exports no `PATHS` or `pickPath` and src/game.js
no `nextRound`, so the import fails. Commit it alone as
`test(4h2): random-paths.test.js reproducer, red first`.

### 2. src/path.js: the five paths and the draw

- The header comment becomes "The map: a grid of square tiles and the paths across it."
- Below `WAYPOINTS` (unchanged, still "Corners of the path …", now "of path 1, the path a game
  made without waypoints walks"), add a local `corners` helper and export
  `PATHS = [WAYPOINTS, …]`, the other four written from the brief's table, with a comment: five
  paths on the same board, each from column 0 to column 15 in straight runs, 24 to 26 tiles
  long, so a round takes about as long on any of them; the first is `WAYPOINTS`.
- Export `pickPath(random)`: `return PATHS[Math.floor(random() * PATHS.length)];`, with a
  comment: one of `PATHS`, each equally likely, for a `random` answering 0 up to but not
  including 1, such as `Math.random`.

### 3. src/game.js: nextRound

- Import `pickPath` from ./path.js beside `WAYPOINTS`.
- Beside `restart`, export:

  ```js
  // A fresh game made with the options this one was made with, on a path drawn again with
  // `random`: the next round. restart keeps the path.
  export function nextRound(state, random) {
    return createGame({ ...state.options, waypoints: pickPath(random) });
  }
  ```

- `restart`, `createGame` and `chooseDifficulty` are unchanged.

### 4. src/main.js: draw a path at boot and for each new round

- Import `pickPath` from ./path.js; import `nextRound` from ./game.js in place of `restart`
  (no other use of `restart` remains in main.js).
- The opening game becomes
  `createGame({ status: 'ready', difficulty: 'normal', waypoints: pickPath(Math.random) })`, its
  comment adding "on a path drawn at random".
- In the click handler, `state = restart(state);` becomes `state = nextRound(state, Math.random);`
  and the comment above the handler, where it says a click on a won or lost round restarts it,
  adds "on a newly drawn path".

### 5. The four boots that click or hover path-1 cells pin the draw to path 1

In test/card-buttons.test.js (`await import('../src/main.js?card=1')`), test/sell.test.js
(`await import('../src/main.js?sell=1')`), test/upgrade.test.js
(`` await import(`../src/main.js?upgrade=${++boots}`) ``) and test/pause-speed.test.js
(`` await import(`../src/main.js?case=${instance}`) ``), the one import line becomes:

```js
const random = Math.random;
Math.random = () => 0; // main.js draws path 1, the path these cells are laid out for
await import(…); // as before
Math.random = random;
```

Nothing else in any of the four files changes, and no other existing test is edited.

Commit steps 2 to 5 as `fix(4h2): pick one of five paths at random for each round`.

### 6. Green

Run `node --test test/random-paths.test.js test/path.test.js test/game.test.js
test/card-buttons.test.js test/sell.test.js test/upgrade.test.js test/pause-speed.test.js
test/difficulty-choice.test.js test/best.test.js test/start-screen.test.js`: the reproducer,
the two existing tests of the changed modules, the four edited files and every unedited file
that boots src/main.js. The whole suite runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/random-paths.test.js is committed red first and is green
after. The four edited files change only by the pin around their import of src/main.js, and are
green whichever path a free `Math.random` would draw. test/random-paths.test.js proves each
criterion:

- `PATHS` holds exactly five lists, the first deep-equal to `WAYPOINTS`, each matching its row
  in the table.
- Every path starts in column 0, ends in column 15, stays inside the board, has only horizontal
  or vertical segments, and `pathLength` of it is 24 to 26 tiles.
- `pickPath` returns path 1 for 0, path 3 for 0.5 and path 5 for 0.99.
- A game created with path 4 refuses a tower on a path 4 cell with `'path'`, accepts one on a
  cell only path 1 covers, and its first ghost starts at path 4's first corner.
- `nextRound` on a hard game with 3 lives gives a `'hard'` game with 8 lives whose `waypoints`
  are the path its `random` picks.
- `chooseDifficulty` on a `'ready'` game made with path 2 gives a game whose `waypoints` are
  still path 2.
