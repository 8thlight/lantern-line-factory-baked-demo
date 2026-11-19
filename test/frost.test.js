import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BRAZIER, FROST, LANTERN, createTower, kindForKey } from '../src/tower.js';
import { ENEMY_HEALTH, ENEMY_SPEED, advanceEnemy, createEnemy, slowEnemy } from '../src/enemy.js';
import { createGame, placeTower, placementError, spawnEnemy, step } from '../src/game.js';
import { WAYPOINTS } from '../src/path.js';
import { HUD_HEIGHT, PAUSE_BUTTON } from '../src/hud.js';
import { HUD_KIND, SPRITES, draw, drawGhost } from '../src/render.js';
import { THEME } from '../src/theme.js';

// Ticks of 1/16 s and a slowFor of 2 keep every distance below exact in floating point.
const TICK = 1 / 16;

// A quiet game, its waves holding no ghosts, with a tower of `kind` at (1, 1), centre (60, 60),
// beside the path's first stretch on row 2 (y = 100), and one ghost spawned at (20, 100).
function frostBeside(kind) {
  const game = createGame({ waveSize: 0 });
  if (kind) assert.equal(placeTower(game, 1, 1, kind), true);
  const ghost = spawnEnemy(game);
  return { game, ghost };
}

// A context that records each call with the fillStyle and font set when it was made.
function recordingContext() {
  const calls = [];
  const ctx = new Proxy(
    {},
    {
      get: (target, name) => (name in target ? target[name] : (...args) => calls.push({ name, args, fillStyle: target.fillStyle, font: target.font })),
    },
  );
  return { ctx, calls };
}

const fills = (calls) => calls.filter((c) => c.name === 'fill' || c.name === 'fillRect').map((c) => c.fillStyle);

test('FROST is the third kind: 40 gold, less damage than the lantern, a 0.5 slow held at least a second', () => {
  assert.equal(FROST.cost, 40);
  assert.equal(FROST.damage < LANTERN.damage, true);
  assert.equal(FROST.slow, 0.5);
  assert.equal(FROST.slowFor >= 1, true);
  assert.deepEqual([FROST.name, LANTERN.name, BRAZIER.name], ['Frost', 'Lantern', 'Brazier']);
});

test('createTower carries slow and slowFor, and other kinds slow nothing', () => {
  const frost = createTower(1, 1, FROST);
  assert.deepEqual(
    [frost.slow, frost.slowFor, frost.damage, frost.range, frost.cooldown],
    [FROST.slow, FROST.slowFor, FROST.damage, FROST.range, FROST.cooldown],
  );
  const lantern = createTower(1, 1);
  const brazier = createTower(1, 1, BRAZIER);
  assert.deepEqual([lantern.slow, lantern.slowFor], [0, 0]);
  assert.deepEqual([brazier.slow, brazier.slowFor], [0, 0]);
});

test('key 3 chooses frost', () => {
  assert.deepEqual([kindForKey('3', LANTERN), kindForKey('3', BRAZIER), kindForKey('1', FROST)], [FROST, FROST, LANTERN]);
});

test('a frost tower costs 40 and is refused when gold is short', () => {
  assert.equal(placementError(createGame({ waveSize: 0, gold: 39 }), 1, 1, FROST), 'gold');
  const game = createGame({ waveSize: 0, gold: 40 });
  assert.equal(placeTower(game, 1, 1, FROST), true);
  assert.deepEqual([game.gold, game.towers.length, game.towers[0].slow], [0, 1, FROST.slow]);
});

test('a ghost hit by frost covers half the distance in the next second that an unhit ghost covers', () => {
  const slowed = frostBeside(FROST);
  const free = frostBeside(null);
  step(slowed.game, TICK);
  step(free.game, TICK);
  assert.deepEqual([slowed.ghost.slow, slowed.ghost.slowLeft], [FROST.slow, FROST.slowFor]);
  const from = [slowed.ghost.distance, free.ghost.distance];
  for (let i = 0; i < 1 / TICK; i++) {
    step(slowed.game, TICK);
    step(free.game, TICK);
  }
  assert.equal(free.ghost.distance - from[1], ENEMY_SPEED);
  assert.equal(slowed.ghost.distance - from[0], ENEMY_SPEED * FROST.slow);
  assert.deepEqual([slowed.game.enemies.length, slowed.ghost.health], [1, ENEMY_HEALTH - 2 * FROST.damage]);
});

test('one frost hit, then a second of travel: half the distance', () => {
  const e = createEnemy({ id: 1, waypoints: WAYPOINTS });
  slowEnemy(e, FROST.slow, FROST.slowFor);
  advanceEnemy(e, WAYPOINTS, 1);
  assert.equal(e.distance, ENEMY_SPEED * 0.5);
});

test('after slowFor seconds without another hit, the ghost is back to full speed', () => {
  const e = slowEnemy(createEnemy({ id: 1, waypoints: WAYPOINTS }), FROST.slow, FROST.slowFor);
  advanceEnemy(e, WAYPOINTS, FROST.slowFor);
  const slowedFor = ENEMY_SPEED * FROST.slow * FROST.slowFor;
  assert.equal(e.distance, slowedFor);
  assert.deepEqual([e.slow, e.slowLeft], [1, 0]);
  advanceEnemy(e, WAYPOINTS, 1);
  assert.equal(e.distance, slowedFor + ENEMY_SPEED);
});

test('a step that outlasts the slow is split where it runs out', () => {
  const e = slowEnemy(createEnemy({ id: 1, waypoints: WAYPOINTS }), FROST.slow, FROST.slowFor);
  advanceEnemy(e, WAYPOINTS, FROST.slowFor + 1);
  assert.equal(e.distance, ENEMY_SPEED * FROST.slow * FROST.slowFor + ENEMY_SPEED);
  assert.deepEqual([e.slow, e.slowLeft], [1, 0]);
});

