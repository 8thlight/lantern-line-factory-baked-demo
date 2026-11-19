import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame, placeTower, spawnEnemy } from '../src/game.js';
import { THEME } from '../src/theme.js';
import { draw, drawBeam, drawGhost, drawLantern, drawPath } from '../src/render.js';

const COLOUR_PROPS = new Set(['fillStyle', 'strokeStyle', 'shadowColor']);
const CURVES = new Set(['arc', 'ellipse', 'bezierCurveTo', 'quadraticCurveTo', 'roundRect']);

// A 2D context that records every call and every property set. Each call also
// records the fillStyle in force when it was made.
function fakeContext() {
  const calls = [];
  const sets = [];
  const stops = [];
  const props = { fillStyle: '', strokeStyle: '', shadowColor: '', shadowBlur: 0, lineWidth: 1 };
  const gradient = () => ({ addColorStop: (offset, colour) => stops.push(colour) });
  const ctx = new Proxy(props, {
    get(target, name) {
      if (name in target) return target[name];
      if (name === 'createRadialGradient' || name === 'createLinearGradient') {
        return (...args) => {
          calls.push({ name, args, fillStyle: target.fillStyle });
          return gradient();
        };
      }
      if (name === 'measureText') return (text) => ({ width: String(text).length * 8 });
      return (...args) => {
        calls.push({ name, args, fillStyle: target.fillStyle, shadowBlur: target.shadowBlur });
      };
    },
    set(target, name, value) {
      target[name] = value;
      sets.push({ name, value });
      return true;
    },
  });
  return { ctx, calls, sets, stops };
}

const named = (calls, name) => calls.filter((c) => c.name === name);
const HEALTH = new Set([THEME.healthHigh, THEME.healthMid, THEME.healthLow]);
const barWidth = (calls) => named(calls, 'fillRect').find((c) => HEALTH.has(c.fillStyle)).args[2];

function busyGame(status) {
  const game = createGame();
  game.spawnTimer = Infinity;
  placeTower(game, 1, 1);
  placeTower(game, 3, 4);
  spawnEnemy(game);
  spawnEnemy(game).health = 1;
  game.shots.push({ from: { x: 60, y: 60 }, to: { x: 100, y: 100 }, ttl: 0.1 });
  game.status = status;
  return game;
}

test('render.js has no hex colour literal and takes every colour from theme.js', () => {
  const source = readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b/);
  assert.doesNotMatch(source, /rgba?\(/);
  assert.match(source, /from '\.\/theme\.js'/);

  const palette = new Set(Object.values(THEME));
  for (const [status, hover] of [
    ['playing', { col: 2, row: 0, ok: true }],
    ['playing', { col: 0, row: 2, ok: false }],
    ['lost', null],
    ['won', null],
  ]) {
    const { ctx, sets, stops, calls } = fakeContext();
    draw(ctx, busyGame(status), hover);
    const colours = sets.filter((s) => COLOUR_PROPS.has(s.name) && typeof s.value === 'string').map((s) => s.value);
    assert.ok(colours.length > 0);
    assert.ok(stops.length > 0);
    for (const colour of [...colours, ...stops]) assert.ok(palette.has(colour), `${colour} is not a theme token`);
    assert.ok(calls.length > 0);
  }
});

test('the lost and won cards say how the round ended and how to play again', () => {
  const texts = (status) => {
    const { ctx, calls } = fakeContext();
    draw(ctx, busyGame(status), null);
    return named(calls, 'fillText').map((c) => c.args[0]);
  };
  assert.ok(texts('lost').includes('The ghosts got through'));
  assert.ok(texts('lost').includes('Click to play again'));
  assert.ok(texts('won').includes('The path is safe'));
  assert.ok(texts('won').includes('Click to play again'));
  assert.deepEqual(texts('playing').filter((t) => t === 'Click to play again'), []);
  assert.ok(texts('playing').length > 0);
});

test('drawLantern draws a radial-gradient pool and an arc or curve body', () => {
  const { ctx, calls } = fakeContext();
  drawLantern(ctx, { x: 60, y: 60 });
  assert.equal(named(calls, 'createRadialGradient').length >= 1, true);
  assert.ok(calls.some((c) => CURVES.has(c.name)));
});

test('drawGhost draws a curved body, two eyes and a health bar that shortens as health falls', () => {
  const full = fakeContext();
  drawGhost(full.ctx, { x: 100, y: 100, health: 3, maxHealth: 3 });
  assert.ok(full.calls.some((c) => ['arc', 'bezierCurveTo', 'quadraticCurveTo'].includes(c.name)));
  const eyes = full.calls.filter((c) => (c.name === 'ellipse' || c.name === 'arc') && c.fillStyle === THEME.ghostEye);
  assert.equal(eyes.length, 2);

  const hurt = fakeContext();
  drawGhost(hurt.ctx, { x: 100, y: 100, health: 1, maxHealth: 3 });
  assert.ok(barWidth(hurt.calls) < barWidth(full.calls));
  assert.ok(barWidth(hurt.calls) > 0);

  const bare = fakeContext();
  drawGhost(bare.ctx, { x: 100, y: 100 });
  assert.equal(barWidth(bare.calls), barWidth(full.calls));
});

test('drawBeam strokes lantern centre to target centre with a glow', () => {
  const { ctx, calls } = fakeContext();
  drawBeam(ctx, { from: { x: 60, y: 60 }, to: { x: 140, y: 100 } });
  assert.ok(named(calls, 'moveTo').some((c) => c.args[0] === 60 && c.args[1] === 60));
  assert.ok(named(calls, 'lineTo').some((c) => c.args[0] === 140 && c.args[1] === 100));
  const strokes = named(calls, 'stroke');
  assert.ok(strokes.length > 0);
  assert.ok(strokes[0].shadowBlur > 0);
});

test('draw on a fresh game calls drawPath once and draws no ghost before the first spawn', () => {
  const counts = { drawPath: 0, drawGhost: 0, drawLantern: 0, drawBeam: 0 };
  const sprites = Object.fromEntries(Object.keys(counts).map((name) => [name, () => (counts[name] += 1)]));
  const game = createGame();
  const { ctx } = fakeContext();
  draw(ctx, game, null, sprites);
  assert.equal(counts.drawPath, 1);
  assert.equal(counts.drawGhost, 0);

  spawnEnemy(game);
  draw(ctx, game, null, sprites);
  assert.equal(counts.drawPath, 2);
  assert.equal(counts.drawGhost, 1);
});

test('drawPath draws the path as stones with an edge', () => {
  const { ctx, sets, calls } = fakeContext();
  drawPath(ctx, createGame().path);
  const strokes = sets.filter((s) => s.name === 'strokeStyle').map((s) => s.value);
  assert.ok(strokes.includes(THEME.pathEdge));
  assert.ok(sets.some((s) => s.name === 'fillStyle' && s.value === THEME.pathStone));
  assert.ok(calls.length > 0);
});
