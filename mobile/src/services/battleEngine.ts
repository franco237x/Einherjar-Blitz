import {
  GAME_CHARACTERS,
  REY_ESCARLATA_BOSS,
  type CharacterDef,
  type BossDef,
} from '@/constants/battleData';
import { executeCharacterSpecial } from './characterAbilities';

export type SpriteState = 'idle' | 'attack' | 'defend' | 'special' | 'regen' | 'hit' | 'victory' | 'defeat';

/**
 * Injectable RNG so the engine is deterministic in tests. All randomness
 * MUST go through this function — never call Math.random() directly.
 *
 * `rng()` returns a float in [0, 1). Defaults to Math.random in production.
 * Tests pass a seeded/controlled rng to assert exact outcomes.
 */
export type Rng = () => number;

const defaultRng: Rng = () => Math.random();

/** Returns a random integer in [min, max] inclusive using the given rng. */
function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Returns true with probability `p` (0..1) using the given rng. */
function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Picks a random element from an array using the given rng. */
function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export interface LogEntry {
  id: string;
  type: 'attack' | 'defend' | 'special' | 'regen' | 'boss_attack' | 'boss_phase' | 'info' | 'crit';
  message: string;
  timestamp: number;
}

export interface PlayerCombatantState {
  def: CharacterDef;
  animationCharacterId: string;
  currentHealth: number;
  maxHealth: number;
  currentMinDamage: number;
  currentMaxDamage: number;
  currentDefenseReduction: number;
  specialUsed: boolean;
  isDefending: boolean;
  spriteState: SpriteState;
  radiationFieldTurns: number;
}

export interface BossCombatantState {
  def: BossDef;
  currentHealth: number;
  maxHealth: number;
  isPhase2: boolean;
  spriteState: SpriteState;
}

export interface BattleState {
  player: PlayerCombatantState;
  boss: BossCombatantState;
  turnCount: number;
  turnPhase: 'player_turn' | 'boss_turn' | 'animating' | 'victory' | 'defeat';
  log: LogEntry[];
  regenUsedThisTurn: boolean;
}

let logCounter = 0;
function createLog(type: LogEntry['type'], message: string): LogEntry {
  return {
    id: `log_${Date.now()}_${logCounter++}`,
    type,
    message,
    timestamp: Date.now(),
  };
}

export function initBattle(charId: string): BattleState {
  const charDef = GAME_CHARACTERS[charId] || GAME_CHARACTERS.argos;
  const bossDef = REY_ESCARLATA_BOSS;

  return {
    player: {
      def: { ...charDef },
      animationCharacterId: charDef.id,
      currentHealth: charDef.maxHealth,
      maxHealth: charDef.maxHealth,
      currentMinDamage: charDef.attack.minDamage,
      currentMaxDamage: charDef.attack.maxDamage,
      currentDefenseReduction: charDef.defense.reduction,
      specialUsed: false,
      isDefending: false,
      spriteState: 'idle',
      radiationFieldTurns: 0,
    },
    boss: {
      def: { ...bossDef },
      currentHealth: bossDef.maxHealth,
      maxHealth: bossDef.maxHealth,
      isPhase2: false,
      spriteState: 'idle',
    },
    turnCount: 1,
    turnPhase: 'player_turn',
    log: [
      createLog('info', `¡La batalla contra ${bossDef.name} ha comenzado!`),
      createLog('info', `${charDef.name} entra en el terreno de combate.`),
    ],
    regenUsedThisTurn: false,
  };
}

