// The HUD's model and where the pointer lands on the canvas. Pure logic, no DOM: render.js
// draws the bar from hudModel, and main.js asks these which button or cell a pointer is on.

import { COLS, TILE } from './path.js';

export const HUD_HEIGHT = 40; // design/hud.md --hud-height; the board is drawn below the bar
export const LIVES_DANGER = 3; // lives at or below this turn the HUD's lives red
const WIDTH = COLS * TILE;

// Right-aligned buttons, 28 tall, --hud-pad from the edge and --hud-gap apart.
export const SPEED_BUTTON = Object.freeze({ x: WIDTH - 8 - 40, y: 6, width: 40, height: 28 });
export const PAUSE_BUTTON = Object.freeze({ x: SPEED_BUTTON.x - 16 - 72, y: 6, width: 72, height: 28 });

// What the HUD shows, read from the state and never written to it.
export function hudModel({ lives, gold, wave, totalWaves, paused, speed }) {
  return { lives, gold, wave, totalWaves, paused, speed, livesDanger: lives <= LIVES_DANGER };
}

const inside = (rect, x, y) => x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;

// The button under a canvas point: 'pause', 'speed', or null anywhere else.
export function hudButtonAt(x, y) {
  if (inside(PAUSE_BUTTON, x, y)) return 'pause';
  if (inside(SPEED_BUTTON, x, y)) return 'speed';
  return null;
}

// The board cell under a canvas point, or null on the bar. A point past the board's edge
// still names a cell, for cellError to call 'bounds'.
export function boardCellAt(x, y) {
  if (y < HUD_HEIGHT) return null;
  return { col: Math.floor(x / TILE), row: Math.floor((y - HUD_HEIGHT) / TILE) };
}

// The toggle a key reaches: P pauses, F changes speed, either case; any other key, null.
export function hudKey(key) {
  const lower = key.toLowerCase();
  if (lower === 'p') return 'pause';
  if (lower === 'f') return 'speed';
  return null;
}
