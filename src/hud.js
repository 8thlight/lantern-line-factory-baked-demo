// What the HUD shows, read from state by hudModel and never written back: render.js draws only
// that. Its two buttons' geometry, and the clicks and keys that press them. No DOM: safe to
// import from tests.

import { COLS, TILE } from './path.js';
import { togglePause, toggleSpeed } from './game.js';

export const DANGER_LIVES = 3; // at this many lives or fewer, the lives pill turns danger red

export function hudModel({ lives, gold, wave, totalWaves, paused, speed }) {
  return { lives, gold, wave, totalWaves, paused, speed, livesDanger: lives <= DANGER_LIVES };
}

// The bar across the top of the board, and its two buttons at the right end
// (design/screens/Main.dc.html, HudStates.dc.html), so render.js draws them where main.js hit-tests them.
export const HUD_HEIGHT = 40;
export const HUD_PAD = 10; // the bar's padding at either end
export const HUD_GAP = 8; // between neighbouring pills, and between the two buttons
const SPEED_WIDTH = 68;
const PAUSE_WIDTH = 32;
const BUTTON_HEIGHT = 28;
const BUTTON_TOP = (HUD_HEIGHT - BUTTON_HEIGHT) / 2;
const SPEED_LEFT = COLS * TILE - HUD_PAD - SPEED_WIDTH;

export const HUD_BUTTONS = Object.freeze({
  pause: Object.freeze({ x: SPEED_LEFT - HUD_GAP - PAUSE_WIDTH, y: BUTTON_TOP, width: PAUSE_WIDTH, height: BUTTON_HEIGHT }),
  speed: Object.freeze({ x: SPEED_LEFT, y: BUTTON_TOP, width: SPEED_WIDTH, height: BUTTON_HEIGHT }),
});

// The HUD button under a board point: 'pause', 'speed' or null.
export function hudButtonAt(x, y) {
  for (const [name, b] of Object.entries(HUD_BUTTONS)) {
    if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) return name;
  }
  return null;
}

// The HUD button a key presses: P for Pause, F for Speed, in either case; null for any other key.
const HUD_KEYS = { p: 'pause', f: 'speed' };

export function hudButtonForKey(key) {
  return HUD_KEYS[key.toLowerCase()] ?? null;
}

const HUD_ACTIONS = { pause: togglePause, speed: toggleSpeed };

// A click in play at a board point. The bar covers the board's top row, so it takes every click
// that lands on it, pressing the button under it if there is one: true when the bar took the
// click and the board under it places nothing, false when the click is below the bar.
export function clickHud(state, x, y) {
  if (y >= HUD_HEIGHT) return false;
  const button = hudButtonAt(x, y);
  if (button) HUD_ACTIONS[button](state);
  return true;
}

// A key press: P or F presses its button and names it. A held key's repeats press nothing,
// so where pause or speed stops does not hang on how long the key was held.
export function keyHud(state, key, repeat = false) {
  const button = repeat ? null : hudButtonForKey(key);
  if (button) HUD_ACTIONS[button](state);
  return button;
}
