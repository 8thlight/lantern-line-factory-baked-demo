# Plan: a second tower, the brazier, with splash damage (line-factory-baked-demo-4ki)

Bead: lantern-line-factory-baked-demo-4ki (GitHub issue #5, opened here as #27; the task is
work/m2-01-splash-tower.md). Class: fix.

## Inputs verified

- docs/changes/line-factory-baked-demo-4ki/triage.md: read. It carries the brief, the signed
  `touches:` and `reproduces:` lists and the acceptance criterion. This plan works inside that
  `touches:` list and amends nothing.
- spec.md: not present in the worktree (no docs/changes/line-factory-baked-demo-4ki/spec.md, and
  none anywhere in the tree). Nothing is read from it; the triage's brief and lists stand in
  for it.
- plan/research.md: not present in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers the whole brief.
- The base: this print branch sits on 6658250, which is older than main. Main (cab3d7f,
  print line-factory-baked-demo-a8h) has since added ghost health, waves, `damageEnemy` and
  `LANTERN.damage`. The triage describes main's code (`LANTERN` as `{ range, cooldown, damage }`),
  so this plan is written against main's src/ and test/, read with `git show origin/main:<path>`.
  The build takes main in before its first change; that merge brings main's own files and is
  not this change's diff.
- Source read (at origin/main): src/tower.js, src/targeting.js, src/game.js, src/enemy.js,
  src/main.js, src/render.js, src/path.js, test/game.test.js, test/targeting.test.js; and, for
  what must stay out of this change, work/m1-04-board-art.md, work/m2-02-range-on-hover.md and
  work/m3-02-tower-cost.md.
- Design read: design/screens.yaml (the Main artboard lists work/m2-01-splash-tower.md among its
  tasks), design/screens/Main.dc.html and design/screens/Main.png.

## Who meets it

- person: the player, in play on the board drawn at design/screens/Main.png (source design/screens/Main.dc.html, listed in design/screens.yaml), presses 1 for a lantern or 2 for a brazier before clicking a grass cell, sees a brazier stand as an orange square, and sees its slower shots wear down every ghost bunched around the one it fires at.

## Refusals

- none: this change adds no refusal; a key other than 1 or 2 is ignored rather than refused, a brazier is placed on exactly the cells a lantern may be (the existing path, taken-cell and bounds refusals in `canPlace`, unchanged), and `splashTargets` returns an empty list rather than refusing when nothing is near.

## Touches

As signed in triage.md, unchanged:

- src/tower.js
- src/targeting.js
- src/game.js
- src/main.js
- src/render.js
- test/brazier.test.js (new, reproduces)

No other path changes. test/game.test.js and test/targeting.test.js stay unedited and must pass
as they stand; no test/render.test.js is added (render tests belong to work/m1-04).

## Design note, reported and not moved

The Main artboard's build tray names the splash tower "Firefly jar" (120 gold) and draws it as a
glass jar; it shows no orange square. The brief asks for a `BRAZIER` drawn as an orange square,
and the triage holds it to that. This change follows the brief: the orange square is the
brazier's placeholder, as today's yellow circle is the lantern's placeholder for the artboard's
paper lantern. The jar sprite is work/m1-04 (board art), the build tray work/m4-01 (HUD), and the
cost work/m3-02; none is built here. Whether the brazier is later renamed to the artboard's
"Firefly jar" is a product call for the line, not this print.

## Build order (red first, then green)

### 0. Take main in

Merge origin/main into the print branch so src/ and test/ are main's (health, waves,
`LANTERN.damage`). Run `node --test test/game.test.js test/targeting.test.js` once to see the
base green before any change.

### 1. The reproducer: test/brazier.test.js, committed red

One file, three groups of tests, written and committed before any source change:

- splashTargets: with `center = { x: 0, y: 0 }` and radius 50, enemies `inside` at (10, 20),
  `edge` at (30, 40) (exactly 50 away) and `outside` at (30, 40.1) (just over 50):
  `assert.deepEqual(splashTargets(center, [inside, edge, outside], 50), [inside, edge])`. The
  exclusion is proven by the exact list, so no unpaired negative assertion is added. A second
  test: an empty enemy list gives `[]`.
- createTower: `createTower(1, 1, BRAZIER)` has `range === BRAZIER.range`,
  `cooldown === BRAZIER.cooldown`, `splash === BRAZIER.splash` and `damage === BRAZIER.damage`;
  and the brief's shape holds: `BRAZIER.range < LANTERN.range`,
  `BRAZIER.cooldown > LANTERN.cooldown`, `BRAZIER.splash > 0`. Same test: `createTower(1, 1)`
  (a lantern) has `splash` 0, the value the game reads as "no splash".
