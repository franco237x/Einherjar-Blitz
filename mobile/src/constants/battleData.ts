export type RegenTier = 'bajo' | 'moderado' | 'avanzado' | 'ultrarrapido';

export const REGEN_VALUES: Record<RegenTier, number> = {
  bajo: 80,
  moderado: 120,
  avanzado: 160,
  ultrarrapido: 220,
};

// ─── Character sprite assets ──────────────────────────────────────────────
// Sprite sources are loaded via require() in a separate module
// (characterAssets.ts) so that battleData.ts stays pure data with no
// react-native or asset imports — this keeps the battle engine testable
// in a node environment (vitest) without a React Native polyfill.
//
// The `sprites` field here is typed as `Record<string, unknown>` and
// populated by characterAssets.ts at runtime via a merge step. The UI
// components import from characterAssets.ts, not from here, to get the
// fully-resolved sprite sources.
export interface CharacterSprites {
  /** Static portrait for the character select screen. */
  portrait?: unknown;
  /** Static base/idle sprite for the battle stage. */
  battleSprite?: unknown;
  /** Animated GIF played on the 'attack' sprite state. */
  attackGif?: unknown;
  /** Animated GIF played on the 'defend' sprite state. */
  defenseGif?: unknown;
}

export interface SpecialAbilityDef {
  name: string;
  description: string;
  message: string;
  bonusMin: number;
  bonusMax: number;
  healBonus?: number;
  reductionBonus?: number;
  newAttackName?: string;
  transformedIcon?: string;
  transformedImageUri?: string;
  transformTarget?: string;
  fieldRadiationDamage?: number;
  fieldDuration?: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  maxHealth: number;
  regenTier: RegenTier;
  regenAmount: number;
  isPlayableBase?: boolean;
  attack: {
    name: string;
    minDamage: number;
    maxDamage: number;
    alwaysCrit?: boolean;
  };
  defense: {
    name: string;
    reduction: number;
    message: string;
  };
  specialAbility: SpecialAbilityDef;
  passiveDescription: string;
  accentColor: string;
  lucideIcon: string;
  /** Image asset path/URI placeholder for character artwork (legacy). */
  imageUri?: string;
  /** Bundled sprite assets for the select screen and battle stage. */
  sprites?: CharacterSprites;
}

