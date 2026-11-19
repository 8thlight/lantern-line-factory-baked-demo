// The difficulties a game may be made with: the gold and lives it starts with, and how many
// times tougher its ghosts are than the waves table says (src/waves.js), and the lookup that refuses any other key. No DOM.

export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({ name: 'Easy', health: 1, gold: 50, lives: 10 }),
  normal: Object.freeze({ name: 'Normal', health: 1.5, gold: 50, lives: 10 }),
  hard: Object.freeze({ name: 'Hard', health: 2, gold: 60, lives: 8 }),
});

// The entry for `key`, or null when `key` is null or left out. Any other key is refused, naming
// the keys DIFFICULTIES holds.
export function difficultyEntry(key) {
  if (key === null || key === undefined) return null;
  if (Object.hasOwn(DIFFICULTIES, key)) return DIFFICULTIES[key];
  const keys = Object.keys(DIFFICULTIES);
  const choices = `${keys.slice(0, -1).join(', ')} or ${keys.at(-1)}`;
  throw new RangeError(
    `Unknown difficulty '${String(key)}': pass one of ${choices}, or leave difficulty out to play the game as it is.`,
  );
}
