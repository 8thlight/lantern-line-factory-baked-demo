# Plan: a HUD of lives, gold and wave, with pause and speed (line-factory-baked-demo-aic)

Beads: lantern-line-factory-baked-demo-aic (GitHub issue #11, work/m4-01-hud.md) and
lantern-line-factory-baked-demo-l3s (GitHub issue #12, work/m4-02-pause-and-speed.md), opened
here as issue #40. Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-aic/triage.md: read. It carries both briefs in full, the
  signed `touches:` and `reproduces:` lists and the acceptance criterion. This plan works inside
  that `touches:` list and amends nothing.
- spec.md: not present in the worktree (no docs/changes/line-factory-baked-demo-aic/spec.md and
  none anywhere in the tree). Nothing is read from it; the triage's briefs and lists stand in
  for it, as they did for prints sn6 and a8h.
- plan/research.md: not present in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers both briefs whole.
- The base: this print branch sat on 6658250, older than main. The triage describes main's code
  (src/theme.js, test/render.test.js, `state.gold`, `state.wave`, `updateWave`), so main
  (639f168) was taken in at 9ddde1b before this plan was written. That merge brings main's own
  files and is not this change's diff; the build starts from it.
- Source read (after the merge): src/game.js, src/render.js, src/theme.js, src/main.js,
  src/wave.js, src/enemy.js, src/tower.js, src/path.js (TILE 40, 16 by 10, a 640 by 400 board);
  test/render.test.js, test/game.test.js, test/game-over.test.js. No test pins the whole state
  with `deepEqual`, so the new `paused` and `speed` fields break none.
- Design read: design/hud.md, design/screens.yaml, design/screens/Main.dc.html and Main.png,
  design/screens/HudStates.dc.html and HudStates.png. design/hud.md says the artboard wins where
  the two differ, and this plan follows the artboards' HUD bar (see the design note).
- Standards: docs/standards/README.md and tests/architecture/assertion_baseline.json hold
  negative-assertion-unpaired and substring-binding at 0. The new tests use `assert.equal` and
  `assert.deepEqual` on exact values only: no `notEqual`/`notDeepEqual`, no `includes` or
  `match` on a string.

## Who meets it

- person: the player, in play on the board drawn at design/screens/Main.png (source design/screens/Main.dc.html), reads lives, gold and the wave (current / total, with its pips) in the bar across the top; with 3 lives or fewer sees the lives pill turn danger red, and clicking the pause button or pressing P stops the board and shows the Resume (play) icon, while clicking the 1x/2x control or pressing F fills 2x gold and runs the board at double speed, as design/screens/HudStates.png (source design/screens/HudStates.dc.html) shows.

## Refusals

- none: this change refuses nothing new; `hudModel` reads any state and returns its values, `togglePause` and `toggleSpeed` always toggle, a paused `step` returns the state unchanged rather than refusing, a click outside the two HUD buttons falls through to the board as it does today, and every other key passes on to `kindForKey` as it does today.

## Touches

As signed in triage.md, unchanged:

- src/hud.js (new)
- src/render.js
- src/theme.js
- src/game.js
- src/main.js
- test/hud.test.js (new, `reproduces:`)
- test/pause-speed.test.js (new, `reproduces:`)
- test/render.test.js

No other path changes. src/wave.js, src/enemy.js and src/tower.js are not touched: `step`
scales the `dt` it hands to `updateWave`, `advanceEnemy` and `updateTower`, so none of them
changes.

## Design note, reported and not moved

design/hud.md's brief and the Main/HudStates artboards differ, and the brief says the artboard
wins. Where they differ, the build follows the artboard:

- Bar: 40px tall, full width, fill `rgba(10, 22, 16, 0.78)` with a 1px bottom line
  `rgba(244, 239, 225, 0.08)` (the brief's `--hud-bg` is `rgba(18, 36, 28, 0.85)`).
- Lives, gold and wave are three rounded pills (26px tall, radius 13, fill
  `rgba(244, 239, 225, 0.06)`), 10px in from the left with an 8px gap: a heart then the value
  (bold 15px) then "lives" (11px, muted); a coin then the gold value in accent then "gold";
  "Wave" (muted) then `current / total` in `#c3a8ff` then one 4 by 12 pip per wave, lit
  `#c3a8ff` up to the current wave and `rgba(195, 168, 255, 0.22)` past it (the brief's
  `--hud-ghost` is `#8e6bd8`).
- Danger (3 lives or fewer): the lives pill fills `rgba(230, 90, 90, 0.16)` with a 1px ring
  `rgba(230, 90, 90, 0.6)`, heart `#ff7a7a`, value `#ff8f8f`, label `#ffb3b3`.
- Pause is an icon button, 32 by 28, radius 7: two bars (Pause) in ink with a muted outline
  `rgba(184, 196, 176, 0.45)` over `rgba(244, 239, 225, 0.04)`; while paused, a play triangle
  (Resume) in accent, outlined in accent over `rgba(242, 193, 78, 0.14)`. The brief's text
  "Pause"/"Resume" is not drawn.
- Speed is one segmented control, 68 by 28, radius 7, muted outline, holding "1x" and "2x"
  (600 12px), each 34 wide. The active one is filled: 1x with `rgba(244, 239, 225, 0.16)` and
  ink text, 2x with accent `#f2c14e` and dark text `#12241c`; the idle one is transparent with
  muted text. The bar's right padding is 10px and the gap between the two buttons is 8px.

Not built, because neither brief asks for it and the state holds nothing to draw it from:
the Main artboard's "Next wave in 0:08" (waves start as soon as the board clears, with no
countdown in state), and the HudStates artboard's centred "Paused" card with "Press Space or
the play button to resume" (the brief names P and F as the keys; Space is not bound). Both are
for the line to cut as their own items, not for this print.

## Build order (red first, then green)

### 0. Base

Main is already in (9ddde1b). Run `node --test test/render.test.js test/game.test.js
test/game-over.test.js` once to see the base green before any change.

### 1. The reproducers, committed red

Written and committed before any source change.

**test/hud.test.js**, importing `hudModel` from '../src/hud.js' and `createGame`, `START_LIVES`,
`START_GOLD`, `TOTAL_WAVES` from '../src/game.js':

- 'hudModel on a new game shows full lives, starting gold, wave 1 of the total, running at 1x':
  `assert.deepEqual(hudModel(createGame()), { lives: START_LIVES, gold: START_GOLD, wave: 1,
  totalWaves: TOTAL_WAVES, paused: false, speed: 1, livesDanger: false })`; and
  `hudModel(createGame({ totalWaves: 2 })).totalWaves` is 2.
- 'livesDanger is false at 4 lives and true at 3': `hudModel(createGame({ lives: 4 })).livesDanger`
  is `false`, at `lives: 3` it is `true`, and at `lives: 0` it is `true`.
- 'hudModel reflects gold and wave after they change in state': a game with `gold = 120`,
  `wave = 3`, `paused = true`, `speed = 2` gives `gold` 120, `wave` 3, `paused` true, `speed` 2.
- 'hudModel does not change the state it reads': `const game = createGame()`,
  `const before = structuredClone({ ...game, path: [...game.path] })`; call `hudModel(game)`
  twice; `assert.deepEqual({ ...game, path: [...game.path] }, before)`. A second call returns
  a deep-equal object (so it reads, never accumulates).

**test/pause-speed.test.js**, importing `createGame`, `placeTower`, `spawnEnemy`, `step`,
`togglePause`, `toggleSpeed` from '../src/game.js':

- 'togglePause flips paused and toggleSpeed moves between 1 and 2': a new game is
  `paused: false, speed: 1`; `togglePause` gives `true`, again `false`; `toggleSpeed` gives 2,
  again 1. Each returns the state it was handed.
- 'a paused step leaves enemy positions, spawn timers and tower reloads unchanged': a game with
  a lantern at (1, 1) and a ghost spawned, stepped 0.3 so the spawner timer is mid-count and
  the lantern has fired and is reloading (`reload > 0`); snapshot `enemies` (x, y, distance),
  `spawner` (spawned, timer), each tower's `reload`, `gold`, `kills`, `lives`, `wave`; then
  `togglePause` and `step(game, 0.5)` three times; every snapshotted value is deep-equal to
  before. `togglePause` again and one `step(game, 0.1)` moves the ghost on (its `distance`
  is greater), so the pause is what held it.
- 'at speed 2, one step(state, 0.5) moves a ghost as far as two step(state, 0.5) calls at speed
  1': two games made with `{ waveSize: 0 }` (no automatic spawning), one ghost each from
  `spawnEnemy`; `toggleSpeed(fast)`; `step(fast, 0.5)` once and `step(slow, 0.5)` twice; the
  two ghosts' `{ x, y, distance }` are deep-equal and `distance` is 60 (ENEMY_SPEED times 1s).
- 'speed scales the spawner and tower reloads too': at speed 2 with `{ waveSize: 3,
  spawnInterval: 1 }`, `step(game, 0.01)` spawns 1, then `step(game, 0.5)` spawns the 2nd
  (one interval of game time); and a lantern reloading from 0.6 is at 0 after one
  `step(game, 0.3)` at speed 2 in a `{ waveSize: 0 }` game with no ghost (its `reload` set to 0.6 first).

Red against main: src/hud.js does not exist, and `togglePause`, `toggleSpeed`, `paused` and
`speed` do not.

### 2. src/game.js

- `createGame` adds `paused: false` and `speed: 1` to the state (not to `options`, so `restart`
  starts a fresh round unpaused at 1x).
- `export function togglePause(state)`: flips `state.paused`; returns `state`.
- `export function toggleSpeed(state)`: `state.speed = state.speed === 2 ? 1 : 2`; returns `state`.
- `step(state, dt)`: after the `status` check, `if (state.paused) return state;` then
  `dt *= state.speed;` (so spawner, enemies, shot ttl and tower reloads all see game time),
  and the rest is unchanged. The header comment says a paused round stands still and speed
  scales game time.

### 3. src/hud.js (new)

Pure, no DOM, safe to import from tests:

    // What the HUD shows, read from state and never written back. render.js draws only this.
    export const DANGER_LIVES = 3;
    export function hudModel({ lives, gold, wave, totalWaves, paused, speed }) {
      return { lives, gold, wave, totalWaves, paused, speed, livesDanger: lives <= DANGER_LIVES };
    }

The bar's geometry, so render.js draws the buttons where main.js hit-tests them:

    export const HUD_HEIGHT = 40;
    export const HUD_BUTTONS = {
      pause: { x: 640 - 10 - 68 - 8 - 32, y: 6, width: 32, height: 28 },
      speed: { x: 640 - 10 - 68, y: 6, width: 68, height: 28 },
    };
    // The HUD button under a board point: 'pause', 'speed' or null.
    export function hudButtonAt(x, y) { … }

The x positions are worked from `COLS * TILE` (imported from './path.js'), not written as 640.

### 4. src/theme.js

Add the HUD's colours as named tokens under a `// HUD bar (design/screens/Main.dc.html,
HudStates.dc.html)` heading: `hudBg`, `hudLine`, `hudPill`, `hudInk`, `hudMuted`, `hudAccent`,
`hudOnAccent`, `hudCoinRim` (`#b9861f`), `hudHeart` (`#e65a5a`), `hudWave`, `hudPipDim`,
`hudDangerPill`, `hudDangerRing`, `hudDangerHeart`, `hudDangerValue`, `hudDangerLabel`,
`hudButtonEdge`, `hudButtonBg`, `hudButtonActive`, `hudResumeBg`, with the values in the design
note. Existing tokens are not changed. The file's header comment names the HUD too.

### 5. src/render.js

- `draw` replaces `drawLives(ctx, state.lives)` with `drawHud(ctx, hudModel(state))`, still
  before the end card so the card's veil sits over the bar.
- `drawLives` is deleted. `export function drawHud(ctx, hud)` draws, from `hud` alone: the bar
  and its bottom line; the lives pill (heart path, value, "lives") in the danger colours when
  `hud.livesDanger`; the gold pill (coin, value, "gold"); the wave pill ("Wave",
  `` `${wave} / ${totalWaves}` ``, `totalWaves` pips); the pause button (two bars, or the play
  triangle while `hud.paused`) and the speed control ("1x", "2x", the active one filled), at
  `HUD_BUTTONS`. Text is drawn left-aligned, middle baseline, `Inter, system-ui, sans-serif`;
  each pill's width is laid out with `ctx.measureText` (falling back to an estimate when the
  context returns none, as the test's recording context does).
- Every colour is a THEME token; no literal. `ctx.save()`/`ctx.restore()` around it.

### 6. src/main.js

- `cellAt` is split: `pointAt(event)` gives the board point, and `cellAt` uses it.
- The click handler, while `state.status === 'playing'`, first asks `hudButtonAt(x, y)`:
  'pause' calls `togglePause(state)`, 'speed' calls `toggleSpeed(state)`, and either returns
  without placing. A click anywhere else places as today; a finished round still restarts on
  any click.
- The keydown handler: `p`/`P` calls `togglePause(state)`, `f`/`F` calls `toggleSpeed(state)`,
  and every key still goes to `kindForKey` as today (neither P nor F is a kind key).
- Imports add `togglePause`, `toggleSpeed` from './game.js' and `hudButtonAt` from './hud.js'.

### 7. test/render.test.js

Only the assertions the triage names, plus coverage of the HUD's other state:

- 'a finished round draws its end card, and a round in play draws none': the end-card checks
  read the card's two texts as the last two drawn (`texts(lost).slice(-2)`), since the HUD now
  draws several texts first; the in-play check becomes
  `assert.deepEqual(texts(playing), ['10', 'lives', '50', 'gold', 'Wave', '1 / 5', '1x', '2x'])`.
- 'every colour draw paints with is a THEME colour' also draws a paused, 2x, 3-lives game
  (`{ ...game, paused: true, speed: 2, lives: 3 }`), so the danger, resume and 2x colours are
  held to THEME too.
- New: 'the HUD draws danger lives, the resume icon and a filled 2x from hudModel': drawing
  `{ ...createGame(), lives: 3, paused: true, speed: 2 }` fills a text '3' with
  `THEME.hudDangerValue` and a text '2x' with `THEME.hudOnAccent` over a `THEME.hudAccent`
  fill; the same game at 4 lives, unpaused, at 1x draws '4' in `THEME.hudInk`. Checked by
  exact `fillStyle` on the recorded `fillText` calls.

The file's literal-free and no-PALETTE tests stay as they are.

### 8. Green

`pytest` is not this line's runner; the files this change names or touches run with
`node --test test/hud.test.js test/pause-speed.test.js test/render.test.js test/game.test.js
test/game-over.test.js`, then `npm test` on the pull request's required checks.

## Acceptance

npm --prefix . run test passes with test/hud.test.js proving hudModel on a new game returns
full lives, starting gold, wave 1 and the total wave count, livesDanger false at 4 lives and
true at 3, gold and wave reflected after they change, and the state it reads left unchanged;
and test/pause-speed.test.js proving togglePause flips paused, toggleSpeed moves between 1 and
2, a paused step leaves enemy positions, spawn timers and tower reloads unchanged, and at speed
2 one step(state, 0.5) moves a ghost as far as two step(state, 0.5) calls at speed 1.
