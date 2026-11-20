import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { BRAZIER, FROST, LANTERN, MAX_LEVEL, createTower, towerById } from '../src/tower.js';
import { START_GOLD, clickCell, createGame, placeTower, upgradeError, upgradeTower } from '../src/game.js';
import { HUD_HEIGHT, UPGRADE_REFUSALS, hudKey, selectedModel, upgradeLine } from '../src/hud.js';
import { LEVEL_MARK, SPRITES, draw, drawLevelMarks } from '../src/render.js';
import { THEME } from '../src/theme.js';
import { COLS, ROWS, TILE } from '../src/path.js';

// A canvas stand-in that records each call with the fill colour it was made under.
function recordingContext() {
  const calls = [];
  let style = { fillStyle: '', strokeStyle: '' };
  const stack = [];
  const methods = {
    save: () => stack.push({ ...style }),
    restore: () => (style = stack.pop()),
    createRadialGradient: () => ({ addColorStop() {} }),
  };
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name === 'fillStyle' || name === 'strokeStyle') return style[name];
        if (name in target) return target[name];
        return (...args) => {
          calls.push({ name, args, fillStyle: style.fillStyle });
          return methods[name]?.(...args);
        };
      },
      set(target, name, value) {
        if (name === 'fillStyle' || name === 'strokeStyle') style[name] = value;
        else target[name] = value;
        return true;
      },
    },
  );
}

const marks = (ctx) =>
  ctx.calls.filter((c) => c.name === 'fillRect' && c.args[2] === LEVEL_MARK && c.args[3] === LEVEL_MARK && c.fillStyle === THEME.hudAccent);
const texts = (ctx) => ctx.calls.filter((c) => c.name === 'fillText');

// A quiet game, no ghosts, with one lantern at (1, 1), off the path.
function withLantern(gold) {
  const game = createGame({ waveSize: 0, gold });
  assert.equal(placeTower(game, 1, 1, LANTERN), true);
  return game;
}

const stats = (game, id = 1) => {
  const { level, damage, range } = towerById(game, id);
  return [level, damage, range, game.gold];
};

test('every kind declares its upgrade, and the most is level 3', () => {
  assert.equal(MAX_LEVEL, 3);
  assert.deepEqual(
    [LANTERN, BRAZIER, FROST].map((k) => [k.upgradeCost, k.upgradeDamage, k.upgradeRange]),
    [[25, 1, 20], [35, 1, 10], [45, 0.5, 10]],
  );
});

test("a placed tower starts at level 1, carries its kind's name and has its own id", () => {
  const game = createGame({ waveSize: 0 });
  placeTower(game, 1, 1, LANTERN);
  placeTower(game, 3, 1, LANTERN);
  assert.deepEqual(game.towers.map((t) => [t.id, t.level, t.name]), [[1, 1, 'Lantern'], [2, 1, 'Lantern']]);
  assert.equal(towerById(game, 2), game.towers[1]);
  assert.equal(towerById(game, 9), null);
  assert.equal(createTower(1, 1).level, 1);
});

test('upgrading a level-1 lantern with enough gold', () => {
  const game = withLantern(100);
  assert.equal(upgradeTower(game, 1), null);
  assert.deepEqual(stats(game), [
    2,
    LANTERN.damage + LANTERN.upgradeDamage,
    LANTERN.range + LANTERN.upgradeRange,
    100 - LANTERN.cost - LANTERN.upgradeCost,
  ]);
});

test('with too little gold the upgrade is refused with gold and nothing changes', () => {
  const game = withLantern(LANTERN.cost + LANTERN.upgradeCost - 1);
  assert.deepEqual([upgradeError(game, 1), upgradeTower(game, 1)], ['gold', 'gold']);
  assert.deepEqual(stats(game), [1, LANTERN.damage, LANTERN.range, LANTERN.upgradeCost - 1]);
});

test('a level-3 tower refuses with max', () => {
  const game = withLantern(1000);
  assert.deepEqual([upgradeTower(game, 1), upgradeTower(game, 1)], [null, null]);
  const before = stats(game);
  assert.equal(before[0], 3);
  assert.equal(upgradeTower(game, 1), 'max');
  assert.deepEqual(stats(game), before);
  game.gold = 0;
  assert.equal(upgradeTower(game, 1), 'max'); // max is checked before gold
});

test('a kind that declares no upgrade is refused with max at level 1', () => {
  const game = createGame({ waveSize: 0, gold: 1000 });
  const { upgradeCost, upgradeDamage, upgradeRange, ...plain } = LANTERN;
  placeTower(game, 1, 1, plain);
  const before = stats(game);
  assert.equal(before[0], 1);
  assert.equal(upgradeTower(game, 1), 'max');
  assert.deepEqual(stats(game), before);
});

