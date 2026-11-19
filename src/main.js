// Browser entry point: wires the canvas, the mouse and the frame loop to the game.

import { COLS, ROWS, TILE } from './path.js';
import { createGame, placeTower, placementError, step } from './game.js';
import { LANTERN, kindForKey } from './tower.js';
import { draw } from './render.js';

const canvas = document.getElementById('board');
canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;
const ctx = canvas.getContext('2d');

const state = createGame();
let hover = null;
let kind = LANTERN;

function cellAt(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
}

canvas.addEventListener('click', (event) => {
  const { col, row } = cellAt(event);
  placeTower(state, col, row, kind);
});

canvas.addEventListener('mousemove', (event) => {
  const { col, row } = cellAt(event);
  hover = { col, row, ok: placementError(state, col, row, kind) === null };
});

window.addEventListener('keydown', (event) => {
  kind = kindForKey(event.key, kind);
});

canvas.addEventListener('mouseleave', () => {
  hover = null;
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // clamp after a hidden tab
  last = now;
  step(state, dt);
  if (hover) hover.ok = placementError(state, hover.col, hover.row, kind) === null;
  draw(ctx, state, hover, kind);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
