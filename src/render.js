// Canvas drawing only. Reads game state; never changes it.

import { rangePreview } from './game.js';
import { COLS, ROWS, TILE, cellKey } from './path.js';
import { THEME } from './theme.js';

export function draw(ctx, state, hover) {
  drawMap(ctx, state);
  if (hover) drawHover(ctx, state, hover);
  const ring = rangePreview(state, hover);
  if (ring) drawRange(ctx, ring);
  for (const tower of state.towers) drawTower(ctx, tower);
  for (const enemy of state.enemies) drawGhost(ctx, enemy);
  drawShots(ctx, state.shots);
  drawLives(ctx, state.lives);
}

function drawMap(ctx, { path }) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const onPath = path.has(cellKey(col, row));
      ctx.fillStyle = onPath ? THEME.path : (col + row) % 2 ? THEME.grassA : THEME.grassB;
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
      if (onPath) {
        ctx.strokeStyle = THEME.pathEdge;
        ctx.strokeRect(col * TILE + 0.5, row * TILE + 0.5, TILE - 1, TILE - 1);
      }
    }
  }
}

function drawHover(ctx, state, { col, row, ok }) {
  ctx.fillStyle = ok ? THEME.hover : THEME.hoverBad;
  ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
}

// The faint dashed reach circle, as the Board artboard draws it.
function drawRange(ctx, { x, y, radius }) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = THEME.rangeFill;
  ctx.fill();
  ctx.strokeStyle = THEME.rangeRing;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTower(ctx, { x, y }) {
  ctx.fillStyle = THEME.lantern;
  ctx.beginPath();
  ctx.arc(x, y, TILE * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = THEME.lanternCore;
  ctx.beginPath();
  ctx.arc(x, y, TILE * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function drawGhost(ctx, { x, y }) {
  const r = TILE * 0.3;
  ctx.fillStyle = THEME.ghost;
  ctx.strokeStyle = THEME.ghostEdge;
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
  ctx.strokeStyle = THEME.beam;
  ctx.lineWidth = 3;
  for (const { from, to } of shots) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
}

function drawLives(ctx, lives) {
  ctx.fillStyle = THEME.text;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`Lives: ${lives}`, 8, 20);
}
