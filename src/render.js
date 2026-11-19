// Canvas drawing only. Reads game state; never changes it.
// Every colour is a THEME token; the sprites follow the Board artboard (design/screens/Board.dc.html).

import { COLS, ROWS, TILE, cellCenter } from './path.js';
import { healthFraction } from './enemy.js';
import { THEME } from './theme.js';
import { rangePreview } from './game.js';
import { HUD_BUTTONS, HUD_GAP, HUD_HEIGHT, HUD_PAD, hudModel } from './hud.js';

const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;

// Pools first, then the hover and its range ring, then tower bodies, so no lantern's pool lands
// on another's body and the ring sits under the lanterns, as the Main artboard layers it.
// A tower that splashes is a brazier: it casts no pool and is drawn as its square.
export function draw(ctx, state, hover, sprites = SPRITES) {
  sprites.drawPath(ctx, state);
  for (const tower of state.towers) if (!(tower.splash > 0)) sprites.drawLanternLight(ctx, tower);
  if (hover) drawHover(ctx, hover);
  drawRangeRing(ctx, rangePreview(state, hover));
  for (const tower of state.towers) {
    if (tower.splash > 0) sprites.drawBrazier(ctx, tower);
    else sprites.drawLanternBody(ctx, tower);
  }
  for (const enemy of state.enemies) sprites.drawGhost(ctx, enemy);
  for (const { from, to } of state.shots) sprites.drawBeam(ctx, from, to);
  drawHud(ctx, hudModel(state));
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

// The reach of the tower under the pointer, or of the one a click would place: a faint fill
// under a thin dashed outline (design/screens.html:204).
function drawRangeRing(ctx, ring) {
  if (!ring) return;
  ctx.save();
  ctx.fillStyle = THEME.rangeFill;
  ctx.strokeStyle = THEME.rangeRing;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
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
// lighter core. THEME names no brazier colours yet, so the square borrows the lantern's
// orange paper and its lighter core until the board art names the brazier's own.
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

// The HUD bar across the top, drawn from hudModel alone (design/screens/Main.dc.html, and
// HudStates.dc.html for danger lives, Resume and 2x): three pills on the left, Pause and Speed on the right.
const HUD_FONT = 'Inter, system-ui, sans-serif';
const PILL_HEIGHT = 26;
const PILL_TOP = (HUD_HEIGHT - PILL_HEIGHT) / 2;
const HUD_MID = HUD_HEIGHT / 2;

export function drawHud(ctx, hud) {
  ctx.save();
  ctx.fillStyle = THEME.hudBg;
  ctx.fillRect(0, 0, WIDTH, HUD_HEIGHT);
  ctx.fillStyle = THEME.hudLine;
  ctx.fillRect(0, HUD_HEIGHT - 1, WIDTH, 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  let x = HUD_PAD;
  x = drawLivesPill(ctx, x, hud) + HUD_GAP;
  x = drawGoldPill(ctx, x, hud) + HUD_GAP;
  drawWavePill(ctx, x, hud);
  drawPauseButton(ctx, HUD_BUTTONS.pause, hud.paused);
  drawSpeedControl(ctx, HUD_BUTTONS.speed, hud.speed);
  ctx.restore();
}

// Text's width as the context measures it, or an estimate where it measures none.
function textWidth(ctx, text, size) {
  const width = ctx.measureText(text)?.width;
  return typeof width === 'number' ? width : text.length * size * 0.6;
}

function hudText(ctx, text, x, colour, font, size) {
  ctx.font = `${font} ${size}px ${HUD_FONT}`;
  ctx.fillStyle = colour;
  ctx.fillText(text, x, HUD_MID);
  return x + textWidth(ctx, text, size);
}

// A pill's contents are laid out first to learn its width, then the pill is drawn under them.
function drawPill(ctx, x, fill, ring, layout) {
  const right = layout(true);
  fillRounded(ctx, fill, x, PILL_TOP, right - x, PILL_HEIGHT, PILL_HEIGHT / 2);
  if (ring) {
    ctx.strokeStyle = ring;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 0.5, PILL_TOP + 0.5, right - x - 1, PILL_HEIGHT - 1, PILL_HEIGHT / 2);
    ctx.stroke();
  }
  layout(false);
  return right;
}

// Measuring draws nothing: the layout runs once with this stand-in, then on the real context.
function measuring(ctx) {
  return {
    set font(value) {
      ctx.font = value;
    },
    fillText() {},
    measureText: (text) => ctx.measureText(text),
  };
}

function drawLivesPill(ctx, left, { lives, livesDanger }) {
  const heart = livesDanger ? THEME.hudDangerHeart : THEME.hudHeart;
  const value = livesDanger ? THEME.hudDangerValue : THEME.hudInk;
  const label = livesDanger ? THEME.hudDangerLabel : THEME.hudMuted;
  const fill = livesDanger ? THEME.hudDangerPill : THEME.hudPill;
  const ring = livesDanger ? THEME.hudDangerRing : null;
  return drawPill(ctx, left, fill, ring, (measure) => {
    const c = measure ? measuring(ctx) : ctx;
    let x = left + 8;
    if (!measure) drawHeart(ctx, x + 7.5, HUD_MID, heart);
    x += 15 + 6;
    x = hudText(c, String(lives), x, value, 700, 15) + 6;
    return hudText(c, 'lives', x, label, 400, 11) + 10;
  });
}

function drawGoldPill(ctx, left, { gold }) {
  return drawPill(ctx, left, THEME.hudPill, null, (measure) => {
    const c = measure ? measuring(ctx) : ctx;
    let x = left + 8;
    if (!measure) drawCoin(ctx, x + 7.5, HUD_MID);
    x += 15 + 6;
    x = hudText(c, String(gold), x, THEME.hudAccent, 700, 15) + 6;
    return hudText(c, 'gold', x, THEME.hudMuted, 400, 11) + 10;
  });
}

// "Wave", then current / total, then one pip per wave, lit up to the current one.
const PIP_WIDTH = 4;
const PIP_HEIGHT = 12;
const PIP_GAP = 2;

function drawWavePill(ctx, left, { wave, totalWaves }) {
  return drawPill(ctx, left, THEME.hudPill, null, (measure) => {
    const c = measure ? measuring(ctx) : ctx;
    let x = left + 10;
    x = hudText(c, 'Wave', x, THEME.hudMuted, 400, 11) + 8;
    x = hudText(c, `${wave} / ${totalWaves}`, x, THEME.hudWave, 700, 15) + 8;
    for (let i = 1; i <= totalWaves; i++) {
      if (!measure) {
        ctx.fillStyle = i <= wave ? THEME.hudWave : THEME.hudPipDim;
        ctx.fillRect(x, HUD_MID - PIP_HEIGHT / 2, PIP_WIDTH, PIP_HEIGHT);
      }
      x += PIP_WIDTH + PIP_GAP;
    }
    return x - PIP_GAP + 10;
  });
}

// The artboard's 24-unit heart, scaled to 15px around its centre.
function drawHeart(ctx, cx, cy, colour) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(15 / 24, 15 / 24);
  ctx.translate(-12, -12);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(12, 21);
  ctx.bezierCurveTo(12, 21, 4.5, 16.4, 2.4, 11.8);
  ctx.bezierCurveTo(0.9, 8.4, 3, 4.5, 6.7, 4.5);
  ctx.bezierCurveTo(8.8, 4.5, 10.2, 5.6, 12, 7.6);
  ctx.bezierCurveTo(13.8, 5.6, 15.2, 4.5, 17.3, 4.5);
  ctx.bezierCurveTo(21, 4.5, 23.1, 8.4, 21.6, 11.8);
  ctx.bezierCurveTo(19.5, 16.4, 12, 21, 12, 21);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The artboard's coin: a gold disc with a darker rim ring and a stroke down its middle.
function drawCoin(ctx, cx, cy) {
  const unit = 15 / 24;
  ctx.save();
  ctx.fillStyle = THEME.hudAccent;
  ctx.beginPath();
  ctx.arc(cx, cy, 9.5 * unit, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = THEME.hudCoinRim;
  ctx.lineWidth = 1.6 * unit;
  ctx.beginPath();
  ctx.arc(cx, cy, 6.5 * unit, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.8 * unit;
  ctx.lineCap = 'round';
  line(ctx, cx, cy - 3.5 * unit, cx, cy + 3.5 * unit);
  ctx.restore();
}

// A button's rounded outline, over its fill when it has one.
function outlineButton(ctx, { x, y, width, height }, fill, edge) {
  if (fill) fillRounded(ctx, fill, x, y, width, height, 7);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, height - 1, 7);
  ctx.stroke();
}

// Pause shows two bars; while paused it shows Resume, a play triangle in accent.
function drawPauseButton(ctx, button, paused) {
  const cx = button.x + button.width / 2;
  const cy = button.y + button.height / 2;
  if (paused) {
    outlineButton(ctx, button, THEME.hudResumeBg, THEME.hudAccent);
    ctx.fillStyle = THEME.hudAccent;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 4.4);
    ctx.lineTo(cx + 4.4, cy);
    ctx.lineTo(cx - 3, cy + 4.4);
    ctx.closePath();
    ctx.fill();
    return;
  }
  outlineButton(ctx, button, THEME.hudButtonBg, THEME.hudButtonEdge);
  ctx.fillStyle = THEME.hudInk;
  ctx.fillRect(cx - 4, cy - 5, 3, 10);
  ctx.fillRect(cx + 1, cy - 5, 3, 10);
}

// One segmented control: 1x and 2x, the active one filled (2x in accent).
function drawSpeedControl(ctx, button, speed) {
  outlineButton(ctx, button, null, THEME.hudButtonEdge);
  const half = button.width / 2;
  ctx.font = `600 12px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  for (const [i, value] of [1, 2].entries()) {
    const active = speed === value;
    const left = button.x + i * half;
    if (active) {
      ctx.fillStyle = value === 2 ? THEME.hudAccent : THEME.hudButtonActive;
      ctx.beginPath();
      ctx.roundRect(left + 1, button.y + 1, half - 2, button.height - 2, 6);
      ctx.fill();
    }
    ctx.fillStyle = !active ? THEME.hudMuted : value === 2 ? THEME.hudOnAccent : THEME.hudInk;
    ctx.fillText(`${value}x`, left + half / 2, button.y + button.height / 2);
  }
  ctx.textAlign = 'left';
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
