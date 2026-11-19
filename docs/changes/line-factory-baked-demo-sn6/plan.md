# Plan: a tower targets the first ghost or the nearest (line-factory-baked-demo-sn6)

Bead: lantern-line-factory-baked-demo-sn6 (GitHub issue #7, opened here as #33; the task is
work/m2-03-targeting-modes.md). Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-sn6/triage.md: read. It carries the brief, the signed
  `touches:` and `reproduces:` lists and the acceptance criterion. This plan works inside that
  `touches:` list and amends nothing.
- spec.md: not present in the worktree (no docs/changes/line-factory-baked-demo-sn6/spec.md, and
  none anywhere in the tree). Nothing is read from it; the triage's brief and lists stand in
  for it.
- plan/research.md: not present in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers the whole brief.
- The base: this print branch sits on 6658250, which is older than main. Main (da8d95a,
  print line-factory-baked-demo-4ki) has since added ghost health, waves, splash, the
  `BRAZIER` kind and the pure `kindForKey` that src/main.js calls on keydown. The triage
  describes main's code ("the way kindForKey is"), so this plan is written against main's src/
  and test/, read with `git show origin/main:<path>`. The build takes main in before its first
  change; that merge brings main's own files and is not this change's diff.
- Source read (at origin/main): src/targeting.js, src/tower.js, src/main.js, src/enemy.js,
  src/game.js; test/targeting.test.js and test/brazier.test.js (no test pins a tower's whole
  shape with `deepEqual`, so a new `mode` field breaks none).
- Design read: design/screens.yaml (no artboard lists work/m2-03-targeting-modes.md),
  design/screens/Main.dc.html and design/screens/Main.png, design/screens/StartScreen.dc.html.

## Who meets it

- person: the player, in play on the board drawn at design/screens/Main.png (source design/screens/Main.dc.html, listed in design/screens.yaml), right-clicks a placed lantern or brazier to switch it between shooting the nearest ghost and shooting the ghost furthest along the path, gets no browser menu over the board, and sees the tower's beam go to the leading ghost once it is set to first.

## Refusals

- none: this change adds no refusal; a right-click on a cell with no tower does nothing (the browser menu is still kept off the board), a tower with no mode or an unknown mode targets the nearest ghost as today, and `firstInRange` returns `null` rather than refusing when no ghost is in range.

## Touches

As signed in triage.md, unchanged:

- src/targeting.js
- src/tower.js
- src/main.js
- test/targeting-mode.test.js (new)

No other path changes. test/targeting.test.js (the `reproduces:` lock) and every other test
stay unedited and must pass as they stand. src/game.js is not touched: `step` already fires
at whatever `updateTower` returns, so a tower in mode 'first' shoots the first ghost in play
without it changing.

## Design note, reported and not moved

No artboard shows a targeting mode: design/screens.yaml lists work/m2-03 under no screen, and
the Main artboard's hover card shows a lantern's range and stats but no mode. The brief asks
for no on-screen mark, so none is drawn here (src/render.js is outside the touches); the
player sees the mode only in where the beam goes. The StartScreen artboard's how-to-play line
"Each one shines on the nearest ghost in range" stays true of a new tower, whose mode is
'nearest'. Whether the hover card should name the mode is a design call for the line, not
this print.

## Build order (red first, then green)

### 0. Take main in

Merge origin/main into the print branch so src/ and test/ are main's. Run
`node --test test/targeting.test.js test/brazier.test.js` once to see the base green before
any change.

### 1. The reproducer: test/targeting-mode.test.js, committed red

Written and committed before any source change. A tower stub `{ x: 0, y: 0, range: 100 }` as
test/targeting.test.js uses, and ghosts as `{ id, x, y, distance }`:

- 'firstInRange picks the ghost further along the path even when the other is nearer':
  `near = { x: 10, y: 0, distance: 50 }`, `leader = { x: 90, y: 0, distance: 200 }`;
  `firstInRange(tower, [near, leader])` is `leader`, and `nearestInRange` on the same list is
  `near` (so the case really is one where the two differ). The list reversed gives `leader`
  too, so order does not decide it.
