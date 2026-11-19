# Plan: show a tower's range when the pointer is over it (print 31)

Fast follower of print line-factory-baked-demo-000 (GitHub issue #6, task
work/m2-02-range-on-hover.md), which was retired at landing on a review P1 that called the ring's
opaque stroke "not faint". Class: fix.

## Inputs verified

- docs/changes/31/triage.md: read. It carries the brief, the signed `touches:` and
  `reproduces:` lists and the acceptance criterion.
- spec.md: not present in the worktree (no docs/changes/31/spec.md, none anywhere in the tree).
  Nothing is read from it; the triage's brief and lists stand in for it.
- plan/research.md: not present in the worktree. Research declared no scope, so there is no
  '## Declared scope' to restate, and this plan covers the whole brief.
- The base: this branch already holds main at da8d95a, so src/ is main's: `BRAZIER`,
  `kindForKey` and a `kind` the player picks with keys 1 and 2 in src/main.js
  (print line-factory-baked-demo-4ki). The retired print was cut before that landed.
- The prior branch print/line-factory-baked-demo-000 (32e6af3) is not in this clone; the plan is
  written from the tree as it stands.
- Source read: src/game.js, src/tower.js, src/path.js, src/render.js, src/theme.js, src/main.js,
  test/game.test.js, test/render.test.js, test/brazier.test.js,
  tests/architecture/assertion_baseline.json.
- Design read: design/screens.yaml (the Main artboard lists work/m2-02-range-on-hover.md and
  must "draw the hovered lantern's range ring"), design/screens/Main.png, design/screens.html,
  design/screens/Board.dc.html.

## Who meets it

- person: the player, in play on the board drawn at design/screens/Main.png (source design/screens/Main.dc.html, as design/screens.yaml lists it; the ring itself at design/screens.html:204), points at a placed lantern or brazier and sees a faint dashed ring of how far it reaches, or points at empty grass and sees the reach of the kind a click would place there, before spending the click.

## Refusals

- none: this change adds no refusal; `towerAt` answers `null` for an empty cell and `rangePreview` answers `null` on a path cell, off the board or with no hover, and the board then simply draws no ring; placement and its existing `canPlace` refusals are unchanged.

## The ring, as the design draws it

design/screens.html:204 (the Main artboard, "In play", tasks M2-02) draws the hovered lantern's
ring as:

    <circle cx="340" cy="226" r="120" fill="#f2c14e" fill-opacity="0.07"
            stroke="#f2c14e" stroke-width="1.5" stroke-dasharray="6 6">

The same circle is at design/screens/Board.dc.html:69 (the triage says Board has no ring; it
does, and it is identical). "Faint" in the brief is this: an opaque #f2c14e stroke only 1.5px wide
and dashed 6 on 6 off, over a fill at 0.07. The build matches it exactly and the review is pointed
here: an opaque stroke is the design, not a defect.

Reported, not moved: the artboard's ring is r=120 around a lantern; the game's `LANTERN.range` is
100. The ring is drawn at the tower's real `range`, as the brief asks (a ring that lies about
reach is worse than one that differs from a mock-up); retuning the lantern's range is not this
change.

## Touches amendment

- reason: the brief's "the range of the tower kind that would be placed" needs the kind the player has picked, and since main took in print line-factory-baked-demo-4ki that kind lives only in src/main.js (`let kind`, set by keys 1 and 2); none of the signed paths can see it, so without src/main.js a player holding a brazier would be shown the lantern's 100px reach on empty grass. src/main.js gains one line that hands `kind` to the hover it already builds.

touches:
  - src/game.js
  - src/render.js
  - src/theme.js
  - src/main.js
  - test/range-preview.test.js

`reproduces:` stays as signed: test/game.test.js and test/render.test.js are run and are not
edited; test/range-preview.test.js is new, written red first. No other path changes.

## Build order (red first, then green)

### 1. The reproducer: test/range-preview.test.js, committed red

Board facts used: TILE 40; (1, 1) and (3, 1) are grass (centres (60, 60) and (140, 60)); (2, 2)
lies on the path's first stretch (row 2).

- towerAt: on `createGame({ waveSize: 0 })` with `placeTower(game, 1, 1)`,
  `assert.equal(towerAt(game, 1, 1), game.towers[0])` and `assert.equal(towerAt(game, 3, 1), null)`.
- rangePreview over a placed tower: a lantern at (1, 1), hover `{ col: 1, row: 1, ok: false }`
  gives `{ x: 60, y: 60, radius: LANTERN.range }`; a brazier placed at (3, 1) with
  `placeTower(game, 3, 1, BRAZIER)` gives `{ x: 140, y: 60, radius: BRAZIER.range }` even when
  the hover's `kind` is `LANTERN` (the placed tower wins over the picked kind).
