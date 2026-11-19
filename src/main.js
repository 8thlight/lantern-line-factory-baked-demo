// Browser entry point: wires the canvas, the mouse and the frame loop to the game.

import { COLS, ROWS, TILE } from './path.js';
import { chooseDifficulty, clickCell, createGame, hoverAt, restart, sellTower, start, step, togglePause, toggleSpeed, upgradeTower } from './game.js';
import { HUD_HEIGHT, boardCellAt, cardButtonAt, difficultyButtonAt, difficultyKey, hudButtonAt, hudKey, startButtonAt, startKey } from './hud.js';
import { LANTERN, kindForKey, toggleModeAt, towerById } from './tower.js';
import { SPRITES, draw } from './render.js';
import { bestAfterStep, browserStorage, readBest } from './best.js';

const canvas = document.getElementById('board');
canvas.width = COLS * TILE;
canvas.height = HUD_HEIGHT + ROWS * TILE; // the HUD bar, then the whole board below it
const ctx = canvas.getContext('2d');

let state = createGame({ status: 'ready', difficulty: 'normal' }); // the start screen, on normal, until Start, Enter or Space
let hover = null;
let kind = LANTERN; // the kind a click places, named in the HUD from boot: 1 a lantern, 2 a brazier, 3 frost
let selected = null; // the id of the tower the card shows, chosen by a click on it
const storage = browserStorage(); // undefined outside a browser or where it is refused, read as empty
let best = readBest(storage); // the best wave any run has reached, shown on the start screen

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

// On the start screen, a click on Start begins wave 1 and a click on a difficulty button
// chooses that difficulty; anywhere else does nothing.
// Once the round is over, a click starts a fresh one, back on the start screen, rather than
// placing a lantern.
// A click on a HUD button toggles it; anywhere else on the bar does nothing.
// A click on the selected tower's Upgrade or Sell button does what U or S does, before the board,
// so it never lands on the cell beneath; Sell clears the selection.
// On the board, a click on a placed tower selects it for its card; anywhere else places a tower
// and clears the selection.
canvas.addEventListener('click', (event) => {
  if (state.status === 'ready') {
    const { x, y } = pointAt(event);
    if (startButtonAt(x, y)) {
      start(state);
    } else {
      const choice = difficultyButtonAt(x, y);
      if (choice) state = chooseDifficulty(state, choice);
    }
    return;
  }
  if (state.status === 'won' || state.status === 'lost') {
    state = restart(state);
    selected = null;
    return;
  }
  const { x, y } = pointAt(event);
  const button = hudButtonAt(x, y);
  if (button) {
    TOGGLES[button](state);
    return;
  }
  const press = selected === null ? null : cardButtonAt(towerById(state, selected), x, y);
  if (press === 'upgrade') {
    upgradeTower(state, selected);
    return;
  }
  if (press === 'sell') {
    sellTower(state, selected);
    selected = null;
    return;
  }
  const cell = boardCellAt(x, y);
  if (cell) selected = clickCell(state, cell.col, cell.row, kind);
});

// A right-click switches the tower under the cursor between nearest and first;
// the browser's own menu never opens over the board.
canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  const cell = cellAt(event);
  if (cell) toggleModeAt(state, cell.col, cell.row);
});

// 1, 2 and 3 choose lantern, brazier and frost; while the round is playing, P pauses, F changes
// speed, U upgrades the selected tower and S sells it and clears the selection (paused or not),
// once per press. Escape clears the selection.
// On the start screen, E, N or H chooses easy, normal or hard, and Enter or Space begins wave 1,
// once per press.
window.addEventListener('keydown', (event) => {
  kind = kindForKey(event.key, kind);
  if (state.status === 'ready' && !event.repeat) {
    const choice = difficultyKey(event.key);
    if (choice) {
      state = chooseDifficulty(state, choice);
      return;
    }
  }
  if (state.status === 'ready' && startKey(event.key) && !event.repeat) {
    start(state);
    return;
  }
  const action = hudKey(event.key);
  if (action === 'deselect') {
    selected = null;
    return;
  }
  if (!action || state.status !== 'playing' || event.repeat) return;
  if (action === 'upgrade') {
    if (selected !== null) upgradeTower(state, selected);
    return;
  }
  if (action === 'sell') {
    if (selected !== null) sellTower(state, selected);
    selected = null;
    return;
  }
  TOGGLES[action](state);
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
  const before = state.status;
  step(state, dt);
  best = bestAfterStep(storage, before, state, best); // saved on the step a run ends, whether or not the player plays again
  if (hover) hover = hoverAt(state, hover.col, hover.row, kind); // turns as gold is spent and earned
  draw(ctx, state, hover, SPRITES, kind, selected, best);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
