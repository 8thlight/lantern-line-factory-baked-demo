// The waves of a round, in order: how many ghosts, how often, and how tough and fast each is.
// Wave 1 is the M1 wave (5 ghosts every 1.5 s, health 3, speed 60); each wave after it
// sends at least as much health in all (count * health) and no slower ghosts.
// Pure data, no DOM: safe to import from tests.

export const WAVES = [
  { count: 5, interval: 1.5, health: 3, speed: 60 }, // 15
  { count: 6, interval: 1.4, health: 4, speed: 65 }, // 24
  { count: 7, interval: 1.3, health: 4, speed: 70 }, // 28
  { count: 8, interval: 1.2, health: 5, speed: 70 }, // 40
  { count: 9, interval: 1.1, health: 5, speed: 75 }, // 45
  { count: 10, interval: 1.0, health: 6, speed: 75 }, // 60
  { count: 11, interval: 0.9, health: 6, speed: 80 }, // 66
  { count: 12, interval: 0.9, health: 7, speed: 80 }, // 84
  { count: 13, interval: 0.8, health: 7, speed: 85 }, // 91
  { count: 15, interval: 0.8, health: 8, speed: 90 }, // 120
];
