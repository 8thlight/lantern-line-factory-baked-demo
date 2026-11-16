// Canvas drawing only. Reads game state; never changes it.

import { COLS, ROWS, TILE, cellKey } from './path.js';

export const PALETTE = {
  grassA: '#1d3a2e',
  grassB: '#214234',
  path: '#c9a66b',
  pathEdge: '#a8854f',
  lantern: '#f2c14e',
  lanternCore: '#fff4c9',
  shade: '#8e6bd8',
  shadeEdge: '#4d3586',
  beam: '#fff4c9',
  hover: 'rgba(255, 244, 201, 0.25)',
  hoverBad: 'rgba(230, 90, 90, 0.35)',
  text: '#f4efe1',
};

export function draw(ctx, state, hover) {
  drawMap(ctx, state);
  if (hover) drawHover(ctx, state, hover);
  for (const tower of state.towers) drawTower(ctx, tower);
  for (const enemy of state.enemies) drawShade(ctx, enemy);
  drawShots(ctx, state.shots);
  drawLives(ctx, state.lives);
}

function drawMap(ctx, { path }) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const onPath = path.has(cellKey(col, row));
      ctx.fillStyle = onPath ? PALETTE.path : (col + row) % 2 ? PALETTE.grassA : PALETTE.grassB;
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
      if (onPath) {
        ctx.strokeStyle = PALETTE.pathEdge;
        ctx.strokeRect(col * TILE + 0.5, row * TILE + 0.5, TILE - 1, TILE - 1);
      }
    }
  }
}

function drawHover(ctx, state, { col, row, ok }) {
  ctx.fillStyle = ok ? PALETTE.hover : PALETTE.hoverBad;
  ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
}

function drawTower(ctx, { x, y }) {
  ctx.fillStyle = PALETTE.lantern;
  ctx.beginPath();
  ctx.arc(x, y, TILE * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.beginPath();
  ctx.arc(x, y, TILE * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function drawShade(ctx, { x, y }) {
  const r = TILE * 0.3;
  ctx.fillStyle = PALETTE.shade;
  ctx.strokeStyle = PALETTE.shadeEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawShots(ctx, shots) {
  ctx.strokeStyle = PALETTE.beam;
  ctx.lineWidth = 3;
  for (const { from, to } of shots) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
}

function drawLives(ctx, lives) {
  ctx.fillStyle = PALETTE.text;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`Lives: ${lives}`, 8, 20);
}
