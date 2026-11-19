// Canvas drawing only. Reads game state; never changes it.
// Every colour is a THEME token; the sprites follow the Board artboard (design/screens/Board.dc.html).

import { COLS, ROWS, TILE, cellCenter } from './path.js';
import { healthFraction } from './enemy.js';
import { THEME } from './theme.js';

const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;

// Pools first, then the hover, then tower bodies, so no lantern's pool lands on another's body.
// A tower that splashes is a brazier: it casts no pool and is drawn as its square.
export function draw(ctx, state, hover, sprites = SPRITES) {
  sprites.drawPath(ctx, state);
  for (const tower of state.towers) if (!(tower.splash > 0)) sprites.drawLanternLight(ctx, tower);
  if (hover) drawHover(ctx, hover);
  for (const tower of state.towers) {
    if (tower.splash > 0) sprites.drawBrazier(ctx, tower);
    else sprites.drawLanternBody(ctx, tower);
  }
  for (const enemy of state.enemies) sprites.drawGhost(ctx, enemy);
  for (const { from, to } of state.shots) sprites.drawBeam(ctx, from, to);
  drawLives(ctx, state.lives);
  if (state.status !== 'playing') drawEndCard(ctx, state.status);
}

// Grass as alternating tiles with a few blades, then the path as layered stone:
// a shadow, an edge, the stones and a dashed run of darker stones down the middle.
export function drawPath(ctx, { waypoints }) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      ctx.fillStyle = (col + row) % 2 ? THEME.grassB : THEME.grassA;
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
    }
  }
  drawGrassBlades(ctx);

  const points = pathPoints(waypoints);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.translate(0, 3);
  strokePolyline(ctx, points, THEME.pathShadow, 44);
  ctx.restore();
  ctx.save();
  ctx.lineJoin = 'round';
  strokePolyline(ctx, points, THEME.pathEdge, 40);
  strokePolyline(ctx, points, THEME.pathStone, 34);
  ctx.setLineDash([10, 14]);
  strokePolyline(ctx, points, THEME.pathStoneDark, 22);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawGrassBlades(ctx) {
  ctx.save();
  ctx.strokeStyle = THEME.grassBlade;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if ((col * 7 + row * 3) % 4) continue; // a blade in some tiles, the same ones every frame
      const x = col * TILE + 12;
      const y = row * TILE + 30;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 6);
      ctx.lineTo(x + 4, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// The waypoints' cell centres, with the ends carried a tile on so the path runs off the board.
function pathPoints(waypoints) {
  const points = waypoints.map(cellCenter);
  if (points.length < 2) return points;
  const reach = (from, to) => {
    const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    return { x: to.x + ((to.x - from.x) / len) * TILE, y: to.y + ((to.y - from.y) / len) * TILE };
  };
  return [reach(points[1], points[0]), ...points.slice(1, -1), reach(points[points.length - 2], points[points.length - 1])];
}

function strokePolyline(ctx, points, colour, width) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const { x, y } of points.slice(1)) ctx.lineTo(x, y);
  ctx.stroke();
}

function drawHover(ctx, { col, row, ok }) {
  ctx.fillStyle = ok ? THEME.hover : THEME.hoverBad;
  ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
}

// The whole lantern on its own: its pool, then its body.
export function drawLantern(ctx, tower) {
  drawLanternLight(ctx, tower);
  drawLanternBody(ctx, tower);
}

// The soft radial pool of light a lantern casts on the grass.
const POOL_RADIUS = TILE * 1.5;

