/**
 * Game Data Constants — Einherjar Blitz RPG
 *
 * Static definitions for characters, passives, skills, items, enemies,
 * and dungeon layout. All balance numbers live here for easy tuning.
 *
 * The combat system has NO elemental weakness table. Character identity
 * is defined by unique passives and learnable skills.
 */

import { ImageSourcePropType } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type StatusEffect = 'poison' | 'stun' | 'regen_mp' | 'regen_hp' | 'defense_up';

export interface StatusInstance {
  effect: StatusEffect;
  duration: number;       // turns remaining
  potency: number;        // effect-specific value (poison dmg, regen amount, etc.)
}

export type SkillType = 'physical' | 'magical' | 'heal' | 'buff';

export interface SkillEffect {
  status?: StatusEffect;
  statusChance?: number;  // 0-1, probability of applying the status
  statusDuration?: number;
  statusPotency?: number;
  buffStat?: 'attack' | 'defense' | 'magic' | 'resistance' | 'speed';
  buffAmount?: number;    // flat bonus added to the stat
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  mpCost: number;
  power: number;          // multiplier on attack/magic stat (0.5 = 50%, 1.5 = 150%)
  target: 'enemy' | 'self' | 'ally';
  effect?: SkillEffect;
  learnLevel: number;     // level at which this skill is learned
}

export type PassiveTrigger =
  | 'on_turn_start'
  | 'on_turn_end'
  | 'on_hit_received'
  | 'on_attack'
  | 'on_low_hp'
  | 'always';

export interface Passive {
  id: string;
  name: string;
  description: string;
  trigger: PassiveTrigger;
  // Handler key — battleEngine maps these to logic functions
  handler: string;
  // Optional params for the handler
  params?: Record<string, number>;
}

export interface CharacterStats {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  magic: number;
  resistance: number;
  speed: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  description: string;
  element: string | null;       // flavor only, no mechanical weakness table
  sprite: ImageSourcePropType | null;
  fallbackIcon: string;         // Ionicons name (placeholder)
  accentColor: string;
  baseStats: CharacterStats;
  growth: CharacterStats;       // per-level growth
  passives: Passive[];
  skills: Skill[];              // all skills, filtered by learnLevel at runtime
  unlockFloor: number;          // dungeon floor required to unlock
  startingSkills: string[];     // skill IDs available from level 1
}

export interface EnemyDef {
  id: string;
  name: string;
  sprite: ImageSourcePropType | null;
  fallbackIcon: string;
  accentColor: string;
  stats: CharacterStats;
  skills: EnemySkill[];
  ai: {
    attackChance: number;
    skillChance: number;
    specialChance: number;
    healThreshold: number;      // HP % below which it may heal (0-1)
    healChance: number;
  };
  isBoss: boolean;
  xpReward: number;
  sphereReward: number;
}

export interface EnemySkill {
  id: string;
  name: string;
  type: SkillType;
  mpCost: number;
  power: number;
  target: 'enemy' | 'self';
  effect?: SkillEffect;
  isSpecial?: boolean;          // boss-only special
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  type: 'heal_hp' | 'heal_mp' | 'cure_status';
  amount: number;               // HP/MP restored or 0 for cure_status
  icon: string;
}

