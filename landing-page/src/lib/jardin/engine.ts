/**
 * Jardín — deterministic lane-defense engine.
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

export type PlantKind =
  | 'solmiel'
  | 'nabu'
  | 'cortezon'
  | 'granadin'
  | 'mordiseta'
  | 'cardon'
  | 'frigora'
  | 'zarzina';
export type PlantClip =
  | 'spawn'
  | 'idle'
  | 'attack'
  | 'damaged'
  | 'critical';
export type ZombieKind = 'despistado' | 'conero' | 'balderon';
export type ZombieClip = 'spawn' | 'walk' | 'bite' | 'fall' | 'armor-break';
export type MowerClip = 'idle' | 'start' | 'run';
export type ProjectileKind = 'seed' | 'spore' | 'spine' | 'frost';
export type GameMode = 'sandbox' | 'waves';

export interface PlantDef {
  kind: PlantKind;
  name: string;
  role: string;
  cost: number;
  hp: number;
  /** Seed packet recharge, in ticks. */
  cooldown: number;
}

/** Attackers are fragile: a zombie eats one in four bites (~5 s). */
const ATTACKER_HP = 160;

export const PLANTS: Record<PlantKind, PlantDef> = {
  solmiel: { kind: 'solmiel', name: 'Solmiel', role: 'Produce 25 de sol', cost: 50, hp: 300, cooldown: s(7.5) },
  nabu: { kind: 'nabu', name: 'Nabú', role: 'Escupe semillas', cost: 100, hp: ATTACKER_HP, cooldown: s(7.5) },
  mordiseta: { kind: 'mordiseta', name: 'Mordiseta', role: 'Esporas de corto alcance', cost: 25, hp: ATTACKER_HP, cooldown: s(7.5) },
  cortezon: { kind: 'cortezon', name: 'Cortezón', role: 'Muro resistente', cost: 50, hp: 4000, cooldown: s(30) },
  frigora: { kind: 'frigora', name: 'Frígora', role: 'Ralentiza y congela', cost: 100, hp: ATTACKER_HP, cooldown: s(7.5) },
  granadin: { kind: 'granadin', name: 'Granadín', role: 'Explota en 3×3', cost: 200, hp: 9999, cooldown: s(50) },
  zarzina: { kind: 'zarzina', name: 'Zarzina', role: 'Devora de un mordisco', cost: 150, hp: ATTACKER_HP, cooldown: s(7.5) },
  cardon: { kind: 'cardon', name: 'Cardón', role: 'Espinas que atraviesan', cost: 175, hp: ATTACKER_HP, cooldown: s(7.5) },
};
export const PLANT_ORDER: PlantKind[] = [
  'solmiel',
  'nabu',
  'mordiseta',
  'cortezon',
  'frigora',
  'granadin',
  'zarzina',
  'cardon',
];

export interface ZombieDef {
  kind: ZombieKind;
  name: string;
  hp: number;
  armor: number;
  /** Walk tempo from the art pack; scales speed and the walk animation. */
  gait: number;
}

export const ZOMBIES: Record<ZombieKind, ZombieDef> = {
  despistado: { kind: 'despistado', name: 'Despistado', hp: 200, armor: 0, gait: 1 },
  conero: { kind: 'conero', name: 'Conero', hp: 200, armor: 220, gait: 1.08 },
  balderon: { kind: 'balderon', name: 'Balderón', hp: 200, armor: 560, gait: 0.82 },
};
export const ZOMBIE_ORDER: ZombieKind[] = ['despistado', 'conero', 'balderon'];

// Timings come from the events in each sprite's JSON so the art and the
// gameplay stay in sync (e.g. Nabú releases its seed at 0.43 s of `attack`).
export const TIMING = {
  plantSpawn: s(1.2),
  attackClip: s(1.2),
  fireInterval: s(1.5),
  release: { nabu: 13, mordiseta: 18, cardon: 14, frigora: 16 } as Record<string, number>,
  solmielRelease: 17,
  solmielFirst: s(7),
  solmielInterval: s(24),
  granadinFuse: 21,
  zarzinaBite: 14,
  zarzinaDigest: s(15),
  zombieSpawn: s(1),
  armorBreak: s(0.8),
  biteCycle: 36,
  biteFrame: 16,
  zombieFall: s(1.4),
  corpseLinger: s(1),
  slow: s(3),
  freeze: s(1.2),
  skySunInterval: s(10),
  sunLifetime: s(10),
  autoWaveInterval: s(9),
  mowerStart: s(0.4),
} as const;

