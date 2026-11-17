---
milestone: M3
---
# Earn gold for each ghost defeated

**Milestone:** M3, Waves and economy

## Why

There is no economy yet, so nothing limits building and nothing rewards defending well.

## What

- Add `state.gold` to `src/game.js`, starting at 50.
- Each enemy carries a `bounty` (default 5) set in `createEnemy`.
- When a ghost dies, add its `bounty` to `state.gold`. A ghost that leaks off the end earns nothing.

## Acceptance criteria

Each is proven by a test under `test/`, run with `node --test`.

- [ ] A new game starts with 50 gold.
- [ ] Killing one ghost with bounty 5 raises gold by exactly 5.
- [ ] A ghost reaching the end leaves gold unchanged.
- [ ] Two ghosts killed in the same step each pay their bounty exactly once (gold rises by 10).
- [ ] `npm test` passes.
