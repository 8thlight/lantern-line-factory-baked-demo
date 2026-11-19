// Browser entry point: wires the canvas, the mouse and the frame loop to the game.

import { COLS, ROWS, TILE } from './path.js';
import { createGame, hoverAt, placeTower, restart, step, togglePause, toggleSpeed } from './game.js';
import { HUD_HEIGHT, boardCellAt, hudButtonAt, hudKey } from './hud.js';
import { LANTERN, kindForKey, toggleModeAt } from './tower.js';
import { SPRITES, draw } from './render.js';

const canvas = document.getElementById('board');
canvas.width = COLS * TILE;
canvas.height = HUD_HEIGHT + ROWS * TILE; // the HUD bar, then the whole board below it
const ctx = canvas.getContext('2d');

let state = createGame();
let hover = null;
let kind = LANTERN; // the kind a click places, named in the HUD from boot: 1 a lantern, 2 a brazier, 3 frost

const TOGGLES = { pause: togglePause, speed: toggleSpeed };

// The pointer's point on the canvas, in canvas pixels however the page has scaled it.
function pointAt(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

const cellAt = (event) => {
  const { x, y } = pointAt(event);
  return boardCellAt(x, y);
};

// Once the round is over, a click starts a fresh one rather than placing a lantern.
// A click on a HUD button toggles it; anywhere else on the bar does nothing.
canvas.addEventListener('click', (event) => {
  if (state.status !== 'playing') {
    state = restart(state);
    return;
  }
  const { x, y } = pointAt(event);
  const button = hudButtonAt(x, y);
  if (button) {
    TOGGLES[button](state);
    return;
  }
  const cell = boardCellAt(x, y);
  if (cell) placeTower(state, cell.col, cell.row, kind);
});

// A right-click switches the tower under the cursor between nearest and first;
// the browser's own menu never opens over the board.
canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  const cell = cellAt(event);
  if (cell) toggleModeAt(state, cell.col, cell.row);
});

// 1, 2 and 3 choose lantern, brazier and frost; while the round is playing, P pauses and F changes speed, once per press.
window.addEventListener('keydown', (event) => {
  kind = kindForKey(event.key, kind);
  const toggle = hudKey(event.key);
  if (toggle && state.status === 'playing' && !event.repeat) TOGGLES[toggle](state);
});

// Over the bar there is no cell, so no hover.
canvas.addEventListener('mousemove', (event) => {
  const cell = cellAt(event);
  hover = cell ? hoverAt(state, cell.col, cell.row, kind) : null;
});

canvas.addEventListener('mouseleave', () => {
  hover = null;
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // clamp after a hidden tab; at 2x, step runs two ticks of it
  last = now;
  step(state, dt);
  if (hover) hover = hoverAt(state, hover.col, hover.row, kind); // turns as gold is spent and earned
  draw(ctx, state, hover, SPRITES, kind);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
