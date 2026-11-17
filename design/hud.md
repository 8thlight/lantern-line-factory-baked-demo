# Lantern Line: HUD and start screen design brief

The design input for milestone M4 (`work/m4-*.md`). It may later be replaced by
Claude Design exports; until then this file is the board the M4 tasks follow.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--hud-bg` | `rgba(18, 36, 28, 0.85)` | HUD bar and overlay panels |
| `--hud-ink` | `#f4efe1` | Primary text |
| `--hud-muted` | `#b8c4b0` | Labels |
| `--hud-accent` | `#f2c14e` | Gold value, active buttons, title |
| `--hud-danger` | `#e65a5a` | Lives at 3 or fewer |
| `--hud-ghost` | `#8e6bd8` | Wave counter |
| `--hud-height` | `32px` | Height of the HUD bar |
| `--hud-pad` | `8px` | Inner padding |
| `--hud-gap` | `16px` | Gap between HUD items |
| `--hud-font` | `16px system-ui, sans-serif` | HUD text |
| `--title-font` | `bold 40px system-ui, sans-serif` | Start screen title |
| `--button-radius` | `6px` | Buttons |

## HUD bar

A single bar across the top of the canvas, `--hud-height` tall, filled with
`--hud-bg`, drawn on the canvas above the map (it may cover the top row).

Left to right, separated by `--hud-gap`:

1. **Lives**: label "Lives" in `--hud-muted`, value in `--hud-ink`; value turns
   `--hud-danger` at 3 or fewer.
2. **Gold**: label "Gold", value in `--hud-accent`.
3. **Wave**: label "Wave", value `current / total` in `--hud-ghost`.

Right-aligned:

4. **Pause** button: text "Pause" or "Resume".
5. **Speed** button: text "1x" or "2x"; `--hud-accent` fill when 2x is active.

Buttons are 28px tall, `--button-radius`, `--hud-ink` text, outlined in `--hud-muted`.

The values come from a pure function, `hudModel(state)`, that returns
`{ lives, gold, wave, totalWaves, paused, speed, livesDanger }`. Drawing only
reads that object, so the HUD's content is testable with `node --test`.

## Start screen

Shown before the first wave and again after a restart.

- Full-canvas overlay in `--hud-bg` over the map, so the path shows faintly behind.
- Title "Lantern Line" centred, `--title-font`, `--hud-accent`, at 35% height.
- One line under it in `--hud-muted`: "Light the lanterns. Stop the ghosts before they reach the gate."
- A **Start** button centred at 60% height, 160 by 44px, `--hud-accent` fill,
  dark text (`#12241c`), `--button-radius`.
- Clicking Start, or pressing Enter or Space, begins wave 1.