export const BALANCE = {
  startingSun: 150,
  wavesStartingSun: 100,
  sunValue: 25,
  shotDamage: 20,
  explosionDamage: 1800,
  /** Cells per tick for a gait of 1; matches the walk cycle at 140 px per cell. */
  zombieSpeed: 0.178 / TICKS_PER_SECOND,
  /** The walk art covers 22.2 rig units/s; the engine walks 1.4× faster. */
  walkFrameRate: 1.4,
  biteDamage: 40,
  skySunFallSpeed: 0.9 / TICKS_PER_SECOND,
  mordisetaRange: 3.5,
  zarzinaReach: 1.6,
  slowFactor: 0.5,
  freezeStacks: 3,
  mowerSpeed: 4 / TICKS_PER_SECOND,
  /** Parked mowers sit in the middle of the house strip. */
  mowerParkX: -0.45,
  /** A zombie that reaches this x sets off its lane's mower. */
  mowerTriggerX: 0.05,
  breachX: -0.6,
} as const;

const PROJECTILES: Record<ProjectileKind, { speed: number; damage: number; pierce: boolean }> = {
  seed: { speed: 4 / TICKS_PER_SECOND, damage: BALANCE.shotDamage, pierce: false },
  spore: { speed: 2.6 / TICKS_PER_SECOND, damage: BALANCE.shotDamage, pierce: false },
  spine: { speed: 5 / TICKS_PER_SECOND, damage: BALANCE.shotDamage, pierce: true },
  frost: { speed: 3 / TICKS_PER_SECOND, damage: 0, pierce: false },
};

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
  /** Zarzina: chewing until this tick. */
  digestUntil: number;
}

export interface Zombie {
  id: number;
  kind: ZombieKind;
  row: number;
  x: number;
  prevX: number;
  hp: number;
  armor: number;
  clip: ZombieClip;
  clipStart: number;
  /** Animation frames elapsed in the current clip (slowed by cold). */
  anim: number;
  target: number | null;
  lastHit: number;
  slowUntil: number;
  freezeUntil: number;
  chill: number;
}

/** One per lane; single use until the garden is reset. */
export interface Mower {
  row: number;
  x: number;
  prevX: number;
  clip: MowerClip;
  clipStart: number;
  used: boolean;
  /** Left the board after its sweep. */
  gone: boolean;
}