export function executePlayerAttack(
  state: BattleState,
  rng: Rng = defaultRng
): {
  newState: BattleState;
  damageDealt: number;
  isCrit: boolean;
} {
  const { player, boss } = state;
  const min = player.currentMinDamage;
  const max = player.currentMaxDamage;

  let baseDamage = randInt(rng, min, max);

  // Check alwaysCrit modifier on character attack
  const alwaysCrit = !!player.def.attack.alwaysCrit;
  const isCrit = alwaysCrit || chance(rng, 0.2);

  if (isCrit) {
    baseDamage *= 2;
  }

  const newBossHealth = Math.max(0, boss.currentHealth - baseDamage);

  const attackMessage = isCrit
    ? `¡Ataque crítico! ${player.def.name} utiliza ${player.def.attack.name} infligiendo ${baseDamage} de daño masivo a ${boss.def.name}.`
    : `${player.def.name} utiliza ${player.def.attack.name} e inflige ${baseDamage} de daño a ${boss.def.name}.`;

  const newLogs = [...state.log, createLog(isCrit ? 'crit' : 'attack', attackMessage)];
  const isVictory = newBossHealth <= 0;

  return {
    newState: {
      ...state,
      player: {
        ...player,
        animationCharacterId: player.def.id,
        isDefending: false,
        spriteState: 'attack',
      },
      boss: {
        ...boss,
        currentHealth: newBossHealth,
        spriteState: 'hit',
      },
      turnPhase: isVictory ? 'victory' : 'boss_turn',
      log: isVictory
        ? [...newLogs, createLog('info', `¡Has derrotado a ${boss.def.name}! ¡Victoria!`)]
        : newLogs,
    },
    damageDealt: baseDamage,
    isCrit,
  };
}

export function executePlayerDefend(state: BattleState): BattleState {
  const { player } = state;
  const defMsg = `${player.def.name} activa ${player.def.defense.name} para protegerse este turno.`;

  return {
    ...state,
    player: {
      ...player,
      animationCharacterId: player.def.id,
      isDefending: true,
      spriteState: 'defend',
    },
    turnPhase: 'boss_turn',
    log: [...state.log, createLog('defend', defMsg)],
  };
}

export function executePlayerRegen(state: BattleState): {
  newState: BattleState;
  healedAmount: number;
} {
  const { player } = state;
  const healAmount = player.def.regenAmount;
  const newHP = Math.min(player.maxHealth, player.currentHealth + healAmount);
  const actualHealed = newHP - player.currentHealth;

  const regenMsg = `${player.def.name} utiliza Regeneración (${player.def.regenTier.toUpperCase()}) y recupera +${actualHealed} HP.`;

  return {
    newState: {
      ...state,
      player: {
        ...player,
        animationCharacterId: player.def.id,
        currentHealth: newHP,
        isDefending: false,
        spriteState: 'regen',
      },
      turnPhase: 'boss_turn',
      log: [...state.log, createLog('regen', regenMsg)],
    },
    healedAmount: actualHealed,
  };
}

export function executePlayerSpecial(state: BattleState): BattleState {
  const { player } = state;

  if (player.specialUsed) {
    return state;
  }

  // Special is only available when the player is at or below 50% HP.
  // This rule lives in the engine (not the UI) so any caller is bound by it.
  const canUseSpecial = player.currentHealth <= player.maxHealth * 0.5;
  if (!canUseSpecial) {
    return state;
  }

  // Delegate ability execution to strategy registry
  const result = executeCharacterSpecial({
    playerDef: player.def,
    currentHealth: player.currentHealth,
    maxHealth: player.maxHealth,
    minDamage: player.currentMinDamage,
    maxDamage: player.currentMaxDamage,
    defenseReduction: player.currentDefenseReduction,
    specialUsed: player.specialUsed,
    radiationFieldTurns: player.radiationFieldTurns,
  });

  const abilityLogs = result.logMessages.map((msg) => createLog('special', msg));

  return {
    ...state,
    player: {
      ...player,
      // The clip belongs to the character that initiated the transformation.
      // The transformed definition is already active for the following turn.
      animationCharacterId: player.def.id,
      def: result.newDef,
      currentHealth: result.currentHealth,
      currentMinDamage: result.minDamage,
      currentMaxDamage: result.maxDamage,
      currentDefenseReduction: result.defenseReduction,
      specialUsed: result.specialUsed,
      radiationFieldTurns: result.radiationFieldTurns,
      spriteState: 'special',
    },
    log: [...state.log, ...abilityLogs],
  };
}

