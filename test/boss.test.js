import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_LIVES, WAVES } from '../src/waves.js';
import { START_LIVES, createGame, placeTower, spawnBoss, spawnEnemy, step } from '../src/game.js';
import { ENEMY_BOUNTY, damageEnemy } from '../src/enemy.js';
import { BOSS_WARNING, HUD_HEIGHT, bossWarning } from '../src/hud.js';
import { BOSS_SCALE, GHOST_SCALE, draw, drawGhost } from '../src/render.js';
import { THEME } from '../src/theme.js';
import { LANTERN } from '../src/tower.js';
import { WAYPOINTS, pathLength } from '../src/path.js';

// Step a game by half a second until `done` holds, at most `limit` times.
function stepUntil(game, done, limit = 20000) {
  for (let i = 0; i < limit && !done(game); i++) step(game, 0.5);
}

// A game with lives to spare, stepped until wave `n` has started.
function atWave(n, options = {}) {
  const game = createGame({ lives: 1000, ...options });
  stepUntil(game, (g) => g.wave === n);
  return game;
}

// A game that sends nothing on its own, put in wave `n`.
function quietAt(n, options = {}) {
  const game = createGame({ waveSize: 0, ...options });
  game.wave = n;
  return game;
}

// A canvas stand-in that records each call with the fill it was made under and the vertical
// offset translate has carried it to.
function recordingContext() {
  const calls = [];
  let state = { fillStyle: '', strokeStyle: '', dy: 0 };
  const stack = [];
  const methods = {
    save: () => stack.push({ ...state }),
    restore: () => (state = stack.pop()),
    translate: (x, y) => (state.dy += y),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name === 'fillStyle' || name === 'strokeStyle') return state[name];
        if (name in target) return target[name];
        return (...args) => {
          calls.push({ name, args, fillStyle: state.fillStyle, dy: state.dy });
          return methods[name]?.(...args);
        };
      },
      set(target, name, value) {
        if (name === 'fillStyle' || name === 'strokeStyle') state[name] = value;
        else target[name] = value;
        return true;
      },
    },
  );
}

// Every ghost a game spawns until `done` holds, by id, as whether it is a boss.
function spawnsUntil(game, done) {
  const seen = new Map();
  stepUntil(game, (g) => {
    for (const e of g.enemies) seen.set(e.id, e.boss === true);
    return done(g);
  });
  return seen;
}

const tally = (seen) => {
  const flags = [...seen.values()];
  return [flags.filter((b) => b === false).length, flags.filter((b) => b === true).length];
};

test('waves 5 and 10 each declare exactly one boss, and waves 1 to 4 none', () => {
  assert.deepEqual(
    WAVES.map((w) => w.boss !== undefined),
    [false, false, false, false, true, false, false, false, false, true],
  );
  for (const wave of [WAVES[4], WAVES[9]]) {
    const { boss } = wave;
    assert.deepEqual(Object.keys(boss).sort(), ['bounty', 'health', 'speed']);
    assert.equal(boss.speed < wave.speed, true);
    assert.equal(boss.health >= 5 * wave.health, true);
    assert.equal(boss.bounty >= 3 * ENEMY_BOUNTY, true);
  }
});

test('wave 5 spawns its count of ghosts and then exactly one boss, as does wave 10', () => {
  const five = atWave(5);
  const seen = spawnsUntil(five, (g) => g.wave === 6);
  assert.deepEqual(tally(seen), [WAVES[4].count, 1]);
  assert.equal([...seen.values()].at(-1), true);

  const ten = atWave(10);
  const last = spawnsUntil(ten, (g) => g.status !== 'playing');
  assert.equal(ten.status, 'won');
  assert.deepEqual(tally(last), [WAVES[9].count, 1]);
  assert.equal([...last.values()].at(-1), true);

  const early = spawnsUntil(createGame({ lives: 1000 }), (g) => g.wave === 5);
  const firstFour = WAVES.slice(0, 4).reduce((sum, w) => sum + w.count, 0);
  assert.deepEqual(tally(early), [firstFour, 0]);
});

