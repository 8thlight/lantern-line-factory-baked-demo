// Canvas drawing only. Reads game state; never changes it.
// Each sprite is its own function taking a context, drawn to design/screens/Board.

import { healthFraction } from './enemy.js';
import { COLS, ROWS, TILE, cellKey } from './path.js';
import { THEME } from './theme.js';

// The colours render.js draws with, under the name the health bar's tests read them by.
export const PALETTE = THEME;

const POOL_R = TILE * 3; // radius of a lantern's light pool
const BAR_W = 26; // health bar, full width
const BAR_H = 4;
const FULL = Math.PI * 2;

const HEADLINE = { lost: 'The ghosts got through', won: 'The path is safe' };

export function draw(ctx, state, hover, sprites = SPRITES) {
  drawGrass(ctx);
  sprites.drawPath(ctx, state.path);
  if (hover) drawHover(ctx, hover);
  for (const tower of state.towers) sprites.drawLantern(ctx, tower);
  for (const enemy of state.enemies) sprites.drawGhost(ctx, enemy);
  for (const shot of state.shots) sprites.drawBeam(ctx, shot);
  drawLives(ctx, state.lives);
  if (state.status === 'lost' || state.status === 'won') drawRoundOver(ctx, state.status);
}

function drawGrass(ctx) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      ctx.fillStyle = (col + row) % 2 ? THEME.grassA : THEME.grassB;
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
    }
  }
  // A few blades on every fourth tile, so the lawn is not flat.
  ctx.strokeStyle = THEME.grassBlade;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let row = 0; row < ROWS; row++) {
    for (let col = (row * 3) % 4; col < COLS; col += 4) {
      const x = col * TILE + 12;
      const y = row * TILE + 30;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 6);
      ctx.lineTo(x + 4, y);
    }
  }
  ctx.stroke();
}

// The path as laid stones: a drop shadow, an edge, the stone, a dashed joint.
export function drawPath(ctx, path) {
  const cells = [...path].map((key) => key.split(',').map(Number));
  ctx.fillStyle = THEME.pathShadow;
  for (const [col, row] of cells) ctx.fillRect(col * TILE, row * TILE + 3, TILE, TILE);
  ctx.fillStyle = THEME.pathEdge;
  for (const [col, row] of cells) ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
  ctx.fillStyle = THEME.pathStone;
  for (const [col, row] of cells) {
    // Inset only on a side with no path beyond it, so the stones run on as one road.
    const left = path.has(cellKey(col - 1, row)) ? 0 : 3;
    const right = path.has(cellKey(col + 1, row)) ? 0 : 3;
    const top = path.has(cellKey(col, row - 1)) ? 0 : 3;
    const bottom = path.has(cellKey(col, row + 1)) ? 0 : 3;
    ctx.fillRect(col * TILE + left, row * TILE + top, TILE - left - right, TILE - top - bottom);
  }
  ctx.save();
  ctx.strokeStyle = THEME.pathEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [col, row] of cells) ctx.rect(col * TILE + 0.5, row * TILE + 0.5, TILE - 1, TILE - 1);
  ctx.globalAlpha = 0.25;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = THEME.pathJoint;
  ctx.lineWidth = 22;
  ctx.setLineDash([10, 14]);
  ctx.beginPath();
  // Centre to centre of each pair of touching path cells: the road's spine.
  for (const [col, row] of cells) {
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    if (path.has(cellKey(col + 1, row))) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + TILE, cy);
    }
    if (path.has(cellKey(col, row + 1))) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + TILE);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawHover(ctx, { col, row, ok }) {
  ctx.fillStyle = ok ? THEME.hover : THEME.hoverBad;
  ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
}

