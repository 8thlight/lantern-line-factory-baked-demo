# Plan: choose the difficulty on the start screen (print line-factory-baked-demo-3vy)

GitHub issue #68, opened again as issue #73, bead lantern-line-factory-baked-demo-3vy. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-3vy/triage.md: read. It carries the issue, the brief,
  the signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no spec.md under
  docs/changes/line-factory-baked-demo-3vy/, and none anywhere else in the tree, so nothing is
  read from it. The triage's brief and lists stand in for it, as they did for prints 24 to 9oy.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The base: the print branch was cut from 6658250, before M1. At that commit src/hud.js,
  src/difficulty.js, `restart`, `status` and the start screen do not exist. So every claim
  the triage makes was false of the print's own tree. origin/main had moved on, so I took
  it in at 542a64a (print 9oy, PR #71) with a clean merge, as 9oy, dd1 and 58 did before.
  Every claim below is checked against that base.
- I checked the triage's claims against that base:
  - True: src/main.js boots `createGame({ status: 'ready' })` with no difficulty. A click on
    the start screen does something only on `startButtonAt`, and a key does something only
    on `startKey` (Enter or Space, not held).
  - True: src/game.js has no `chooseDifficulty`. `createGame` takes `difficulty` (null by
    default) and keeps `{ ..., status, difficulty }` in `state.options`. `lives` and `gold`
    are kept as the caller gave them, so `createGame({ ...options, difficulty })` takes the
    difficulty's gold and lives. `restart(state)` is `createGame(state.options)`, so it keeps
    the difficulty.
  - True: src/difficulty.js gives normal 50 gold and 10 lives, and hard 60 gold and 8 lives.
    `difficultyEntry` refuses an unknown key with the existing `difficulty/unknown-key`
    RangeError.
  - True: on the start screen, src/hud.js declares only `START_BUTTON`, `startButtonAt` and
    `startKey`. `START_BUTTON` is `{ x: 240, y: 242, width: 160, height: 44 }` on a 640 by 440
    canvas (`WIDTH = COLS * TILE`, `CANVAS_HEIGHT = HUD_HEIGHT + ROWS * TILE`).
  - True: src/render.js `drawStartScreen(ctx, best)` draws the title, tagline, the optional
    best line, Start, the hint at y 302 and the three steps at y 340, 362 and 384 (12px
    text). It gets no state, and `draw` calls it as `drawStartScreen(ctx, best)`.
- The geometry the brief asks for fits. The row is 3 × 96 + 2 × 8 = 304 wide, so x starts
  at (640 − 304) / 2 = 168 and the buttons sit at x 168, 272 and 376. Its bottom is
  440 − 8 = 432, so it spans y 404 to 432. That is clear of Start (y 242 to 286) and clear of
  the last step's text, which ends near y 390.
- Keys: `kindForKey` reads only 1, 2 and 3, and `hudKey` reads P, F, U and Escape. So E, N
  and H reach nothing today.
- Existing tests that a main.js booting on normal could break. I read each one, and none
  breaks:
  - test/start-screen.test.js, test/pause-speed.test.js and test/upgrade.test.js boot
    main.js. Their assertions on the start screen are `startTexts` (only 'Lantern Line' and
    'Start'), `textsOf(calls)[0] === 'Lives'` after starting, and the HUD's gold of
    `START_GOLD`, which is 50, as normal gives. None depends on ghost health, so normal's
    1.5× health changes nothing they pin.
  - test/best.test.js's full start-screen text lists draw `createGame({ status: 'ready' })`
    with no difficulty. They see no difficulty buttons, as the brief requires.
- Issue #66 has not landed on the base: src/render.js prints no price beside the HUD's tower
  name. So test/pause-speed.test.js's pinned `Lantern` holds.
- Standards: tests/architecture/assertion_baseline.json holds `negative-assertion-unpaired`
  and `substring-binding` at 0. .hydraflow/layout.yaml gives the test paths `e2e/**` and
  `test/**`.
- Knowledge vault: two 0-Inbox notes bear on this print, and both are met here.
  - "Two issues that each forbid editing a test can together break one it pins" names this
    print with #66. #66 is not on the base, and this print does not take it.
  - Its sibling about a print branch cut before main moved is met by the merge above.

## Who meets it

- person: the player, on the start screen (design/screens/StartScreen.dc.html, design/hud.md
  "Start screen"). Before the first wave, they see three buttons, Easy, Normal and Hard, in a
  row along the bottom of the start screen. Normal is filled in `--hud-accent` from boot, and
  the other two are outlined. A click on a button, or E, N or H, makes that button the filled
  one and sets the game's starting gold and lives (hard: 60 gold, 8 lives). Start, Enter and
  Space begin wave 1 on the chosen difficulty. After the round, the restart comes back to the
  start screen with the same difficulty chosen. The StartScreen artboard predates this row and
  does not draw it. design/hud.md's button rules (28 tall, `--button-radius`, outlined in
  `--hud-muted`, `--hud-accent` fill when active) and the brief's geometry are the
  specification for it.

