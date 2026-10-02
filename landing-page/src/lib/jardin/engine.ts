/**
 * Jardín — deterministic lane-defense engine (sandbox).
 *
 * The simulation advances in fixed ticks (30 per second, the frame rate of the
 * art) and draws randomness only from a seeded RNG, so the same seed and the
 * same timed commands always produce the same game. That keeps it testable and
 * lets a server replay a match later, exactly like the battle mode.
 *
 * Coordinates: rows 0..ROWS-1 from top to bottom; `x` is measured in cells
 * from the left edge of the lawn (the house side) to COLS at the right edge,
 * where zombies enter. The state is mutated in place by `step`.
 */
import { createSeededRng, type Rng } from '@/services/battleEngine';

export const ROWS = 5;
export const COLS = 9;
export const TICKS_PER_SECOND = 30;
const s = (seconds: number) => Math.round(seconds * TICKS_PER_SECOND);

export type PlantKind = 'solmiel' | 'nabu' | 'cortezon' | 'granadin';
export type PlantClip = 'spawn' | 'idle' | 'attack' | 'damaged' | 'critical';
export type ZombieClip = 'spawn' | 'walk' | 'bite' | 'fall';

export interface PlantDef {
  kind: PlantKind;
  name: string;
  role: string;
  cost: number;
  hp: number;
  /** Seed packet recharge, in ticks. */
  cooldown: number;
}

export const PLANTS: Record<PlantKind, PlantDef> = {
  solmiel: { kind: 'solmiel', name: 'Solmiel', role: 'Produce 25 de sol', cost: 50, hp: 300, cooldown: s(7.5) },
  nabu: { kind: 'nabu', name: 'Nabú', role: 'Escupe semillas', cost: 100, hp: 300, cooldown: s(7.5) },
  cortezon: { kind: 'cortezon', name: 'Cortezón', role: 'Muro resistente', cost: 50, hp: 4000, cooldown: s(30) },
  granadin: { kind: 'granadin', name: 'Granadín', role: 'Explota en 3×3', cost: 150, hp: 9999, cooldown: s(50) },
};
export const PLANT_ORDER: PlantKind[] = ['solmiel', 'nabu', 'cortezon', 'granadin'];

// Timings come from the events in each sprite's JSON so the art and the
// gameplay stay in sync (e.g. Nabú releases its seed at 0.43 s of `attack`).
export const TIMING = {
  plantSpawn: s(1.2),
  attackClip: s(1.2),
  nabuRelease: 13,
  nabuInterval: s(1.5),
  solmielRelease: 17,
  solmielFirst: s(7),
  solmielInterval: s(24),
  granadinFuse: 21,
  zombieSpawn: s(1),
  biteCycle: s(1.2),
  biteFrame: 16,
  zombieFall: s(1.4),
  corpseLinger: s(1),
  skySunInterval: s(10),
  sunLifetime: s(10),
  autoWaveInterval: s(9),
} as const;

export const BALANCE = {
  startingSun: 150,
  sunValue: 25,
  seedDamage: 20,
  seedSpeed: 4 / TICKS_PER_SECOND,
  explosionDamage: 1800,
  zombieHp: 200,
  /** Cells per tick; matches the walk cycle when drawn at 140 px per cell. */
  zombieSpeed: 0.178 / TICKS_PER_SECOND,
  biteDamage: 40,
  skySunFallSpeed: 0.9 / TICKS_PER_SECOND,
} as const;

export interface Plant {
  id: number;
  kind: PlantKind;
  row: number;
  col: number;
  hp: number;
  clip: PlantClip;
  clipStart: number;
  /** Tick of the next shot or sun; for Granadín, the detonation tick. */
  nextAction: number;
  pendingRelease: number | null;
  lastHit: number;
}

export interface Zombie {
  id: number;
  row: number;
  x: number;
  prevX: number;
  hp: number;
  clip: ZombieClip;
  clipStart: number;
  target: number | null;
  lastHit: number;
}

export interface Projectile {
  id: number;
  row: number;
  x: number;
  prevX: number;
}

export interface Sun {
  id: number;
  x: number;
  y: number;
  prevY: number;
  targetY: number;
  value: number;
  bornAt: number;
  fromPlant: boolean;
}

export interface Blast {
  row: number;
  col: number;
  tick: number;
}

export interface SandboxOptions {
  infiniteSun: boolean;
  noCooldown: boolean;
  autoWaves: boolean;
  skySun: boolean;
  autoCollect: boolean;
}