export function executeBossTurn(
  state: BattleState,
  rng: Rng = defaultRng
): {
  newState: BattleState;
  damageDealt: number;
} {
  const { player, boss } = state;

  let bossMin = boss.def.attack.minDamage;
  let bossMax = boss.def.attack.maxDamage;

  let isPhase2Triggered = false;
  let phase2JustTriggered = false;

  // Check Phase 2 (<= 50% HP)
  if (boss.currentHealth <= boss.def.phase2HealthThreshold) {
    isPhase2Triggered = true;
    if (!boss.isPhase2) {
      phase2JustTriggered = true;
    }
  }

  // Check Radiation Field effect (Campo de Energía Primordial Primitiva)
  let currentRadiationTurns = player.radiationFieldTurns;
  let bossHealthAfterRadiation = boss.currentHealth;
  let playerHealthAfterRadiationHeal = player.currentHealth;
  const logs: LogEntry[] = [...state.log];

  if (currentRadiationTurns > 0) {
    const radDamage = 120;
    bossHealthAfterRadiation = Math.max(0, bossHealthAfterRadiation - radDamage);

    const radHeal = 160;
    playerHealthAfterRadiationHeal = Math.min(player.maxHealth, playerHealthAfterRadiationHeal + radHeal);

    logs.push(
      createLog('special', `☢️ Campo Primordial: Inflige 120 de daño de radiación a ${boss.def.name} y regenera +160 HP a ${player.def.name}.`)
    );

    currentRadiationTurns -= 1;
  }

  // If the radiation field killed the boss, the boss does NOT get to attack.
  // Victory is awarded without applying boss damage this turn.
  if (bossHealthAfterRadiation <= 0) {
    logs.push(createLog('info', `¡La radiación del Campo Primordial ha consumido a ${boss.def.name}! ¡Victoria!`));
    return {
      newState: {
        ...state,
        turnCount: state.turnCount + 1,
        player: {
          ...player,
          animationCharacterId: player.def.id,
          currentHealth: playerHealthAfterRadiationHeal,
          isDefending: false,
          spriteState: 'victory',
          radiationFieldTurns: currentRadiationTurns,
        },
        boss: {
          ...boss,
          currentHealth: 0,
          isPhase2: isPhase2Triggered,
          spriteState: 'defeat',
        },
        turnPhase: 'victory',
        log: logs,
      },
      damageDealt: 0,
    };
  }

  // If radiation field is active, nullify boss special/phase 2 damage multiplier!
  const isBossSpecialNullified = player.radiationFieldTurns > 0;
  if (isPhase2Triggered && !isBossSpecialNullified) {
    bossMin *= 2;
    bossMax *= 2;
  }

  let rawDamage = randInt(rng, bossMin, bossMax);

  // Reduce damage if player is defending
  if (player.isDefending) {
    rawDamage = Math.max(10, rawDamage - player.currentDefenseReduction);
  }

  const newPlayerHealth = Math.max(0, playerHealthAfterRadiationHeal - rawDamage);

  if (phase2JustTriggered) {
    logs.push(
      createLog('boss_phase', `¡${boss.def.name} ${boss.def.phase2Name}!`)
    );
    if (isBossSpecialNullified) {
      logs.push(
        createLog('special', `🛡️ ¡El Campo Primordial de Galileo anula la potenciación de ataque del Trono Escarlata!`)
      );
    }
  }

  // Select boss quote
  const phrases = isPhase2Triggered ? boss.def.phase2Phrases : boss.def.phrases;
  const randomPhrase = pick(rng, phrases);
  logs.push(createLog('info', randomPhrase));

  const damageMsg = player.isDefending
    ? `${boss.def.name} ataca pero ${player.def.name} mitiga el daño a ${rawDamage} HP.`
    : `${boss.def.name} inflige ${rawDamage} de daño a ${player.def.name}.`;
  logs.push(createLog('boss_attack', damageMsg));

  const isDefeat = newPlayerHealth <= 0;

  if (isDefeat) {
    logs.push(createLog('info', `¡${boss.def.name} te ha vencido! Entrena y vuelve a intentarlo.`));
  }

  return {
    newState: {
      ...state,
      turnCount: state.turnCount + 1,
      player: {
        ...player,
        animationCharacterId: player.def.id,
        currentHealth: newPlayerHealth,
        isDefending: false,
        spriteState: isDefeat ? 'defeat' : 'hit',
        radiationFieldTurns: currentRadiationTurns,
      },
      boss: {
        ...boss,
        currentHealth: bossHealthAfterRadiation,
        isPhase2: isPhase2Triggered,
        spriteState: phase2JustTriggered ? 'special' : 'attack',
      },
      turnPhase: isDefeat ? 'defeat' : 'player_turn',
      log: logs,
    },
    damageDealt: rawDamage,
  };
}
