# Plan: difficulty levels that make ghosts tougher (print line-factory-baked-demo-9oy)

GitHub issue #65, opened again as issue #69, bead lantern-line-factory-baked-demo-9oy. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-9oy/triage.md: read. It carries the issue, the brief,
  the signed `touches:` and `reproduces:` lists, and the acceptance criterion.
- spec.md: not in the worktree. There is no spec.md under
  docs/changes/line-factory-baked-demo-9oy/ and none anywhere else in the tree, so nothing is
  read from it. The triage's brief and lists stand in for it, as they did for prints 36 to dd1.
- plan/research.md: not in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate. This plan covers the whole brief.
- The base: the print branch was cut from 6658250, before M1. At that commit there is no
  src/waves.js, no gold, no START_GOLD, no enemy health and no `restart`, so every claim the
  triage makes about src/game.js was false of the print's own tree. origin/main had moved
  on. 46fbc57 takes origin/main in at 6ddc997 (print dd1, PR #61), as dd1 and 58 did before
  it. The merge was clean. Every claim below is checked against that base.
- I checked the triage's claims against that base:
  - True: nothing under src/ or test/ uses the word "difficulty", and src/difficulty.js does
    not exist.
  - True: `createGame` destructures `waypoints, spawnInterval, waveSize, lives = START_LIVES,
    gold = START_GOLD, totalWaves, status`. It keeps all seven in `state.options`, the
    defaulted `lives` and `gold` included, and it keeps no `state.difficulty`.
  - True: `spawnEnemy` reads `{ health, speed }` from `waveEntry(state.wave)`, and `spawnBoss`
    reads `{ health, speed, bounty }` from that entry's `boss`. Neither scales health.
  - True: `restart(state)` returns `createGame(state.options)`. Because `options` records the
    defaulted 10 and 50, a hard game restarted through it would come back with 50 gold and
    10 lives instead of 60 and 8.
  - The numbers in the acceptance criteria hold against src/waves.js. Wave 1's health is 3,
    so `Math.ceil(3 * 1)`, `Math.ceil(3 * 1.5)` and `Math.ceil(3 * 2)` give 3, 5 and 6.
    Wave 5's boss has 40 health, giving 40, 60 and 80. Every health in the table is a whole
    number, so a multiplier of 1 leaves every ghost as it is today.
- Callers of `createGame` in src/: only src/main.js, as `createGame({ status: 'ready' })`.
  src/main.js is outside `touches:` and needs no change. It boots with no difficulty and plays
  as it does today.
- Existing tests I read for the shape of `options` and the starting lives and gold:
  test/game-over.test.js ('restart keeps the options the game was made with', with explicit
  `lives: 4`), test/gold.test.js (`createGame().gold` is 50, `createGame({ gold: 7 }).gold` is
  7), test/start-screen.test.js (a ready game restarted keeps `lives: 4`),
  test/tower-cost.test.js, test/upgrade.test.js, test/game.test.js and test/boss.test.js. None
  of them deep-equals `state.options` or a whole fresh state, so neither leaving the defaulted
  `lives` and `gold` out of `options` nor adding `difficulty` to `options` and state breaks
  them. test/pause-speed.test.js:29 and test/hud.test.js:100 deep-equal a game against its
  own clone, and those comparisons hold.
- Standards: tests/architecture/assertion_baseline.json holds `negative-assertion-unpaired`
  and `substring-binding` at 0. .hydraflow/layout.yaml gives the test paths `e2e/**` and
  `test/**`, with the unit ring at `test/{slug}.test.js`.
- Knowledge vault: two 0-Inbox notes bear on this print and both are met. "A print branch cut
  before main moved must merge main before the plan reads it" is met by 46fbc57. "A triage can
  describe code the print's tree does not have yet" is met by the checks above.

## Who meets it

- agent: a caller of `createGame` in src/game.js, such as a test or a later print that adds a
  difficulty picker. It passes `difficulty: 'easy' | 'normal' | 'hard'` and gets that entry's
  gold, lives and ghost health. It reads the chosen key back as `state.difficulty`, and gets
  the same difficulty from `restart`. An unknown key is refused with the sentence under
  Refusals. No person meets this change yet. src/main.js still boots with no difficulty, and
  no screen offers one: neither design/screens.yaml nor any artboard under design/screens/
  draws a difficulty choice. So the player sees the game exactly as it plays today.

## Refusals

- difficulty/unknown-key: `Unknown difficulty '<key>': pass one of easy, normal or hard, or leave difficulty out to play the game as it is.`

  `createGame` throws this as a `RangeError` when `difficulty` is given as anything other than
  `null`, `undefined` or one of `DIFFICULTIES`' own keys. `<key>` is `String(difficulty)`, so
  `createGame({ difficulty: 'impossible' })` throws
  `Unknown difficulty 'impossible': pass one of easy, normal or hard, or leave difficulty out to play the game as it is.`
  An inherited name such as `'toString'` is refused too, because the lookup is
  `Object.hasOwn(DIFFICULTIES, difficulty)`. Treating an unknown key as "no difficulty" would
  hand a caller with a typo an easy game and no sign of the mistake, so the game refuses it
  instead.

## Touches

The signed list holds the whole change, so it is not amended:

touches:
  - src/difficulty.js
  - src/game.js
  - test/difficulty.test.js

The suite these test paths match: `test/**` (.hydraflow/layout.yaml), run with `node --test`.

`reproduces:` stays as signed: test/difficulty.test.js. It is new, so it is written and
committed red first, and it stays in `touches:`. No existing test file is edited.

## Build steps

Every new check is an exact `assert.equal`, `assert.deepEqual` or `assert.throws` with an
exact `{ name, message }`. No `notEqual`, `notDeepEqual`, `ok(!…)`, `doesNotMatch`, prefix or
substring filter is written, so neither baseline count can rise.

### 1. test/difficulty.test.js, red first

Imports `test` from node:test, `assert` from node:assert/strict, `DIFFICULTIES` from
../src/difficulty.js, `START_GOLD`, `START_LIVES`, `createGame`, `restart` and `spawnBoss`,
`spawnEnemy` from ../src/game.js, and `WAVES` from ../src/waves.js.

A helper, `firstGhost(options)`, returns `spawnEnemy(createGame({ waveSize: 0, ...options }))`.
`waveSize: 0` keeps the spawner from sending anything on its own. A second helper,
`waveFiveBoss(options)`, makes `createGame({ waveSize: 0, ...options })`, sets `game.wave = 5`,
and returns `spawnBoss(game)`.

- 'DIFFICULTIES holds exactly easy, normal and hard, as the table gives them':
  `assert.deepEqual(DIFFICULTIES, { easy: { name: 'Easy', health: 1, gold: 50, lives: 10 },
  normal: { name: 'Normal', health: 1.5, gold: 50, lives: 10 }, hard: { name: 'Hard',
  health: 2, gold: 60, lives: 8 } })`, and `Object.keys(DIFFICULTIES)` deep-equals
  `['easy', 'normal', 'hard']`.
- 'a hard game starts with 60 gold and 8 lives': `createGame({ difficulty: 'hard' })` gives
  `[gold, lives, difficulty]` equal to `[60, 8, 'hard']`.
- 'a gold or lives option wins over the difficulty's': `createGame({ difficulty: 'hard',
  gold: 200 })` gives `[gold, lives]` of `[200, 8]`. `createGame({ difficulty: 'hard',
  lives: 3 })` gives `[60, 3]`.
- 'easy and normal start with 50 gold and 10 lives': each gives `[50, 10]`.
- 'wave 1's first ghost has 3, 5 and 6 health on easy, normal and hard, at one speed and
  bounty': `['easy', 'normal', 'hard'].map((d) => firstGhost({ difficulty: d }))`. The
  `health` values deep-equal `[3, 5, 6]`, and `maxHealth` gives the same. Each `speed`
  equals `WAVES[0].speed` (60), and each `bounty` equals the no-difficulty ghost's bounty (5).
- 'wave 5's boss has 40, 60 and 80 health on easy, normal and hard, at one speed and
  bounty': the same three through `waveFiveBoss`. `health` deep-equals `[40, 60, 80]`.
  `speed` and `bounty` deep-equal `WAVES[4].boss`'s 45 and 30 on all three.
- 'a game made without a difficulty plays as it does today': `createGame()` gives
  `[difficulty, gold, lives]` of `[null, START_GOLD, START_LIVES]`, which is
  `[null, 50, 10]`, and `firstGhost({}).health` is 3. Its wave-5 boss has 40 health.
  `createGame({ difficulty: null }).difficulty` is `null` too.
- 'restarting a hard game gives a hard game with 60 gold and 8 lives':
  `createGame({ difficulty: 'hard' })`, with `gold` set to 7, `lives` to 0 and `status` to
  `'lost'`. `restart` of it gives `[difficulty, gold, lives, status]` of
  `['hard', 60, 8, 'playing']`. `spawnEnemy(restart(createGame({ difficulty: 'hard',
  waveSize: 0 }))).health` is 6, so the restarted game's ghosts are hard ones too.
- 'restarting keeps an explicit gold over the difficulty's':
  `restart(createGame({ difficulty: 'hard', gold: 200 }))` gives `[200, 8]`.
- 'an unknown difficulty is refused with what to pass instead': for each of `'impossible'`,
  `'Hard'` and `'toString'`, `assert.throws(() => createGame({ difficulty: d }), { name:
  'RangeError', message: \`Unknown difficulty '${d}': pass one of easy, normal or hard, or
  leave difficulty out to play the game as it is.\` })`.

It is red against the base because ../src/difficulty.js does not exist, so the import fails.
Commit it alone as `test(9oy): difficulty.test.js reproducer, red first`.

### 2. src/difficulty.js (new)

```js
// The difficulties a game may be made with: the gold and lives it starts with, and how many
// times tougher its ghosts are than the waves table says (src/waves.js). Pure data, no DOM.

export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({ name: 'Easy', health: 1, gold: 50, lives: 10 }),
  normal: Object.freeze({ name: 'Normal', health: 1.5, gold: 50, lives: 10 }),
  hard: Object.freeze({ name: 'Hard', health: 2, gold: 60, lives: 8 }),
});

// The entry for `key`, or null when `key` is null or left out. Any other key is refused.
export function difficultyEntry(key) {
  if (key === null || key === undefined) return null;
  if (Object.hasOwn(DIFFICULTIES, key)) return DIFFICULTIES[key];
  throw new RangeError(
    `Unknown difficulty '${String(key)}': pass one of easy, normal or hard, or leave difficulty out to play the game as it is.`,
  );
}
```

The refusal sentence is spelled once, here. `Object.hasOwn` takes any value, so a non-string
key reaches the throw instead of a TypeError.

### 3. src/game.js: the option, the starting gold and lives, and the health multiplier

- Import `difficultyEntry` from ./difficulty.js.
- `createGame` takes `difficulty` and drops the destructuring defaults on `lives` and `gold`:
  `{ waypoints = WAYPOINTS, spawnInterval, waveSize, lives, gold, totalWaves = TOTAL_WAVES,
  status = 'playing', difficulty = null } = {}`.
- `const entry = difficultyEntry(difficulty);` comes first, so an unknown key throws before
  anything is built.
- `options = { waypoints, spawnInterval, waveSize, lives, gold, totalWaves, status,
  difficulty }`. `lives` and `gold` are kept as the caller gave them, `undefined` when left
  out. That way `restart` resolves them again through the entry, and a restarted hard game
  starts with 60 and 8.
- The state's `lives` is `lives === undefined ? entry?.lives ?? START_LIVES : lives`, and
  `gold` follows the same rule with `entry?.gold ?? START_GOLD`. The `=== undefined` test
  matches today's destructuring default, which fills only `undefined`. The state gains
  `difficulty` (the key, or `null`), placed beside `options`.
- The comment above `createGame` gains one sentence: `difficulty` (a key of DIFFICULTIES)
  sets the starting gold and lives, an explicit `gold` or `lives` wins over it, and left out
  the game plays as the table and START_GOLD/START_LIVES give it.
- A private helper, `toughened(state, health)`, returns
  `Math.ceil(health * (difficultyEntry(state.difficulty)?.health ?? 1))`. Its comment: a
  ghost's health on this game's difficulty, as the table gives it when there is none.
- `spawnEnemy` passes `health: toughened(state, health)`, and `spawnBoss` does the same.
  Speed, bounty, count and interval are untouched. The two spawn comments note that health
  is scaled by the difficulty.
- `restart` is unchanged in code: `createGame(state.options)` now carries `difficulty` and
  the caller's own `lives` and `gold`.

Commit as `fix(9oy): difficulty levels: DIFFICULTIES, createGame's difficulty option, ghost health scaled by it`.

### 4. Green

Run `npx node --test test/difficulty.test.js test/game.test.js test/game-over.test.js
test/gold.test.js test/boss.test.js test/waves.test.js test/start-screen.test.js
test/tower-cost.test.js test/upgrade.test.js`. That covers the reproducer and every unedited
suite that calls `createGame`, `restart`, `spawnEnemy` or `spawnBoss`, or reads the starting
gold and lives. Then run `npm --prefix . run test` once, the line's named check. The whole
suite also runs on the pull request's required checks.

## Acceptance

`npm --prefix . run test` passes. test/difficulty.test.js is committed red first and is
green after, and every existing test under test/ is unedited and green. The new file proves
each of the issue's criteria:

- `DIFFICULTIES` has exactly `easy`, `normal` and `hard`, with the table's names and numbers.
- `createGame({ difficulty: 'hard' })` starts with 60 gold and 8 lives.
  `createGame({ difficulty: 'hard', gold: 200 })` starts with 200 gold and 8 lives.
- Wave 1's first ghost has 3, 5 and 6 health on easy, normal and hard, at the same speed and
  bounty on all three.
- The boss of wave 5 has 40, 60 and 80 health on easy, normal and hard.
- A game made without a difficulty has `state.difficulty` of `null`, 50 gold, 10 lives and
  wave-1 ghosts of 3 health.
- Restarting a hard game gives `state.difficulty` of `'hard'`, with 60 gold and 8 lives.
- The refusal: an unknown difficulty throws the RangeError spelled under Refusals.
