import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  canPlace,
  createGame,
  PLANTS,
  step,
  TICKS_PER_SECOND,
  TIMING,
  type Command,
  type JardinState,
} from './engine';

const SEED = '00112233445566778899aabbccddeeff';
const quiet = { autoWaves: false, skySun: false };

function run(state: JardinState, ticks: number, commands: Record<number, Command[]> = {}) {
  for (let i = 0; i < ticks; i++) step(state, commands[state.tick] ?? []);
  return state;
}

describe('planting', () => {
  it('charges sun and starts the seed packet cooldown', () => {
    const game = createGame(SEED, quiet);
    step(game, [{ type: 'place', kind: 'nabu', row: 2, col: 1 }]);
    expect(game.sun).toBe(BALANCE.startingSun - PLANTS.nabu.cost);
    expect(game.plants).toHaveLength(1);
    expect(canPlace(game, 'nabu', 3, 1)).toBe('sun');
    game.sun = 1000;
    expect(canPlace(game, 'nabu', 3, 1)).toBe('cooldown');
    expect(canPlace(game, 'nabu', 2, 1)).toBe('occupied');
    game.sun = 0;
    expect(canPlace(game, 'granadin', 0, 0)).toBe('sun');
    expect(canPlace(game, 'solmiel', 5, 0)).toBe('outside');
  });

  it('ignores invalid placements', () => {
    const game = createGame(SEED, quiet);
    step(game, [
      { type: 'place', kind: 'cortezon', row: 0, col: 9 },
      { type: 'place', kind: 'cortezon', row: -1, col: 0 },
      { type: 'place', kind: 'cortezon', row: 1.5, col: 0 },
      { type: 'place', kind: 'granadin', row: 0, col: 0 },
      { type: 'place', kind: 'granadin', row: 1, col: 0 },
    ]);
    // Only the first Granadín fits the starting 150 sun.
    expect(game.plants).toHaveLength(1);
    expect(game.sun).toBe(0);
  });

  it('sandbox options skip cost and cooldown', () => {
    const game = createGame(SEED, { ...quiet, infiniteSun: true, noCooldown: true });
    step(game, [
      { type: 'place', kind: 'granadin', row: 0, col: 0 },
      { type: 'place', kind: 'granadin', row: 1, col: 0 },
    ]);
    expect(game.plants).toHaveLength(2);
    expect(game.sun).toBe(BALANCE.startingSun);
  });

  it('the shovel removes a plant', () => {
    const game = createGame(SEED, quiet);
    run(game, 2, { 0: [{ type: 'place', kind: 'solmiel', row: 1, col: 1 }], 1: [{ type: 'shovel', row: 1, col: 1 }] });
    expect(game.plants).toHaveLength(0);
  });
});

describe('Solmiel', () => {
  it('produces collectible sun on schedule', () => {
    const game = createGame(SEED, quiet);
    step(game, [{ type: 'place', kind: 'solmiel', row: 0, col: 0 }]);
    run(game, TIMING.solmielFirst + TIMING.solmielRelease);
    expect(game.suns).toHaveLength(1);
    const before = game.sun;
    step(game, [{ type: 'collect', sunId: game.suns[0].id }]);
    expect(game.sun).toBe(before + 25);
    expect(game.suns).toHaveLength(0);
  });

  it('auto-collect gathers sun by itself', () => {
    const game = createGame(SEED, { ...quiet, autoCollect: true });
    step(game, [{ type: 'place', kind: 'solmiel', row: 0, col: 0 }]);
    run(game, TIMING.solmielFirst + TIMING.solmielRelease + TICKS_PER_SECOND);
    expect(game.stats.sunCollected).toBe(25);
  });
});

describe('Nabú vs. zombie', () => {
  it('kills a zombie with seeds before it arrives', () => {
    const game = createGame(SEED, quiet);
    step(game, [
      { type: 'place', kind: 'nabu', row: 2, col: 0 },
      { type: 'spawnZombie', row: 2 },
    ]);
    run(game, 60 * TICKS_PER_SECOND);
    expect(game.stats.killed).toBe(1);
    expect(game.plants[0].hp).toBe(PLANTS.nabu.hp);
    expect(game.stats.breaches).toBe(0);
  });

  it('only shoots zombies in its own row', () => {
    const game = createGame(SEED, quiet);
    step(game, [
      { type: 'place', kind: 'nabu', row: 0, col: 0 },
      { type: 'spawnZombie', row: 4 },
    ]);
    run(game, 5 * TICKS_PER_SECOND);
    expect(game.projectiles).toHaveLength(0);
    expect(game.plants[0].clip).toBe('idle');
  });
});

describe('zombies', () => {
  it('eat plants and move on', () => {
    const game = createGame(SEED, quiet);
    step(game, [
      { type: 'place', kind: 'solmiel', row: 1, col: 8 },
      { type: 'spawnZombie', row: 1 },
    ]);
    run(game, 25 * TICKS_PER_SECOND);
    expect(game.plants).toHaveLength(0);
    expect(game.zombies[0].clip).toBe('walk');
  });

  it('chew through Cortezón slowly and change its look', () => {
    const game = createGame(SEED, quiet);
    step(game, [
      { type: 'place', kind: 'cortezon', row: 3, col: 8 },
      { type: 'spawnZombie', row: 3 },
    ]);
    run(game, 60 * TICKS_PER_SECOND);
    const wall = game.plants[0];
    expect(wall.hp).toBeLessThan(PLANTS.cortezon.hp * (2 / 3));
    expect(['damaged', 'critical']).toContain(wall.clip);
  });

  it('count a breach when they reach the house', () => {
    const game = createGame(SEED, quiet);
    step(game, [{ type: 'spawnZombie', row: 0 }]);
    run(game, 70 * TICKS_PER_SECOND);
    expect(game.stats.breaches).toBe(1);
    expect(game.zombies).toHaveLength(0);
  });
});

describe('Granadín', () => {
  it('blows up zombies in a 3×3 area and is consumed', () => {
    const game = createGame(SEED, { ...quiet, infiniteSun: true });
    for (const row of [1, 2, 3, 4]) step(game, [{ type: 'spawnZombie', row }]);
    // Let them walk to around column 4.
    while (game.zombies.some((zombie) => zombie.x > 4.6)) step(game);
    step(game, [{ type: 'place', kind: 'granadin', row: 2, col: 4 }]);
    run(game, TIMING.granadinFuse + 2);
    const fallen = game.zombies.filter((zombie) => zombie.clip === 'fall').map((zombie) => zombie.row).sort();
    expect(fallen).toEqual([1, 2, 3]);
    expect(game.plants).toHaveLength(0);
    expect(game.blasts).toHaveLength(1);
  });
});

describe('determinism', () => {
  it('same seed and commands give the same game', () => {
    const play = () => {
      const game = createGame(SEED, { autoWaves: true, skySun: true });
      run(game, 90 * TICKS_PER_SECOND, {
        0: [{ type: 'place', kind: 'solmiel', row: 0, col: 0 }],
        30: [{ type: 'place', kind: 'cortezon', row: 2, col: 5 }],
        300: [{ type: 'place', kind: 'nabu', row: 2, col: 1 }],
      });
      return JSON.stringify({ ...game, rngState: undefined });
    };
    expect(play()).toBe(play());
  });
});