test('a cloned game still upgrades, because a tower holds its upgrade as plain data', () => {
  const game = structuredClone(withLantern(100));
  assert.equal(upgradeTower(game, 1), null);
  assert.deepEqual(stats(game), [
    2,
    LANTERN.damage + LANTERN.upgradeDamage,
    LANTERN.range + LANTERN.upgradeRange,
    100 - LANTERN.cost - LANTERN.upgradeCost,
  ]);
});

test('an id that names no tower is refused with missing', () => {
  const game = createGame();
  assert.equal(upgradeTower(game, 7), 'missing');
  assert.equal(game.gold, START_GOLD);
});

test('each kind rises by its own amounts', () => {
  const frost = createGame({ waveSize: 0, gold: 1000 });
  placeTower(frost, 1, 1, FROST);
  upgradeTower(frost, 1);
  assert.deepEqual([towerById(frost, 1).damage, towerById(frost, 1).range], [FROST.damage + FROST.upgradeDamage, 100]);
  const brazier = createGame({ waveSize: 0, gold: 1000 });
  placeTower(brazier, 1, 1, BRAZIER);
  upgradeTower(brazier, 1);
  assert.deepEqual([towerById(brazier, 1).range, towerById(brazier, 1).splash], [90, BRAZIER.splash]);
});

test('a click on a tower selects it and places nothing; a click elsewhere places and selects nothing', () => {
  const game = withLantern(100);
  assert.equal(clickCell(game, 1, 1, LANTERN), 1);
  assert.deepEqual([game.gold, game.towers.length], [100 - LANTERN.cost, 1]);
  assert.equal(clickCell(game, 3, 1, LANTERN), null);
  assert.deepEqual([game.gold, game.towers.length], [60, 2]);
  assert.equal(clickCell(game, 2, 2, LANTERN), null); // the path
  assert.deepEqual([game.gold, game.towers.length], [60, 2]);
});

// A new game's 50 gold, less a lantern's 20, leaves 30: one upgrade, then 5.
function selectedModels() {
  const game = createGame({ waveSize: 0 });
  placeTower(game, 1, 1, LANTERN);
  const first = selectedModel(game, 1);
  const firstGold = game.gold;
  upgradeTower(game, 1);
  const second = selectedModel(game, 1);
  const secondGold = game.gold;
  game.gold = 1000;
  upgradeTower(game, 1);
  return { game, models: [first, second, selectedModel(game, 1)], golds: [firstGold, secondGold, game.gold] };
}

test('the HUD model of a selected tower', () => {
  const { game, models } = selectedModels();
  const lantern = { name: 'Lantern', maxLevel: 3, mode: 'nearest' };
  assert.deepEqual(models, [
    { ...lantern, level: 1, damage: 1, range: 100, upgradeCost: 25, refusal: null },
    { ...lantern, level: 2, damage: 2, range: 120, upgradeCost: 25, refusal: 'gold' },
    { ...lantern, level: 3, damage: 3, range: 140, upgradeCost: null, refusal: 'max' },
  ]);
  assert.deepEqual([selectedModel(game, 9), selectedModel(game, null)], [null, null]);
});

test('the upgrade line says what U does, or why it cannot', () => {
  const { models, golds } = selectedModels();
  assert.deepEqual(models.map((m, i) => upgradeLine(m, golds[i])), [
    'Press U to upgrade: 25 gold',
    'Needs 25 gold, you hold 5: banish more ghosts',
    'Level 3 is the most: upgrade another tower',
  ]);
  assert.deepEqual(Object.keys(UPGRADE_REFUSALS), ['gold', 'max', 'missing']);
  assert.equal(UPGRADE_REFUSALS.missing, 'No tower to upgrade: click a placed tower first');
});

test('U upgrades and Escape clears the selection', () => {
  assert.deepEqual(['u', 'U', 'Escape'].map(hudKey), ['upgrade', 'upgrade', 'deselect']);
});

test('draw marks a level-1 tower with none and a level-N tower with N marks', () => {
  const counts = [1, 2, 3].map((level) => {
    const ctx = recordingContext();
    drawLevelMarks(ctx, { ...createTower(1, 1), level });
    return marks(ctx).length;
  });
  assert.deepEqual(counts, [0, 2, 3]);

  const tower = createTower(4, 1);
  const ctx = recordingContext();
  drawLevelMarks(ctx, { ...tower, level: 3 });
  const xs = marks(ctx).map((c) => c.args[0]);
  assert.equal(xs[0] + (xs[2] + LEVEL_MARK - xs[0]) / 2, tower.x); // a row centred on the tower
  assert.deepEqual(marks(ctx).map((c) => c.args[1]), Array(3).fill(tower.y + TILE * 0.3));

  const game = withLantern(1000);
  upgradeTower(game, 1);
  upgradeTower(game, 1);
  const drawn = recordingContext();
  draw(drawn, game, null);
  assert.equal(marks(drawn).length, 3);
});

