# M1 · Core loop: plan

The three tasks in work/ that make the game winnable and losable, in order.

1. work/m1-01-enemy-health.md: ghosts carry health, and a hit damages rather than kills.
2. work/m1-02-waves.md: ghosts arrive in waves of N at an interval, with a pause between.
3. work/m1-03-win-lose-restart.md: the last wave cleared wins, zero lives loses, and
   restart resets the state. It builds on the waves from task 2.

Each task lands with node --test tests over the pure modules in src/, and npm test stays
green after each one.