- rangePreview over empty grass: hover `{ col: 3, row: 1, ok: true }` gives
  `{ x: 140, y: 60, radius: LANTERN.range }`; with `kind: BRAZIER` on the hover, the radius is
  `BRAZIER.range`.
- rangePreview gives `null` on a path cell (2, 2), off the board (`{ col: -1, row: 0 }`) and for
  a `null` hover — asserted as one `deepEqual` of the three results against `[null, null, null]`.
- draw strokes the ring: with a recording context (a small Proxy that records each call with
  `strokeStyle`, `fillStyle`, `lineWidth` and the current line dash, in the style of
  test/render.test.js), `draw(ctx, game, { col: 3, row: 1, ok: true })` makes exactly one `arc`
  call with args `[140, 60, LANTERN.range, 0, Math.PI * 2]`, whose `fill` is in `THEME.rangeFill`
  and whose `stroke` is in `THEME.rangeRing`, at `lineWidth` 1.5 and dash `[6, 6]`; and the dash
  is `[]` again after (no dash leaks into the lantern bodies). `draw(ctx, game, { col: 2, row: 2,
  ok: false })` makes no ring stroke: the count of `stroke` calls in `THEME.rangeRing` is 0,
  paired in the same `deepEqual` with the grass case's count of 1.
- The tokens: `assert.deepEqual([THEME.rangeRing, THEME.rangeFill], ['#f2c14e', 'rgba(242, 193, 78, 0.07)'])`,
  with a comment citing design/screens.html:204.

Red against the base: `towerAt`, `rangePreview` and the THEME tokens do not exist. Every
exclusion is proven by an exact value or a paired count, so the counts in
tests/architecture/assertion_baseline.json do not rise.

### 2. src/game.js

    // The tower standing on a cell, or null.
    export function towerAt(state, col, row) {
      return state.towers.find((t) => t.col === col && t.row === row) ?? null;
    }

    // The ring the pointer shows: a placed tower's reach, or on a cell a tower may take, the
    // reach of the kind a click would place there (the hover's kind, a lantern if it names none).
    // Null with no hover, on the path or off the board.
    export function rangePreview(state, hover) {
      if (!hover) return null;
      const tower = towerAt(state, hover.col, hover.row);
      if (tower) return { x: tower.x, y: tower.y, radius: tower.range };
      if (!canPlace(state, hover.col, hover.row)) return null;
      const { x, y } = cellCenter(hover);
      return { x, y, radius: (hover.kind ?? LANTERN).range };
    }

`cellCenter` is imported from ./path.js beside the existing imports. Nothing else in game.js
changes.

### 3. src/theme.js

Under a `// range ring on hover (design/screens.html:204)` heading:

    rangeRing: '#f2c14e',
    rangeFill: 'rgba(242, 193, 78, 0.07)', // #f2c14e at 0.07

### 4. src/render.js

- `draw` calls `drawRangeRing(ctx, rangePreview(state, hover))` right after the hover tile and
  before the tower bodies: above the light pools and under the lanterns, the artboard's order
  (design/screens.html:204 comes after the pools and before the lantern `<use>`s), which also
  keeps test/render.test.js's "pools before hover and bodies" test true.
- `drawRangeRing(ctx, ring)` returns at once on `null`; otherwise, inside save/restore:
  `fillStyle = THEME.rangeFill`, `strokeStyle = THEME.rangeRing`, `lineWidth = 1.5`,
  `setLineDash([6, 6])`, one `beginPath` and `arc(x, y, radius, 0, Math.PI * 2)`, then `fill()`
  and `stroke()`, then `setLineDash([])` before restore. It is a plain module function, not a
  `SPRITES` entry, so the tests that hand in their own sprite table are untouched.
- render.js keeps holding no colour literal (the first test in test/render.test.js).

### 5. src/main.js

The hover carries the picked kind: in `frame`, beside `hover.ok = canPlace(...)`, set
`hover.kind = kind`, and the `mousemove` handler builds `{ col, row, ok, kind }`. No test (DOM
wiring, as today); checked by running the game.

## Proof

- Run only the named and touched test files:
  `node --test test/range-preview.test.js test/game.test.js test/render.test.js test/brazier.test.js`
  (brazier.test.js because it calls `draw`), then `npm --prefix . run test` once, the line's
  named check.
- test/range-preview.test.js is committed red before the source that turns it green.
- Acceptance: each clause of the brief has its test above (towerAt found and null; over a tower,
  its centre and range; over grass, the range of the kind to be placed; over a path cell, null),
  and `npm --prefix . run test` passes.
- The review reads the ring against design/screens.html:204.
