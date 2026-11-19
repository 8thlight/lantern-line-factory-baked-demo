import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTIES } from '../src/difficulty.js';
import { START_GOLD, START_LIVES, createGame, restart, spawnBoss, spawnEnemy } from '../src/game.js';
import { WAVES } from '../src/waves.js';

const KEYS = ['easy', 'normal', 'hard'];

// The first plain ghost of wave 1; waveSize 0 keeps the spawner from sending any on its own.
function firstGhost(options) {
  return spawnEnemy(createGame({ waveSize: 0, ...options }));
}

// The boss of wave 5.
function waveFiveBoss(options) {
  const game = createGame({ waveSize: 0, ...options });
  game.wave = 5;
  return spawnBoss(game);
}

test('DIFFICULTIES holds exactly easy, normal and hard, as the table gives them', () => {
  assert.deepEqual(DIFFICULTIES, {
    easy: { name: 'Easy', health: 1, gold: 50, lives: 10 },
    normal: { name: 'Normal', health: 1.5, gold: 50, lives: 10 },
    hard: { name: 'Hard', health: 2, gold: 60, lives: 8 },
  });
  assert.deepEqual(Object.keys(DIFFICULTIES), KEYS);
});

test('a hard game starts with 60 gold and 8 lives', () => {
  const game = createGame({ difficulty: 'hard' });
  assert.deepEqual([game.gold, game.lives, game.difficulty], [60, 8, 'hard']);
});

test("a gold or lives option wins over the difficulty's", () => {
  const rich = createGame({ difficulty: 'hard', gold: 200 });
  assert.deepEqual([rich.gold, rich.lives], [200, 8]);
  const frail = createGame({ difficulty: 'hard', lives: 3 });
  assert.deepEqual([frail.gold, frail.lives], [60, 3]);
});

test('easy and normal start with 50 gold and 10 lives', () => {
  for (const difficulty of ['easy', 'normal']) {
    const game = createGame({ difficulty });
    assert.deepEqual([game.gold, game.lives], [50, 10]);
  }
});

test("wave 1's first ghost has 3, 5 and 6 health on easy, normal and hard, at one speed and bounty", () => {
  const ghosts = KEYS.map((difficulty) => firstGhost({ difficulty }));
  const plain = firstGhost({});
  assert.deepEqual(ghosts.map((g) => g.health), [3, 5, 6]);
  assert.deepEqual(ghosts.map((g) => g.maxHealth), [3, 5, 6]);
  assert.deepEqual(ghosts.map((g) => g.speed), [WAVES[0].speed, WAVES[0].speed, WAVES[0].speed]);
  assert.deepEqual(ghosts.map((g) => g.bounty), [plain.bounty, plain.bounty, plain.bounty]);
  assert.equal(plain.bounty, 5);
});

test("wave 5's boss has 40, 60 and 80 health on easy, normal and hard, at one speed and bounty", () => {
  const bosses = KEYS.map((difficulty) => waveFiveBoss({ difficulty }));
  const { speed, bounty } = WAVES[4].boss;
  assert.deepEqual(bosses.map((b) => b.health), [40, 60, 80]);
  assert.deepEqual(bosses.map((b) => [b.speed, b.bounty]), [[speed, bounty], [speed, bounty], [speed, bounty]]);
  assert.deepEqual([speed, bounty], [45, 30]);
});

test('a game made without a difficulty plays as it does today', () => {
  const game = createGame();
  assert.deepEqual([game.difficulty, game.gold, game.lives], [null, START_GOLD, START_LIVES]);
  assert.deepEqual([START_GOLD, START_LIVES], [50, 10]);
  assert.equal(firstGhost({}).health, 3);
  assert.equal(waveFiveBoss({}).health, 40);
  assert.equal(createGame({ difficulty: null }).difficulty, null);
});

test('restarting a hard game gives a hard game with 60 gold and 8 lives', () => {
  const game = createGame({ difficulty: 'hard' });
  game.gold = 7;
  game.lives = 0;
  game.status = 'lost';
  const again = restart(game);
  assert.deepEqual([again.difficulty, again.gold, again.lives, again.status], ['hard', 60, 8, 'playing']);
  assert.equal(spawnEnemy(restart(createGame({ difficulty: 'hard', waveSize: 0 }))).health, 6);
});

test("restarting keeps an explicit gold over the difficulty's", () => {
  const again = restart(createGame({ difficulty: 'hard', gold: 200 }));
  assert.deepEqual([again.gold, again.lives], [200, 8]);
});

test('an unknown difficulty is refused with what to pass instead', () => {
  for (const difficulty of ['impossible', 'Hard', 'toString']) {
    assert.throws(() => createGame({ difficulty }), {
      name: 'RangeError',
      message: `Unknown difficulty '${difficulty}': pass one of easy, normal or hard, or leave difficulty out to play the game as it is.`,
    });
  }
});
