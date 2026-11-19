# Plan: pick one of five paths at random for each round (print line-factory-baked-demo-4h2)

GitHub issue #81, opened again as issue #87, bead lantern-line-factory-baked-demo-4h2. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-4h2/triage.md: read. It carries the brief in full, the
  signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is none under docs/changes/line-factory-baked-demo-4h2/
  and none anywhere else in the tree, so nothing is read from it. The triage's brief and lists
  stand in for it, as they did for the prints before this one (see the 54a-r2 plan).
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the brief in full.
- The base: the print branch was cut from 6658250, the line's first merge, while origin/main
  had moved on to 06858f0 (print 54a-r2, PR #86). a557960 takes origin/main in. The branch held
  only triage files, so the merge was clean. Every claim below is checked against that base.
- I checked the triage's claims against that base:
  - True: src/path.js exports `TILE` (40), `COLS` (16), `ROWS` (10), `WAYPOINTS` (corners 0,2
    5,2 5,7 10,7 10,3 15,3), `cellKey`, `cellCenter`, `pathCells`, `pathLength` (pixels, first
    cell's centre to last's) and `pointAlong`. It has no list of paths and no way to pick one.
  - True: `createGame` in src/game.js takes `waypoints` (default `WAYPOINTS`) and keeps it in
    `state.options`; `restart(state)` is `createGame(state.options)`; `chooseDifficulty` is
    `createGame({ ...state.options, status: 'ready', difficulty: key })` on a ready game, so it
    keeps the waypoints the game was made with.
  - True: src/main.js opens with `createGame({ status: 'ready', difficulty: 'normal' })` and
    calls `restart(state)` in the click handler once the round is `'won'` or `'lost'`. That is
    its only `restart`.
  - True: `spawnEnemy` and `spawnBoss` hand `state.waypoints` to `createEnemy`, which starts the
    ghost at `pointAlong(waypoints, 0)`, the first corner's centre; `step` advances along
    `state.waypoints`; placement refuses through `cellError`, which reads `state.path`.
  - True: hard is `{ gold: 60, lives: 8 }` in src/difficulty.js.
  - The table's numbers hold: in tiles the five paths are 5+5+5+4+5 = 24, 4+5+7+4+4 = 24,
    3+4+5+5+7 = 24, 7+7+5+4+3 = 26 and 6+5+7+4+2 = 24 long.
  - **False: "A game created without `waypoints` still uses path 1, so no existing test file
    needs editing."** The first half holds, but four existing tests do not create their game:
    they boot src/main.js, which after this change opens on `pickPath(Math.random)`. I proved it
    in a scratch copy with main.js forced onto each path in turn and the seven test files that
    import or name main.js run (card-buttons, upgrade, sell, pause-speed, start-screen,
    difficulty-choice, best). Paths 1, 2, 3 and 5: 80 of 80 pass. Path 4: four fail, because
    path 4's first leg covers row 1 from column 0 to 7:
    - test/card-buttons.test.js 'in the browser, a click on Upgrade …' clicks (1, 1) to place a
      lantern;
    - test/upgrade.test.js 'in the browser, a click selects a tower, U upgrades it …' clicks
      (1, 1);
    - test/sell.test.js 'in the browser, S sells the selected tower …' clicks (1, 1);
    - test/pause-speed.test.js 'the hover clears over the bar' hovers (3, 1) and counts one
      `THEME.hover` fill, which a path cell draws as `THEME.hoverBad`.
    So built as briefed, `npm test` goes red on one boot in five. See '## Touches amendment'.
- Standards: tests/architecture/assertion_baseline.json holds `negative-assertion-unpaired`
  and `substring-binding` at 0. The new test proves everything with exact `assert.equal` and
  `assert.deepEqual` of whole values. It writes no `notEqual`, `ok(!…)`, prefix or substring
  filter.
- Knowledge vault (0-Inbox):
  - "A print branch cut before main moved must merge main before the plan reads it": met by
    a557960.
  - "A triage can describe code the print's tree does not have yet": met by the checks above.
  - "Two issues that each forbid editing a test can together break one it pins": the same shape
    inside one issue. "Opens on a random path" and "no existing test file is edited" cannot
    both hold, and the fix forward is below.
  - "A touches amendment must keep a new reproducer that the signed list named": the amendment
    keeps test/random-path.test.js in `touches:`, and `reproduces:` is unchanged.

## Who meets it

- person: the player, on the Board artboard drawn at design/screens/Board.png (source design/screens/Board.dc.html, listed in design/screens.yaml as the board every screen sits on). Each time the game opens, and each time a won or lost round is clicked away to a fresh start screen, the path the ghosts walk is one of five, drawn at random. The artboard draws path 1; the board, the ghosts, tower placement and the range ring draw whichever path `state.path` holds. Picking a difficulty on the start screen keeps the path already drawn for that round.
- agent: a caller of src/path.js and src/game.js, such as src/main.js, a test or a later print. It reads `PATHS` (five waypoint lists, `PATHS[0]` being `WAYPOINTS` itself), `pickPath(random)` (one of them for a `random` returning 0 up to but not including 1) and `nextRound(state, random)` (a fresh game on this one's options with a newly picked path).

## Refusals

- none: the change adds no refusal. A path-4 game refuses a tower on its path with the existing
  `cellError` reason `'path'`, and `pickPath` is specified only for a `random` returning a number
  from 0 up to but not including 1, as `Math.random` does, so nothing new is refused.

## Touches amendment

- reason: the signed list holds src/path.js, src/game.js, src/main.js and
  test/random-path.test.js, but the brief's main.js line (`waypoints: pickPath(Math.random)`)
  turns four existing tests red whenever `Math.random` picks path 4 (the scratch proof under
  '## Inputs verified'). The fix keeps the feature as briefed and pins the random source in
  those four files' main.js boots to path 1, the path their clicks were written on. Their
  assertions are not touched. None of them is in `reproduces:`. This breaks the brief's "no
  existing test file is edited". The other way out, opening main.js's first round on path 1,
  would break the brief's "src/main.js opens the game with `waypoints: pickPath(Math.random)`"
  and would make the opening round's path the same every time, which is the problem the issue's
  Why names. The merge gate's review reads this diff.

touches:
  - src/path.js
  - src/game.js
  - src/main.js
  - test/random-path.test.js
  - test/card-buttons.test.js
  - test/upgrade.test.js
  - test/sell.test.js
  - test/pause-speed.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with `node --test`.

`reproduces:` stays as signed: test/random-path.test.js. It is new, so it is written and
committed red first, and it stays in `touches:`.

## Build steps

Every new check is an exact `assert.equal` (strict) or `assert.deepEqual` (node:assert/strict).

### 1. test/random-path.test.js, red first

Imports `test` (node:test), `assert` (node:assert/strict), `COLS`, `PATHS`, `ROWS`, `TILE`,
`WAYPOINTS`, `cellCenter`, `pathLength` and `pickPath` from ../src/path.js, and
`chooseDifficulty`, `createGame`, `nextRound`, `placementError`, `placeTower` and `spawnEnemy`
from ../src/game.js. A local `corners = (list) => list.map(([col, row]) => ({ col, row }))`
spells the table.

- 'PATHS holds the five paths of the table, the first WAYPOINTS itself': `PATHS.length` is 5,
  `PATHS[0]` deep-equals `WAYPOINTS`, and `PATHS` deep-equals the five tables as `corners` lists:
  `[[0,2],[5,2],[5,7],[10,7],[10,3],[15,3]]`, `[[0,7],[4,7],[4,2],[11,2],[11,6],[15,6]]`,
  `[[0,4],[3,4],[3,8],[8,8],[8,3],[15,3]]`, `[[0,1],[7,1],[7,8],[12,8],[12,4],[15,4]]`,
  `[[0,8],[6,8],[6,3],[13,3],[13,7],[15,7]]`.
- 'every path runs from column 0 to column 15 on the board in straight segments, 24 to 26 tiles
  long': for each path, the list `[first.col === 0, last.col === COLS - 1,
  ...path.map((c) => c.col >= 0 && c.col < COLS && c.row >= 0 && c.row < ROWS),
  ...segments.map(([a, b]) => (a.col === b.col) !== (a.row === b.row)),
  pathLength(path) / TILE >= 24, pathLength(path) / TILE <= 26]` deep-equals all `true`. The
  `!==` asks for exactly one coordinate shared, so a segment is horizontal or vertical and never
  of zero length. Next to it, `PATHS.map((p) => pathLength(p) / TILE)` deep-equals
  `[24, 24, 24, 26, 24]`, so the lengths are pinned and not only bounded.
- 'pickPath gives path 1 for 0, path 3 for 0.5 and path 5 for 0.99':
  `[pickPath(() => 0), pickPath(() => 0.5), pickPath(() => 0.99)]` deep-equals
  `[PATHS[0], PATHS[2], PATHS[4]]`, and `assert.equal(pickPath(() => 0.5), PATHS[2])` checks
  it is the same list, not a copy.
- 'a game made with path 4 refuses a tower on path 4, takes one on a cell only path 1 covers,
  and spawns its first ghost at path 4's first corner': `game = createGame({ waypoints: PATHS[3]
  })`. `[placementError(game, 0, 1), placementError(game, 7, 5)]` deep-equals `['path', 'path']`
  ((0, 1) is its first corner, (7, 5) mid-way down its second leg).
  `placeTower(game, 0, 2)` is `true` ((0, 2) is path 1's first corner and on no leg of path 4),
  and `game.towers.map((t) => [t.col, t.row])` deep-equals `[[0, 2]]`. `spawnEnemy(game)`'s
  `{ x, y }` deep-equals `cellCenter({ col: 0, row: 1 })`, `{ x: 20, y: 60 }`.
- 'nextRound on a hard game with 3 lives left gives a hard game with 8 lives on the picked path':
  `game = createGame({ difficulty: 'hard', waypoints: PATHS[1] })`, then `game.lives = 3`.
  `next = nextRound(game, () => 0.5)`.
  `[next.difficulty, next.lives, next.gold, next.status, next.wave]` deep-equals
  `['hard', 8, 60, 'playing', 1]`, `assert.equal(next.waypoints, PATHS[2])`, and
  `next.options.waypoints` is `PATHS[2]` too, so the round after it is also made on path 3.
  A second case on a ready normal game, `createGame({ status: 'ready', difficulty: 'normal' })`,
  run through `nextRound(…, () => 0.99)`, gives `[status, difficulty, waypoints]` deep-equal to
  `['ready', 'normal', PATHS[4]]`, which is how main.js uses it.
- 'chooseDifficulty on a ready game made with path 2 keeps path 2':
  `chosen = chooseDifficulty(createGame({ status: 'ready', difficulty: 'normal', waypoints:
  PATHS[1] }), 'hard')`. `[chosen.difficulty, chosen.lives]` deep-equals `['hard', 8]` and
  `assert.equal(chosen.waypoints, PATHS[1])`.

It is red against the base because src/path.js exports no `PATHS` or `pickPath` and
src/game.js no `nextRound`, so the import fails. Commit it alone as
`test(4h2): random-path.test.js reproducer, red first`.

### 2. src/path.js: PATHS and pickPath

- The header comment becomes "The map: a grid of square tiles and the paths across it, one of
  five each round."
- After `WAYPOINTS` (its comment becomes "Corners of path 1, in grid cells. The path runs
  straight between them."), add:

  ```js
  // The five paths a round may run on, as corners in grid cells: each from column 0 to column 15
  // in straight segments, 24 to 26 tiles long, so a round takes about as long on any of them.
  // Path 1 is WAYPOINTS itself, the path a game made without waypoints runs on.
  const corners = (list) => list.map(([col, row]) => ({ col, row }));
  export const PATHS = [
    WAYPOINTS,
    corners([[0, 7], [4, 7], [4, 2], [11, 2], [11, 6], [15, 6]]),
    corners([[0, 4], [3, 4], [3, 8], [8, 8], [8, 3], [15, 3]]),
    corners([[0, 1], [7, 1], [7, 8], [12, 8], [12, 4], [15, 4]]),
    corners([[0, 8], [6, 8], [6, 3], [13, 3], [13, 7], [15, 7]]),
  ];

  // One of PATHS, each as likely, for a `random` returning 0 up to but not including 1, as
  // Math.random does.
  export function pickPath(random) {
    return PATHS[Math.floor(random() * PATHS.length)];
  }
  ```

### 3. src/game.js: nextRound

- Import `pickPath` beside `WAYPOINTS` from ./path.js.
- After `restart`, which is unchanged:

  ```js
  // A fresh game made with the options this one was made with, on a path picked again by `random`
  // (see pickPath), so each round may run on a different path.
  export function nextRound(state, random) {
    return createGame({ ...state.options, waypoints: pickPath(random) });
  }
  ```

### 4. src/main.js: open on a picked path and draw again each round

- Import `pickPath` from ./path.js beside `COLS`, `ROWS` and `TILE`. In the ./game.js import,
  replace `restart` with `nextRound` (main.js uses `restart` nowhere else).
- Open with `let state = createGame({ status: 'ready', difficulty: 'normal', waypoints:
  pickPath(Math.random) });`, the comment reading "the start screen, on normal and a path picked
  at random, until Start, Enter or Space".
- In the click handler, once the round is `'won'` or `'lost'`, `state = nextRound(state,
  Math.random);` where it calls `restart(state)` today. The comment above the handler's second
  sentence becomes "Once the round is over, a click starts a fresh one on a path picked again,
  back on the start screen, rather than placing a lantern."
- `chooseDifficulty` is untouched: it already rebuilds from `state.options`, so it keeps the
  picked path.

### 5. The four main.js boots: pin the random source to path 1

In test/card-buttons.test.js, test/upgrade.test.js, test/sell.test.js and
test/pause-speed.test.js, directly under the existing `after(() => Object.assign(globalThis, …))`
line, add:

```js
// src/main.js picks each round's path with Math.random; 0 picks path 1, the path these clicks
// and hovers were written on.
const savedRandom = Math.random;
Math.random = () => 0;
after(() => (Math.random = savedRandom));
```

Nothing else in those files changes. Their assertions are byte-identical.

Commit steps 2 to 5 as
`fix(4h2): five paths, one picked at random for each round`.

### 6. Green

Run `node --test test/random-path.test.js test/card-buttons.test.js test/upgrade.test.js
test/sell.test.js test/pause-speed.test.js test/start-screen.test.js
test/difficulty-choice.test.js test/best.test.js test/path.test.js test/game.test.js`. That
covers the reproducer, the four edited files, every other file that boots or names src/main.js,
and the two files on path.js and createGame. start-screen and difficulty-choice boot main.js
unpinned. The scratch proof shows they pass on all five paths: they click and hover only on the
start screen or the HUD. The whole suite runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/random-path.test.js is committed red first and is green
after. Every other existing file under test/ is unedited and green, except the four boots named
in step 5, which gain only the pinned random source. test/random-path.test.js proves each
criterion:

- `PATHS` holds exactly five lists, the first deep-equal to `WAYPOINTS`, each matching its row
  of the table.
- Every path starts in column 0, ends in column 15, stays on the 16 by 10 board, has only
  horizontal or vertical segments, and has a `pathLength` of 24 to 26 tiles.
- `pickPath` returns path 1 for 0, path 3 for 0.5 and path 5 for 0.99.
- A game made with path 4 refuses a tower on a path-4 cell with `'path'`, accepts one on a cell
  only path 1 covers, and spawns its first ghost at path 4's first corner.
- `nextRound` on a hard game with 3 lives left gives a `'hard'` game with 8 lives on the path
  its `random` picks.
- `chooseDifficulty` on a ready game made with path 2 keeps path 2.
