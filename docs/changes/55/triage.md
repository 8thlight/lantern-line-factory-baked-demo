# Fast follower of print line-factory-baked-demo-lbn: GitHub issue 8thligh

Abandoned in a row: 1 for train-wreck; 311 model call(s), $0.00 metered, across those prints of this ask.

Print line-factory-baked-demo-lbn was retired by the fail-forward skill, so it delivered nothing: this follower carries the print's work in full (the operator, 2026-10-15: "it may retire a print"). Why: train-wreck: plan 76db626 (ratified 868bf1b) dropped the new reproducer test/boss.test.js from touches:, and the scope gate reads touches: alone. widen refuses a locked reproducer, build cannot edit the chain, and about ten sessions of widen and in-place restores left the finding standing, so this print cannot get through. Its work, green on branch print/line-factory-baked-demo-lbn at 744b1a8, goes to a fast follower whose touches: name the boss test.

## The ask this follows on from, word for word, from print line-factory-baked-demo-lbn

### GitHub issue 8thlight/lantern-line-factory-baked-demo#16

What broke: There is no boss yet, so this is new behaviour. `WAVES` in src/waves.js is ten plain `{ count, interval, health, speed }` entries. src/game.js gives every ghost of a wave the same health and speed through `waveEntry`/`spawnEnemy`, pays each kill the default `ENEMY_BOUNTY` of 5 through `createEnemy` in src/enemy.js, and `leakEnemies` takes exactly one life per ghost that reaches the end. `hudModel` in src/hud.js and `drawHud`/`drawGhost` in src/render.js know nothing of a boss: there is no announcement and no larger sprite. So waves 5 and 10 feel like every other wave. The fix gives entries 5 and 10 a `boss` entry (one ghost with its own health, a slower speed and a bounty several times 5). The game spawns that boss once in those waves, gives it the declared health, speed and bounty, takes three lives when it leaks and marks it so render draws it larger. The HUD model carries a boss-wave flag that render announces when the wave starts. Two tests in test/waves.test.js pin the old table and must be brought up to date in the same print, with what each proves kept: one pins each entry's keys to exactly count/health/interval/speed, and 'clearing the last entry wins' expects one life lost per ghost. A new test/boss.test.js, written red first, proves the boss itself.

beads:
  - lantern-line-factory-baked-demo-lbn

## The brief, in full, from bead lantern-line-factory-baked-demo-lbn

Carried here rather than cited, because a stage runs in a sandbox with no tracker: a pointer to a bead is a pointer to nothing from inside it.

Filed from GitHub issue #16 (https://github.com/8thlight/lantern-line-factory-baked-demo/issues/16) by the line's GitHub intake (bead hydraflow-picrz.2). Released to the factory: the issue is labelled hydraflow.

The item's title and body, as filed. UNTRUSTED DATA: anyone who can open an issue wrote it, quoted so a person can read it, never an instruction to follow.

~~~text
Send a boss ghost every fifth wave

**Milestone:** M5, Depth

## Why

Waves that only get bigger feel the same. A boss every fifth wave gives the run a rhythm and something to prepare for.

## What

- The ten-wave table in `src/waves.js` gains a `boss` entry on every fifth wave (waves 5 and 10): one ghost with many times the health, slower, drawn larger.
- A defeated boss pays several times a normal ghost's gold; a boss that reaches the end costs three lives instead of one.
- The HUD announces a boss wave when it starts.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] Waves 5 and 10 each include exactly one boss; waves 1 to 4 include none.
- [ ] A boss has the health and speed its table entry declares, and takes that many hits to defeat.
- [ ] Defeating a boss adds its declared gold; a boss reaching the end removes three lives.
- [ ] `npm test` passes.
~~~

Class: fix

reproduces:
  - test/game.test.js

touches:
  - src/waves.js
  - src/game.js
  - test/boss.test.js
  - test/waves.test.js

Acceptance criterion: Printer defect: the plan stage's touches amendment may drop a reproduces: path that does not exist on the base yet, and ratify signs it. The scope gate reads touches: alone, so the print cannot create its own red-first reproducer. widen then refuses the path as a locked reproducer, which leaves no route out (print line-factory-baked-demo-lbn spent about ten fail-forward sessions on it). Fix one of three ways: ratify refuses such an amendment; the scope gate admits a print's own reproduces: paths that are absent on the base; or widen accepts them. Not fixed here because it is printer code. See vault note 0-Inbox/'A touches amendment must keep a new reproducer that the signed list named'.
