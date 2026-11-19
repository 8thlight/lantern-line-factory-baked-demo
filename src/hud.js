// What the HUD shows, read from state and never written back. render.js draws only this.
// Pure logic, no DOM: safe to import from tests.

import { COLS, TILE } from './path.js';

export const DANGER_LIVES = 3; // at this many lives or fewer, the lives pill turns danger red

export function hudModel({ lives, gold, wave, totalWaves, paused, speed }) {
  return { lives, gold, wave, totalWaves, paused, speed, livesDanger: lives <= DANGER_LIVES };
}

// The bar across the top of the board, and its two buttons at the right end
// (design/screens/Main.dc.html, HudStates.dc.html), so render.js draws them where main.js hit-tests them.
export const HUD_HEIGHT = 40;
const PAD = 10;
const GAP = 8;
const SPEED_WIDTH = 68;
const PAUSE_WIDTH = 32;
const BUTTON_HEIGHT = 28;
const BUTTON_TOP = (HUD_HEIGHT - BUTTON_HEIGHT) / 2;
const SPEED_LEFT = COLS * TILE - PAD - SPEED_WIDTH;

export const HUD_BUTTONS = Object.freeze({
  pause: Object.freeze({ x: SPEED_LEFT - GAP - PAUSE_WIDTH, y: BUTTON_TOP, width: PAUSE_WIDTH, height: BUTTON_HEIGHT }),
  speed: Object.freeze({ x: SPEED_LEFT, y: BUTTON_TOP, width: SPEED_WIDTH, height: BUTTON_HEIGHT }),
});

// The HUD button under a board point: 'pause', 'speed' or null.
export function hudButtonAt(x, y) {
  for (const [name, b] of Object.entries(HUD_BUTTONS)) {
    if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) return name;
  }
  return null;
}
