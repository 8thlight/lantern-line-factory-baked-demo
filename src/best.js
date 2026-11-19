// The best wave any run has reached, kept in a Storage handed in, so a plain object with
// getItem and setItem stands in for the browser's localStorage.
// A missing storage, one that throws, or a value that is not a whole wave reads as no best.

export const BEST_KEY = 'lantern-line.best-wave';

// The saved best wave as a number, or null when there is none to read.
export function readBest(storage) {
  try {
    const raw = storage.getItem(BEST_KEY);
    if (raw === null) return null;
    const wave = Number(raw);
    return Number.isInteger(wave) && wave >= 1 ? wave : null;
  } catch {
    return null;
  }
}

// Raises the saved best to `wave`, never lowers it; an unreadable value is written over.
// Returns the best after the write. A storage that refuses the write keeps the game running.
export function writeBest(storage, wave) {
  const best = readBest(storage);
  if (best !== null && best >= wave) return best;
  try {
    storage.setItem(BEST_KEY, String(wave));
  } catch {
    // no storage, or the browser refused it: the best is simply not kept
  }
  return wave;
}
