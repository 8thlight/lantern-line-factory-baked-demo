import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WAVES } from '../src/waves.js';
import { BOSS_LIVES, createGame, leakEnemies, spawnBoss, spawnEnemy, step, waveSpawner } from '../src/game.js';
import { ENEMY_BOUNTY, damageEnemy } from '../src/enemy.js';
import { WAYPOINTS, pathLength } from '../src/path.js';
import { createTower } from '../src/tower.js';
import { hudModel, HUD_HEIGHT } from '../src/hud.js';
import { BOSS_SCALE, HUD_BOSS_X, draw, drawGhost } from '../src/render.js';
import { THEME } from '../src/theme.js';

const BOSS_WAVES = [5, 10];

// A game started at wave `n`, its spawner that wave's.
function atWave(n, options = {}) {
  const game = createGame({ lives: 1000, ...options });
  game.wave = n;
  game.spawner = waveSpawner(game, n);
  return game;
}

// Every ghost wave `n` spawns, in order, as [boss, health, speed, bounty] when it first appears.
function spawnedIn(n) {
  const game = atWave(n);
  const seen = new Map();
  for (let i = 0; i < 20000 && game.wave === n && game.status === 'playing'; i++) {
    step(game, 0.25);
    for (const e of game.enemies) if (!seen.has(e.id)) seen.set(e.id, [e.boss === true, e.health, e.speed, e.bounty]);
  }
  return [...seen.values()];
}

// A canvas stand-in that records each call with the fill style it was made under.
function recordingContext() {
  const calls = [];
  let fillStyle = '';
  return new Proxy(
    {},
    {
      get(target, name) {
        if (name === 'calls') return calls;
        if (name === 'fillStyle') return fillStyle;
        if (name in target) return target[name];
        if (name === 'createRadialGradient' || name === 'createLinearGradient') return () => ({ addColorStop() {} });
        return (...args) => calls.push({ name, args, fillStyle });
      },
      set(target, name, value) {
        if (name === 'fillStyle') fillStyle = value;
        else target[name] = value;
        return true;
      },
    },
  );
}

const texts = (ctx) => ctx.calls.filter((c) => c.name === 'fillText');

test('waves 5 and 10 declare one boss each, and waves 1 to 4 none', () => {
  assert.deepEqual(
    WAVES.map((w) => w.boss !== undefined),
    [false, false, false, false, true, false, false, false, false, true],
  );
  for (const n of BOSS_WAVES) assert.deepEqual(Object.keys(WAVES[n - 1].boss).sort(), ['bounty', 'health', 'speed']);
});

test('a boss is many times tougher, slower, and pays several times a ghost', () => {
  for (const n of BOSS_WAVES) {
    const entry = WAVES[n - 1];
    const { boss } = entry;
    assert.deepEqual(
      [boss.health >= 5 * entry.health, boss.speed < entry.speed, boss.bounty >= 3 * ENEMY_BOUNTY],
      [true, true, true],
    );
  }
});

test('waves 5 and 10 each spawn exactly one boss, last, and waves 1 to 4 none', () => {
  for (const n of [1, 2, 3, 4]) {
    const ghosts = spawnedIn(n);
    assert.deepEqual(
      [ghosts.length, ghosts.filter(([boss]) => boss).length],
      [WAVES[n - 1].count, 0],
    );
  }
  for (const n of BOSS_WAVES) {
    const ghosts = spawnedIn(n);
    assert.deepEqual(
      ghosts.map(([boss]) => boss),
      [...Array(WAVES[n - 1].count).fill(false), true],
    );
  }
});

test('the boss has its entry\'s health and speed', () => {
  for (const n of BOSS_WAVES) {
    const b = WAVES[n - 1].boss;
    assert.deepEqual(spawnedIn(n).at(-1), [true, b.health, b.speed, b.bounty]);
  }
  const b = WAVES[4].boss;
  const boss = spawnBoss(atWave(5));
  assert.deepEqual(
    [boss.health, boss.maxHealth, boss.speed, boss.bounty, boss.boss],
    [b.health, b.health, b.speed, b.bounty, true],
  );
});

