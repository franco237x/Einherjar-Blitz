import { CharacterDef, GAME_CHARACTERS } from '@/constants/battleData';

export interface AbilityExecutionContext {
  playerDef: CharacterDef;
  currentHealth: number;
  maxHealth: number;
  minDamage: number;
  maxDamage: number;
  defenseReduction: number;
  specialUsed: boolean;
  radiationFieldTurns: number;
}

export interface AbilityExecutionResult {
  newDef: CharacterDef;
  currentHealth: number;
  minDamage: number;
  maxDamage: number;
  defenseReduction: number;
  specialUsed: boolean;
  radiationFieldTurns: number;
  logMessages: string[];
}

export type SpecialAbilityHandler = (
  ctx: AbilityExecutionContext
) => AbilityExecutionResult;

/**
 * Strategy Registry for character-specific special abilities and transformations.
 * Allows easy scaling of unique mechanics without cluttering the core battle engine.
 */
export const CHARACTER_SPECIAL_HANDLERS: Record<string, SpecialAbilityHandler> = {
  // Argos Special: Transformation to Androide Galileo
  argos: (ctx) => {
    const galileoDef = GAME_CHARACTERS.galileo;
    return {
      newDef: { ...galileoDef },
      currentHealth: ctx.currentHealth,
      minDamage: galileoDef.attack.minDamage,
      maxDamage: galileoDef.attack.maxDamage,
      defenseReduction: galileoDef.defense.reduction,
      specialUsed: false, // Galileo can now use his own special!
      radiationFieldTurns: ctx.radiationFieldTurns,
      logMessages: [
        ctx.playerDef.specialAbility.message,
        `¡${ctx.playerDef.name} invoca al ${galileoDef.name} y asume sus estadísticas y habilidades potenciadas!`,
      ],
    };
  },

  // Galileo Special: Campo de Energía Primordial Primitiva
  galileo: (ctx) => {
    const spec = ctx.playerDef.specialAbility;
    return {
      newDef: { ...ctx.playerDef },
      currentHealth: ctx.currentHealth,
      minDamage: ctx.minDamage,
      maxDamage: ctx.maxDamage,
      defenseReduction: ctx.defenseReduction,
      specialUsed: true,
      radiationFieldTurns: spec.fieldDuration || 4,
      logMessages: [
        spec.message,
        `¡${ctx.playerDef.name} despliega ${spec.name}! (120 de daño por radiación/turno, anulación de habilidad enemiga y Regeneración Avanzada por 4 turnos)`,
      ],
    };
  },

  // Default Fallback Handler for standard characters
  default: (ctx) => {
    const spec = ctx.playerDef.specialAbility;
    const newMin = ctx.minDamage + spec.bonusMin;
    const newMax = ctx.maxDamage + spec.bonusMax;
    const heal = spec.healBonus || 0;
    const newHP = Math.min(ctx.maxHealth, ctx.currentHealth + heal);

    return {
      newDef: { ...ctx.playerDef },
      currentHealth: newHP,
      minDamage: newMin,
      maxDamage: newMax,
      defenseReduction: ctx.defenseReduction,
      specialUsed: true,
      radiationFieldTurns: ctx.radiationFieldTurns,
      logMessages: [
        `${ctx.playerDef.name} ha activado su Habilidad Especial: ${spec.name}!`,
        spec.message,
      ],
    };
  },
};

export function executeCharacterSpecial(
  ctx: AbilityExecutionContext
): AbilityExecutionResult {
  const handler =
    CHARACTER_SPECIAL_HANDLERS[ctx.playerDef.id] ||
    CHARACTER_SPECIAL_HANDLERS.default;
  return handler(ctx);
}