test('a boss wave cleared of its ghosts waits for its boss before it ends', () => {
  const game = atWave(5);
  while (game.spawner.spawned < game.spawner.count) step(game, 0.01);
  game.enemies = [];
  step(game, 0.01);
  assert.deepEqual([game.wave, bossWarning(game)], [5, BOSS_WARNING]);
  stepUntil(game, (g) => g.enemies.some((e) => e.boss === true));
  assert.equal(game.wave, 5);
});

test('a boss has the health and speed its entry declares and takes that many hits', () => {
  const game = atWave(5);
  const b = WAVES[4].boss;
  const boss = spawnBoss(game);
  assert.deepEqual([boss.health, boss.maxHealth, boss.speed, boss.bounty, boss.boss], [b.health, b.health, b.speed, b.bounty, true]);
  const hits = Array.from({ length: b.health }, () => damageEnemy(boss, 1));
  assert.deepEqual(hits, [...Array(b.health - 1).fill(false), true]);
});

test('banishing a boss adds its declared gold', () => {
  const game = quietAt(5, { gold: LANTERN.cost });
  assert.equal(placeTower(game, 0, 1, LANTERN), true);
  const boss = spawnBoss(game);
  boss.health = 1;
  step(game, 0.01);
  assert.deepEqual([game.gold, game.kills], [WAVES[4].boss.bounty, 1]);
});

test('a boss reaching the end costs three lives, and an ordinary ghost still one', () => {
  const b = WAVES[4].boss;
  const game = quietAt(5);
  spawnBoss(game);
  step(game, pathLength(WAYPOINTS) / b.speed + 0.1);
  assert.deepEqual([BOSS_LIVES, game.lives, game.enemies.length], [3, START_LIVES - BOSS_LIVES, 0]);

  const both = quietAt(5);
  spawnBoss(both);
  spawnEnemy(both);
  step(both, pathLength(WAYPOINTS) / b.speed + 0.1);
  assert.equal(both.lives, START_LIVES - (BOSS_LIVES + 1));
});

test('the HUD announces a boss wave until its boss appears', () => {
  assert.equal(bossWarning(createGame()), null);
  const game = atWave(5);
  assert.equal(BOSS_WARNING, 'Boss wave: a great ghost follows this wave');
  assert.equal(bossWarning(game), BOSS_WARNING);
  stepUntil(game, (g) => g.enemies.some((e) => e.boss === true));
  assert.equal(bossWarning(game), null);
  stepUntil(game, (g) => g.wave === 6);
  assert.equal(bossWarning(game), null);
});

test('draw shows the banner in a boss wave and not otherwise', () => {
  const ctx = recordingContext();
  draw(ctx, atWave(5), null);
  const banner = ctx.calls.filter((c) => c.name === 'fillText' && c.args[0] === BOSS_WARNING);
  assert.equal(banner.length, 1);
  assert.equal(banner[0].fillStyle, THEME.hudAccent);
  assert.equal(banner[0].args[2] + banner[0].dy > HUD_HEIGHT, true);

  const plain = recordingContext();
  draw(plain, createGame(), null);
  assert.equal(plain.calls.filter((c) => c.name === 'fillText' && c.args[0] === BOSS_WARNING).length, 0);
});

test('a boss is drawn larger, its health bar as much higher', () => {
  const at = { x: 100, y: 100, health: 1, maxHealth: 1 };
  const ghost = recordingContext();
  drawGhost(ghost, at);
  const boss = recordingContext();
  drawGhost(boss, { ...at, boss: true });
  const scaleOf = (ctx) => ctx.calls.find((c) => c.name === 'scale').args;
  const barTop = (ctx) => ctx.calls.filter((c) => c.name === 'fillRect')[0].args[1];
  assert.equal(BOSS_SCALE, 1.5);
  assert.deepEqual(scaleOf(ghost), [GHOST_SCALE, GHOST_SCALE]);
  assert.deepEqual(scaleOf(boss), [GHOST_SCALE * BOSS_SCALE, GHOST_SCALE * BOSS_SCALE]);
  assert.equal(at.y - barTop(boss), (at.y - barTop(ghost)) * BOSS_SCALE);
});
