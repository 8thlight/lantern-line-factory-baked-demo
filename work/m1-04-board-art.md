---
labels: [hydraflow]
milestone: M1
---
# Draw the board to match the Claude Design board

**Milestone:** M1, Core loop

## Why

The game plays, but it does not look like its design. Ghosts are purple diamonds, lanterns are flat yellow dots and the path is a flat strip, so the board in play looks nothing like design/screens/Board.png.

## What

- Add `src/theme.js` exporting the Board artboard's colours as named tokens (grass, path stones, lantern paper, lantern glow, ghost body, ghost eyes, beam, health bar). `src/render.js` reads every colour from it; no hex literal stays in `src/render.js`.
- Lanterns are drawn as paper lanterns on a post: a cap, a rounded glowing body with ribs, and a soft radial light pool on the grass beneath them.
- Ghosts are drawn as ghosts: a rounded head, a wavy hem and two eyes, with their health bar above them.
- The path is drawn as stones with an edge, not a flat strip, and the grass as alternating tiles.
- A lantern's shot is a glowing beam from the lantern to its target.
- Each sprite is its own exported function (`drawLantern`, `drawGhost`, `drawPath`, `drawBeam`) taking a canvas context, so each can be tested with a fake context that records its calls.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] `src/theme.js` holds every colour `src/render.js` draws with, and `src/render.js` contains no hex colour literal.
- [ ] `drawLantern` draws a radial-gradient light pool and at least one arc or curve for the body.
- [ ] `drawGhost` draws a curved body (arc or bezier) and two eyes, and its health bar's width shortens as the ghost's health falls.
- [ ] `drawBeam` strokes a line from the lantern's centre to the target's centre with a glow (`shadowBlur` above 0).
- [ ] `draw` on a fresh game calls `drawPath` once and draws no ghost before the first spawn.
- [ ] `npm test` passes.

## Design

Follow the Claude Design artboards for this task, as design/screens.yaml describes:

- design/screens/Board.png (source design/screens/Board.dc.html)
- design/screens/Main.png (source design/screens/Main.dc.html), for the lantern and ghost sprites in play
