import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as render from '../src/render.js';
import { THEME } from '../src/theme.js';
import { createGame, placeTower, spawnEnemy } from '../src/game.js';
import { damageEnemy } from '../src/enemy.js';
import { createTower } from '../src/tower.js';

const { draw, drawBeam, drawGhost, drawLantern, drawPath } = render;

const STYLES = ['fillStyle', 'strokeStyle', 'shadowColor', 'shadowBlur', 'lineWidth'];
const COLOURS = ['fillStyle', 'strokeStyle', 'shadowColor'];

// A canvas stand-in. Every method call is recorded with the styles as they stand at the call,
// every colour assigned is recorded, gradients record their stops, and save/restore keep a
// stack of styles as a canvas does.
function recordingContext() {
  const calls = [];
  const colours = [];
  const styles = { fillStyle: '', strokeStyle: '', shadowColor: '', shadowBlur: 0, lineWidth: 1 };
  const stack = [];
  const gradient = () => ({
    gradient: true,
    addColorStop(offset, colour) {
      colours.push(colour);
    },
  });
  const methods = {
    save: () => stack.push({ ...styles }),
    restore: () => Object.assign(styles, stack.pop()),
    createRadialGradient: gradient,
    createLinearGradient: gradient,
  };
  const ctx = new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name === 'colours') return colours;
        if (name in styles) return styles[name];
        if (name in target) return target[name];
        return (...args) => {
          calls.push({ name, args, ...styles });
          return methods[name]?.(...args);
        };
      },
      set(target, name, value) {
        if (COLOURS.includes(name) && !value?.gradient) colours.push(value);
        if (STYLES.includes(name)) styles[name] = value;
        else target[name] = value;
        return true;
      },
    },
  );
  return ctx;
}

const named = (ctx, ...names) => ctx.calls.filter((c) => names.includes(c.name));
const CURVES = ['arc', 'ellipse', 'quadraticCurveTo', 'bezierCurveTo', 'roundRect'];
const texts = (ctx) => named(ctx, 'fillText').map((c) => c.args[0]);

function busyGame() {
  const game = createGame();
  placeTower(game, 1, 1);
  placeTower(game, 2, 1);
  const ghosts = [spawnEnemy(game), spawnEnemy(game), spawnEnemy(game)];
  damageEnemy(ghosts[1], 1);
  damageEnemy(ghosts[2], 2);
  game.shots.push({ from: { x: 60, y: 60 }, to: { x: 100, y: 100 }, ttl: 0.1 });
  return game;
}

test('src/render.js holds no colour literal and exports no PALETTE', () => {
  const source = readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
  assert.deepEqual(source.match(/#[0-9a-f]{3,8}\b|rgba?\(/gi), null);
  assert.deepEqual(
    Object.keys(render).filter((name) => name === 'PALETTE'),
    [],
  );
});

test('every colour draw paints with is a THEME colour', () => {
  const ctx = recordingContext();
  const game = busyGame();
  draw(ctx, game, { col: 0, row: 0, ok: true });
  draw(ctx, game, { col: 0, row: 2, ok: false });
  draw(ctx, { ...game, status: 'lost' }, null);
  draw(ctx, { ...game, status: 'won' }, null);
  const theme = new Set(Object.values(THEME));
  assert.deepEqual(
    ctx.colours.filter((colour) => !theme.has(colour)),
    [],
  );
  assert.equal(ctx.colours.length > 20, true);
});

test('drawLantern draws a radial light pool and a curved body', () => {
  const ctx = recordingContext();
  drawLantern(ctx, createTower(1, 1));
  assert.equal(named(ctx, 'createRadialGradient').length, 1);
  assert.equal(named(ctx, ...CURVES).length > 0, true);
});

test('every light pool is drawn before the hover cell and before any lantern body', () => {
  const ctx = recordingContext();
  const game = createGame({ waveSize: 0 });
  placeTower(game, 1, 1);
  placeTower(game, 2, 1);
  draw(ctx, game, { col: 3, row: 1, ok: true });
  const at = (call) => ctx.calls.indexOf(call);
  const pools = named(ctx, 'createRadialGradient').map(at);
  assert.equal(pools.length, 2);
  const lastPool = Math.max(...pools);
  const hover = ctx.calls.findIndex((c) => c.name === 'fillRect' && c.fillStyle === THEME.hover);
  const bodies = named(ctx, ...CURVES).map(at);
  assert.equal(hover > lastPool, true);
  assert.equal(bodies.length > 0, true);
  assert.equal(Math.min(...bodies) > lastPool, true);
});

test('drawGhost draws a curved body, two eyes, and a health bar that shortens with health', () => {
  const game = createGame({ waveSize: 0 });
  const ghost = spawnEnemy(game);
  const barFill = (enemy) => {
    const ctx = recordingContext();
    drawGhost(ctx, enemy);
    const bar = named(ctx, 'fillRect').filter((c) => c.args[3] === 4);
    return { ctx, width: bar[1].args[2] };
  };

  const full = barFill(ghost);
  assert.equal(named(full.ctx, ...CURVES).length > 0, true);
  assert.equal(named(full.ctx, 'fill').filter((c) => c.fillStyle === THEME.ghostEyes).length, 2);
  assert.equal(full.width, 26);

  damageEnemy(ghost, 1);
  assert.equal(barFill(ghost).width < 26, true);
  assert.equal(barFill({ id: 9, x: 50, y: 50 }).width, 26);
});

test('drawBeam strokes from the lantern to its target with a glow, and leaves no glow behind', () => {
  const ctx = recordingContext();
  drawBeam(ctx, { x: 10, y: 20 }, { x: 90, y: 80 });
  assert.deepEqual(named(ctx, 'moveTo')[0].args, [10, 20]);
  assert.deepEqual(named(ctx, 'lineTo')[0].args, [90, 80]);
  assert.equal(named(ctx, 'stroke').some((c) => c.shadowBlur > 0), true);
  assert.equal(ctx.shadowBlur, 0);
});

test('drawPath strokes stones inside an edge over alternating grass tiles', () => {
  const ctx = recordingContext();
  drawPath(ctx, createGame());
  const strokes = named(ctx, 'stroke').map((c) => c.strokeStyle);
  assert.equal(strokes.filter((colour) => colour === THEME.pathEdge).length, 1);
  assert.equal(strokes.filter((colour) => colour === THEME.pathStone).length, 1);
  const grass = named(ctx, 'fillRect').map((c) => c.fillStyle);
  assert.deepEqual(grass.slice(0, 3), [THEME.grassA, THEME.grassB, THEME.grassA]);
});

test('draw on a fresh game draws the path once and no ghost', () => {
  const counts = { drawPath: 0, drawGhost: 0 };
  const sprites = {
    ...render.SPRITES,
    drawPath: () => (counts.drawPath += 1),
    drawGhost: () => (counts.drawGhost += 1),
  };
  draw(recordingContext(), createGame(), null, sprites);
  assert.deepEqual(counts, { drawPath: 1, drawGhost: 0 });
});

test('a finished round draws its end card, and a round in play draws none', () => {
  const lost = recordingContext();
  draw(lost, { ...createGame(), status: 'lost' }, null);
  assert.deepEqual(texts(lost).slice(1), ['The ghosts got through', 'Click to play again']);

  const won = recordingContext();
  draw(won, { ...createGame(), status: 'won' }, null);
  assert.deepEqual(texts(won).slice(1), ['The path is safe', 'Click to play again']);

  const playing = recordingContext();
  draw(playing, createGame(), null);
  assert.deepEqual(texts(playing), ['Lives: 10']);
});