## Refusals

- none: nothing new is refused. `difficultyButtonAt` and `difficultyKey` answer `null` off a
  button or for another key, and main.js then does nothing, as a click off Start does today.
  `chooseDifficulty` on a game that is not `'ready'` returns that game unchanged, a no-op like
  `start`'s. An unknown key passed to `chooseDifficulty` on a ready game reaches `createGame`.
  There it meets the existing `difficulty/unknown-key` RangeError from src/difficulty.js
  (print 9oy), word for word, so this change introduces no new refusal.

## Touches

The signed list holds the whole change, so it is not amended:

touches:
  - src/main.js
  - src/game.js
  - src/hud.js
  - src/render.js
  - test/difficulty-choice.test.js

The suite these test paths match is `test/**` (.hydraflow/layout.yaml), run with `node --test`.

`reproduces:` stays as signed: test/difficulty-choice.test.js. It is new, so it is written
and committed red first, and it stays in `touches:`. No existing test file is edited.

## Build steps

Every new check is an exact `assert.equal` or `assert.deepEqual`, and an absent text is
asserted as a filtered list deep-equal to `[]`. No `notEqual`, `notDeepEqual`, `ok(!…)`,
`doesNotMatch`, `includes` or substring filter is written, so neither baseline count can rise.

### 1. test/difficulty-choice.test.js, red first

It imports from ../src/hud.js, ../src/game.js and ../src/render.js. To draw, it uses the
recording-ctx Proxy that test/start-screen.test.js uses: every method call is pushed as
`{ name, args, fillStyle }`, and `draw(ctx, game, null)` is called on it. The tests:

- `difficultyButtonAt` at the centre of each `DIFFICULTY_BUTTONS` entry gives `'easy'`,
  `'normal'` and `'hard'`, in that order. `DIFFICULTY_BUTTONS.map((b) => b.key)` deep-equals
  `['easy', 'normal', 'hard']`. At the centre of `START_BUTTON`, and at (5, 5), it gives
  `null`.
- Each button is 96 by 28, and consecutive buttons are 8 apart. The row is centred
  (left margin equals right margin) and its bottom is `CANVAS_HEIGHT - 8`. Every button lies
  inside 0..640 by 0..`CANVAS_HEIGHT`. No pair among the three buttons and Start overlaps:
  rectangle intersection is computed and each pair's result is `assert.equal(…, false)`.
- `difficultyKey`: `e` and `E` give `'easy'`, `n` gives `'normal'`, `h` gives `'hard'`, and
  `x` and `Enter` give `null`.
- `chooseDifficulty(createGame({ status: 'ready', difficulty: 'normal' }), 'hard')` gives
  `[status, difficulty, gold, lives]` deep-equal to `['ready', 'hard', 60, 8]`. `restart` of
  that game gives `['ready', 'hard', 60, 8]` too.
- `chooseDifficulty` on a playing normal game, `start(createGame({ status: 'ready',
  difficulty: 'normal' }))`, with `'hard'`, returns the same object (`assert.equal(result,
  game)`). Its `[difficulty, gold, lives]` is `['normal', 50, 10]`.
- Drawing a ready normal game: its texts filtered to Easy, Normal and Hard deep-equal
  `['Easy', 'Normal', 'Hard']`. The `roundRect` calls filled in `THEME.hudAccent` at
  Normal's x are exactly one. A ready game with no difficulty, filtered the same way,
  deep-equals `[]`.

It is red against the base because `DIFFICULTY_BUTTONS`, `difficultyButtonAt`,
`difficultyKey` and `chooseDifficulty` do not exist, so the import fails. Commit it alone as
`test(3vy): difficulty-choice.test.js reproducer, red first`.

### 2. src/hud.js

Add the following after `START_BUTTON`:

```js
// The start screen's difficulty row: Easy, Normal, Hard, each 96 by 28 and 8 apart, centred
// across the canvas with its bottom 8 above the canvas's bottom edge, below the start steps.
const DIFFICULTY_ROW = 3 * 96 + 2 * 8;
export const DIFFICULTY_BUTTONS = Object.freeze(
  ['easy', 'normal', 'hard'].map((key, i) =>
    Object.freeze({ key, x: (WIDTH - DIFFICULTY_ROW) / 2 + i * (96 + 8), y: CANVAS_HEIGHT - 8 - 28, width: 96, height: 28 }),
  ),
);
```

