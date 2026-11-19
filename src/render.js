// Canvas drawing only. Reads game state; never changes it.
// Every colour is a THEME token; the sprites follow the Board artboard (design/screens/Board.dc.html).

import { COLS, ROWS, TILE, cellCenter } from './path.js';
import { healthFraction } from './enemy.js';
import { THEME } from './theme.js';
import { DIFFICULTIES } from './difficulty.js';
import { rangePreview, sellValue, towerPrice } from './game.js';
import { towerById } from './tower.js';
import { CANVAS_HEIGHT, DIFFICULTY_BUTTONS, HUD_HEIGHT, HUD_PAD, PAUSE_BUTTON, SPEED_BUTTON, START_BUTTON, hudModel, selectedModel, upgradeLine } from './hud.js';

const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;

// Pools first, then the hover and its range ring, then tower bodies, so no lantern's pool lands
// on another's body and the ring sits under the lanterns, as the Main artboard layers it.
// A tower that splashes is a brazier, drawn as its square; one that slows is frost, drawn as its
// diamond; neither casts a pool.
// The board sits below the HUD bar, drawn in its own coordinates moved down by HUD_HEIGHT,
// so no cell is ever under the bar; the end card veils the board and the bar stays readable.
// `kind`, when handed, is the kind a click places, and the bar names it; on a game with a
// difficulty the bar names it with its current price. `selected`, when it is a
// placed tower's id, rings that tower and draws its card above the ghosts and beams.
// An upgraded tower wears its level marks over its body.
// While the game is ready, the start screen covers the whole canvas, bar included; a playing,
// won or lost game draws no start screen. `best`, when handed, is the saved best wave, shown only
// on the start screen; null draws no Best line.
// The pointed cell and its range ring draw only while the game is playing: under the start
// screen and the end cards the pointer previews nothing, while a selected tower keeps its ring
// and card.
export function draw(ctx, state, hover, sprites = SPRITES, kind = null, selected = null, best = null) {
  const pointed = state.status === 'playing' ? hover : null;
  const model = selectedModel(state, selected);
  const chosen = model && towerById(state, selected);
  ctx.save();
  ctx.translate(0, HUD_HEIGHT);
  sprites.drawPath(ctx, state);
  for (const tower of state.towers) if (bodySprite(tower) === 'drawLanternBody') sprites.drawLanternLight(ctx, tower);
  if (pointed) drawHover(ctx, pointed);
  drawRangeRing(ctx, rangePreview(state, pointed));
  if (chosen && !(pointed && pointed.col === chosen.col && pointed.row === chosen.row)) {
    drawRangeRing(ctx, { x: chosen.x, y: chosen.y, radius: chosen.range });
  }
  for (const tower of state.towers) sprites[bodySprite(tower)](ctx, tower);
  for (const tower of state.towers) drawLevelMarks(ctx, tower);
  for (const enemy of state.enemies) sprites.drawGhost(ctx, enemy);
  for (const { from, to } of state.shots) sprites.drawBeam(ctx, from, to);
  if (chosen) drawTowerCard(ctx, chosen, model, state.gold);
  if (state.status === 'won' || state.status === 'lost') drawEndCard(ctx, state.status);
  ctx.restore();
  drawHud(ctx, hudModel(state), kind && (state.difficulty ? `${kind.name} ${towerPrice(state, kind)}` : kind.name));
  if (state.status === 'ready') drawStartScreen(ctx, best, state.difficulty);
}

