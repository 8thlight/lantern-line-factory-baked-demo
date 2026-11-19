# Plan: line-factory-baked-demo-ov2

Win and lose states with a restart (GitHub #3, bead ov2), taken with drawing the board to match its Claude Design board (GitHub #4, bead vd6). Class: fix. Tracking issue: #22.

## Inputs, as verified

- `docs/changes/line-factory-baked-demo-ov2/triage.md` (commit 2233895): the ratified brief. It carries `reproduces:` (test/game-over.test.js, test/render.test.js), `touches:` and the acceptance criterion this plan answers to. No separate `spec.md` exists for this print; triage.md is the signed record it reads.
- `plan/research.md`: absent, and not owed. `.hydraflow/policy.yaml` `research.required_for` lists only `class:feature` and `class:mandate`, and this print is `class:fix`. So research declared no scope, and this plan restates none: the whole brief in triage.md is in scope.
- The tree as found: `src/game.js`, `src/main.js`, `src/render.js`, `src/enemy.js`, `src/tower.js`, `src/path.js`, `test/game.test.js`, `work/m1-01..04`, `design/screens.yaml`, `design/screens/{Board,Win,Lose}.dc.html`.

## Who meets it

- person: the player in the browser, who now reaches an end to a round. When the last life goes, the dimmed board shows the lose card "The ghosts got through"; when the last wave is held with lives left, the win card "The path is safe"; both say "Click to play again", and a click starts a fresh round at wave 1. Artboards: design/screens/Lose.png and design/screens/Win.png (sources design/screens/Lose.dc.html, design/screens/Win.dc.html). The board in play is drawn to design/screens/Board.png (source design/screens/Board.dc.html), with the lantern and ghost sprites in play as design/screens/Main.png.

## Refusals

- none: this change adds no refusal. A round that is over makes `step` a silent no-op and turns a click into a restart; nothing is turned away with a message, and `placeTower` keeps its existing `false` for a bad cell with no new case.

## Touches

The signed list holds the whole fix; no amendment.

touches:
  - src/game.js
  - src/main.js
  - src/render.js
  - src/theme.js
  - test/game-over.test.js
  - test/render.test.js

`test/game.test.js` is not touched: every test in it keeps passing under the change below (the default wave is larger than the two ghosts its spawn-interval test counts, and its other tests use `quietGame`, which never spawns on its own).

## Tests written red first

Both are the triage's `reproduces:` files, written before the source change and run red, then green. Run with `node --test test/game-over.test.js test/render.test.js`, then `npm test`.

The line's testing standard holds `negative-assertion-unpaired` at 0: every "no", "absent" or "unchanged" assertion below is paired with a positive one in the same test (for example, no hex literal in render.js *and* render.js imports from `./theme.js`).

### test/game-over.test.js

1. Losing the last life sets `status` to `'lost'`: `createGame({ lives: 1 })` with the auto-spawn held off, one ghost spawned, `step` long enough for it to reach the gate; `lives` is 0 and `status` is `'lost'` (and was `'playing'` before).
2. Clearing every wave with lives left sets `status` to `'won'`: `createGame({ totalWaves: 2, waveSize: 1, spawnInterval: 0.1 })`, stepped in small ticks until it ends; `status` is `'won'`, `wave` is 2, `lives` is above 0. A further case: with `totalWaves: 2`, after the first wave clears `wave` is 2 and `status` still `'playing'`.
3. `step` on a lost game and on a won game leaves enemies, lives and towers unchanged: snapshot (structured clone) of `enemies`, `lives`, `towers` before a long `step`, deep-equal after; and the returned state is the same object.
4. `restart` returns full lives, no towers, no enemies, wave 1 and status `'playing'`: from a lost game built with `{ lives: 4, totalWaves: 3 }` and a tower placed, `restart(game)` gives `lives` 4, `towers` [], `enemies` [], `wave` 1, `status` `'playing'`, `totalWaves` 3, and is a new object.

### test/render.test.js

A fake context: a `Proxy` that records every method call (`name`, `args`) and every property set (`fillStyle`, `strokeStyle`, `shadowColor`, `shadowBlur`, `lineWidth`, ...), with `createRadialGradient` / `createLinearGradient` returning a recording gradient whose `addColorStop` colours are recorded too.

1. render.js has no hex colour literal and takes every colour from theme.js: the source of `src/render.js` (read with `fs`) matches no `/#[0-9a-fA-F]{3,8}\b/` and no `rgba?\(`; it imports from `./theme.js`. Then `draw` a busy game (towers, ghosts, a shot, a hover, and the lost and won cards): every string set as `fillStyle`, `strokeStyle` or `shadowColor`, and every `addColorStop` colour, is one of the values `src/theme.js` exports.
2. `drawLantern` draws a radial-gradient pool and an arc or curve body: records a `createRadialGradient` call and at least one `arc`, `ellipse`, `bezierCurveTo`, `quadraticCurveTo` or `roundRect`.
3. `drawGhost` draws a curved body, two eyes and a health bar that shortens as health falls: a curve call (`arc` / `bezierCurveTo` / `quadraticCurveTo`), two eye shapes (two `ellipse` or `arc` calls filled with the eye colour), and the health bar's fill width for `{ health: 1, maxHealth: 3 }` is less than for `{ health: 3, maxHealth: 3 }`; a ghost with no `health` draws the full-width bar.
4. `drawBeam` strokes lantern centre to target centre with a glow: `moveTo(from.x, from.y)`, `lineTo(to.x, to.y)`, a `stroke`, and `shadowBlur` set above 0 before that stroke.
5. `draw` on a fresh game calls `drawPath` once and draws no ghost before the first spawn: `draw(ctx, createGame(), null, sprites)` with recording sprites counts `drawPath` 1 and `drawGhost` 0; after one `spawnEnemy`, `drawGhost` 1.

## Construction

### src/game.js

- `createGame` takes two new options beside `waypoints`, `spawnInterval` and `lives`: `totalWaves` (default `TOTAL_WAVES = 5`) and `waveSize` (default `WAVE_SIZE = 5`, ghosts per wave). It keeps them all on `state.options` so `restart` can rebuild from them, and adds `status: 'playing'`, `wave: 1`, `totalWaves`, `waveSize` and `spawnedThisWave: 0`.
- Waves are the least that gives a round an end, inside game.js alone, because work/m1-02's `src/wave.js` is not built and is not in touches: `step` spawns on the existing `spawnTimer` only while `spawnedThisWave < waveSize`, counting each spawn it makes (`spawnEnemy` itself is unchanged, so tests that spawn by hand do not move the wave). When the wave has spawned out and the board is clear, the wave is cleared: on the last wave with lives left `status` becomes `'won'`; otherwise `wave` goes up by one, `spawnedThisWave` returns to 0 and `spawnTimer` to 0. work/m1-02 later replaces the counter with `updateWave` and keeps `state.wave` and `totalWaves` as they are.
- After `leakEnemies`, lives at 0 sets `status` to `'lost'` and `step` returns at once, so a lost round is never also won.
- `step` returns the state unchanged at its top while `status !== 'playing'`.
- `export function restart(state) { return createGame(state.options); }`.

### src/theme.js (new)

Named colour tokens read off design/screens/Board.dc.html, Win.dc.html and Lose.dc.html, as one exported `THEME` object (and nothing else that is a colour anywhere in render.js): grass (`grassA` #17311f, `grassB` #1a3623, `grassBlade` #2c5236), path stones (`pathShadow` #0c1a13, `pathEdge` #8f6f40, `pathStone` #c9a66b, `pathJoint` #b18d55), lantern paper (`lanternPaper` #e8a83a, `lanternInner` #f6c95c, `lanternCore` #fff4c9, `lanternRib` #b97a22, `lanternCap` #4a3720, `lanternPost` #5a4326, `lanternTassel` #d9534f), lantern glow (`glowCentre` #ffd27a with alpha, `glowEdge` #f2b84e transparent), ghost body (`ghostBody` #9b7be6, `ghostEdge` #4d3586, `ghostSheen` #d9c9ff), ghost eyes (`ghostEye` #1c1233, `ghostEyeShine` #f4efe1), beam (`beam` #fff4c9, `beamGlow` #ffe7a3), health bar (`healthTrack` #0c1a13 at 0.7, `healthHigh` #7fd68a, `healthMid` #e9c75a, `healthLow` #e65a5a), hover (`hover`, `hoverBad`, the two rgba values render.js uses today), text (`text` #f4efe1, `textMuted` #b8c4b0), and the end cards (`dim` #07130d at the cards' dim, `cardWin` / `cardLose` backgrounds, `cardWinEdge` #f2c14e, `cardLoseEdge` #c3a8ff). Alpha is written into the token (rgba or 8-digit hex) so render.js never builds a colour string.

### src/render.js

- Imports `THEME` from `./theme.js`; `PALETTE` goes (nothing else imports it). No hex or `rgba(` literal remains.
- Exports `drawPath(ctx, path)`: the stones over the path cells with a darker edge and a drop shadow, a dashed joint line between stones; the grass stays alternating tiles, drawn by `draw` before it.
- Exports `drawLantern(ctx, tower)`: a radial-gradient light pool on the grass (`createRadialGradient`, glow tokens), the post, the cap, a rounded glowing body (rounded rect / ellipse) with two ribs and a bright core, the tassel.
- Exports `drawGhost(ctx, ghost)`: a rounded head (`arc`), a wavy hem (zig-zag or `quadraticCurveTo` scallops), sheen, two eyes with shines, and the health bar above it: a track, then a fill whose width is `BAR_W * health / maxHealth`, read off the ghost and taken as full when either is absent (src/enemy.js has no health until work/m1-01), coloured high / mid / low as the Board artboard reddens it.
- Exports `drawBeam(ctx, shot)`: inside `save`/`restore`, `shadowBlur` above 0 with the beam-glow `shadowColor`, a wide soft stroke and a thin bright stroke from `shot.from` to `shot.to` (the lantern's centre to the target's centre, as game.js records them).
- `draw(ctx, state, hover, sprites = SPRITES)`, where `SPRITES = { drawPath, drawLantern, drawGhost, drawBeam }`: grass, `sprites.drawPath` once, hover, a lantern per tower, a ghost per enemy, a beam per shot, lives; then, when `state.status` is `'lost'` or `'won'`, the end card over a dimmed board. The `sprites` parameter is what lets the test count `drawPath` and `drawGhost` calls through a fake; main.js passes nothing.
- The end card (private `drawRoundOver`): a centred rounded card in the lose or win colours, the headline "The ghosts got through" (lost) or "The path is safe" (won), and "Click to play again" beneath.

### src/main.js

- `state` becomes `let`. The click handler: when `state.status !== 'playing'`, `state = restart(state)` and return; otherwise place a tower as today. Import `restart` from game.js.

## Deviations from the artboards, and why

- The win headline is "The path is safe", as the issue (#3) and the triage spell it, where design/screens/Win.dc.html says "The garden is safe". The issue's copy is the one the brief signs; the next print that builds the full card (stats, Play again / Menu) can take the artboard's.
- The Win and Lose cards' stat tiles (lives left, ghosts turned back, gold banked, waves held, lanterns hung), their buttons and the Menu are not built: the issue asks for the two lines and a click, gold is work/m3-01 and the menu is work/m4-03. The card's colours, dimmed board and headline follow the artboards.
- The artboards say 10 waves; the issue sets `totalWaves` default 5, and this plan follows the issue.

## Done when

`node --test test/game-over.test.js test/render.test.js` and `npm --prefix . run test` pass, with the two new files proving every criterion in triage.md's acceptance criterion, and the diff touching only the six paths above.
