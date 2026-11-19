// The best wave any run has reached, kept in a Storage handed in, so a plain object with
// getItem and setItem stands in for the browser's localStorage.
// A missing storage, one that throws, or a value that is not a whole wave reads as no best.

export const BEST_KEY = 'lantern-line.best-wave';

const isWave = (wave) => Number.isInteger(wave) && wave >= 1;

// The saved best wave as a number, or null when there is none to read.
export function readBest(storage) {
  try {
    const raw = storage.getItem(BEST_KEY);
    if (raw === null) return null;
    const wave = Number(raw);
    return isWave(wave) ? wave : null;
  } catch {
    return null;
  }
}

// Raises the saved best to `wave`, never lowers it; an unreadable value is written over.
// Returns the best after the write. A storage that refuses the write keeps the game running.
// A wave that is not a whole wave of at least 1 is never saved, so it cannot write over a real best.
export function writeBest(storage, wave) {
  const best = readBest(storage);
  if (!isWave(wave)) return best;
  if (best !== null && best >= wave) return best;
  try {
    storage.setItem(BEST_KEY, String(wave));
  } catch {
    // no storage, or the browser refused it: the best is simply not kept
  }
  return wave;
}

// The best after one step of the frame loop, given the status the game held before it: a run
// ends once, on the step that moves it from 'playing' to 'won' or 'lost', and only then is the
// wave it reached saved. Any other step leaves `best` as it was and writes nothing.
export function bestAfterStep(storage, before, state, best) {
  const ended = before === 'playing' && (state.status === 'won' || state.status === 'lost');
  return ended ? writeBest(storage, state.wave) : best;
}