export function drawLanternLight(ctx, { x, y }) {
  const pool = ctx.createRadialGradient(x, y, 0, x, y, POOL_RADIUS);
  pool.addColorStop(0, THEME.glowInner);
  pool.addColorStop(0.35, THEME.glowMid);
  pool.addColorStop(1, THEME.glowOuter);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.arc(x, y, POOL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// The artboard's lantern symbol (40x56 units around its centre), scaled to sit in a 40px tile.
const LANTERN_SCALE = 0.72;

export function drawLanternBody(ctx, { x, y }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(LANTERN_SCALE, LANTERN_SCALE);
  ctx.lineCap = 'round';

  ctx.strokeStyle = THEME.lanternPost;
  ctx.lineWidth = 2;
  line(ctx, 0, -28, 0, -20);

  fillRounded(ctx, THEME.lanternCap, -9, -21, 18, 5, 2.5);
  fillRounded(ctx, THEME.lanternPaper, -13, -17, 26, 28, 11);
  fillRounded(ctx, THEME.lanternPaperLit, -10, -14, 20, 22, 9);
  ctx.fillStyle = THEME.lanternCore;
  ctx.beginPath();
  ctx.ellipse(0, -3, 5.5, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = THEME.lanternRib;
  ctx.lineWidth = 1.2;
  line(ctx, -5, -16, -5, 10);
  line(ctx, 5, -16, 5, 10);

  fillRounded(ctx, THEME.lanternCap, -8, 10, 16, 4.5, 2.2);
  ctx.strokeStyle = THEME.lanternTassel;
  ctx.lineWidth = 2;
  line(ctx, 0, 14.5, 0, 22);
  ctx.restore();
}

// The brazier's placeholder until the board art brings its sprite: an orange square with a
// lighter core, in the lantern's paper and core colours.
const BRAZIER_SIDE = TILE * 0.6;
const BRAZIER_CORE = TILE * 0.25;

export function drawBrazier(ctx, { x, y }) {
  ctx.fillStyle = THEME.lanternPaper;
  ctx.fillRect(x - BRAZIER_SIDE / 2, y - BRAZIER_SIDE / 2, BRAZIER_SIDE, BRAZIER_SIDE);
  ctx.fillStyle = THEME.lanternCore;
  ctx.fillRect(x - BRAZIER_CORE / 2, y - BRAZIER_CORE / 2, BRAZIER_CORE, BRAZIER_CORE);
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function fillRounded(ctx, colour, x, y, width, height, radius) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

// The artboard's ghost symbol (32x36 units around its centre): a round head, a hem of
// curved points, a sheen and two eyes with shine; its health bar floats above it.
const GHOST_SCALE = 0.94;

export function drawGhost(ctx, enemy) {
  const { x, y } = enemy;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(GHOST_SCALE, GHOST_SCALE);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.fillStyle = THEME.ghostBody;
  ctx.strokeStyle = THEME.ghostEdge;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 12);
  ctx.lineTo(-12, -2);
  ctx.arc(0, -2, 12, Math.PI, 0);
  ctx.lineTo(12, 12);
  ctx.quadraticCurveTo(10, 8, 8, 8);
  ctx.quadraticCurveTo(5, 9, 4, 13);
  ctx.quadraticCurveTo(2, 8, 0, 8);
  ctx.quadraticCurveTo(-3, 9, -4, 13);
  ctx.quadraticCurveTo(-6, 8, -8, 8);
  ctx.quadraticCurveTo(-11, 9, -12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = THEME.ghostSheen;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1, -2, 8, Math.PI * 1.25, Math.PI * 1.6);
  ctx.stroke();

  for (const side of [-1, 1]) {
    ctx.fillStyle = THEME.ghostEyes;
    ctx.beginPath();
    ctx.ellipse(side * 4.2, -1, 2.4, 3.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const shineX of [-3.4, 5]) {
    ctx.fillStyle = THEME.ghostEyeShine;
    ctx.beginPath();
    ctx.arc(shineX, -2.2, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // A ghost handed in with no health of its own is drawn at full health.
  const fraction = enemy.maxHealth === undefined ? 1 : healthFraction(enemy);
  drawHealthBar(ctx, x, y - 29, fraction);
}

// The Board artboard's bar: a 26x4 track whose fill shortens and reddens with each hit.
const BAR_WIDTH = 26;
const BAR_HEIGHT = 4;

export function drawHealthBar(ctx, x, top, fraction) {
  const left = x - BAR_WIDTH / 2;
  ctx.fillStyle = THEME.healthTrack;
  ctx.fillRect(left, top, BAR_WIDTH, BAR_HEIGHT);
  if (fraction > 2 / 3) ctx.fillStyle = THEME.healthHigh;
  else if (fraction > 1 / 3) ctx.fillStyle = THEME.healthMid;
  else ctx.fillStyle = THEME.healthLow;
  ctx.fillRect(left, top, BAR_WIDTH * fraction, BAR_HEIGHT);
}

// A lantern's shot: a wide soft glow under a thin bright core.
export function drawBeam(ctx, from, to) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = THEME.beamGlow;
  ctx.shadowColor = THEME.beamGlow;
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 9;
  line(ctx, from.x, from.y, to.x, to.y);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.strokeStyle = THEME.beam;
  ctx.lineWidth = 2.5;
  line(ctx, from.x, from.y, to.x, to.y);
  ctx.restore();
}

function drawLives(ctx, lives) {
  ctx.save();
  ctx.fillStyle = THEME.text;
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Lives: ${lives}`, 8, 20);
  ctx.restore();
}

const END_TITLES = { lost: 'The ghosts got through', won: 'The path is safe' };

// The round is over: a veil over the board, what happened, and how to go again.
function drawEndCard(ctx, status) {
  ctx.save();
  ctx.fillStyle = THEME.dim;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = THEME.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 30px Inter, system-ui, sans-serif';
  ctx.fillText(END_TITLES[status], WIDTH / 2, HEIGHT / 2 - 18);
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 22);
  ctx.restore();
}

// The sprite table draw uses; a test hands in its own to count calls.
export const SPRITES = { drawPath, drawLanternLight, drawLanternBody, drawBrazier, drawGhost, drawBeam };