- 'firstInRange ignores ghosts out of range and returns null when none qualify':
  `beyond = { x: 101, y: 0, distance: 999 }` (furthest along, but out of range) and
  `inside = { x: 50, y: 0, distance: 10 }`: `firstInRange(tower, [beyond, inside])` is
  `inside`; `firstInRange(tower, [beyond])` and `firstInRange(tower, [])` are `null`. A ghost
  exactly on the range edge (60, 80) is picked, matching `inRange`.
- 'pickTarget returns the nearest for mode nearest and the first for mode first': on the same
  `[near, leader]`, `pickTarget({ ...tower, mode: 'nearest' }, …)` is `near` and
  `pickTarget({ ...tower, mode: 'first' }, …)` is `leader`; a tower with no `mode` gets `near`.
- 'a new tower's mode is nearest, and the toggle flips it': `createTower(1, 1).mode` and
  `createTower(1, 1, BRAZIER).mode` are 'nearest'; `nextMode('nearest')` is 'first' and
  `nextMode('first')` is 'nearest'.
- 'towerAt finds the tower on a cell, or null': with `towers = [createTower(1, 1)]`,
  `towerAt({ towers }, 1, 1)` is that tower and `towerAt({ towers }, 2, 1)` is `null`.
- 'updateTower fires at the first ghost for a tower in mode first': `t = createTower(0, 0)`,
  `t.mode = 'first'`; a ghost at `t.x + 10, t.y` with distance 5 and one at `t.x + 80, t.y`
  with distance 300: `updateTower(t, [near, leader], 0.016)` is `leader`. The same pair with a
  fresh tower left at 'nearest' gives `near`.

Red against main: `firstInRange`, `pickTarget`, `nextMode` and `towerAt` do not exist, and a
tower has no `mode`.

### 2. src/targeting.js

    // The enemy furthest along the path among those within the tower's range, or null.
    export function firstInRange(tower, enemies) { … }

A loop like `nearestInRange`'s: keep the enemy with `inRange(tower, enemy)` and the greatest
`enemy.distance` (strictly greater, so the earlier of two equals is kept).

    // The enemy the tower's mode chooses: 'first' the leader, anything else the nearest.
    export function pickTarget(tower, enemies) {
      return tower.mode === 'first' ? firstInRange(tower, enemies) : nearestInRange(tower, enemies);
    }

### 3. src/tower.js

- `createTower` adds `mode: 'nearest'` to the tower it returns.
- `export function nextMode(mode)`: `'first'` gives `'nearest'`, anything else gives
  `'first'`. Pure, as `kindForKey` is.
- `export function towerAt({ towers }, col, row)`: the tower standing on that cell, or `null`;
  the same cell match `canPlace` uses.
- `updateTower` calls `pickTarget` in place of `nearestInRange`; the import changes to match.
- The header comment says a tower shoots the nearest ghost by default, or the one furthest
  along the path once switched to first.

### 4. src/main.js

    // A right-click switches the tower under the cursor between nearest and first;
    // the browser's own menu never opens over the board.
    canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      if (state.status !== 'playing') return;
      const { col, row } = cellAt(event);
      const tower = towerAt(state, col, row);
      if (tower) tower.mode = nextMode(tower.mode);
    });

The import from './tower.js' adds `nextMode` and `towerAt`. A finished round ignores the
right-click, as it is only restarted by a left click.

### 5. Green

`node --test test/targeting-mode.test.js test/targeting.test.js test/brazier.test.js` (the
files this change names or touches), then `npm test` on the pull request's required checks.

## Acceptance

npm --prefix . run test passes with test/targeting-mode.test.js proving: firstInRange picks
the ghost further along the path over a nearer one; it ignores out-of-range ghosts and
returns null when none qualify; pickTarget returns the nearest for 'nearest' and the first for
'first' on the same enemies; a new tower's mode is 'nearest' and nextMode flips it between
'nearest' and 'first'; and updateTower fires at the first ghost for a tower in mode 'first'.