test('a boss takes its health in hits of 1 to banish', () => {
  const b = WAVES[4].boss;
  const boss = spawnBoss(atWave(5));
  const hits = Array.from({ length: b.health - 1 }, () => damageEnemy(boss, 1));
  assert.deepEqual(hits, Array(b.health - 1).fill(false));
  assert.equal(damageEnemy(boss, 1), true);
});

test('banishing a boss pays its declared gold', () => {
  const game = atWave(5, { waveSize: 0, gold: 0 });
  const boss = spawnBoss(game);
  boss.health = 1;
  game.towers.push({ id: game.nextTowerId++, ...createTower(1, 1) });
  for (let i = 0; i < 64 && game.enemies.length > 0; i++) step(game, 1 / 16);
  assert.deepEqual([game.gold, game.kills], [WAVES[4].boss.bounty, 1]);
});

test('a boss reaching the end takes three lives, a ghost one', () => {
  assert.equal(BOSS_LIVES, 3);
  const game = atWave(5, { waveSize: 0, lives: 10 });
  spawnBoss(game);
  spawnEnemy(game);
  step(game, pathLength(WAYPOINTS) / WAVES[4].boss.speed + 0.1);
  assert.deepEqual([game.lives, game.enemies.length], [6, 0]);
});

test('leakEnemies returns the lives its leaks cost: three for a boss, one for a ghost', () => {
  const game = atWave(5, { waveSize: 0, lives: 10 });
  for (const e of [spawnBoss(game), spawnEnemy(game)]) e.reachedEnd = true;
  assert.deepEqual([leakEnemies(game), game.lives], [BOSS_LIVES + 1, 10 - BOSS_LIVES - 1]);
});

test('an explicit waveSize counts the plain ghosts, and a boss wave sends its boss after them', () => {
  const sent = (n) => {
    const { count, boss } = atWave(n, { waveSize: 2 }).spawner;
    return [count, boss];
  };
  assert.deepEqual([sent(4), sent(5), sent(10)], [[2, null], [3, WAVES[4].boss], [3, WAVES[9].boss]]);
});

test('a boss that takes the last lives loses the round, and lives stop at 0', () => {
  const game = atWave(5, { waveSize: 0, lives: 2 });
  spawnBoss(game);
  step(game, pathLength(WAYPOINTS) / WAVES[4].boss.speed + 0.1);
  assert.deepEqual([game.lives, game.status], [0, 'lost']);
});

test('the HUD model flags a boss wave', () => {
  assert.deepEqual(
    [createGame(), atWave(4), atWave(5), atWave(10)].map((g) => hudModel(g).bossWave),
    [false, false, true, true],
  );
});

test('the bar announces a boss wave', () => {
  const ctx = recordingContext();
  draw(ctx, atWave(5), null);
  const bar = texts(ctx).filter((c) => c.args[2] === HUD_HEIGHT / 2);
  assert.deepEqual(bar.slice(-5).map((c) => c.args[0]), ['Wave', '5 / 10', 'Boss wave', 'Pause', '1x']);
  const announced = bar.find((c) => c.args[0] === 'Boss wave');
  assert.deepEqual([announced.fillStyle, announced.args[1]], [THEME.hudDanger, HUD_BOSS_X]);

  const plain = recordingContext();
  draw(plain, atWave(4), null);
  assert.deepEqual(texts(plain).filter((c) => c.args[0] === 'Boss wave'), []);
});

test('a boss is drawn larger than a ghost', () => {
  const firstScale = (enemy) => {
    const ctx = recordingContext();
    drawGhost(ctx, enemy);
    return ctx.calls.find((c) => c.name === 'scale').args;
  };
  const ghost = firstScale({ x: 100, y: 100 });
  const boss = firstScale({ x: 100, y: 100, boss: true });
  assert.deepEqual(boss, ghost.map((s) => s * BOSS_SCALE));
  assert.equal(BOSS_SCALE > 1, true);
});

test("a boss's health bar floats above its larger head", () => {
  const barTop = (enemy) => {
    const ctx = recordingContext();
    drawGhost(ctx, enemy);
    return ctx.calls.find((c) => c.name === 'fillRect' && c.fillStyle === THEME.healthTrack).args[1];
  };
  const above = (top) => 100 - top;
  assert.equal(above(barTop({ x: 100, y: 100, boss: true })), above(barTop({ x: 100, y: 100 })) * BOSS_SCALE);
});