// The one place a tower's kind is read for drawing: the sprite that draws its body. A tower that
// neither splashes nor slows is a lantern, and only a lantern casts a pool.
function bodySprite(tower) {
  if (tower.splash > 0) return 'drawBrazier';
  if (tower.slow > 0) return 'drawFrost';
  return 'drawLanternBody';
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

// The frost tower's placeholder until the board art brings its sprite: an icy diamond (the
// brazier's square turned 45 degrees about its centre) with a pale square core.
const FROST_SIDE = BRAZIER_SIDE;
const FROST_CORE = TILE * 0.2;

export function drawFrost(ctx, { x, y }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = THEME.frostBody;
  ctx.fillRect(-FROST_SIDE / 2, -FROST_SIDE / 2, FROST_SIDE, FROST_SIDE);
  ctx.restore();
  ctx.fillStyle = THEME.frostCore;
  ctx.fillRect(x - FROST_CORE / 2, y - FROST_CORE / 2, FROST_CORE, FROST_CORE);
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
// A ghost frost is slowing is tinted frost, and an armoured ghost's outline is THEME.armour, 2
// pixels. A boss is the same ghost, drawn BOSS_SCALE larger.
const GHOST_SCALE = 0.94;
export const BOSS_SCALE = 1.6;

export function drawGhost(ctx, enemy) {
  const { x, y } = enemy;
  ctx.save();
  ctx.translate(x, y);
  const size = enemy.boss ? BOSS_SCALE : 1;
  ctx.scale(GHOST_SCALE * size, GHOST_SCALE * size);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.fillStyle = enemy.slowLeft > 0 ? THEME.ghostSlowed : THEME.ghostBody;
  ctx.strokeStyle = enemy.armour > 0 ? THEME.armour : THEME.ghostEdge;
  ctx.lineWidth = enemy.armour > 0 ? 2 : 1.6;
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
  drawHealthBar(ctx, x, y - 29 * size, fraction);
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

// The design/hud.md bar, drawn only from hudModel: Lives, Gold and Wave from the left at fixed
// offsets (no text is measured), then the kind a click places when draw is handed one, styled
// like the three before it and clear of the Pause and Speed buttons on the right. On a boss wave,
// "Boss wave" follows in the danger red, before the buttons.
const HUD_ITEMS = [
  { label: 'Lives', labelX: HUD_PAD, valueX: 54 },
  { label: 'Gold', labelX: 96, valueX: 138 },
  { label: 'Wave', labelX: 190, valueX: 236 },
];
export const HUD_KIND = { label: 'Tower', labelX: 300, valueX: 348 };
export const HUD_BOSS_X = 420;
const BUTTON_RADIUS = 6;

function drawHud(ctx, { lives, gold, wave, totalWaves, paused, speed, livesDanger, bossWave }, kindText) {
  ctx.save();
  ctx.fillStyle = THEME.hudBg;
  ctx.fillRect(0, 0, WIDTH, HUD_HEIGHT);
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const values = [
    [String(lives), livesDanger ? THEME.hudDanger : THEME.hudInk],
    [String(gold), THEME.hudAccent],
    [`${wave} / ${totalWaves}`, THEME.hudGhost],
  ];
  HUD_ITEMS.forEach(({ label, labelX, valueX }, i) => {
    ctx.fillStyle = THEME.hudMuted;
    ctx.fillText(label, labelX, HUD_HEIGHT / 2);
    ctx.fillStyle = values[i][1];
    ctx.fillText(values[i][0], valueX, HUD_HEIGHT / 2);
  });
  if (kindText) {
    ctx.fillStyle = THEME.hudMuted;
    ctx.fillText(HUD_KIND.label, HUD_KIND.labelX, HUD_HEIGHT / 2);
    ctx.fillStyle = THEME.hudInk;
    ctx.fillText(kindText, HUD_KIND.valueX, HUD_HEIGHT / 2);
  }
  if (bossWave) {
    ctx.fillStyle = THEME.hudDanger;
    ctx.fillText('Boss wave', HUD_BOSS_X, HUD_HEIGHT / 2);
  }
  drawButton(ctx, PAUSE_BUTTON, paused ? 'Resume' : 'Pause', false);
  drawButton(ctx, SPEED_BUTTON, `${speed}x`, speed === 2);
  ctx.restore();
}

// A HUD button: outlined in the muted ink, or filled with the accent while it is active.
function drawButton(ctx, { x, y, width, height }, text, active) {
  ctx.beginPath();
  if (active) {
    ctx.fillStyle = THEME.hudAccent;
    ctx.roundRect(x, y, width, height, BUTTON_RADIUS);
    ctx.fill();
  } else {
    ctx.strokeStyle = THEME.hudMuted;
    ctx.lineWidth = 1;
    ctx.roundRect(x, y, width, height, BUTTON_RADIUS);
    ctx.stroke();
  }
  ctx.fillStyle = active ? THEME.hudAccentInk : THEME.hudInk;
  ctx.textAlign = 'center';
  ctx.fillText(text, x + width / 2, y + height / 2);
}

// An upgraded tower's level: one small accent square per level in a row under its body, a mark
// apart; a level-1 tower wears none and is drawn as the Board artboard draws it.
export const LEVEL_MARK = 5;

export function drawLevelMarks(ctx, tower) {
  const level = tower.level ?? 1;
  if (level < 2) return;
  const left = tower.x - ((2 * level - 1) * LEVEL_MARK) / 2;
  const top = tower.y + TILE * 0.3;
  ctx.fillStyle = THEME.hudAccent;
  for (let i = 0; i < level; i++) ctx.fillRect(left + i * 2 * LEVEL_MARK, top, LEVEL_MARK, LEVEL_MARK);
}

// The selected tower's card, as the Main artboard's tower card (design/screens/Main.dc.html:49-52):
// a dark panel edged in the ring's gold beside the tower, its name and level, its reach and
// damage, and what U and S do. Fixed sizes, no text measured, kept CARD_INSET inside the board.
const CARD = { width: 300, height: 69, radius: 6, pad: 10, line: 15 };
const CARD_INSET = 4;
const REFUSAL_INK = { gold: 'hudDanger', max: 'hudMuted', missing: 'hudMuted' };
const clamp = (value, low, high) => Math.min(Math.max(value, low), high);

function drawTowerCard(ctx, tower, model, gold) {
  const x = clamp(tower.x + TILE * 0.6, CARD_INSET, WIDTH - CARD_INSET - CARD.width);
  const y = clamp(tower.y - TILE - 14, CARD_INSET, HEIGHT - CARD_INSET - CARD.height);
  ctx.save();
  ctx.fillStyle = THEME.hudBg;
  ctx.strokeStyle = THEME.rangeRing;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, CARD.width, CARD.height, CARD.radius);
  ctx.fill();
  ctx.stroke();
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const lines = [
    [`${model.name} · level ${model.level}`, THEME.hudAccent],
    [`Range ${model.range / TILE} tiles · ${model.damage} damage · targets ${model.mode}`, THEME.hudInk],
    [upgradeLine(model, gold), model.refusal ? THEME[REFUSAL_INK[model.refusal]] : THEME.hudAccent],
    [`Press S to sell: ${sellValue(tower)} gold`, THEME.hudInk],
  ];
  lines.forEach(([text, colour], i) => {
    ctx.fillStyle = colour;
    ctx.fillText(text, x + CARD.pad, y + CARD.pad + i * CARD.line + 2);
  });
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

const START_STEPS = [
  '1  Hang lanterns on the grass beside the path',
  '2  Each one shines on the nearest ghost in range',
  '3  A ghost that reaches the gate costs a life',
];

// design/hud.md's Start screen, with the StartScreen artboard's hint and steps
// (design/screens/StartScreen.dc.html): a veil in --hud-bg over the whole canvas, so the path
// shows faintly behind, the title at 35% height and the Start button at 60%. The tagline hangs
// from the title, and the hint and steps from the button, so they move with them. A saved best
// wave sits midway between the tagline and the button; with none, nothing is drawn there.
// A game with a difficulty gets the Easy, Normal, Hard row along the bottom, the chosen one
// filled in the accent and the others outlined; with none, the row is not drawn.
function drawStartScreen(ctx, best = null, difficulty = null) {
  const centre = WIDTH / 2;
  const titleY = Math.round(0.35 * CANVAS_HEIGHT);
  const { x, y, width, height } = START_BUTTON;
  const hintY = y + height + 16;
  ctx.save();
  ctx.fillStyle = THEME.hudBg;
  ctx.fillRect(0, 0, WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = THEME.hudAccent;
  ctx.fillText('Lantern Line', centre, titleY);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = THEME.hudMuted;
  ctx.fillText('Light the lanterns. Stop the ghosts before they reach the gate.', centre, titleY + 36);
  if (best !== null) {
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = THEME.hudInk;
    ctx.fillText(`Best: wave ${best}`, centre, titleY + 62);
  }
  ctx.beginPath();
  ctx.fillStyle = THEME.hudAccent;
  ctx.roundRect(x, y, width, height, BUTTON_RADIUS);
  ctx.fill();
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillStyle = THEME.hudAccentInk;
  ctx.fillText('Start', x + width / 2, y + height / 2);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = THEME.hudMuted;
  ctx.fillText('or press Enter or Space', centre, hintY);
  ctx.fillStyle = THEME.hudInk;
  START_STEPS.forEach((line, i) => ctx.fillText(line, centre, hintY + 38 + 22 * i));
  if (difficulty !== null) {
    ctx.font = 'bold 13px system-ui, sans-serif';
    for (const b of DIFFICULTY_BUTTONS) drawButton(ctx, b, DIFFICULTIES[b.key].name, b.key === difficulty);
  }
  ctx.restore();
}

// The sprite table draw uses; a test hands in its own to count calls.
export const SPRITES = { drawPath, drawLanternLight, drawLanternBody, drawBrazier, drawFrost, drawGhost, drawBeam };
