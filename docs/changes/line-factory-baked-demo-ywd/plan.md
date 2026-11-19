# Plan: a frost tower that slows ghosts

Print: line-factory-baked-demo-ywd (GitHub issue #14, triage issue #45). Class: fix.

## Inputs, as verified

- `docs/changes/line-factory-baked-demo-ywd/triage.md`: read. Its acceptance criterion, `reproduces:` and `touches:` are what this plan answers to.
- `spec.md`: not in the worktree. No spec was committed for this print, so this plan reads none and claims none.
- `plan/research.md`: not in the worktree. Research declared no scope, so this plan has no `## Declared scope` to restate. Everything below is planned against the triage alone.

### Where the triage and the tree disagree

The triage's "What broke" describes a tree that is not this one. Checked at commit 0b81c5f:

- `src/tower.js` declares only `LANTERN` (`{ range, cooldown }`). There is no `BRAZIER`, no `cost`, no `damage`, no `splash` and no `kindForKey`.
- `src/game.js` has no `state.gold` and no `placementError`. `placeTower` returns `true` or `false`, and one beam removes a ghost outright because ghosts have no health.
- `src/theme.js` and `test/brazier.test.js` do not exist. Colours live in `PALETTE` in `src/render.js`.
- `src/main.js` has no key handling and places only lanterns.

Those parts belong to work items that have not been built: `work/m1-01-enemy-health.md` (health and damage), `work/m1-04-board-art.md` (`src/theme.js`), `work/m2-01-splash-tower.md` (brazier, keys 1 and 2), `work/m3-01-gold-per-kill.md` (gold) and `work/m3-02-tower-cost.md` (`cost`, `placementError`). The defect is still real: no frost tower exists. So this is neither a stand-down nor a reject.

I tried to ask the operator a Product question about the decision below, but no operator was watching this stage. I took the narrowest option that meets the triage's acceptance criterion on this tree without building another work item's feature.

**Decision: build frost on today's tree, with only the parts frost needs, shaped to the contracts the later work items name so they can build on them without rework.**

- Frost slows and deals no damage, because ghosts have no health to lose. When m1-01 lands, the lantern gets `damage: 1` and frost can get a damage below it. That is m1-01's call and is not planned here.
- Each kind gets a `cost`: lantern `0` and frost `40`. m3-02 sets the lantern's 20 when the economy lands. A lantern cost of 0 keeps every existing `test/game.test.js` placement unchanged.
- The game gets `state.gold`, starting at 50 (m3-01's figure). Nothing earns gold until m3-01, so one frost tower can be afforded per game until then.
- `placementError(state, col, row, kind)` is added with m3-02's exact return set (`'bounds'`, `'path'`, `'taken'`, `'gold'`, `null`). `placeTower` still returns `true`/`false` and now takes a `kind`.
- Keys `1` and `3` pick lantern and frost. Key `2` (brazier) is left to m2-01, and any other key keeps the current kind.
- Frost's colours go into `PALETTE` in `src/render.js`, the one colour home this tree has. m1-04 moves `PALETTE` into `src/theme.js` and takes them along. `src/theme.js` is not created here.
- `test/brazier.test.js` does not exist, so there is no "key 3 keeps the brazier" assertion to change. It is not created and not touched.

## Who meets it

- person: the player. They pick frost with key 3, see "Frost (40)" as the selected kind on the board, place it on grass when they hold 40 gold, and watch the ghosts it hits turn frost-tinted and drift at half speed. No artboard draws frost yet. Its tower and the selected-kind label follow the build tray and HUD of design/screens/Main.png (source design/screens/Main.dc.html), and the tinted ghost keeps the Board artboard's ghost shape (design/screens/Board.png).

## Refusals

This change introduces a placement reason, `placementError`'s return value, which `main.js` reads to colour the hover cell. Each value is new text:

- placement/gold: `'gold'` — this tower costs more than the gold you hold; pick a cheaper kind (key 1, the lantern, costs 0) or wait until you hold its cost.
- placement/bounds: `'bounds'` — that cell is off the board; place the tower on a cell inside the 0..COLS-1 by 0..ROWS-1 grid.
- placement/path: `'path'` — towers cannot stand on the ghosts' path; place it on a grass cell beside the path.
- placement/taken: `'taken'` — a tower already stands on that cell; pick an empty grass cell.

## Touches

The signed `touches:` hold this fix. No amendment is needed. This plan writes a subset of them:

- `src/tower.js`
- `src/enemy.js`
- `src/game.js`
- `src/render.js`
- `src/main.js`
- `test/frost.test.js` (new, the `reproduces:` test, written red first)

These signed paths are left alone: `src/theme.js` (m1-04 creates it) and `test/brazier.test.js` (it does not exist). No existing test is edited. `test/game.test.js`, `test/path.test.js` and `test/targeting.test.js` must pass unchanged.

## Steps

### 1. `test/frost.test.js`, red first

Use `node:test` and `node:assert/strict`, in the style of `test/game.test.js`. There must be no unpaired negative assertion and no substring assertion, because the line's testing baseline is 0 for both and may not rise.

1. **Half the distance in the next second.** Create two ghosts with the same speed on the same waypoints. Hit one with frost's slow (`slowEnemy(ghost, FROST.slow, FROST.slowFor)`, the function `step` calls). Then `advanceEnemy` both by 1 second. The slowed ghost's distance equals half the unhit ghost's.
2. **Back to full speed after `slowFor`.** Slow a ghost, then `advanceEnemy` it by `FROST.slowFor` seconds. Assert `slow === 1` and `slowLeft === 0`. Then one more second moves it exactly `speed * 1`.
3. **Two hits leave the factor, not its square.** Slow a ghost twice in a row. Assert `slow === FROST.slow` (0.5, not 0.25) and `slowLeft === FROST.slowFor`, so the second hit refreshed the time. Then one second covers `speed * 0.5`.
4. **Cost and refusal.** `FROST.cost === 40`. On `createGame({ gold: 30 })`, `placementError(game, 1, 0, FROST) === 'gold'`, `placeTower(game, 1, 0, FROST) === false`, `game.towers.length === 0` and `game.gold === 30`. On `createGame()` (50 gold), placing frost returns `true` and leaves `gold === 10`.
5. **Through the game loop.** A game with no spawns (`spawnInterval` large) gets one ghost placed in a frost tower's range and one `step`. The ghost is still on the board, its `slow` is `0.5` and `kills` stays 0. This proves frost slows and does not kill.
6. **Wiring.** `kindForKey('3', LANTERN) === FROST`, `kindForKey('1', FROST) === LANTERN` and `kindForKey('x', FROST) === FROST`. `createTower(1, 0, FROST)` carries `slow`, `slowFor` and `kind === FROST`.

Run `node --test test/frost.test.js`. It must fail before steps 2–6 are built.

### 2. `src/tower.js`

- `LANTERN = { name: 'Lantern', range: 100, cooldown: 0.6, cost: 0 }`.
- `FROST = { name: 'Frost', range: 90, cooldown: 1.0, cost: 40, slow: 0.5, slowFor: 2 }`. Here `slowFor` is in seconds and at least 1, so the one-second test sits wholly inside the slow.
- `createTower(col, row, kind = LANTERN)` also carries `kind`, `slow` and `slowFor` (both `undefined` for the lantern).
- `kindForKey(key, current)`: `'1'` returns `LANTERN`, `'3'` returns `FROST` and anything else returns `current`.

### 3. `src/enemy.js`

- `createEnemy` adds `slow: 1, slowLeft: 0`.
- `slowEnemy(enemy, factor, seconds)` sets `slow = factor` and `slowLeft = seconds`. It assigns rather than multiplies, which is what keeps two hits at 0.5.
- `advanceEnemy` moves by `speed * (slow * t + (dt - t))`, where `t = min(dt, slowLeft)`, so a slow that runs out mid-step ends exactly. It then counts `slowLeft` down, and at 0 resets `slow` to 1. An unslowed ghost still moves `speed * dt`, so `test/path.test.js` holds.

### 4. `src/game.js`

- `START_GOLD = 50`. `createGame({ ..., gold = START_GOLD })` puts `gold` on the state.
- `placementError(state, col, row, kind = LANTERN)` returns `'bounds'`, `'path'`, `'taken'` or `'gold'`, in that order, or `null`.
- `placeTower(state, col, row, kind = LANTERN)` returns `false` on any error. Otherwise it pushes `createTower(col, row, kind)`, takes `kind.cost` from `gold` and returns `true`.
- In `step`, a tower with `slow` calls `slowEnemy(target, tower.slow, tower.slowFor)`. It does not remove the ghost or count a kill, and it pushes a shot marked `frost: true`. Lantern behaviour is unchanged.
- `canPlace` in `tower.js` stays, because `main.js` and the tests use it. `placementError` checks the same rules and adds gold.

### 5. `src/render.js`

- `PALETTE` gains `frost`, `frostCore`, `frostBeam` and `ghostSlowed` (an ice blue body).
- `drawTower` draws a tower with `slow` as a frost tower: a diamond in `frost` with a `frostCore` centre, so it reads apart from the round lantern.
- `drawGhost` fills a ghost whose `slowLeft > 0` with `ghostSlowed`.
- `drawShots` strokes a `frost` shot in `frostBeam`.
- `draw(ctx, state, hover, kind)` draws `` `${kind.name} (${kind.cost})` `` under the lives text only when `kind` is given, so a three-argument `draw` call draws exactly what it does today.

### 6. `src/main.js`

- Hold `let kind = LANTERN`. A `keydown` listener on `window` sets `kind = kindForKey(event.key, kind)`.
- A click calls `placeTower(state, col, row, kind)`. Hover `ok` is `placementError(state, col, row, kind) === null`, so a frost cell you can't afford shows in the existing refusal colour.
- The frame passes `kind` to `draw`.
- The intro line in `index.html` is not in `touches:` and is left alone.

## Verification

- `node --test test/frost.test.js` must go red after step 1 and green after step 6.
- Run the touched suites with `node --test test/frost.test.js test/game.test.js test/path.test.js test/targeting.test.js` (this line's tests are `node --test`, not pytest). Then run `npm --prefix . run test` as the criterion names it. The full suite runs on the pull request's required checks.
- Read back over `src/render.js` and `src/main.js`. These are not unit-tested here, because the tree has no canvas test harness. Confirm that `draw` with three arguments is unchanged.

## Out of this print, named for whoever builds them

- Ghost health, and the damage frost and the lantern deal: work/m1-01-enemy-health.md.
- `src/theme.js` and moving `PALETTE` there, frost tokens included: work/m1-04-board-art.md.
- The brazier and key 2: work/m2-01-splash-tower.md.
- Gold per kill: work/m3-01-gold-per-kill.md.
- The lantern's 20-gold price, and the "Not enough gold" HUD message: work/m3-02-tower-cost.md.
- A frost entry in the build tray artboard (`design/screens/Main.png` shows only the Lantern and Firefly jar): a design follow-up.