export interface Projectile {
  id: number;
  kind: ProjectileKind;
  row: number;
  x: number;
  prevX: number;
  maxX: number;
  hit: number[];
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

export interface Effect {
  type: 'blast' | 'chomp';
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

export interface Wave {
  /** Seconds since the start of the level. */
  at: number;
  zombies: ZombieKind[];
  flag?: 'big' | 'final';
}

export const LEVEL_WAVES: Wave[] = [
  { at: 25, zombies: ['despistado'] },
  { at: 42, zombies: ['despistado'] },
  { at: 58, zombies: ['despistado', 'despistado'] },
  { at: 74, zombies: ['conero'] },
  { at: 90, zombies: ['despistado', 'conero'] },
  { at: 108, zombies: ['despistado', 'despistado', 'conero', 'conero', 'despistado'], flag: 'big' },
  { at: 130, zombies: ['conero', 'despistado'] },
  { at: 146, zombies: ['balderon'] },
  { at: 162, zombies: ['conero', 'despistado', 'despistado'] },
  { at: 180, zombies: ['balderon', 'conero', 'despistado'] },
  {
    at: 202,
    zombies: ['despistado', 'despistado', 'conero', 'conero', 'balderon', 'balderon', 'despistado', 'conero'],
    flag: 'final',
  },
];

export interface JardinState {
  mode: GameMode;
  tick: number;
  rngState: { rng: Rng };
  nextId: number;
  sun: number;
  plants: Plant[];
  zombies: Zombie[];
  mowers: Mower[];
  projectiles: Projectile[];
  suns: Sun[];
  effects: Effect[];
  cooldowns: Record<PlantKind, number>;
  nextSkySun: number;
  nextWave: number;
  waves: { index: number; pending: { tick: number; kind: ZombieKind; row: number }[] };
  announcement: { text: string; tick: number } | null;
  outcome: 'victory' | 'defeat' | null;
  stats: { killed: number; breaches: number; sunCollected: number; mowersUsed: number; planted: number };
  options: SandboxOptions;
}

export type Command =
  | { type: 'place'; kind: PlantKind; row: number; col: number }
  | { type: 'shovel'; row: number; col: number }
  | { type: 'collect'; sunId: number }
  | { type: 'spawnZombie'; row?: number; kind?: ZombieKind }
  | { type: 'resetMowers' }
  | { type: 'options'; options: Partial<SandboxOptions> };

export const DEFAULT_OPTIONS: SandboxOptions = {
  infiniteSun: false,
  noCooldown: false,
  autoWaves: true,
  skySun: true,
  autoCollect: false,
};

const WAVES_OPTIONS: SandboxOptions = {
  infiniteSun: false,
  noCooldown: false,
  autoWaves: false,
  skySun: true,
  autoCollect: false,
};

function emptyCooldowns(): Record<PlantKind, number> {
  return Object.fromEntries(PLANT_ORDER.map((kind) => [kind, 0])) as Record<PlantKind, number>;
}

function freshMowers(tick: number): Mower[] {
  return Array.from({ length: ROWS }, (_, row) => ({
    row,
    x: BALANCE.mowerParkX,
    prevX: BALANCE.mowerParkX,
    clip: 'idle' as const,
    clipStart: tick,
    used: false,
    gone: false,
  }));
}

export function createGame(
  seed: string,
  options: Partial<SandboxOptions> = {},
  mode: GameMode = 'sandbox',
): JardinState {
  const waves = mode === 'waves';
  return {
    mode,
    tick: 0,
    rngState: { rng: createSeededRng(seed) },
    nextId: 1,
    sun: waves ? BALANCE.wavesStartingSun : BALANCE.startingSun,
    plants: [],
    zombies: [],
    mowers: freshMowers(0),
    projectiles: [],
    suns: [],
    effects: [],
    cooldowns: emptyCooldowns(),
    nextSkySun: s(4),
    nextWave: s(12),
    waves: { index: 0, pending: [] },
    announcement: null,
    outcome: null,
    stats: { killed: 0, breaches: 0, sunCollected: 0, mowersUsed: 0, planted: 0 },
    options: waves ? { ...WAVES_OPTIONS } : { ...DEFAULT_OPTIONS, ...options },
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────
export function plantAt(state: JardinState, row: number, col: number): Plant | undefined {
  return state.plants.find((plant) => plant.row === row && plant.col === col);
}

export type PlaceCheck = 'ok' | 'occupied' | 'sun' | 'cooldown' | 'outside' | 'over';

export function canPlace(state: JardinState, kind: PlantKind, row: number, col: number): PlaceCheck {
  if (state.outcome) return 'over';
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

/** Level progress for the waves mode, 0..1. */
export function waveProgress(state: JardinState): number {
  const last = LEVEL_WAVES[LEVEL_WAVES.length - 1].at;
  return Math.min(1, state.tick / s(last));
}

export const isAlive = (zombie: Zombie) => zombie.clip !== 'fall';
export const isFrozen = (state: JardinState, zombie: Zombie) => state.tick < zombie.freezeUntil;
export const isSlowed = (state: JardinState, zombie: Zombie) => state.tick < zombie.slowUntil;
export const hasArmor = (zombie: Zombie) => zombie.armor > 0;

// ─── Commands ───────────────────────────────────────────────────────────────
function apply(state: JardinState, command: Command) {
  switch (command.type) {
    case 'place': {
      if (!(command.kind in PLANTS)) return;
      if (canPlace(state, command.kind, command.row, command.col) !== 'ok') return;
      const def = PLANTS[command.kind];
      if (!state.options.infiniteSun) state.sun -= def.cost;
      state.cooldowns[command.kind] = state.tick + def.cooldown;
      state.stats.planted++;
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
        digestUntil: 0,
      });
      return;
    }
    case 'shovel': {
      const plant = plantAt(state, command.row, command.col);
      if (plant && !state.outcome) removePlant(state, plant);
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
      if (state.mode !== 'sandbox') return;
      const row =
        command.row !== undefined && Number.isInteger(command.row) && command.row >= 0 && command.row < ROWS
          ? command.row
          : Math.floor(state.rngState.rng() * ROWS);
      const kind = command.kind && command.kind in ZOMBIES ? command.kind : 'despistado';
      spawnZombie(state, row, kind);
      return;
    }
    case 'resetMowers':
      if (state.mode !== 'sandbox') return;
      // Keep a mower that is still sweeping; refill every other lane.
      state.mowers = freshMowers(state.tick).map((fresh) => {
        const current = state.mowers[fresh.row];
        return current.used && !current.gone ? current : fresh;
      });
      return;
    case 'options':
      if (state.mode !== 'sandbox') return;
      state.options = { ...state.options, ...command.options };
      return;
  }
}

function removePlant(state: JardinState, plant: Plant) {
  state.plants = state.plants.filter((other) => other !== plant);
  for (const zombie of state.zombies) if (zombie.target === plant.id) startWalking(state, zombie);
}

function setPlantClip(state: JardinState, plant: Plant, clip: PlantClip) {
  plant.clip = clip;
  plant.clipStart = state.tick;
}

function setZombieClip(state: JardinState, zombie: Zombie, clip: ZombieClip) {
  zombie.clip = clip;
  zombie.clipStart = state.tick;
  zombie.anim = 0;
}

function spawnZombie(state: JardinState, row: number, kind: ZombieKind) {
  const def = ZOMBIES[kind];
  const x = COLS + 0.35 + state.rngState.rng() * 0.3;
  state.zombies.push({
    id: state.nextId++,
    kind,
    row,
    x,
    prevX: x,
    hp: def.hp,
    armor: def.armor,
    clip: 'spawn',
    clipStart: state.tick,
    anim: 0,
    target: null,
    lastHit: -1,
    slowUntil: 0,
    freezeUntil: 0,
    chill: 0,
  });
}

function startWalking(state: JardinState, zombie: Zombie) {
  zombie.target = null;
  if (zombie.clip === 'bite') setZombieClip(state, zombie, 'walk');
}

function damageZombie(state: JardinState, zombie: Zombie, amount: number) {
  if (!isAlive(zombie) || amount <= 0) return;
  zombie.lastHit = state.tick;
  const hadArmor = hasArmor(zombie);
  const absorbed = Math.min(zombie.armor, amount);
  zombie.armor -= absorbed;
  zombie.hp -= amount - absorbed;
  if (zombie.hp <= 0) {
    zombie.target = null;
    setZombieClip(state, zombie, 'fall');
    state.stats.killed++;
  } else if (hadArmor && !hasArmor(zombie)) {
    zombie.target = null;
    setZombieClip(state, zombie, 'armor-break');
  }
}

function chillZombie(state: JardinState, zombie: Zombie) {
  if (!isAlive(zombie)) return;
  zombie.lastHit = state.tick;
  if (isFrozen(state, zombie)) return;
  zombie.slowUntil = state.tick + TIMING.slow;
  zombie.chill++;
  if (zombie.chill >= BALANCE.freezeStacks) {
    zombie.chill = 0;
    zombie.freezeUntil = state.tick + TIMING.freeze;
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

function hitPlant(state: JardinState, plant: Plant, damage: number) {
  plant.hp -= damage;
  plant.lastHit = state.tick;
  if (plant.hp <= 0) removePlant(state, plant);
}

// ─── Plants ─────────────────────────────────────────────────────────────────
function zombiesAhead(state: JardinState, plant: Plant, range = COLS + 0.4) {
  return state.zombies.filter(
    (zombie) =>
      isAlive(zombie) &&
      zombie.row === plant.row &&
      zombie.x > plant.col + 0.3 &&
      zombie.x <= Math.min(COLS + 0.4, plant.col + 0.5 + range),
  );
}

function shoot(state: JardinState, plant: Plant, kind: ProjectileKind, range?: number) {
  const x = plant.col + 0.8;
  state.projectiles.push({
    id: state.nextId++,
    kind,
    row: plant.row,
    x,
    prevX: x,
    maxX: range === undefined ? COLS + 1 : plant.col + 0.5 + range + 0.2,
    hit: [],
  });
}

const SHOOTERS: Partial<Record<PlantKind, { projectile: ProjectileKind; range?: number }>> = {
  nabu: { projectile: 'seed' },
  mordiseta: { projectile: 'spore', range: BALANCE.mordisetaRange },
  cardon: { projectile: 'spine' },
  frigora: { projectile: 'frost' },
};

function updateShooter(state: JardinState, plant: Plant) {
  const shooter = SHOOTERS[plant.kind]!;
  const threatened = zombiesAhead(state, plant, shooter.range).length > 0;
  if (threatened && plant.clip !== 'spawn' && state.tick >= plant.nextAction) {
    setPlantClip(state, plant, 'attack');
    plant.pendingRelease = state.tick + TIMING.release[plant.kind];
    plant.nextAction = state.tick + TIMING.fireInterval;
  }
  if (plant.pendingRelease !== null && state.tick >= plant.pendingRelease) {
    plant.pendingRelease = null;
    shoot(state, plant, shooter.projectile, shooter.range);
  }
}

function updateZarzina(state: JardinState, plant: Plant) {
  if (plant.clip === 'spawn' || state.tick < plant.digestUntil) return;
  const inReach = () =>
    zombiesAhead(state, plant, BALANCE.zarzinaReach - 0.5).sort((a, b) => a.x - b.x)[0];
  if (plant.clip === 'idle' && state.tick >= plant.nextAction && inReach()) {
    setPlantClip(state, plant, 'attack');
    plant.pendingRelease = state.tick + TIMING.zarzinaBite;
  }
  if (plant.pendingRelease !== null && state.tick >= plant.pendingRelease) {
    plant.pendingRelease = null;
    const prey = inReach();
    if (prey) {
      damageZombie(state, prey, Number.POSITIVE_INFINITY);
      // Swallowed whole: no corpse to watch fall.
      state.zombies = state.zombies.filter((zombie) => zombie !== prey);
      state.effects.push({ type: 'chomp', row: plant.row, col: plant.col, tick: state.tick });
      plant.digestUntil = state.tick + TIMING.zarzinaDigest;
    } else {
      plant.nextAction = state.tick + s(0.5);
    }
  }
}

function updatePlants(state: JardinState) {
  const { rng } = state.rngState;
  for (const plant of [...state.plants]) {
    if (!state.plants.includes(plant)) continue;
    const age = state.tick - plant.clipStart;
    if (plant.clip === 'spawn' && age >= TIMING.plantSpawn) setPlantClip(state, plant, 'idle');
    if (plant.clip === 'attack' && plant.kind !== 'granadin' && age >= TIMING.attackClip)
      setPlantClip(state, plant, 'idle');

    switch (plant.kind) {
      case 'nabu':
      case 'mordiseta':
      case 'cardon':
      case 'frigora':
        updateShooter(state, plant);
        break;
      case 'zarzina':
        updateZarzina(state, plant);
        break;
      case 'solmiel': {
        if (state.tick >= plant.nextAction) {
          setPlantClip(state, plant, 'attack');
          plant.pendingRelease = state.tick + TIMING.solmielRelease;
          plant.nextAction = state.tick + TIMING.solmielInterval;
        }
        if (plant.pendingRelease !== null && state.tick >= plant.pendingRelease) {
          plant.pendingRelease = null;
          // Drop it on the grass to the right of the flower so it stands out.
          const x = plant.col + 0.8 + rng() * 0.12;
          dropSun(state, x, plant.row + 0.3, plant.row + 0.78, true);
        }
        break;
      }
      case 'granadin': {
        if (state.tick >= plant.nextAction) {
          state.effects.push({ type: 'blast', row: plant.row, col: plant.col, tick: state.tick });
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
        const clip: PlantClip = ratio > 0.55 ? 'idle' : ratio > 0.25 ? 'damaged' : 'critical';
        if (clip !== plant.clip) setPlantClip(state, plant, clip);
        break;
      }
    }
  }
}

// ─── Projectiles, zombies, mowers ───────────────────────────────────────────
function updateProjectiles(state: JardinState) {
  for (const projectile of [...state.projectiles]) {
    const def = PROJECTILES[projectile.kind];
    projectile.prevX = projectile.x;
    projectile.x += def.speed;
    const touching = state.zombies
      .filter(
        (zombie) =>
          isAlive(zombie) &&
          zombie.row === projectile.row &&
          !projectile.hit.includes(zombie.id) &&
          zombie.x - 0.3 <= projectile.x &&
          zombie.x + 0.3 >= projectile.x - def.speed,
      )
      .sort((a, b) => a.x - b.x);
    let consumed = false;
    for (const zombie of def.pierce ? touching : touching.slice(0, 1)) {
      if (projectile.kind === 'frost') chillZombie(state, zombie);
      else damageZombie(state, zombie, def.damage);
      projectile.hit.push(zombie.id);
      consumed = !def.pierce;
    }
    if (consumed || projectile.x > projectile.maxX)
      state.projectiles = state.projectiles.filter((other) => other !== projectile);
  }
}

function coldFactor(state: JardinState, zombie: Zombie) {
  if (isFrozen(state, zombie)) return 0;
  return isSlowed(state, zombie) ? BALANCE.slowFactor : 1;
}

function updateZombies(state: JardinState) {
  for (const zombie of [...state.zombies]) {
    zombie.prevX = zombie.x;
    if (state.tick >= zombie.slowUntil) zombie.chill = 0;
    const age = state.tick - zombie.clipStart;
    const factor = coldFactor(state, zombie);
    const gait = ZOMBIES[zombie.kind].gait;

    if (zombie.clip === 'fall') {
      zombie.anim += 1;
      if (age >= TIMING.zombieFall + TIMING.corpseLinger)
        state.zombies = state.zombies.filter((other) => other !== zombie);
      continue;
    }
    if (zombie.clip === 'spawn') {
      zombie.anim += 1;
      if (age >= TIMING.zombieSpawn) setZombieClip(state, zombie, 'walk');
      continue;
    }
    if (zombie.clip === 'armor-break') {
      zombie.anim += factor;
      if (zombie.anim >= TIMING.armorBreak) setZombieClip(state, zombie, 'walk');
      continue;
    }

    if (zombie.clip === 'bite') {
      const target = state.plants.find((plant) => plant.id === zombie.target);
      if (!target) {
        startWalking(state, zombie);
        continue;
      }
      const before = zombie.anim;
      zombie.anim += factor;
      const cycle = TIMING.biteCycle;
      const crossed =
        Math.floor((zombie.anim - TIMING.biteFrame) / cycle) > Math.floor((before - TIMING.biteFrame) / cycle);
      // Granadín is mid-fuse: zombies cannot eat it before it blows up.
      if (crossed && target.kind !== 'granadin') hitPlant(state, target, BALANCE.biteDamage);
      continue;
    }

    // Walking: bite the first plant whose cell the zombie's mouth reaches.
    const victim = state.plants
      .filter((plant) => plant.row === zombie.row && zombie.x - 0.35 <= plant.col + 0.85 && zombie.x > plant.col + 0.2)
      .sort((a, b) => b.col - a.col)[0];
    if (victim) {
      setZombieClip(state, zombie, 'bite');
      zombie.target = victim.id;
      continue;
    }
    zombie.anim += BALANCE.walkFrameRate * gait * factor;
    zombie.x -= BALANCE.zombieSpeed * gait * factor;
    if (zombie.x < BALANCE.breachX) {
      state.stats.breaches++;
      state.zombies = state.zombies.filter((other) => other !== zombie);
      if (state.mode === 'waves') state.outcome = 'defeat';
    }
  }
}

function updateMowers(state: JardinState) {
  for (const mower of state.mowers) {
    mower.prevX = mower.x;
    if (mower.gone) continue;
    if (!mower.used) {
      const arrived = state.zombies.some(
        (zombie) => isAlive(zombie) && zombie.row === mower.row && zombie.x <= BALANCE.mowerTriggerX,
      );
      if (!arrived) continue;
      mower.used = true;
      mower.clip = 'start';
      mower.clipStart = state.tick;
      state.stats.mowersUsed++;
    }
    if (mower.clip === 'start' && state.tick - mower.clipStart >= TIMING.mowerStart) {
      mower.clip = 'run';
      mower.clipStart = state.tick;
    }
    if (mower.clip === 'run') mower.x += BALANCE.mowerSpeed;
    for (const zombie of state.zombies) {
      if (zombie.row === mower.row && Math.abs(zombie.x - mower.x) < 0.55)
        damageZombie(state, zombie, Number.POSITIVE_INFINITY);
    }
    if (mower.x > COLS + 2) mower.gone = true;
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

function randomKind(rng: Rng): ZombieKind {
  const roll = rng();
  return roll < 0.6 ? 'despistado' : roll < 0.9 ? 'conero' : 'balderon';
}

function updateWaves(state: JardinState) {
  const { rng } = state.rngState;
  const wave = LEVEL_WAVES[state.waves.index];
  if (wave && state.tick >= s(wave.at)) {
    state.waves.index++;
    let offset = 0;
    for (const kind of wave.zombies) {
      state.waves.pending.push({ tick: state.tick + offset, kind, row: Math.floor(rng() * ROWS) });
      offset += s(0.4) + Math.floor(rng() * s(1.2));
    }
    if (wave.flag === 'big') state.announcement = { text: '¡Se acerca una gran oleada!', tick: state.tick };
    if (wave.flag === 'final') state.announcement = { text: '¡Oleada final!', tick: state.tick };
  }
  for (const spawn of [...state.waves.pending]) {
    if (state.tick < spawn.tick) continue;
    spawnZombie(state, spawn.row, spawn.kind);
    state.waves.pending = state.waves.pending.filter((other) => other !== spawn);
  }
  const finished =
    state.waves.index >= LEVEL_WAVES.length &&
    state.waves.pending.length === 0 &&
    !state.zombies.some(isAlive);
  if (finished && !state.outcome) state.outcome = 'victory';
}

function updateSpawners(state: JardinState) {
  const { rng } = state.rngState;
  if (state.options.skySun && state.tick >= state.nextSkySun) {
    state.nextSkySun = state.tick + TIMING.skySunInterval;
    const x = 0.5 + rng() * (COLS - 1);
    dropSun(state, x, -0.6, 0.5 + rng() * (ROWS - 1), false);
  }
  if (state.mode === 'waves') updateWaves(state);
  else if (state.options.autoWaves && state.tick >= state.nextWave) {
    state.nextWave = state.tick + TIMING.autoWaveInterval;
    spawnZombie(state, Math.floor(rng() * ROWS), randomKind(rng));
  }
  state.effects = state.effects.filter((effect) => state.tick - effect.tick < s(1));
}

/** Advances one tick, applying `commands` first. Mutates `state`. */
export function step(state: JardinState, commands: readonly Command[] = []): JardinState {
  if (state.outcome) {
    // The board freezes on victory or defeat; only sun can still be picked up.
    for (const command of commands) if (command.type === 'collect') apply(state, command);
    return state;
  }
  for (const command of commands) apply(state, command);
  updatePlants(state);
  updateProjectiles(state);
  updateZombies(state);
  updateMowers(state);
  updateSuns(state);
  updateSpawners(state);
  state.tick++;
  return state;
}