test("draw shows the selected tower's card", () => {
  const game = createGame({ waveSize: 0 });
  placeTower(game, 1, 1, LANTERN);
  const ctx = recordingContext();
  draw(ctx, game, null, SPRITES, null, 1);
  assert.deepEqual(texts(ctx).slice(0, 7).map((c) => [c.args[0], c.fillStyle]), [
    ['Lantern · level 1', THEME.hudAccent],
    ['Range 2.5 tiles · 1 damage · targets nearest', THEME.hudInk],
    ['Press U to upgrade: 25 gold', THEME.hudAccent],
    ['Press S to sell: 10 gold', THEME.hudInk],
    ['Upgrade', THEME.hudInk],
    ['Sell', THEME.hudInk],
    ['Lives', THEME.hudMuted],
  ]);

  upgradeTower(game, 1);
  const short = recordingContext();
  draw(short, game, null, SPRITES, null, 1);
  assert.equal(texts(short)[2].fillStyle, THEME.hudDanger);
  game.gold = 1000;
  upgradeTower(game, 1);
  const most = recordingContext();
  draw(most, game, null, SPRITES, null, 1);
  assert.deepEqual([texts(most)[2].args[0], texts(most)[2].fillStyle], ['Level 3 is the most: upgrade another tower', THEME.hudMuted]);

  const bare = recordingContext();
  const plain = recordingContext();
  draw(bare, game, null, SPRITES, null, null);
  draw(plain, game, null);
  assert.deepEqual(texts(bare).map((c) => c.args[0]), texts(plain).map((c) => c.args[0]));
  assert.equal(texts(bare)[0].args[0], 'Lives');
});

test("the selected tower's card stays on the board", () => {
  const cards = [[0, 0], [COLS - 1, 0], [COLS - 1, ROWS - 1]].map(([col, row]) => {
    const game = createGame({ waveSize: 0, gold: 1000 });
    placeTower(game, col, row, LANTERN);
    const ctx = recordingContext();
    draw(ctx, game, null, SPRITES, null, 1);
    const [x, y, width, height] = ctx.calls.find((c) => c.name === 'roundRect' && c.fillStyle === THEME.hudBg).args;
    return [x >= 0, x + width <= COLS * TILE, y >= 0, y + height <= ROWS * TILE];
  });
  assert.deepEqual(cards, Array(3).fill([true, true, true, true]));
});

// src/main.js against stand-ins for the DOM, as test/pause-speed.test.js boots it: the canvas
// keeps its handlers, the window its keydown, and each frame is run by hand.
const savedGlobals = { document: globalThis.document, window: globalThis.window, requestAnimationFrame: globalThis.requestAnimationFrame };
after(() => Object.assign(globalThis, savedGlobals));

let boots = 0;
async function bootMain() {
  const handlers = {};
  const keys = {};
  const frames = [];
  let ctx = recordingContext();
  const canvas = {
    addEventListener: (type, handler) => (handlers[type] = handler),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: canvas.width, height: canvas.height }),
    getContext: () => new Proxy({}, { get: (t, name) => ctx[name], set: (t, name, value) => ((ctx[name] = value), true) }),
  };
  globalThis.document = { getElementById: () => canvas };
  globalThis.window = { addEventListener: (type, handler) => (keys[type] = handler) };
  globalThis.requestAnimationFrame = (frame) => frames.push(frame);
  // src/main.js picks the opening round's path with Math.random; 0 picks path 1, the path these
  // clicks were written on. The real Math.random is back once main.js has booted.
  const savedRandom = Math.random;
  Math.random = () => 0;
  try {
    await import(`../src/main.js?upgrade=${++boots}`);
  } finally {
    Math.random = savedRandom;
  }
  keys.keydown({ key: 'Enter', repeat: false }); // past the start screen, into the round
  return {
    click: (col, row) => handlers.click({ clientX: col * TILE + TILE / 2, clientY: HUD_HEIGHT + row * TILE + TILE / 2 }),
    key: (key, repeat = false) => keys.keydown({ key, repeat }),
    // Run the next queued frame and return the texts it drew.
    frame() {
      ctx = recordingContext();
      frames.shift()(performance.now());
      return texts(ctx).map((c) => c.args[0]);
    },
  };
}

test('in the browser, a click selects a tower, U upgrades it once per press and Escape clears it', async () => {
  const game = await bootMain();
  game.click(1, 1); // places a lantern: 30 gold left, nothing selected
  assert.equal(game.frame()[0], 'Lives');
  game.key('u');
  game.click(1, 1); // selects it
  assert.deepEqual(game.frame().slice(0, 3), ['Lantern · level 1', 'Range 2.5 tiles · 1 damage · targets nearest', 'Press U to upgrade: 25 gold']);
  game.key('u', true); // a held key's repeat does nothing
  assert.equal(game.frame()[0], 'Lantern · level 1');
  game.key('U');
  assert.deepEqual(game.frame().slice(0, 3), ['Lantern · level 2', 'Range 3 tiles · 2 damage · targets nearest', 'Needs 25 gold, you hold 5: banish more ghosts']);
  game.key('Escape');
  assert.equal(game.frame()[0], 'Lives');
});