export const GAME_CHARACTERS: Record<string, CharacterDef> = {
  argos: {
    id: 'argos',
    name: 'Argos',
    title: 'El Prodigio de Acero',
    maxHealth: 1750,
    regenTier: 'bajo',
    regenAmount: REGEN_VALUES.bajo,
    isPlayableBase: true,
    attack: {
      name: 'Disparo de Energía Primordial',
      minDamage: 160,
      maxDamage: 195,
    },
    defense: {
      name: 'Escudo de Energía Primordial',
      reduction: 55,
      message: 'Argos activa su escudo de energía para mitigar el ataque.',
    },
    specialAbility: {
      name: 'Llamada al Androide Galileo',
      description: 'Invoca al Androide Galileo, cambiando de forma, estadísticas y habilidades. (Ataque 100% Crítico y Blindaje x2).',
      message: 'Argos: - Ejecutando la llamada al Androide Galileo',
      bonusMin: 20,
      bonusMax: 25,
      transformedIcon: 'Cpu',
      transformTarget: 'galileo',
    },
    passiveDescription: 'Blindaje Metálico: Reduce un 10% adicional de daño constante.',
    accentColor: '#38bdf8',
    lucideIcon: 'Bot',
    // sprites are injected by characterAssets.ts at runtime to keep this
    // module free of react-native/asset imports (testable in node).
  },
  galileo: {
    id: 'galileo',
    name: 'Androide Galileo',
    title: 'Entidad Mecánica Superior',
    maxHealth: 1750,
    regenTier: 'avanzado',
    regenAmount: REGEN_VALUES.avanzado,
    isPlayableBase: false,
    attack: {
      name: 'Golpe de Sobrecarga',
      minDamage: 180,
      maxDamage: 220,
      alwaysCrit: true,
    },
    defense: {
      name: 'Blindaje',
      reduction: 110,
      message: 'Galileo se protege tras su Blindaje reforzado de alta densidad.',
    },
    specialAbility: {
      name: 'Campo de Energía Primordial Primitiva',
      description: 'Crea una zona de radiación que inflige 120 de daño por turno, anula la habilidad del jefe y otorga Regeneración Avanzada durante 4 turnos.',
      message: 'Galileo: - Desplegando Campo de Energía Primordial Primitiva. Radiación activa.',
      bonusMin: 0,
      bonusMax: 0,
      fieldRadiationDamage: 120,
      fieldDuration: 4,
    },
    passiveDescription: 'Sobrecarga Crítica: Todos sus ataques causan golpe crítico garantizado.',
    accentColor: '#0ea5e9',
    lucideIcon: 'Cpu',
    imageUri: undefined, // Add image URI e.g. 'assets/images/characters/galileo.png'
  },
  orfevre: {
    id: 'orfevre',
    name: 'Orfevre',
    title: 'Esgrimista Dorado',
    maxHealth: 1250,
    regenTier: 'moderado',
    regenAmount: REGEN_VALUES.moderado,
    isPlayableBase: true,
    attack: {
      name: 'Estocada Áurea',
      minDamage: 90,
      maxDamage: 155,
    },
    defense: {
      name: 'Escudo del Rey',
      reduction: 20,
      message: 'Orfevre se protege tras el Escudo del Rey.',
    },
    specialAbility: {
      name: 'Filo Áureo Imperial',
      description: 'Eleva el daño crítico y aumenta el daño min/máx en +70.',
      message: 'Orfevre: - Contempla el verdadero brillo del oro imperial.',
      bonusMin: 70,
      bonusMax: 70,
    },
    passiveDescription: 'Precisión Real: +10% de probabilidad crítica base.',
    accentColor: '#eab308',
    lucideIcon: 'Sword',
    imageUri: undefined, // Add image URI e.g. 'assets/images/characters/orfevre.png'
  },
  nathan: {
    id: 'nathan',
    name: 'Nathan',
    title: 'Relámpago Silencioso',
    maxHealth: 1300,
    regenTier: 'avanzado',
    regenAmount: REGEN_VALUES.avanzado,
    isPlayableBase: true,
    attack: {
      name: 'Paso Flash',
      minDamage: 80,
      maxDamage: 165,
    },
    defense: {
      name: 'Reflejo Kami',
      reduction: 18,
      message: 'Nathan esquiva parcialmente con su movimiento Kami.',
    },
    specialAbility: {
      name: 'Kakusei Hiraishin',
      description: 'Aumenta el daño en +80 y activa aura de resplandor.',
      message: 'Nathan: - No desperdiciaré esta oportunidad, Kakusei...',
      bonusMin: 80,
      bonusMax: 80,
    },
    passiveDescription: 'Pasiva de Resplandor: Los golpes tienen posibilidad de cegar temporalmente.',
    accentColor: '#f59e0b',
    lucideIcon: 'Flash',
    imageUri: undefined, // Add image URI e.g. 'assets/images/characters/nathan.png'
  },
  yuka: {
    id: 'yuka',
    name: 'Yuka',
    title: 'Hechicera Espiritual',
    maxHealth: 1200,
    regenTier: 'moderado',
    regenAmount: REGEN_VALUES.moderado,
    isPlayableBase: true,
    attack: {
      name: 'Ráfaga Mística',
      minDamage: 95,
      maxDamage: 150,
    },
    defense: {
      name: 'Barrera Espiritual',
      reduction: 22,
      message: 'Yuka invoca una barrera espiritual que disipa el golpe.',
    },
    specialAbility: {
      name: 'Despertar Místico',
      description: 'Aumenta el daño mínimo en +90 y otorga curación de +120 HP.',
      message: 'Yuka: - Los espíritus antiguos responden a mi llamado.',
      bonusMin: 90,
      bonusMax: 50,
      healBonus: 120,
    },
    passiveDescription: 'Armonía Mística: Restaura 15 HP extra en cada turno de defensa.',
    accentColor: '#a855f7',
    lucideIcon: 'Wand2',
    imageUri: undefined, // Add image URI e.g. 'assets/images/characters/yuka.png'
  },
  dione: {
    id: 'dione',
    name: 'Dione',
    title: 'Cazadora Nocturna',
    maxHealth: 1150,
    regenTier: 'ultrarrapido',
    regenAmount: REGEN_VALUES.ultrarrapido,
    isPlayableBase: true,
    attack: {
      name: 'Hojacreciente Sombría',
      minDamage: 85,
      maxDamage: 160,
    },
    defense: {
      name: 'Esquiva Nocturna',
      reduction: 15,
      message: 'Dione se desvanece en las sombras evitando gran parte del daño.',
    },
    specialAbility: {
      name: 'Eclipse Escarlata',
      description: 'Potencia el daño min/máx en +75 y otorga regeneración ultrarrápida instantánea.',
      message: 'Dione: - La noche nos pertenece... ¡Eclipse activado!',
      bonusMin: 75,
      bonusMax: 75,
      healBonus: 150,
    },
    passiveDescription: 'Regeneración Vampírica: Posee la regeneración más acelerada del equipo.',
    accentColor: '#ec4899',
    lucideIcon: 'Moon',
    imageUri: undefined, // Add image URI e.g. 'assets/images/characters/dione.png'
  },
};

export interface BossDef {
  name: string;
  maxHealth: number;
  phase2HealthThreshold: number;
  phase2Name: string;
  phrases: string[];
  phase2Phrases: string[];
  attack: {
    minDamage: number;
    maxDamage: number;
  };
  accentColor: string;
  lucideIcon: string;
  phase2LucideIcon: string;
  imageUri?: string;
  phase2ImageUri?: string;
}

export const REY_ESCARLATA_BOSS: BossDef = {
  name: 'El Rey Escarlata',
  maxHealth: 2000,
  phase2HealthThreshold: 1000,
  phase2Name: 'Levanta el Trono Escarlata',
  phrases: [
    'Rey Escarlata: - ¡Inhábiles insignificantes, inclinarse es su único destino!',
    'Rey Escarlata: - Tu resistencia solo aplaza lo inevitable.',
    'Rey Escarlata: - ¿Eso es todo el poder que posees?',
    'Rey Escarlata: - Nadie desafía la voluntad del Rey.',
    'Rey Escarlata: - Siente el peso de la corona sangrienta.',
  ],
  phase2Phrases: [
    'Rey Escarlata: - ¡Ha llegado el momento... El Trono Escarlata se eleva!',
    'Rey Escarlata: - ¡Ante este trono, sus almas serán consumidas!',
    'Rey Escarlata: - El dominio del Rey no conoce límites.',
  ],
  attack: {
    minDamage: 75,
    maxDamage: 135,
  },
  accentColor: '#dc2626',
  lucideIcon: 'Crown',
  phase2LucideIcon: 'Flame',
  imageUri: undefined, // e.g. 'assets/images/characters/rey_escarlata.png'
};