test('two frost hits in a row leave the speed at the factor, not its square', () => {
  const e = createEnemy({ id: 1, waypoints: WAYPOINTS });
  slowEnemy(e, FROST.slow, FROST.slowFor);
  slowEnemy(e, FROST.slow, FROST.slowFor);
  advanceEnemy(e, WAYPOINTS, 1);
  assert.deepEqual([e.distance, e.slow], [ENEMY_SPEED * 0.5, FROST.slow]);

  // Through step: tick until the second hit lands, counting the ticks since the first.
  const { game, ghost } = frostBeside(FROST);
  let ticks = 0;
  let sinceHit = 0;
  while (ghost.health > ENEMY_HEALTH - 2 * FROST.damage && ticks < 64) {
    const before = ghost.health;
    step(game, TICK);
    ticks += 1;
    sinceHit = ghost.health < before ? 0 : sinceHit + 1;
  }
  assert.equal(ghost.health, ENEMY_HEALTH - 2 * FROST.damage);
  assert.deepEqual([ghost.slow, ghost.slowLeft], [FROST.slow, FROST.slowFor - sinceHit * TICK]);
});

test('a refreshed slow restarts its time left', () => {
  const e = slowEnemy(createEnemy({ id: 1, waypoints: WAYPOINTS }), FROST.slow, FROST.slowFor);
  advanceEnemy(e, WAYPOINTS, 1);
  slowEnemy(e, FROST.slow, FROST.slowFor);
  assert.equal(e.slowLeft, FROST.slowFor);
});

test('while a slow runs, a weaker one refreshes the time and keeps the stronger factor', () => {
  const e = slowEnemy(createEnemy({ id: 1, waypoints: WAYPOINTS }), FROST.slow, FROST.slowFor);
  slowEnemy(e, 0.75, 1);
  assert.deepEqual([e.slow, e.slowLeft], [FROST.slow, 1]);
  advanceEnemy(e, WAYPOINTS, 1);
  slowEnemy(e, 0.75, 1);
  assert.deepEqual([e.slow, e.slowLeft], [0.75, 1]);
});

test('only frost slows', () => {
  const { game, ghost } = frostBeside(LANTERN);
  step(game, TICK);
  assert.equal(ghost.health, ENEMY_HEALTH - LANTERN.damage);
  assert.deepEqual([ghost.slow, ghost.slowLeft], [1, 0]);
});

test('draw gives a frost tower its own sprite and no lantern pool', () => {
  assert.equal(typeof SPRITES.drawFrost, 'function');
  const counts = { drawLanternLight: 0, drawLanternBody: 0, drawBrazier: 0, drawFrost: 0 };
  const sprites = { ...SPRITES };
  for (const name of Object.keys(counts)) sprites[name] = () => (counts[name] += 1);
  const game = createGame({ waveSize: 0 });
  placeTower(game, 1, 1, FROST);
  const ctx = new Proxy({}, { get: (target, name) => (name in target ? target[name] : () => ctx) });
  draw(ctx, game, null, sprites);
  assert.deepEqual(counts, { drawLanternLight: 0, drawLanternBody: 0, drawBrazier: 0, drawFrost: 1 });
});

test('the frost sprite and a slowed ghost paint in their own THEME tokens', () => {
  const tower = recordingContext();
  SPRITES.drawFrost(tower.ctx, createTower(1, 1, FROST));
  assert.deepEqual(fills(tower.calls).slice(0, 2), [THEME.frostBody, THEME.frostCore]);

  const ghost = createEnemy({ id: 1, waypoints: WAYPOINTS });
  const slowed = recordingContext();
  drawGhost(slowed.ctx, slowEnemy({ ...ghost }, FROST.slow, FROST.slowFor));
  assert.equal(fills(slowed.calls)[0], THEME.ghostSlowed);
  const plain = recordingContext();
  drawGhost(plain.ctx, { ...ghost, slowLeft: 0 });
  assert.equal(fills(plain.calls)[0], THEME.ghostBody);
});

test('the HUD names the kind draw is handed', () => {
  const texts = (kind) => {
    const { ctx, calls } = recordingContext();
    draw(ctx, createGame(), null, SPRITES, kind);
    return calls.filter((c) => c.name === 'fillText');
  };
  const frost = texts(FROST);
  assert.deepEqual(frost.slice(-6).map((c) => c.args[0]), ['Wave', '1 / 10', 'Tower', 'Frost', 'Pause', '1x']);
  const [label, value] = frost.slice(-4, -2);
  assert.deepEqual(
    [label.fillStyle, label.args[2], value.fillStyle, value.args[2]],
    [THEME.hudMuted, HUD_HEIGHT / 2, THEME.hudInk, HUD_HEIGHT / 2],
  );
  assert.deepEqual(texts(LANTERN).slice(-3, -2).map((c) => c.args[0]), ['Lantern']);
});

// No text is measured, so the bound is a whole em per letter of the font the name is drawn in,
// wider than any letter in these names: every kind's name ends before the Pause button starts.
test('every kind name in the HUD ends before the Pause button', () => {
  const { ctx, calls } = recordingContext();
  draw(ctx, createGame(), null, SPRITES, FROST);
  const value = calls.filter((c) => c.name === 'fillText' && c.args[0] === FROST.name);
  assert.deepEqual(value.map((c) => c.args[1]), [HUD_KIND.valueX]);
  const em = parseFloat(value[0].font);
  assert.equal(em > 0, true);
  const ends = [LANTERN, BRAZIER, FROST].map((kind) => HUD_KIND.valueX + kind.name.length * em <= PAUSE_BUTTON.x);
  assert.deepEqual(ends, [true, true, true]);
});