- The game: a helper builds a quiet game (`createGame({ waveSize: 0 })`), places a tower of the
  given kind at (1, 1) with `placeTower(game, 1, 1, kind)` (centre 60, 60, beside the path's
  first stretch on row 2, y = 100), spawns three ghosts and sets their `distance` to 0, 10 and
  20 so they stand at x = 20, 30, 40 on the path (each within the brazier's range, and each
  within its splash of the nearest one, the one at x = 40), then steps 0.01s.
  - 'a brazier firing at a group of three close ghosts damages all three': every ghost's health
    is `ENEMY_HEALTH - BRAZIER.damage`, one shot drawn.
  - 'a lantern in the same spot damages one of the three': exactly one ghost is at
    `ENEMY_HEALTH - LANTERN.damage` and the other two at `ENEMY_HEALTH`.
  - 'a brazier that banishes a group counts each ghost once': the same three ghosts at health 1
    (`createEnemy` via `spawnEnemy`, then `health = maxHealth = 1`); after one step the board is
    empty and `kills` is 3, not 4 (the target is inside its own splash and must not be hit or
    counted twice).

Red against main: `BRAZIER` and `splashTargets` do not exist and `placeTower` ignores a kind.

### 2. splashTargets: src/targeting.js

    // Every enemy within `radius` of `center`, an enemy exactly on the edge included.
    export function splashTargets(center, enemies, radius) {
      return enemies.filter((enemy) => distance(center, enemy) <= radius);
    }

It reads the existing `distance`, as `inRange` does; enemies keep their list order.

### 3. The brazier kind: src/tower.js

- `export const BRAZIER = { range: 80, cooldown: 1.2, damage: 1, splash: 40 }; // pixels, seconds, health, pixels`
  Two tiles of range against the lantern's 2.5, twice the lantern's cooldown, and a one-tile
  splash, so a crowd is worth it and a lone ghost is not.
- `createTower` copies `splash: kind.splash ?? 0` onto the tower beside `range`, `cooldown` and
  `damage`; a kind with no splash hits its target alone. The header comment drops "The one tower
  type today" and names both kinds.
- `LANTERN`, `canPlace` and `updateTower` are unchanged.

### 4. The game: src/game.js

- `placeTower(state, col, row, kind = LANTERN)` passes `kind` to `createTower`; called with three
  arguments it places a lantern as today, so test/game.test.js is untouched.
- In `step`'s tower loop, after the shot is pushed:

      const hit = tower.splash > 0 ? splashTargets(target, state.enemies, tower.splash) : [target];
      const dead = hit.filter((enemy) => damageEnemy(enemy, tower.damage));
      if (dead.length) {
        state.enemies = state.enemies.filter((e) => !dead.includes(e));
        state.kills += dead.length;
      }

  The target is in its own splash (distance 0), so each ghost is damaged once and each kill
  counted once. Wave logic is unchanged.

### 5. Choosing the kind: src/main.js

- `let kind = LANTERN;` and a `window` `keydown` listener: `'1'` sets `LANTERN`, `'2'` sets
  `BRAZIER`; any other key does nothing.
- The click handler calls `placeTower(state, col, row, kind)`.
- No test (it is DOM wiring, as today); the build checks it by running the game.

### 6. Drawing the brazier: src/render.js

- `PALETTE` gains `brazier: '#e8843a'` and `brazierCore: '#ffd29a'`.
- `drawTower` draws a tower with `splash > 0` as an orange square, `TILE * 0.6` on a side centred
  on the tower, with a `TILE * 0.25` lighter core square; every other tower stays the lantern's
  yellow circle.
- No render test in this change (work/m1-04 brings the fake-context tests); checked by eye.

## Proof

- Run only the touched and named test files:
  `node --test test/brazier.test.js test/game.test.js test/targeting.test.js`, then
  `npm --prefix . run test` once, the build's named check for this line.
- test/brazier.test.js is committed red before the source that turns it green.
- The testing standard's counts (tests/architecture/assertion_baseline.json) must not rise: every
  exclusion is proven by an exact list or paired count, not a bare `false`.
- Acceptance is met when each clause of triage.md's acceptance line has its test above and
  `npm --prefix . run test` passes.