// A paper lantern on a post, over a soft pool of light on the grass.
export function drawLantern(ctx, { x, y }) {
  const pool = ctx.createRadialGradient(x, y, 0, x, y, POOL_R);
  pool.addColorStop(0, THEME.glowCentre);
  pool.addColorStop(0.35, THEME.glowMid);
  pool.addColorStop(1, THEME.glowEdge);
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.arc(x, y, POOL_R, 0, FULL);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.9, 0.9);
  ctx.strokeStyle = THEME.lanternPost;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(0, -20);
  ctx.stroke();

  roundedFill(ctx, -9, -21, 18, 5, 2.5, THEME.lanternCap);
  roundedFill(ctx, -13, -17, 26, 28, 11, THEME.lanternPaper);
  roundedFill(ctx, -10, -14, 20, 22, 9, THEME.lanternInner);
  ctx.fillStyle = THEME.lanternCore;
  ctx.beginPath();
  ctx.ellipse(0, -3, 5.5, 7.5, 0, 0, FULL);
  ctx.fill();

  ctx.strokeStyle = THEME.lanternRib;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-5, -16);
  ctx.lineTo(-5, 10);
  ctx.moveTo(5, -16);
  ctx.lineTo(5, 10);
  ctx.stroke();

  roundedFill(ctx, -8, 10, 16, 4.5, 2.2, THEME.lanternCap);
  ctx.strokeStyle = THEME.lanternTassel;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 14.5);
  ctx.lineTo(0, 22);
  ctx.stroke();
  ctx.restore();
}

// A ghost: a rounded head, a zig-zag hem, two eyes, and its health bar above it.
// A ghost handed no health draws a full bar.
export function drawGhost(ctx, ghost) {
  const { x, y } = ghost;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = THEME.ghostBody;
  ctx.strokeStyle = THEME.ghostEdge;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-12, 12);
  ctx.lineTo(-12, -2);
  ctx.arc(0, -2, 12, Math.PI, 0);
  ctx.lineTo(12, 12);
  for (const [hx, hy] of [[8, 8], [4, 13], [0, 8], [-4, 13], [-8, 8]]) ctx.lineTo(hx, hy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = THEME.ghostSheen;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-1, -3, 8, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();

  ctx.fillStyle = THEME.ghostEye;
  for (const ex of [-4.2, 4.2]) {
    ctx.beginPath();
    ctx.ellipse(ex, -1, 2.4, 3.3, 0, 0, FULL);
    ctx.fill();
  }
  ctx.fillStyle = THEME.ghostEyeShine;
  for (const sx of [-3.4, 5]) {
    ctx.beginPath();
    ctx.arc(sx, -2.2, 0.9, 0, FULL);
    ctx.fill();
  }

  const share = ghost.health == null || ghost.maxHealth == null ? 1 : healthFraction(ghost);
  drawHealthBar(ctx, 0, -26, share);
  ctx.restore();
}

// The Board artboard's bar: a 26x4 track whose fill shortens and reddens with each hit.
export function drawHealthBar(ctx, x, top, fraction) {
  const left = x - BAR_W / 2;
  ctx.fillStyle = THEME.healthTrack;
  ctx.fillRect(left, top, BAR_W, BAR_H);
  if (fraction > 2 / 3) ctx.fillStyle = THEME.healthHigh;
  else if (fraction > 1 / 3) ctx.fillStyle = THEME.healthMid;
  else ctx.fillStyle = THEME.healthLow;
  ctx.fillRect(left, top, BAR_W * fraction, BAR_H);
}

// A glowing beam from a lantern's centre to its target's centre.
export function drawBeam(ctx, { from, to }) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.shadowColor = THEME.beamGlow;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = THEME.beamSoft;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.strokeStyle = THEME.beam;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

function drawLives(ctx, lives) {
  ctx.fillStyle = THEME.text;
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Lives: ${lives}`, 8, 20);
}

// The end of a round: the board dimmed, a card saying how it ended and how to go again.
function drawRoundOver(ctx, status) {
  const width = COLS * TILE;
  const height = ROWS * TILE;
  const won = status === 'won';
  ctx.save();
  ctx.fillStyle = THEME.dim;
  ctx.fillRect(0, 0, width, height);

  const cardW = 360;
  const cardH = 130;
  const left = (width - cardW) / 2;
  const top = (height - cardH) / 2;
  roundedFill(ctx, left, top, cardW, cardH, 16, won ? THEME.cardWin : THEME.cardLose);
  ctx.strokeStyle = won ? THEME.cardWinEdge : THEME.cardLoseEdge;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = won ? THEME.cardWinTitle : THEME.cardLoseTitle;
  ctx.font = '800 26px system-ui, sans-serif';
  ctx.fillText(HEADLINE[status], width / 2, top + 56);
  ctx.fillStyle = THEME.textMuted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Click to play again', width / 2, top + 94);
  ctx.restore();
}

function roundedFill(ctx, x, y, w, h, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export const SPRITES = { drawPath, drawLantern, drawGhost, drawBeam };
