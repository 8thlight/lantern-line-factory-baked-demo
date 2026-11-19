// Game state and the fixed-step update. No DOM: render.js draws what this holds.

import { WAYPOINTS, cellCenter, pathCells } from './path.js';
import { advanceEnemy, createEnemy, damageEnemy, slowEnemy } from './enemy.js';
import { LANTERN, MAX_LEVEL, canPlace, cellError, createTower, towerById, updateTower } from './tower.js';
import { splashTargets } from './targeting.js';
import { createWave, updateWave, waveDone } from './wave.js';
import { WAVES } from './waves.js';
import { challengeEntry, difficultyEntry } from './difficulty.js';

export const START_LIVES = 10;
export const START_GOLD = 50;
export const TOTAL_WAVES = WAVES.length; // waves to hold for the round to be won
export const BOSS_LIVES = 3; // lives a boss takes when it reaches the end
const SHOT_TTL = 0.1; // how long a beam stays drawn

// The table's entry for a wave; a game holding more waves than the table repeats its last.
function waveEntry(wave) {
  return WAVES[Math.min(wave, WAVES.length) - 1];
}

// A wave's spawner: its entry's count and interval, unless the game was made with its own.
// A wave whose entry has a boss sends it as its last spawn; a wave of no ghosts sends no boss either.
// `plain` counts the plain ghosts spawned this wave, so the difficulty can armour every so many.
export function waveSpawner({ options }, wave) {
  const entry = waveEntry(wave);
  const count = options.waveSize ?? entry.count;
  const boss = count > 0 ? entry.boss ?? null : null;
  return { ...createWave({ count: count + (boss ? 1 : 0), interval: options.spawnInterval ?? entry.interval }), boss, plain: 0 };
}

// `waveSize` and `spawnInterval` left out, each wave reads them from the table; given, they hold for every wave,
// `waveSize` counting the plain ghosts, so a boss wave of a nonzero size still sends its boss after them.
// `status` left out starts the game playing; 'ready' holds it on the start screen, and restart
// brings it back the same way. `difficulty` (a key of DIFFICULTIES) sets the starting gold and
// lives and how tough the ghosts are; an explicit `gold` or `lives` wins over it, and left out the
// game plays as the table and START_GOLD/START_LIVES give it.
export function createGame({
  waypoints = WAYPOINTS,
  spawnInterval,
  waveSize,
  lives,
  gold,
  totalWaves = TOTAL_WAVES,
  status = 'playing',
  difficulty = null,
} = {}) {
  const entry = difficultyEntry(difficulty);
  // `lives` and `gold` are kept as given, so restart resolves them through the difficulty again.
  const options = { waypoints, spawnInterval, waveSize, lives, gold, totalWaves, status, difficulty };
  return {
    options,
    difficulty, // a key of DIFFICULTIES, or null
    status, // 'ready' until started, 'playing', then 'won' or 'lost', and the round is over
    waypoints,
    path: pathCells(waypoints),
    wave: 1,
    totalWaves,
    spawner: waveSpawner({ options }, 1),
    nextEnemyId: 1,
    nextTowerId: 1,
    enemies: [],
    towers: [],
    shots: [],
    lives: lives === undefined ? entry?.lives ?? START_LIVES : lives,
    gold: gold === undefined ? entry?.gold ?? START_GOLD : gold,
    kills: 0,
    paused: false,
    speed: 1, // 1 or 2: the ticks each step runs
  };
}

// What the next tower of `kind` costs on this game: its cost, plus the difficulty's price step
// for every tower of the same name already standing. With no difficulty the step is 0.
export function towerPrice(state, kind = LANTERN) {
  const step = challengeEntry(state.difficulty)?.priceStep ?? 0;
  return (kind.cost ?? 0) + step * state.towers.filter((t) => t.name === kind.name).length;
}

// Why a tower of `kind` may not be placed on a cell: the cell's reason ('bounds', 'path' or
// 'taken') first, then 'gold' when the gold held is below the kind's price; null when it may.
// A kind with no cost pays only the difficulty's price step, so with no difficulty it is free.
export function placementError(state, col, row, kind = LANTERN) {
  return cellError(state, col, row) ?? (state.gold < towerPrice(state, kind) ? 'gold' : null);
}

// Place a tower of `kind` and pay its price, unless placementError refuses it. The tower
// remembers the price it was placed for as `spent`.
export function placeTower(state, col, row, kind = LANTERN) {
  if (placementError(state, col, row, kind) !== null) return false;
  const price = towerPrice(state, kind);
  state.gold -= price;
  state.towers.push({ id: state.nextTowerId++, ...createTower(col, row, kind), spent: price });
  return true;
}

