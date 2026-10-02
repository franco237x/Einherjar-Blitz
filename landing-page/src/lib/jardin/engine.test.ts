import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  canPlace,
  createGame,
  isFrozen,
  isSlowed,
  LEVELS,
  MAX_LOADOUT,
  isValidLoadout,
  parseLoggedCommand,
  replayLevel,
  type LoggedCommand,
  PLANTS,
  step,
  ZOMBIES,
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
    ]);
    // Granadín costs more than the starting sun.
    expect(PLANTS.granadin.cost).toBeGreaterThan(BALANCE.startingSun);
    expect(game.plants).toHaveLength(0);
    expect(game.sun).toBe(BALANCE.startingSun);
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

  it('count a breach when they reach a lane whose mower is spent', () => {
    const game = createGame(SEED, quiet);
    step(game, [{ type: 'spawnZombie', row: 0 }]);
    run(game, 70 * TICKS_PER_SECOND);
    expect(game.stats.breaches).toBe(0);
    step(game, [{ type: 'spawnZombie', row: 0 }]);
    run(game, 70 * TICKS_PER_SECOND);
    expect(game.stats.breaches).toBe(1);
    expect(game.zombies).toHaveLength(0);
  });
});

describe('mowers', () => {
  it('start when a zombie reaches the house and sweep the whole lane once', () => {
    const game = createGame(SEED, quiet);
    for (let i = 0; i < 3; i++) run(game, 2 * TICKS_PER_SECOND, { [game.tick]: [{ type: 'spawnZombie', row: 2 }] });
    step(game, [{ type: 'spawnZombie', row: 3 }]);
    while (game.mowers[2].clip === 'idle') step(game);
    expect(game.mowers[2].used).toBe(true);
    expect(game.mowers[3].used).toBe(false);
    run(game, TIMING.mowerStart + 1);
    expect(game.mowers[2].clip).toBe('run');
    run(game, 5 * TICKS_PER_SECOND);
    const lane2 = game.zombies.filter((zombie) => zombie.row === 2);
    expect(lane2.every((zombie) => zombie.clip === 'fall')).toBe(true);
    expect(game.stats.killed).toBe(3);
    expect(game.stats.mowersUsed).toBe(1);
    expect(game.zombies.some((zombie) => zombie.row === 3 && zombie.clip !== 'fall')).toBe(true);
    expect(game.mowers[2].gone).toBe(true);
    expect(game.stats.breaches).toBe(0);
  });

  it('can be refilled from the sandbox', () => {
    const game = createGame(SEED, quiet);
    game.mowers[1].used = true;
    game.mowers[1].gone = true;
    step(game, [{ type: 'resetMowers' }]);
    expect(game.mowers[1]).toMatchObject({ used: false, gone: false, clip: 'idle' });
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
    expect(game.effects.filter((effect) => effect.type === 'blast')).toHaveLength(1);
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

// ─── Plants added for the beta ─────────────────────────────────────────────
const free = { ...quiet, infiniteSun: true, noCooldown: true };

describe('armoured zombies', () => {
  it('lose the cone or bucket before taking health damage', () => {
    const game = createGame(SEED, quiet);
    step(game, [
      { type: 'spawnZombie', row: 1, kind: 'conero' },
      { type: 'spawnZombie', row: 3, kind: 'balderon' },
    ]);
    const [cone, bucket] = game.zombies;
    expect(cone.armor).toBe(ZOMBIES.conero.armor);
    expect(bucket.armor).toBe(ZOMBIES.balderon.armor);
    step(game, [{ type: 'place', kind: 'nabu', row: 1, col: 0 }]);
    while (cone.armor > 0) step(game);
    expect(cone.hp).toBe(ZOMBIES.conero.hp);
    expect(cone.clip).toBe('armor-break');
  });

  it('Balderón walks slower than Despistado', () => {
    const game = createGame(SEED, quiet);
    step(game, [
      { type: 'spawnZombie', row: 0, kind: 'despistado' },
      { type: 'spawnZombie', row: 4, kind: 'balderon' },
    ]);
    const start = game.zombies.map((zombie) => zombie.x);
    run(game, 10 * TICKS_PER_SECOND);
    const walked = game.zombies.map((zombie, i) => start[i] - zombie.x);
    expect(walked[1]).toBeLessThan(walked[0]);
  });
});

describe('Cardón', () => {
  it('spines pierce every zombie in the lane', () => {
    const game = createGame(SEED, free);
    for (let i = 0; i < 3; i++) run(game, 15, { [game.tick]: [{ type: 'spawnZombie', row: 2 }] });
    step(game, [{ type: 'place', kind: 'cardon', row: 2, col: 0 }]);
    while (!game.projectiles.length) step(game);
    const spine = game.projectiles[0];
    while (game.projectiles.includes(spine)) step(game);
    expect(spine.kind).toBe('spine');
    expect(new Set(spine.hit).size).toBe(3);
  });
});

describe('Mordiseta', () => {
  it('only shoots zombies within its short range', () => {
    const game = createGame(SEED, free);
    step(game, [
      { type: 'place', kind: 'mordiseta', row: 0, col: 0 },
      { type: 'spawnZombie', row: 0 },
    ]);
    run(game, 5 * TICKS_PER_SECOND);
    expect(game.projectiles).toHaveLength(0);
    while (game.zombies[0].x > BALANCE.mordisetaRange + 0.4) step(game);
    run(game, 2 * TICKS_PER_SECOND);
    expect(game.zombies[0].hp).toBeLessThan(ZOMBIES.despistado.hp);
  });
});

describe('Frígora', () => {
  it('slows on the first hit and freezes on the third', () => {
    const game = createGame(SEED, free);
    step(game, [
      { type: 'spawnZombie', row: 3 },
      { type: 'place', kind: 'frigora', row: 3, col: 0 },
    ]);
    const zombie = game.zombies[0];
    while (zombie.chill === 0) step(game);
    expect(isSlowed(game, zombie)).toBe(true);
    expect(zombie.hp).toBe(ZOMBIES.despistado.hp);
    while (!isFrozen(game, zombie)) step(game);
    const x = zombie.x;
    run(game, 10);
    expect(zombie.x).toBe(x);
  });
});

describe('Zarzina', () => {
  it('swallows the zombie in front and then digests', () => {
    const game = createGame(SEED, free);
    step(game, [
      { type: 'place', kind: 'zarzina', row: 2, col: 3 },
      { type: 'spawnZombie', row: 2, kind: 'balderon' },
    ]);
    run(game, 60 * TICKS_PER_SECOND);
    expect(game.zombies).toHaveLength(0);
    expect(game.stats.killed).toBe(1);
    expect(game.effects.some((effect) => effect.type === 'chomp') || game.plants[0].digestUntil > 0).toBe(true);
  });
});

describe('waves mode', () => {
  it('ends in defeat when a zombie gets past a spent mower', () => {
    const game = createGame(SEED, {}, 'waves');
    expect(game.sun).toBe(LEVELS[2].startingSun);
    step(game, [{ type: 'spawnZombie', row: 0 }]);
    expect(game.zombies).toHaveLength(0);
    // With no plants, the mowers stop the first zombie of each lane and a
    // later one walks in.
    run(game, (LEVELS[2].waves[LEVELS[2].waves.length - 1].at + 90) * TICKS_PER_SECOND);
    expect(game.outcome).toBe('defeat');
    expect(game.stats.mowersUsed).toBeGreaterThan(0);
    const tick = game.tick;
    step(game);
    expect(game.tick).toBe(tick);
  });

  it('can be won with a strong defence', () => {
    const game = createGame(SEED, {}, 'waves');
    // Cheat in a fortress so the test only checks the wave bookkeeping.
    game.options.infiniteSun = true;
    game.options.noCooldown = true;
    const commands: Command[] = [];
    for (let row = 0; row < 5; row++) {
      commands.push({ type: 'place', kind: 'cardon', row, col: 0 }, { type: 'place', kind: 'cardon', row, col: 1 });
      commands.push({ type: 'place', kind: 'nabu', row, col: 2 }, { type: 'place', kind: 'nabu', row, col: 3 });
      commands.push({ type: 'place', kind: 'frigora', row, col: 4 }, { type: 'place', kind: 'cortezon', row, col: 6 });
    }
    step(game, commands);
    run(game, (LEVELS[2].waves[LEVELS[2].waves.length - 1].at + 90) * TICKS_PER_SECOND);
    expect(game.outcome).toBe('victory');
    expect(game.stats.killed).toBe(LEVELS[2].waves.reduce((sum, wave) => sum + wave.zombies.length, 0));
  });
});

// ─── Event levels ───────────────────────────────────────────────────────────
describe('levels', () => {
  it('pay more each time and 1500 coins in total', () => {
    const rewards = LEVELS.map((level) => level.reward);
    expect(rewards).toEqual([...rewards].sort((a, b) => a - b));
    expect(new Set(rewards).size).toBe(rewards.length);
    expect(rewards.reduce((sum, value) => sum + value, 0)).toBe(1500);
  });

  it('only allow the chosen seed packets', () => {
    const loadout = ['solmiel', 'nabu'] as const;
    const game = createGame(SEED, {}, 'waves', { level: 1, loadout: [...loadout] });
    expect(game.sun).toBe(LEVELS[0].startingSun);
    expect(canPlace(game, 'cortezon', 0, 0)).toBe('locked');
    expect(canPlace(game, 'solmiel', 0, 0)).toBe('ok');
  });

  it('validate loadouts', () => {
    expect(isValidLoadout(['solmiel'])).toBe(true);
    expect(isValidLoadout([])).toBe(false);
    expect(isValidLoadout(['solmiel', 'solmiel'])).toBe(false);
    expect(isValidLoadout(['solmiel', 'velaria'])).toBe(false);
    expect(isValidLoadout(['solmiel', 'nabu', 'mordiseta', 'cortezon', 'frigora', 'granadin', 'zarzina'])).toBe(false);
    expect(MAX_LOADOUT).toBe(6);
  });

  it('reject sandbox commands in a match log', () => {
    expect(parseLoggedCommand([10, { type: 'place', kind: 'nabu', row: 1, col: 2 }])).not.toBeNull();
    expect(parseLoggedCommand([10, { type: 'spawnZombie', row: 1 }])).toBeNull();
    expect(parseLoggedCommand([10, { type: 'options', options: { infiniteSun: true } }])).toBeNull();
    expect(parseLoggedCommand([10, { type: 'resetMowers' }])).toBeNull();
    expect(parseLoggedCommand([-1, { type: 'collect', sunId: 3 }])).toBeNull();
    expect(parseLoggedCommand([10, { type: 'place', kind: 'nabu', row: 9, col: 2 }])).toBeNull();
  });

  it('replay a logged match to the same result as live play', () => {
    const loadout = ['solmiel', 'nabu', 'cardon', 'cortezon', 'frigora', 'mordiseta'] as const;
    const live = createGame(SEED, {}, 'waves', { level: 1, loadout: [...loadout] });
    const log: LoggedCommand[] = [];
    let planted = 0;
    const plan: [typeof loadout[number], number, number][] = [
      ['solmiel', 0, 0], ['solmiel', 1, 0], ['solmiel', 2, 0], ['solmiel', 3, 0], ['solmiel', 4, 0],
      ['nabu', 0, 1], ['nabu', 1, 1], ['nabu', 2, 1], ['nabu', 3, 1], ['nabu', 4, 1],
      ['cardon', 0, 2], ['cardon', 1, 2], ['cardon', 2, 2], ['cardon', 3, 2], ['cardon', 4, 2],
      ['cortezon', 0, 6], ['cortezon', 1, 6], ['cortezon', 2, 6], ['cortezon', 3, 6], ['cortezon', 4, 6],
    ];
    // A simple bot: collect every sun, plant the next item whenever possible.
    while (!live.outcome && live.tick < 260 * TICKS_PER_SECOND) {
      const commands: Command[] = live.suns.map((sun) => ({ type: 'collect', sunId: sun.id }) as Command);
      const next = plan[planted];
      if (next) {
        const after = live.sun + live.suns.reduce((sum, sun) => sum + sun.value, 0);
        if (after >= PLANTS[next[0]].cost && canPlace({ ...live, sun: after }, next[0], next[1], next[2]) === 'ok') {
          commands.push({ type: 'place', kind: next[0], row: next[1], col: next[2] });
          planted++;
        }
      }
      for (const command of commands) log.push([live.tick, command]);
      step(live, commands);
    }
    expect(live.outcome).not.toBeNull();
    expect(log.length).toBeGreaterThan(20);
    const replay = replayLevel(SEED, 1, [...loadout], log);
    expect(replay.outcome).toBe(live.outcome);
    expect(replay.tick).toBe(live.tick);
    expect(replay.stats).toEqual(live.stats);
  });

  it('a forged log cannot win', () => {
    const replay = replayLevel(SEED, 1, ['solmiel'], [[0, { type: 'collect', sunId: 999 }]]);
    expect(replay.outcome).toBe('defeat');
  });
});