Beside `startButtonAt`, add `difficultyButtonAt(x, y)`. It returns
`DIFFICULTY_BUTTONS.find((b) => inside(b, x, y))?.key ?? null`, so `inside` must be declared
before it is used, which it already is. Beside `startKey`, add `difficultyKey(key)`. It maps
the lower-cased key through `{ e: 'easy', n: 'normal', h: 'hard' }` and returns `null`
otherwise. Use `Object.hasOwn` so that `'constructor'` and similar keys give `null`. Extend
the file's header line: "…the start screen's Start and difficulty buttons among them."

### 3. src/game.js

Add the following beside `start`:

```js
// A ready game made again on the difficulty `key`, with that difficulty's gold and lives, so
// restart keeps it; any other status is returned as it is.
export function chooseDifficulty(state, key) {
  if (state.status !== 'ready') return state;
  return createGame({ ...state.options, status: 'ready', difficulty: key });
}
```

### 4. src/render.js

`draw` passes the difficulty: `drawStartScreen(ctx, best, state.difficulty)`. At its end,
`drawStartScreen(ctx, best = null, difficulty = null)` draws the row only when `difficulty`
is not null. For each of `DIFFICULTY_BUTTONS` (imported from ./hud.js), it draws a `roundRect`
with `BUTTON_RADIUS`, styled as follows:

- The chosen button (`b.key === difficulty`) is filled in `THEME.hudAccent`, with its label
  in `THEME.hudAccentInk`.
- The other two are stroked in `THEME.hudMuted`, lineWidth 1, with labels in `THEME.hudInk`.

The labels are `DIFFICULTIES[b.key].name` (imported from ./difficulty.js), so the texts are
spelled once, in bold 13px, centred in each button. A null difficulty skips the whole block,
so its draw calls are unchanged. Update the comment above `drawStartScreen`.

### 5. src/main.js

- Boot: `let state = createGame({ status: 'ready', difficulty: 'normal' });`.
- Click, in the ready branch: if `startButtonAt(x, y)`, call `start(state)`. Otherwise,
  `const choice = difficultyButtonAt(x, y);` and `if (choice) state = chooseDifficulty(state,
  choice);`. Then return, as today.
- Keydown, before the Start check: `if (state.status === 'ready' && !event.repeat) { const
  choice = difficultyKey(event.key); if (choice) { state = chooseDifficulty(state, choice);
  return; } }`. Enter and Space give `null` from `difficultyKey`, so they still start the
  round.
- Import `chooseDifficulty`, `difficultyButtonAt` and `difficultyKey`, and update the
  comments on the click and key handlers.

Commit steps 2 to 5 as `fix(3vy): choose the difficulty on the start screen`.

### 6. Green

Run `npx node --test test/difficulty-choice.test.js test/start-screen.test.js
test/pause-speed.test.js test/upgrade.test.js test/best.test.js test/hud.test.js
test/render.test.js test/difficulty.test.js test/game-over.test.js`. That covers the
reproducer and every unedited suite that boots main.js, draws the start screen, or reads
src/hud.js and `createGame`'s options. Then run `npm --prefix . run test` once, the line's
named check. The whole suite also runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/difficulty-choice.test.js is committed red first and
is green after. Every existing test under test/ is unedited and green. The new file proves
each of issue #68's criteria:

- `difficultyButtonAt` gives `'easy'`, `'normal'` and `'hard'` inside each button, and
  `null` on Start and off every button.
- No difficulty button overlaps Start or another difficulty button, and all three lie inside
  the canvas.
- `difficultyKey` maps `e` and `E`, `n` and `h`, and gives `null` for `x` and Enter.
- `chooseDifficulty` on a ready normal game with `'hard'` gives a ready hard game with 60
  gold and 8 lives. On a playing game, it returns that same game unchanged.
- A ready normal game draws `Easy`, `Normal` and `Hard`. A ready game with no difficulty
  draws none of them.

## Touches amendment

- reason: train-wreck: the base conflict in src/render.js resolves cleanly, but the 4 reds left, in test/pause-speed.test.js, can only be fixed by editing that file as ruling q-8ea7b2c1 (a) ordered, and that path is outside the signed touches. With the merge resolved and that test updated, npm test is 237/237 green.

touches:
  - src/main.js
  - src/game.js
  - src/hud.js
  - src/render.js
  - test/difficulty-choice.test.js
  - test/pause-speed.test.js