export interface FloorDef {
  floor: number;
  enemyId: string;
  isBoss: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// SKILLS — shared skill pool (characters reference by ID)
// Each character has their own unique skills; this is the master list.
// ═══════════════════════════════════════════════════════════════════════

export const SKILLS: Record<string, Skill> = {
  // ── Protagonist: "Einherjar" — balanced warrior ──────────────────
  einherjar_slash: {
    id: 'einherjar_slash',
    name: 'Corte Profundo',
    description: 'Un tajo poderoso que ignora parte de la defensa enemiga.',
    type: 'physical',
    mpCost: 8,
    power: 1.3,
    target: 'enemy',
    learnLevel: 1,
  },
  einherjar_rally: {
    id: 'einherjar_rally',
    name: 'Grito de Guerra',
    description: 'Aumenta tu ataque durante 3 turnos.',
    type: 'buff',
    mpCost: 12,
    power: 0,
    target: 'self',
    effect: {
      status: 'defense_up',
      statusChance: 1,
      statusDuration: 3,
      statusPotency: 0,
      buffStat: 'attack',
      buffAmount: 15,
    },
    learnLevel: 3,
  },
  einherjar_execute: {
    id: 'einherjar_execute',
    name: 'Ejecución',
    description: 'Daño físico masivo. Crítico garantizado si el enemigo tiene menos de 25% HP.',
    type: 'physical',
    mpCost: 20,
    power: 2.0,
    target: 'enemy',
    learnLevel: 5,
  },
  einherjar_second_wind: {
    id: 'einherjar_second_wind',
    name: 'Segundo Aliento',
    description: 'Recupera 30% de tu HP máximo.',
    type: 'heal',
    mpCost: 18,
    power: 0.3,
    target: 'self',
    learnLevel: 8,
  },

  // ── Character 2: "Valkyrie" — defensive tank ─────────────────────
  valkyrie_shield_bash: {
    id: 'valkyrie_shield_bash',
    name: 'Golpe de Escudo',
    description: 'Daño físico con probabilidad de aturdir al enemigo.',
    type: 'physical',
    mpCost: 10,
    power: 1.1,
    target: 'enemy',
    effect: {
      status: 'stun',
      statusChance: 0.35,
      statusDuration: 1,
      statusPotency: 0,
    },
    learnLevel: 1,
  },
  valkyrie_bulwark: {
    id: 'valkyrie_bulwark',
    name: 'Baluque',
    description: 'Aumenta tu defensa durante 3 turnos.',
    type: 'buff',
    mpCost: 14,
    power: 0,
    target: 'self',
    effect: {
      status: 'defense_up',
      statusChance: 1,
      statusDuration: 3,
      statusPotency: 0,
      buffStat: 'defense',
      buffAmount: 20,
    },
    learnLevel: 3,
  },
  valkyrie_judgment: {
    id: 'valkyrie_judgment',
    name: 'Juicio de Hierro',
    description: 'Daño físico pesado que escala con tu defensa.',
    type: 'physical',
    mpCost: 22,
    power: 1.8,
    target: 'enemy',
    learnLevel: 7,
  },

  // ── Character 3: "Mago Oscuro" — glass cannon magic ──────────────
  dark_mage_shadow_bolt: {
    id: 'dark_mage_shadow_bolt',
    name: 'Descarga Sombra',
    description: 'Daño mágico oscuro con probabilidad de envenenar.',
    type: 'magical',
    mpCost: 12,
    power: 1.4,
    target: 'enemy',
    effect: {
      status: 'poison',
      statusChance: 0.4,
      statusDuration: 3,
      statusPotency: 8,
    },
    learnLevel: 1,
  },
  dark_mage_drain: {
    id: 'dark_mage_drain',
    name: 'Drenar Vida',
    description: 'Daño mágico que cura al usuario por el 50% del daño causado.',
    type: 'magical',
    mpCost: 15,
    power: 1.2,
    target: 'enemy',
    learnLevel: 4,
  },
  dark_mage_void: {
    id: 'dark_mage_void',
    name: 'Vacío Absoluto',
    description: 'Daño mágico devastador que ignora la resistencia enemiga.',
    type: 'magical',
    mpCost: 30,
    power: 2.5,
    target: 'enemy',
    learnLevel: 9,
  },

  // ── Character 4: "Berserker" — high risk high reward ─────────────
  berserker_rage: {
    id: 'berserker_rage',
    name: 'Furia',
    description: 'Daño físico que aumenta cuanto menor HP tengas.',
    type: 'physical',
    mpCost: 6,
    power: 1.0,
    target: 'enemy',
    learnLevel: 1,
  },
  berserker_bloodlust: {
    id: 'berserker_bloodlust',
    name: 'Sangre Caliente',
    description: 'Aumenta tu ataque permanentemente durante la batalla, pero pierdes 5% HP.',
    type: 'buff',
    mpCost: 8,
    power: 0,
    target: 'self',
    effect: {
      status: 'defense_up',
      statusChance: 1,
      statusDuration: 99,
      statusPotency: 0,
      buffStat: 'attack',
      buffAmount: 25,
    },
    learnLevel: 3,
  },
  berserker_cleave: {
    id: 'berserker_cleave',
    name: 'Hendidura',
    description: 'Daño físico brutal con alta probabilidad de crítico.',
    type: 'physical',
    mpCost: 18,
    power: 1.7,
    target: 'enemy',
    learnLevel: 6,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// PASSIVES
// ═══════════════════════════════════════════════════════════════════════

export const PASSIVES: Record<string, Passive> = {
  // Einherjar — "Unbreakable Will"
  unbreakable_will: {
    id: 'unbreakable_will',
    name: 'Voluntad Inquebrantable',
    description: 'Crítico garantizado cuando HP está por debajo del 30%.',
    trigger: 'on_low_hp',
    handler: 'guaranteed_crit_low_hp',
    params: { threshold: 0.3 },
  },

  // Valkyrie — "Counter Stance"
  counter_stance: {
    id: 'counter_stance',
    name: 'Contraataque',
    description: '50% de probabilidad de contraatacar al recibir daño físico.',
    trigger: 'on_hit_received',
    handler: 'counter_attack',
    params: { chance: 0.5 },
  },

  // Dark Mage — "Mana Flow"
  mana_flow: {
    id: 'mana_flow',
    name: 'Flujo de Maná',
    description: 'Regenera 5% de MP al inicio de cada turno.',
    trigger: 'on_turn_start',
    handler: 'regen_mp',
    params: { percent: 0.05 },
  },

  // Berserker — "Bloodthirst"
  bloodthirst: {
    id: 'bloodthirst',
    name: 'Sed de Sangre',
    description: 'Recupera 10% del daño causado como HP.',
    trigger: 'on_attack',
    handler: 'lifesteal',
    params: { percent: 0.1 },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// CHARACTERS
// ═══════════════════════════════════════════════════════════════════════

export const GAME_CHARACTERS: CharacterDef[] = [
  {
    id: 'einherjar',
    name: 'Einherjar',
    title: 'El Guerrero Eterno',
    description: 'Un guerrero equilibrado, maestro de la espada. Su voluntad inquebrantable le permite asestar golpes críticos cuando está al borde de la derrota.',
    element: 'sagrado',
    sprite: null,
    fallbackIcon: 'cut',
    accentColor: '#c9aa71',
    baseStats: {
      hp: 120,
      mp: 40,
      attack: 25,
      defense: 20,
      magic: 15,
      resistance: 15,
      speed: 18,
    },
    growth: {
      hp: 12,
      mp: 4,
      attack: 3,
      defense: 2.5,
      magic: 1.5,
      resistance: 1.5,
      speed: 2,
    },
    passives: [PASSIVES.unbreakable_will],
    skills: [
      SKILLS.einherjar_slash,
      SKILLS.einherjar_rally,
      SKILLS.einherjar_execute,
      SKILLS.einherjar_second_wind,
    ],
    unlockFloor: 0,
    startingSkills: ['einherjar_slash'],
  },
  {
    id: 'valkyrie',
    name: 'Valkyrie',
    title: 'Guardiana de los Caídos',
    description: 'Una tanque defensiva que protege con su escudo. Contraataca automáticamente al recibir daño físico.',
    element: 'sagrado',
    sprite: null,
    fallbackIcon: 'shield',
    accentColor: '#60a5fa',
    baseStats: {
      hp: 160,
      mp: 35,
      attack: 18,
      defense: 30,
      magic: 12,
      resistance: 22,
      speed: 12,
    },
    growth: {
      hp: 16,
      mp: 3,
      attack: 2,
      defense: 3.5,
      magic: 1,
      resistance: 2.5,
      speed: 1.5,
    },
    passives: [PASSIVES.counter_stance],
    skills: [
      SKILLS.valkyrie_shield_bash,
      SKILLS.valkyrie_bulwark,
      SKILLS.valkyrie_judgment,
    ],
    unlockFloor: 3,
    startingSkills: ['valkyrie_shield_bash'],
  },
  {
    id: 'dark_mage',
    name: 'Mago Oscuro',
    title: 'Tejedor de Sombras',
    description: 'Un devastador mago de daño que regenera maná constantemente. Frágil pero letal.',
    element: 'oscuro',
    sprite: null,
    fallbackIcon: 'moon',
    accentColor: '#a855f7',
    baseStats: {
      hp: 90,
      mp: 80,
      attack: 10,
      defense: 12,
      magic: 35,
      resistance: 18,
      speed: 20,
    },
    growth: {
      hp: 8,
      mp: 8,
      attack: 1,
      defense: 1.5,
      magic: 4,
      resistance: 2,
      speed: 2.5,
    },
    passives: [PASSIVES.mana_flow],
    skills: [
      SKILLS.dark_mage_shadow_bolt,
      SKILLS.dark_mage_drain,
      SKILLS.dark_mage_void,
    ],
    unlockFloor: 5,
    startingSkills: ['dark_mage_shadow_bolt'],
  },
  {
    id: 'berserker',
    name: 'Berserker',
    title: 'Sangre y Furia',
    description: 'Un combatiente de alto riesgo que se cura al atacar. Cuanto más daño hace, más se recupera.',
    element: 'fuego',
    sprite: null,
    fallbackIcon: 'flame',
    accentColor: '#ef4444',
    baseStats: {
      hp: 140,
      mp: 30,
      attack: 32,
      defense: 15,
      magic: 8,
      resistance: 12,
      speed: 22,
    },
    growth: {
      hp: 14,
      mp: 2,
      attack: 4,
      defense: 2,
      magic: 1,
      resistance: 1.5,
      speed: 3,
    },
    passives: [PASSIVES.bloodthirst],
    skills: [
      SKILLS.berserker_rage,
      SKILLS.berserker_bloodlust,
      SKILLS.berserker_cleave,
    ],
    unlockFloor: 7,
    startingSkills: ['berserker_rage'],
  },
];

// Quick lookup by ID
export const CHARACTER_BY_ID = new Map<string, CharacterDef>(
  GAME_CHARACTERS.map((c) => [c.id, c])
);

// ═══════════════════════════════════════════════════════════════════════
// ITEMS
// ═══════════════════════════════════════════════════════════════════════

export const GAME_ITEMS: ItemDef[] = [
  {
    id: 'potion_s',
    name: 'Poción Pequeña',
    description: 'Restaura 40 HP.',
    type: 'heal_hp',
    amount: 40,
    icon: 'flask',
  },
  {
    id: 'potion_m',
    name: 'Poción Mediana',
    description: 'Restaura 100 HP.',
    type: 'heal_hp',
    amount: 100,
    icon: 'flask',
  },
  {
    id: 'ether_s',
    name: 'Éter Pequeño',
    description: 'Restaura 25 MP.',
    type: 'heal_mp',
    amount: 25,
    icon: 'water',
  },
  {
    id: 'antidote',
    name: 'Antídoto',
    description: 'Cura el envenenamiento.',
    type: 'cure_status',
    amount: 0,
    icon: 'medkit',
  },
];

export const ITEM_BY_ID = new Map<string, ItemDef>(
  GAME_ITEMS.map((i) => [i.id, i])
);

// Starting inventory for a new game
export const STARTING_ITEMS: Record<string, number> = {
  potion_s: 3,
  ether_s: 1,
  antidote: 1,
};

// ═══════════════════════════════════════════════════════════════════════
// ENEMIES
// ═══════════════════════════════════════════════════════════════════════

export const GAME_ENEMIES: Record<string, EnemyDef> = {
  // ── Floor 1-3: weak enemies ──────────────────────────────────────
  slime: {
    id: 'slime',
    name: 'Limo Sombra',
    sprite: null,
    fallbackIcon: 'water',
    accentColor: '#22c55e',
    stats: {
      hp: 60,
      mp: 20,
      attack: 15,
      defense: 10,
      magic: 10,
      resistance: 8,
      speed: 10,
    },
    skills: [
      {
        id: 'slime_tackle',
        name: 'Placaje',
        type: 'physical',
        mpCost: 0,
        power: 1.0,
        target: 'enemy',
      },
      {
        id: 'slime_acid',
        name: 'Ácido',
        type: 'magical',
        mpCost: 8,
        power: 0.8,
        target: 'enemy',
        effect: {
          status: 'poison',
          statusChance: 0.5,
          statusDuration: 2,
          statusPotency: 5,
        },
      },
    ],
    ai: {
      attackChance: 0.75,
      skillChance: 0.25,
      specialChance: 0,
      healThreshold: 0,
      healChance: 0,
    },
    isBoss: false,
    xpReward: 20,
    sphereReward: 10,
  },

  goblin: {
    id: 'goblin',
    name: 'Goblin Saqueador',
    sprite: null,
    fallbackIcon: 'person',
    accentColor: '#f59e0b',
    stats: {
      hp: 80,
      mp: 15,
      attack: 20,
      defense: 12,
      magic: 8,
      resistance: 10,
      speed: 15,
    },
    skills: [
      {
        id: 'goblin_slash',
        name: 'Cuchillada',
        type: 'physical',
        mpCost: 0,
        power: 1.1,
        target: 'enemy',
      },
      {
        id: 'goblin_frenzy',
        name: 'Frenesí',
        type: 'physical',
        mpCost: 10,
        power: 1.5,
        target: 'enemy',
      },
    ],
    ai: {
      attackChance: 0.65,
      skillChance: 0.35,
      specialChance: 0,
      healThreshold: 0,
      healChance: 0,
    },
    isBoss: false,
    xpReward: 30,
    sphereReward: 15,
  },

  skeleton: {
    id: 'skeleton',
    name: 'Esqueleto Guerrero',
    sprite: null,
    fallbackIcon: 'body',
    accentColor: '#94a3b8',
    stats: {
      hp: 100,
      mp: 25,
      attack: 22,
      defense: 18,
      magic: 12,
      resistance: 12,
      speed: 14,
    },
    skills: [
      {
        id: 'skeleton_bone_strike',
        name: 'Golpe Óseo',
        type: 'physical',
        mpCost: 0,
        power: 1.2,
        target: 'enemy',
      },
      {
        id: 'skeleton_curse',
        name: 'Maldición',
        type: 'magical',
        mpCost: 12,
        power: 0.9,
        target: 'enemy',
        effect: {
          status: 'stun',
          statusChance: 0.3,
          statusDuration: 1,
          statusPotency: 0,
        },
      },
    ],
    ai: {
      attackChance: 0.6,
      skillChance: 0.4,
      specialChance: 0,
      healThreshold: 0,
      healChance: 0,
    },
    isBoss: false,
    xpReward: 45,
    sphereReward: 20,
  },

  // ── Floor 4-6: medium enemies ────────────────────────────────────
  wraith: {
    id: 'wraith',
    name: 'Espectro',
    sprite: null,
    fallbackIcon: 'cloud',
    accentColor: '#a855f7',
    stats: {
      hp: 130,
      mp: 40,
      attack: 18,
      defense: 15,
      magic: 28,
      resistance: 20,
      speed: 22,
    },
    skills: [
      {
        id: 'wraith_touch',
        name: 'Toque Espectral',
        type: 'magical',
        mpCost: 0,
        power: 1.0,
        target: 'enemy',
        effect: {
          status: 'poison',
          statusChance: 0.3,
          statusDuration: 3,
          statusPotency: 7,
        },
      },
      {
        id: 'wraith_drain',
        name: 'Drenaje',
        type: 'magical',
        mpCost: 15,
        power: 1.3,
        target: 'enemy',
      },
    ],
    ai: {
      attackChance: 0.5,
      skillChance: 0.5,
      specialChance: 0,
      healThreshold: 0.3,
      healChance: 0.4,
    },
    isBoss: false,
    xpReward: 60,
    sphereReward: 25,
  },

  golem: {
    id: 'golem',
    name: 'Golem de Piedra',
    sprite: null,
    fallbackIcon: 'cube',
    accentColor: '#78716c',
    stats: {
      hp: 200,
      mp: 20,
      attack: 28,
      defense: 35,
      magic: 10,
      resistance: 25,
      speed: 8,
    },
    skills: [
      {
        id: 'golem_smash',
        name: 'Aplastar',
        type: 'physical',
        mpCost: 0,
        power: 1.3,
        target: 'enemy',
      },
      {
        id: 'golem_quake',
        name: 'Terremoto',
        type: 'physical',
        mpCost: 15,
        power: 1.6,
        target: 'enemy',
        effect: {
          status: 'stun',
          statusChance: 0.25,
          statusDuration: 1,
          statusPotency: 0,
        },
      },
    ],
    ai: {
      attackChance: 0.65,
      skillChance: 0.35,
      specialChance: 0,
      healThreshold: 0,
      healChance: 0,
    },
    isBoss: false,
    xpReward: 80,
    sphereReward: 30,
  },

  // ── Floor 7-9: hard enemies ──────────────────────────────────────
  demon: {
    id: 'demon',
    name: 'Demonio Menor',
    sprite: null,
    fallbackIcon: 'flame',
    accentColor: '#ef4444',
    stats: {
      hp: 250,
      mp: 60,
      attack: 35,
      defense: 22,
      magic: 35,
      resistance: 22,
      speed: 25,
    },
    skills: [
      {
        id: 'demon_claw',
        name: 'Garra Demoníaca',
        type: 'physical',
        mpCost: 0,
        power: 1.4,
        target: 'enemy',
      },
      {
        id: 'demon_hellfire',
        name: 'Fuego Infernal',
        type: 'magical',
        mpCost: 20,
        power: 1.8,
        target: 'enemy',
        effect: {
          status: 'poison',
          statusChance: 0.4,
          statusDuration: 3,
          statusPotency: 12,
        },
      },
      {
        id: 'demon_dread',
        name: 'Terror',
        type: 'magical',
        mpCost: 15,
        power: 0.5,
        target: 'enemy',
        effect: {
          status: 'stun',
          statusChance: 0.5,
          statusDuration: 1,
          statusPotency: 0,
        },
      },
    ],
    ai: {
      attackChance: 0.4,
      skillChance: 0.5,
      specialChance: 0.1,
      healThreshold: 0.25,
      healChance: 0.3,
    },
    isBoss: false,
    xpReward: 120,
    sphereReward: 40,
  },

  // ── Floor 10: BOSS ───────────────────────────────────────────────
  dragon_lord: {
    id: 'dragon_lord',
    name: 'Señor Dragón',
    sprite: null,
    fallbackIcon: 'dragon',
    accentColor: '#dc2626',
    stats: {
      hp: 500,
      mp: 100,
      attack: 45,
      defense: 30,
      magic: 45,
      resistance: 30,
      speed: 20,
    },
    skills: [
      {
        id: 'dragon_bite',
        name: 'Mordida',
        type: 'physical',
        mpCost: 0,
        power: 1.5,
        target: 'enemy',
      },
      {
        id: 'dragon_breath',
        name: 'Aliento de Fuego',
        type: 'magical',
        mpCost: 25,
        power: 2.0,
        target: 'enemy',
        effect: {
          status: 'poison',
          statusChance: 0.5,
          statusDuration: 3,
          statusPotency: 15,
        },
      },
      {
        id: 'dragon_tail',
        name: 'Cola Latigazo',
        type: 'physical',
        mpCost: 15,
        power: 1.7,
        target: 'enemy',
        effect: {
          status: 'stun',
          statusChance: 0.35,
          statusDuration: 1,
          statusPotency: 0,
        },
      },
      {
        id: 'dragon_ultimate',
        name: 'Cólera del Dragón',
        type: 'magical',
        mpCost: 50,
        power: 3.0,
        target: 'enemy',
        isSpecial: true,
      },
    ],
    ai: {
      attackChance: 0.35,
      skillChance: 0.45,
      specialChance: 0.2,
      healThreshold: 0.2,
      healChance: 0.3,
    },
    isBoss: true,
    xpReward: 300,
    sphereReward: 100,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// DUNGEON LAYOUT
// ═══════════════════════════════════════════════════════════════════════

export const DUNGEON_FLOORS: FloorDef[] = [
  { floor: 1, enemyId: 'slime', isBoss: false },
  { floor: 2, enemyId: 'goblin', isBoss: false },
  { floor: 3, enemyId: 'skeleton', isBoss: false },
  { floor: 4, enemyId: 'wraith', isBoss: false },
  { floor: 5, enemyId: 'goblin', isBoss: false },
  { floor: 6, enemyId: 'golem', isBoss: false },
  { floor: 7, enemyId: 'demon', isBoss: false },
  { floor: 8, enemyId: 'wraith', isBoss: false },
  { floor: 9, enemyId: 'demon', isBoss: false },
  { floor: 10, enemyId: 'dragon_lord', isBoss: true },
];

export const TOTAL_FLOORS = DUNGEON_FLOORS.length;

// ═══════════════════════════════════════════════════════════════════════
// XP / LEVELING
// ═══════════════════════════════════════════════════════════════════════

// XP required to reach the NEXT level from the current level.
// Formula: 100 * level^1.5 (rounded)
export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Get skills available at a given level for a character
export function getSkillsForLevel(charId: string, level: number): Skill[] {
  const char = CHARACTER_BY_ID.get(charId);
  if (!char) return [];
  return char.skills.filter((s) => level >= s.learnLevel);
}

// Get newly learned skill at a specific level (for notifications)
export function getNewSkillAtLevel(charId: string, level: number): Skill | null {
  const char = CHARACTER_BY_ID.get(charId);
  if (!char) return null;
  return char.skills.find((s) => s.learnLevel === level) || null;
}

// Calculate stats for a character at a given level
export function getStatsAtLevel(charId: string, level: number): CharacterStats {
  const char = CHARACTER_BY_ID.get(charId);
  if (!char) return { hp: 0, mp: 0, attack: 0, defense: 0, magic: 0, resistance: 0, speed: 0 };
  const { baseStats, growth } = char;
  const lvl = level - 1;
  return {
    hp: Math.floor(baseStats.hp + growth.hp * lvl),
    mp: Math.floor(baseStats.mp + growth.mp * lvl),
    attack: Math.floor(baseStats.attack + growth.attack * lvl),
    defense: Math.floor(baseStats.defense + growth.defense * lvl),
    magic: Math.floor(baseStats.magic + growth.magic * lvl),
    resistance: Math.floor(baseStats.resistance + growth.resistance * lvl),
    speed: Math.floor(baseStats.speed + growth.speed * lvl),
  };
}

// Get characters unlocked at a given floor
export function getUnlockedCharacters(maxFloor: number): CharacterDef[] {
  return GAME_CHARACTERS.filter((c) => c.unlockFloor <= maxFloor);
}
