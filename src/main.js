// Browser entry point: wires the canvas, the mouse and the frame loop to the game.

import { COLS, ROWS, TILE } from './path.js';
import { createGame, placeTower, restart, step } from './game.js';
import { BRAZIER, LANTERN, canPlace } from './tower.js';
import { draw } from './render.js';

const canvas = document.getElementById('board');
canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;
const ctx = canvas.getContext('2d');

let state = createGame();
let hover = null;
let kind = LANTERN; // the kind a click places: 1 for a lantern, 2 for a brazier

function cellAt(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
}

// Once the round is over, a click starts a fresh one rather than placing a lantern.
canvas.addEventListener('click', (event) => {
  if (state.status !== 'playing') {
    state = restart(state);
    return;
  }
  const { col, row } = cellAt(event);
  placeTower(state, col, row, kind);
});

// Any key other than 1 or 2 leaves the chosen kind as it is.
window.addEventListener('keydown', (event) => {
  if (event.key === '1') kind = LANTERN;
  else if (event.key === '2') kind = BRAZIER;
});

canvas.addEventListener('mousemove', (event) => {
  const { col, row } = cellAt(event);
  hover = { col, row, ok: canPlace(state, col, row) };
});

canvas.addEventListener('mouseleave', () => {
  hover = null;
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // clamp after a hidden tab
  last = now;
  step(state, dt);
  if (hover) hover.ok = canPlace(state, hover.col, hover.row);
  draw(ctx, state, hover);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
