// The HUD's model and where the pointer lands on the canvas. Pure logic, no DOM: render.js
// draws the bar from hudModel and the selected tower's card from selectedModel, and main.js asks
// these which button or cell a pointer is on, the start screen's Start and difficulty buttons
// among them.

import { COLS, ROWS, TILE } from './path.js';
import { MAX_LEVEL, towerById } from './tower.js';
import { DIFFICULTIES } from './difficulty.js';
import { upgradeError } from './game.js';

export const HUD_HEIGHT = 40; // design/hud.md --hud-height; the board is drawn below the bar
export const HUD_PAD = 8; // design/hud.md --hud-pad: the bar's inset from the canvas edge
export const LIVES_DANGER = 3; // lives at or below this turn the HUD's lives red
const WIDTH = COLS * TILE;
export const CANVAS_HEIGHT = HUD_HEIGHT + ROWS * TILE; // the bar, then the whole board below it

// Right-aligned buttons, 28 tall, --hud-pad from the edge and --hud-gap apart.
export const SPEED_BUTTON = Object.freeze({ x: WIDTH - HUD_PAD - 40, y: 6, width: 40, height: 28 });
export const PAUSE_BUTTON = Object.freeze({ x: SPEED_BUTTON.x - 16 - 72, y: 6, width: 72, height: 28 });

// design/hud.md's Start button, 160 by 44, centred across the canvas at 60% of its height.
export const START_BUTTON = Object.freeze({ x: WIDTH / 2 - 80, y: Math.round(0.6 * CANVAS_HEIGHT) - 22, width: 160, height: 44 });

// The start screen's difficulty row: Easy, Normal, Hard, each 96 by 28 and 8 apart, centred
// across the canvas with its bottom 8 above the canvas's bottom edge, below the start steps.
const DIFFICULTY_ORDER = Object.keys(DIFFICULTIES);
const DIFFICULTY_WIDTH = 96;
const DIFFICULTY_HEIGHT = 28;
const DIFFICULTY_GAP = 8;
const DIFFICULTY_ROW = DIFFICULTY_ORDER.length * (DIFFICULTY_WIDTH + DIFFICULTY_GAP) - DIFFICULTY_GAP;
export const DIFFICULTY_BUTTONS = Object.freeze(
  DIFFICULTY_ORDER.map((key, i) =>
    Object.freeze({ key, x: (WIDTH - DIFFICULTY_ROW) / 2 + i * (DIFFICULTY_WIDTH + DIFFICULTY_GAP), y: CANVAS_HEIGHT - 8 - DIFFICULTY_HEIGHT, width: DIFFICULTY_WIDTH, height: DIFFICULTY_HEIGHT }),
  ),
);

// What the HUD shows, read from the state and never written to it. `bossWave` holds for the
// whole of a wave whose spawner sends a boss, from its start.
export function hudModel({ lives, gold, wave, totalWaves, paused, speed, spawner }) {
  return { lives, gold, wave, totalWaves, paused, speed, livesDanger: lives <= LIVES_DANGER, bossWave: Boolean(spawner?.boss) };
}

// What the card says in place of the upgrade line when upgradeError refuses, by its reason;
// {cost} and {gold} are the upgrade's cost and the gold held, {max} is MAX_LEVEL.
export const UPGRADE_REFUSALS = Object.freeze({
  gold: 'Needs {cost} gold, you hold {gold}: banish more ghosts',
  max: 'Level {max} is the most: upgrade another tower',
  missing: 'No tower to upgrade: click a placed tower first',
});

// What the selected tower's card shows, read from the state and never written to it; null when
// no tower has the id. Its upgrade cost is null at the most. It carries the tower's targeting
// mode, which a right-click toggles.
export function selectedModel(state, id) {
  const tower = towerById(state, id);
  if (!tower) return null;
  const refusal = upgradeError(state, id);
  const { name, level, damage, range, mode } = tower;
  const upgradeCost = refusal === 'max' ? null : tower.upgrade.cost;
  return { name, level, maxLevel: MAX_LEVEL, damage, range, mode, upgradeCost, refusal };
}

// The card's last line: what U does, or the refusal's sentence when it would refuse.
export function upgradeLine({ upgradeCost, refusal }, gold) {
  if (refusal === null) return `Press U to upgrade: ${upgradeCost} gold`;
  return UPGRADE_REFUSALS[refusal]
    .replace('{cost}', String(upgradeCost))
    .replace('{gold}', String(gold))
    .replace('{max}', String(MAX_LEVEL));
}

const inside = (rect, x, y) => x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;

// The button under a canvas point: 'pause', 'speed', or null anywhere else.
export function hudButtonAt(x, y) {
  if (inside(PAUSE_BUTTON, x, y)) return 'pause';
  if (inside(SPEED_BUTTON, x, y)) return 'speed';
  return null;
}

// Whether a canvas point is on the start screen's Start button.
export function startButtonAt(x, y) {
  return inside(START_BUTTON, x, y);
}

// The difficulty button under a canvas point: 'easy', 'normal', 'hard', or null off them all.
export function difficultyButtonAt(x, y) {
  return DIFFICULTY_BUTTONS.find((b) => inside(b, x, y))?.key ?? null;
}

// The board cell under a canvas point, or null on the bar. A point past the board's edge
// still names a cell, for cellError to call 'bounds'.
export function boardCellAt(x, y) {
  if (y < HUD_HEIGHT) return null;
  return { col: Math.floor(x / TILE), row: Math.floor((y - HUD_HEIGHT) / TILE) };
}

// The action a key reaches: P pauses, F changes speed, U upgrades the selected tower, S sells
// the selected tower, either case; Escape clears the selection; any other key, null.
export function hudKey(key) {
  if (key === 'Escape') return 'deselect';
  const lower = key.toLowerCase();
  if (lower === 'p') return 'pause';
  if (lower === 'f') return 'speed';
  if (lower === 'u') return 'upgrade';
  if (lower === 's') return 'sell';
  return null;
}

// Enter or Space starts a ready round; hudKey leaves them alone.
export function startKey(key) {
  return key === 'Enter' || key === ' ';
}

const DIFFICULTY_KEYS = Object.freeze({ e: 'easy', n: 'normal', h: 'hard' });

// E, N or H chooses easy, normal or hard on the start screen, either case; any other key, null.
export function difficultyKey(key) {
  const lower = key.toLowerCase();
  return Object.hasOwn(DIFFICULTY_KEYS, lower) ? DIFFICULTY_KEYS[lower] : null;
}
