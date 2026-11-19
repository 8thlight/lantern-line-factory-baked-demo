// Browser entry point: wires the canvas, the mouse and the frame loop to the game.

import { COLS, ROWS, TILE } from './path.js';
import { createGame, hoverAt, placeTower, restart, step, togglePause, toggleSpeed } from './game.js';
import { LANTERN, kindForKey, toggleModeAt } from './tower.js';
import { drawFrame } from './render.js';
import { hudButtonAt } from './hud.js';

const canvas = document.getElementById('board');
canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;
const ctx = canvas.getContext('2d');

let state = createGame();
let hover = null;
let kind = LANTERN; // the kind a click places: 1 for a lantern, 2 for a brazier

function pointAt(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

function cellAt(event) {
  const { x, y } = pointAt(event);
  return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
}

const HUD_ACTIONS = { pause: togglePause, speed: toggleSpeed };

// Once the round is over, a click starts a fresh one rather than placing a lantern.
// In play, a click on the HUD's Pause or Speed button toggles it and places nothing.
canvas.addEventListener('click', (event) => {
  if (state.status !== 'playing') {
    state = restart(state);
    return;
  }
  const { x, y } = pointAt(event);
  const button = hudButtonAt(x, y);
  if (button) {
    HUD_ACTIONS[button](state);
    return;
  }
  const { col, row } = cellAt(event);
  placeTower(state, col, row, kind);
});

// A right-click switches the tower under the cursor between nearest and first;
// the browser's own menu never opens over the board.
canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  const { col, row } = cellAt(event);
  toggleModeAt(state, col, row);
});

// P pauses and resumes, F moves between 1x and 2x; 1 and 2 choose the kind a click places.
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'p') togglePause(state);
  if (key === 'f') toggleSpeed(state);
  kind = kindForKey(event.key, kind);
});

canvas.addEventListener('mousemove', (event) => {
  const { col, row } = cellAt(event);
  hover = hoverAt(state, col, row, kind);
});

canvas.addEventListener('mouseleave', () => {
  hover = null;
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // clamp after a hidden tab
  last = now;
  step(state, dt);
  if (hover) hover = hoverAt(state, hover.col, hover.row, kind); // turns as gold is spent and earned
  drawFrame(ctx, state, hover);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