export interface JardinState {
  tick: number;
  rngState: { rng: Rng };
  nextId: number;
  sun: number;
  plants: Plant[];
  zombies: Zombie[];
  projectiles: Projectile[];
  suns: Sun[];
  blasts: Blast[];
  cooldowns: Record<PlantKind, number>;
  nextSkySun: number;
  nextWave: number;
  stats: { killed: number; breaches: number; sunCollected: number };
  options: SandboxOptions;
}

export type Command =
  | { type: 'place'; kind: PlantKind; row: number; col: number }
  | { type: 'shovel'; row: number; col: number }
  | { type: 'collect'; sunId: number }
  | { type: 'spawnZombie'; row?: number }
  | { type: 'options'; options: Partial<SandboxOptions> };

export const DEFAULT_OPTIONS: SandboxOptions = {
  infiniteSun: false,
  noCooldown: false,
  autoWaves: true,
  skySun: true,
  autoCollect: false,
};

export function createGame(seed: string, options: Partial<SandboxOptions> = {}): JardinState {
  return {
    tick: 0,
    rngState: { rng: createSeededRng(seed) },
    nextId: 1,
    sun: BALANCE.startingSun,
    plants: [],
    zombies: [],
    projectiles: [],
    suns: [],
    blasts: [],
    cooldowns: { solmiel: 0, nabu: 0, cortezon: 0, granadin: 0 },
    nextSkySun: s(4),
    nextWave: s(12),
    stats: { killed: 0, breaches: 0, sunCollected: 0 },
    options: { ...DEFAULT_OPTIONS, ...options },
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────
export function plantAt(state: JardinState, row: number, col: number): Plant | undefined {
  return state.plants.find((plant) => plant.row === row && plant.col === col);
}

export type PlaceCheck = 'ok' | 'occupied' | 'sun' | 'cooldown' | 'outside';

export function canPlace(state: JardinState, kind: PlantKind, row: number, col: number): PlaceCheck {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= ROWS || col < 0 || col >= COLS)
    return 'outside';
  if (plantAt(state, row, col)) return 'occupied';
  if (!state.options.infiniteSun && state.sun < PLANTS[kind].cost) return 'sun';
  if (!state.options.noCooldown && state.cooldowns[kind] > state.tick) return 'cooldown';
  return 'ok';
}

/** 0 when ready, 1 right after planting. */
export function cooldownProgress(state: JardinState, kind: PlantKind): number {
  if (state.options.noCooldown) return 0;
  const remaining = state.cooldowns[kind] - state.tick;
  return remaining > 0 ? remaining / PLANTS[kind].cooldown : 0;
}

const alive = (zombie: Zombie) => zombie.clip !== 'fall';

// ─── Commands ───────────────────────────────────────────────────────────────
function apply(state: JardinState, command: Command) {
  switch (command.type) {
    case 'place': {
      if (!(command.kind in PLANTS)) return;
      if (canPlace(state, command.kind, command.row, command.col) !== 'ok') return;
      const def = PLANTS[command.kind];
      if (!state.options.infiniteSun) state.sun -= def.cost;
      state.cooldowns[command.kind] = state.tick + def.cooldown;
      const granadin = command.kind === 'granadin';
      state.plants.push({
        id: state.nextId++,
        kind: command.kind,
        row: command.row,
        col: command.col,
        hp: def.hp,
        // Granadín skips its entrance and lights the fuse at once.
        clip: granadin ? 'attack' : 'spawn',
        clipStart: state.tick,
        nextAction:
          command.kind === 'solmiel'
            ? state.tick + TIMING.solmielFirst
            : granadin
              ? state.tick + TIMING.granadinFuse
              : state.tick + TIMING.plantSpawn,
        pendingRelease: null,
        lastHit: -1,
      });
      return;
    }
    case 'shovel': {
      const plant = plantAt(state, command.row, command.col);
      if (plant) removePlant(state, plant);
      return;
    }
    case 'collect': {
      const index = state.suns.findIndex((sun) => sun.id === command.sunId);
      if (index === -1) return;
      state.sun += state.suns[index].value;
      state.stats.sunCollected += state.suns[index].value;
      state.suns.splice(index, 1);
      return;
    }
    case 'spawnZombie': {
      const row =
        command.row !== undefined && Number.isInteger(command.row) && command.row >= 0 && command.row < ROWS
          ? command.row
          : Math.floor(state.rngState.rng() * ROWS);
      spawnZombie(state, row);
      return;
    }
    case 'options':
      state.options = { ...state.options, ...command.options };
      return;
  }
}

function removePlant(state: JardinState, plant: Plant) {
  state.plants = state.plants.filter((other) => other !== plant);
  for (const zombie of state.zombies) if (zombie.target === plant.id) startWalking(state, zombie);
}

function spawnZombie(state: JardinState, row: number) {
  const x = COLS + 0.35 + state.rngState.rng() * 0.3;
  state.zombies.push({
    id: state.nextId++,
    row,
    x,
    prevX: x,
    hp: BALANCE.zombieHp,
    clip: 'spawn',
    clipStart: state.tick,
    target: null,
    lastHit: -1,
  });
}

function startWalking(state: JardinState, zombie: Zombie) {
  zombie.target = null;
  if (zombie.clip === 'bite') {
    zombie.clip = 'walk';
    zombie.clipStart = state.tick;
  }
}

function damageZombie(state: JardinState, zombie: Zombie, amount: number) {
  if (!alive(zombie)) return;
  zombie.hp -= amount;
  zombie.lastHit = state.tick;
  if (zombie.hp <= 0) {
    zombie.clip = 'fall';
    zombie.clipStart = state.tick;
    zombie.target = null;
    state.stats.killed++;
  }
}

function dropSun(state: JardinState, x: number, y: number, targetY: number, fromPlant: boolean) {
  state.suns.push({
    id: state.nextId++,
    x,
    y,
    prevY: y,
    targetY,
    value: BALANCE.sunValue,
    bornAt: state.tick,
    fromPlant,
  });
}

// ─── Simulation ─────────────────────────────────────────────────────────────
function updatePlants(state: JardinState) {
  const { rng } = state.rngState;
  for (const plant of [...state.plants]) {
    const age = state.tick - plant.clipStart;
    if (plant.clip === 'spawn' && age >= TIMING.plantSpawn) {
      plant.clip = 'idle';
      plant.clipStart = state.tick;
    }
    if (plant.clip === 'attack' && plant.kind !== 'granadin' && age >= TIMING.attackClip) {
      plant.clip = 'idle';
      plant.clipStart = state.tick;
    }

    switch (plant.kind) {
      case 'nabu': {
        const threatened = state.zombies.some(
          (zombie) => alive(zombie) && zombie.row === plant.row && zombie.x > plant.col + 0.3 && zombie.x < COLS + 0.4,
        );
        if (threatened && plant.clip !== 'spawn' && state.tick >= plant.nextAction) {
          plant.clip = 'attack';
          plant.clipStart = state.tick;
          plant.pendingRelease = state.tick + TIMING.nabuRelease;
          plant.nextAction = state.tick + TIMING.nabuInterval;
        }
        if (plant.pendingRelease !== null && state.tick >= plant.pendingRelease) {
          plant.pendingRelease = null;
          const x = plant.col + 0.8;
          state.projectiles.push({ id: state.nextId++, row: plant.row, x, prevX: x });
        }
        break;
      }
      case 'solmiel': {
        if (state.tick >= plant.nextAction) {
          plant.clip = 'attack';
          plant.clipStart = state.tick;
          plant.pendingRelease = state.tick + TIMING.solmielRelease;
          plant.nextAction = state.tick + TIMING.solmielInterval;
        }
        if (plant.pendingRelease !== null && state.tick >= plant.pendingRelease) {
          plant.pendingRelease = null;
          const x = plant.col + 0.35 + rng() * 0.3;
          dropSun(state, x, plant.row + 0.25, plant.row + 0.55, true);
        }
        break;
      }
      case 'granadin': {
        if (state.tick >= plant.nextAction) {
          state.blasts.push({ row: plant.row, col: plant.col, tick: state.tick });
          for (const zombie of state.zombies) {
            if (Math.abs(zombie.row - plant.row) <= 1 && zombie.x >= plant.col - 0.9 && zombie.x <= plant.col + 2.1)
              damageZombie(state, zombie, BALANCE.explosionDamage);
          }
          removePlant(state, plant);
        }
        break;
      }
      case 'cortezon': {
        if (plant.clip === 'spawn') break;
        const ratio = plant.hp / PLANTS.cortezon.hp;
        const clip: PlantClip = ratio > 2 / 3 ? 'idle' : ratio > 1 / 3 ? 'damaged' : 'critical';
        if (clip !== plant.clip) {
          plant.clip = clip;
          plant.clipStart = state.tick;
        }
        break;
      }
    }
  }
}

function updateProjectiles(state: JardinState) {
  for (const projectile of [...state.projectiles]) {
    projectile.prevX = projectile.x;
    projectile.x += BALANCE.seedSpeed;
    const hit = state.zombies
      .filter(
        (zombie) =>
          alive(zombie) &&
          zombie.row === projectile.row &&
          zombie.x - 0.3 <= projectile.x &&
          zombie.x + 0.3 >= projectile.x - BALANCE.seedSpeed,
      )
      .sort((a, b) => a.x - b.x)[0];
    if (hit) {
      damageZombie(state, hit, BALANCE.seedDamage);
      state.projectiles = state.projectiles.filter((other) => other !== projectile);
    } else if (projectile.x > COLS + 1) {
      state.projectiles = state.projectiles.filter((other) => other !== projectile);
    }
  }
}

function updateZombies(state: JardinState) {
  for (const zombie of [...state.zombies]) {
    zombie.prevX = zombie.x;
    const age = state.tick - zombie.clipStart;
    if (zombie.clip === 'fall') {
      if (age >= TIMING.zombieFall + TIMING.corpseLinger)
        state.zombies = state.zombies.filter((other) => other !== zombie);
      continue;
    }
    if (zombie.clip === 'spawn') {
      if (age < TIMING.zombieSpawn) continue;
      zombie.clip = 'walk';
      zombie.clipStart = state.tick;
    }

    if (zombie.clip === 'bite') {
      const target = state.plants.find((plant) => plant.id === zombie.target);
      if (!target) {
        startWalking(state, zombie);
      } else if ((state.tick - zombie.clipStart) % TIMING.biteCycle === TIMING.biteFrame) {
        // Granadín is mid-fuse: zombies cannot eat it before it blows up.
        if (target.kind !== 'granadin') {
          target.hp -= BALANCE.biteDamage;
          target.lastHit = state.tick;
          if (target.hp <= 0) removePlant(state, target);
        }
      }
      continue;
    }

    // Walking: bite the first plant whose cell the zombie's mouth reaches.
    const victim = state.plants
      .filter((plant) => plant.row === zombie.row && zombie.x - 0.35 <= plant.col + 0.85 && zombie.x > plant.col + 0.2)
      .sort((a, b) => b.col - a.col)[0];
    if (victim) {
      zombie.clip = 'bite';
      zombie.clipStart = state.tick;
      zombie.target = victim.id;
      continue;
    }
    zombie.x -= BALANCE.zombieSpeed;
    if (zombie.x < -0.6) {
      state.stats.breaches++;
      state.zombies = state.zombies.filter((other) => other !== zombie);
    }
  }
}

function updateSuns(state: JardinState) {
  for (const sun of [...state.suns]) {
    sun.prevY = sun.y;
    if (sun.y < sun.targetY) sun.y = Math.min(sun.targetY, sun.y + (sun.fromPlant ? 0.03 : BALANCE.skySunFallSpeed));
    const age = state.tick - sun.bornAt;
    if (state.options.autoCollect && age >= s(0.8)) {
      apply(state, { type: 'collect', sunId: sun.id });
    } else if (age >= TIMING.sunLifetime) {
      state.suns = state.suns.filter((other) => other !== sun);
    }
  }
}

function updateSpawners(state: JardinState) {
  const { rng } = state.rngState;
  if (state.options.skySun && state.tick >= state.nextSkySun) {
    state.nextSkySun = state.tick + TIMING.skySunInterval;
    const x = 0.5 + rng() * (COLS - 1);
    dropSun(state, x, -0.6, 0.5 + rng() * (ROWS - 1), false);
  }
  if (state.options.autoWaves && state.tick >= state.nextWave) {
    state.nextWave = state.tick + TIMING.autoWaveInterval;
    spawnZombie(state, Math.floor(rng() * ROWS));
  }
  state.blasts = state.blasts.filter((blast) => state.tick - blast.tick < s(1));
}

/** Advances one tick, applying `commands` first. Mutates `state`. */
export function step(state: JardinState, commands: readonly Command[] = []): JardinState {
  for (const command of commands) apply(state, command);
  updatePlants(state);
  updateProjectiles(state);
  updateZombies(state);
  updateSuns(state);
  updateSpawners(state);
  state.tick++;
  return state;
}