// Why the tower with `id` may not be upgraded: 'missing' when no tower has it, then 'max' at
// MAX_LEVEL or when its kind declared no upgrade, then 'gold' when the gold held is below the
// upgrade's cost; null when it may.
export function upgradeError(state, id) {
  const tower = towerById(state, id);
  if (!tower) return 'missing';
  if (tower.level >= MAX_LEVEL || tower.upgrade === null) return 'max';
  if (state.gold < tower.upgrade.cost) return 'gold';
  return null;
}

// Raise a tower one level by the damage and range its upgrade (copied from its kind) declares
// and pay the upgrade's cost, counting it into the tower's `spent`. Returns upgradeError's
// reason, having changed nothing, when it refuses; null when done.
export function upgradeTower(state, id) {
  const reason = upgradeError(state, id);
  if (reason !== null) return reason;
  const tower = towerById(state, id);
  const { cost, damage, range } = tower.upgrade;
  tower.level += 1;
  tower.damage += damage;
  tower.range += range;
  state.gold -= cost;
  tower.spent = (tower.spent ?? 0) + cost; // a tower built by hand with no `spent` counts from 0
  return null;
}

// What selling a tower returns: half the gold spent on it, rounded down.
export function sellValue(tower) {
  return Math.floor((tower.spent ?? 0) / 2);
}

// Remove the tower with `id` and pay its sell value. Returns 'over', having changed nothing,
// while the round is not playing, 'missing' when no tower has the id; null when sold. Its cell
// is free again, and the next tower of its kind costs one price step less.
export function sellTower(state, id) {
  if (state.status !== 'playing') return 'over';
  const tower = towerById(state, id);
  if (!tower) return 'missing';
  state.towers = state.towers.filter((t) => t !== tower);
  state.gold += sellValue(tower);
  return null;
}

// A left click on a board cell: a tower standing there is selected, its id returned and nothing
// placed; any other cell is handed to placeTower and the click selects nothing (null).
export function clickCell(state, col, row, kind = LANTERN) {
  const tower = towerAt(state, col, row);
  if (tower) return tower.id ?? null;
  placeTower(state, col, row, kind);
  return null;
}

// The hover the pointer shows on a cell: `ok` when a tower of `kind` may be placed there now.
export function hoverAt(state, col, row, kind = LANTERN) {
  return { col, row, kind, ok: placementError(state, col, row, kind) === null };
}

// The tower standing on a cell, or null.
export function towerAt(state, col, row) {
  return state.towers.find((t) => t.col === col && t.row === row) ?? null;
}

// The ring the pointer shows: a placed tower's reach, or on a cell a tower may take, the
// reach of the kind a click would place there (the hover's kind, a lantern if it names none).
// Null with no hover, on the path or off the board.
export function rangePreview(state, hover) {
  if (!hover) return null;
  const tower = towerAt(state, hover.col, hover.row);
  if (tower) return { x: tower.x, y: tower.y, radius: tower.range };
  if (!canPlace(state, hover.col, hover.row)) return null;
  const { x, y } = cellCenter(hover);
  return { x, y, radius: (hover.kind ?? LANTERN).range };
}

// A ghost's health on this game's difficulty; as the table gives it when there is none.
function toughened(state, health) {
  return Math.ceil(health * (difficultyEntry(state.difficulty)?.health ?? 1));
}

// A plain ghost's armour: 1 for every armourEvery-th of its wave, counted from 1, from the
// difficulty's armourFrom wave on; 0 for the rest, and always with no difficulty.
function armoured(state, nth) {
  const { armourFrom = null, armourEvery = 0 } = challengeEntry(state.difficulty) ?? {};
  return armourFrom !== null && state.wave >= armourFrom && armourEvery > 0 && nth % armourEvery === 0 ? 1 : 0;
}

// A plain ghost of the current wave, as fast as its entry in the table and as tough, scaled by
// the game's difficulty, and armoured when it is the wave's armourEvery-th plain ghost (counted
// on the wave's spawner; one built without the count starts it from 0).
export function spawnEnemy(state) {
  const { health, speed } = waveEntry(state.wave);
  state.spawner.plain = (state.spawner.plain ?? 0) + 1;
  const armour = armoured(state, state.spawner.plain);
  const enemy = createEnemy({ id: state.nextEnemyId++, waypoints: state.waypoints, health: toughened(state, health), speed, armour });
  state.enemies.push(enemy);
  return enemy;
}

// The current wave's boss, as fast and rewarding as its entry declares and as tough, scaled by
// the game's difficulty, marked so render draws it larger. Only called on a wave whose entry has a boss.
export function spawnBoss(state) {
  const { health, speed, bounty } = waveEntry(state.wave).boss;
  const enemy = {
    ...createEnemy({ id: state.nextEnemyId++, waypoints: state.waypoints, health: toughened(state, health), speed, bounty }),
    boss: true,
  };
  state.enemies.push(enemy);
  return enemy;
}

// Lose one life per enemy that reached the end, BOSS_LIVES for a boss, and remove those enemies.
// Returns the lives the leaks cost; lives stop at 0 even when that cost is more.
export function leakEnemies(state) {
  const cost = state.enemies.reduce((sum, e) => sum + (e.reachedEnd ? (e.boss ? BOSS_LIVES : 1) : 0), 0);
  state.lives = Math.max(0, state.lives - cost);
  state.enemies = state.enemies.filter((e) => !e.reachedEnd);
  return cost;
}

// A fresh game made with the options this one was made with.
export function restart(state) {
  return createGame(state.options);
}

// Begin a ready game's first wave; any other status is left as it is.
export function start(state) {
  if (state.status === 'ready') state.status = 'playing';
  return state;
}

// A ready game made again on the difficulty `key`, with that difficulty's gold and lives, so
// restart keeps it; any other status is returned as it is.
export function chooseDifficulty(state, key) {
  if (state.status !== 'ready') return state;
  return createGame({ ...state.options, status: 'ready', difficulty: key });
}

// Pause and unpause the round.
export function togglePause(state) {
  state.paused = !state.paused;
  return state;
}

// Move the round between 1x and 2x.
export function toggleSpeed(state) {
  state.speed = state.speed === 2 ? 1 : 2;
  return state;
}

// Advance the whole game by `dt` seconds of play, `speed` times over. A ready game stays as it
// is until started, a finished round as it ended, and a paused one as it was. 2x is two ticks
// of the frame's `dt`, never one tick of twice the `dt`, so a long frame cannot carry a ghost
// past a tower's reach or fold two reloads into one shot.
export function step(state, dt) {
  if (state.status !== 'playing' || state.paused) return state;
  for (let i = 0; i < state.speed && state.status === 'playing'; i++) tick(state, dt);
  return state;
}

function tick(state, dt) {
  const due = updateWave(state.spawner, dt);
  // The boss is the wave's last spawn, even when a long tick owes a backlog.
  for (let i = 0; i < due; i++) {
    const last = state.spawner.spawned - due + i + 1 === state.spawner.count;
    if (last && state.spawner.boss) spawnBoss(state);
    else spawnEnemy(state);
  }

  for (const enemy of state.enemies) advanceEnemy(enemy, state.waypoints, dt);
  leakEnemies(state);
  if (state.lives === 0) {
    state.status = 'lost'; // nothing else moves on the step the round is lost
    return state;
  }

  for (const shot of state.shots) shot.ttl -= dt;
  state.shots = state.shots.filter((s) => s.ttl > 0);

  for (const tower of state.towers) {
    const target = updateTower(tower, state.enemies, dt);
    if (!target) continue;
    state.shots.push({ from: { x: tower.x, y: tower.y }, to: { x: target.x, y: target.y }, ttl: SHOT_TTL });
    // A splash takes in its own target, so each ghost is hit once and each kill counted and paid once.
    const hit = tower.splash > 0 ? splashTargets(target, state.enemies, tower.splash) : [target];
    const dead = hit.filter((enemy) => damageEnemy(enemy, tower.damage));
    // A frost hit sets the slow and restarts its time; it never deepens it.
    if (tower.slow > 0) for (const enemy of hit) if (!dead.includes(enemy)) slowEnemy(enemy, tower.slow, tower.slowFor);
    if (dead.length) {
      state.enemies = state.enemies.filter((e) => !dead.includes(e));
      state.kills += dead.length;
      state.gold += dead.reduce((sum, e) => sum + e.bounty, 0);
    }
  }

  // The next wave starts once this one has spawned out and the board is clear,
  // whether its ghosts were banished or leaked, and reads its entry in the table.
  // A wave of no ghosts is spawned out from the start, so it is kept from counting waves up on an empty board.
  // Clearing the last wave wins the round; lives are above 0 here, since a loss returned above.
  if (state.spawner.count > 0 && waveDone(state.spawner) && state.enemies.length === 0) {
    if (state.wave >= state.totalWaves) {
      state.status = 'won';
      return state;
    }
    state.wave += 1;
    state.spawner = waveSpawner(state, state.wave);
  }

  return state;
}
