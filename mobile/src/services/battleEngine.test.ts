import { describe, it, expect } from 'vitest';
import {
  initBattle,
  executePlayerAttack,
  executePlayerDefend,
  executePlayerRegen,
  executePlayerSpecial,
  executeBossTurn,
  type Rng,
} from './battleEngine';
import { GAME_CHARACTERS, REY_ESCARLATA_BOSS } from '@/constants/battleData';

// ─── Deterministic RNG helpers ─────────────────────────────────────────────
/** Always returns the same value in [0,1). */
function constantRng(value: number): Rng {
  return () => value;
}

/** Returns values from a sequence, cycling if exhausted. */
function sequenceRng(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length];
}

// ─── initBattle ────────────────────────────────────────────────────────────
describe('initBattle', () => {
  it('initializes player and boss with full HP from definitions', () => {
    const state = initBattle('argos');
    expect(state.player.def.id).toBe('argos');
    expect(state.player.currentHealth).toBe(GAME_CHARACTERS.argos.maxHealth);
    expect(state.player.maxHealth).toBe(GAME_CHARACTERS.argos.maxHealth);
    expect(state.boss.def.name).toBe(REY_ESCARLATA_BOSS.name);
    expect(state.boss.currentHealth).toBe(REY_ESCARLATA_BOSS.maxHealth);
    expect(state.turnPhase).toBe('player_turn');
    expect(state.turnCount).toBe(1);
  });

  it('falls back to argos for an unknown charId', () => {
    const state = initBattle('nonexistent');
    expect(state.player.def.id).toBe('argos');
  });

  it('starts with two info log entries', () => {
    const state = initBattle('argos');
    expect(state.log).toHaveLength(2);
    expect(state.log[0].type).toBe('info');
    expect(state.log[1].type).toBe('info');
  });
});

// ─── executePlayerAttack ───────────────────────────────────────────────────
describe('executePlayerAttack', () => {
  it('deals min damage when rng returns 0 and no crit', () => {
    const state = initBattle('argos');
    // rng=0 → randInt picks min; rng=0 again → chance(0.2) is false (0 < 0.2 is true!)
    // Wait: 0 < 0.2 IS true, so crit would trigger. Use a value >= 0.2 to avoid crit.
    // randInt uses rng() once, chance uses rng() once. Sequence: [0, 0.5]
    // randInt(0) → min damage; chance(0.5) → 0.5 < 0.2 is false → no crit.
    const rng = sequenceRng([0, 0.5]);
    const { newState, damageDealt, isCrit } = executePlayerAttack(state, rng);

    const expectedDamage = GAME_CHARACTERS.argos.attack.minDamage;
    expect(damageDealt).toBe(expectedDamage);
    expect(isCrit).toBe(false);
    expect(newState.boss.currentHealth).toBe(
      REY_ESCARLATA_BOSS.maxHealth - expectedDamage
    );
    expect(newState.turnPhase).toBe('boss_turn');
    expect(newState.player.spriteState).toBe('attack');
    expect(newState.boss.spriteState).toBe('hit');
  });

  it('deals max damage when rng returns ~1 and no crit', () => {
    const state = initBattle('argos');
    // randInt: Math.floor(0.99 * (max-min+1)) + min → max
    // chance: 0.99 < 0.2 → false → no crit
    const rng = sequenceRng([0.99, 0.99]);
    const { damageDealt, isCrit } = executePlayerAttack(state, rng);

    expect(damageDealt).toBe(GAME_CHARACTERS.argos.attack.maxDamage);
    expect(isCrit).toBe(false);
  });

  it('doubles damage on crit', () => {
    const state = initBattle('argos');
    // randInt(0) → min damage; chance(0.1) → 0.1 < 0.2 → crit!
    const rng = sequenceRng([0, 0.1]);
    const { damageDealt, isCrit, newState } = executePlayerAttack(state, rng);

    expect(isCrit).toBe(true);
    expect(damageDealt).toBe(GAME_CHARACTERS.argos.attack.minDamage * 2);
    expect(newState.boss.currentHealth).toBe(
      REY_ESCARLATA_BOSS.maxHealth - GAME_CHARACTERS.argos.attack.minDamage * 2
    );
  });

  it('always crits for galileo (alwaysCrit flag)', () => {
    const state = initBattle('galileo');
    // randInt(0.99) → max; chance(0.99) → would be false, but alwaysCrit overrides
    const rng = sequenceRng([0.99, 0.99]);
    const { damageDealt, isCrit } = executePlayerAttack(state, rng);

    expect(isCrit).toBe(true);
    expect(damageDealt).toBe(GAME_CHARACTERS.galileo.attack.maxDamage * 2);
  });

  it('transitions to victory when boss HP reaches 0', () => {
    // Set boss to low HP so one attack kills.
    const state = initBattle('argos');
    const nearDeath = {
      ...state,
      boss: { ...state.boss, currentHealth: 1 },
    };
    const rng = sequenceRng([0, 0.5]); // min damage, no crit
    const { newState } = executePlayerAttack(nearDeath, rng);

    expect(newState.boss.currentHealth).toBe(0);
    expect(newState.turnPhase).toBe('victory');
    expect(newState.log.at(-1)?.type).toBe('info');
  });
});

// ─── executePlayerDefend ───────────────────────────────────────────────────
describe('executePlayerDefend', () => {
  it('sets isDefending and transitions to boss_turn', () => {
    const state = initBattle('argos');
    const newState = executePlayerDefend(state);

    expect(newState.player.isDefending).toBe(true);
    expect(newState.player.spriteState).toBe('defend');
    expect(newState.turnPhase).toBe('boss_turn');
  });
});

// ─── executePlayerRegen ────────────────────────────────────────────────────
describe('executePlayerRegen', () => {
  it('heals the player by regenAmount, capped at maxHealth', () => {
    const state = initBattle('argos');
    const damaged = {
      ...state,
      player: { ...state.player, currentHealth: 100 },
    };
    const { newState, healedAmount } = executePlayerRegen(damaged);

    const expectedHeal = Math.min(
      GAME_CHARACTERS.argos.regenAmount,
      GAME_CHARACTERS.argos.maxHealth - 100
    );
    expect(healedAmount).toBe(expectedHeal);
    expect(newState.player.currentHealth).toBe(100 + expectedHeal);
    expect(newState.player.spriteState).toBe('regen');
    expect(newState.turnPhase).toBe('boss_turn');
  });

  it('does not overheal when at full HP', () => {
    const state = initBattle('argos');
    const { healedAmount, newState } = executePlayerRegen(state);
    expect(healedAmount).toBe(0);
    expect(newState.player.currentHealth).toBe(state.player.maxHealth);
  });
});

// ─── executePlayerSpecial ──────────────────────────────────────────────────
describe('executePlayerSpecial', () => {
  it('is blocked when specialUsed is already true', () => {
    const state = initBattle('argos');
    const used = {
      ...state,
      player: { ...state.player, specialUsed: true },
    };
    const newState = executePlayerSpecial(used);
    // Returns the same state unchanged.
    expect(newState).toBe(used);
  });

  it('is blocked when HP > 50% (canUseSpecial rule in engine)', () => {
    const state = initBattle('argos');
    // argos maxHealth=1750, currentHealth=1750 → 100% > 50% → blocked
    const newState = executePlayerSpecial(state);
    expect(newState).toBe(state);
  });

  it('transforms argos into galileo when HP <= 50%', () => {
    const state = initBattle('argos');
    const lowHp = {
      ...state,
      player: { ...state.player, currentHealth: 100 }, // 100/1750 < 50%
    };
    const newState = executePlayerSpecial(lowHp);

    expect(newState.player.def.id).toBe('galileo');
    expect(newState.player.currentMinDamage).toBe(
      GAME_CHARACTERS.galileo.attack.minDamage
    );
    expect(newState.player.currentMaxDamage).toBe(
      GAME_CHARACTERS.galileo.attack.maxDamage
    );
    // Galileo can still use its own special after transforming.
    expect(newState.player.specialUsed).toBe(false);
    expect(newState.player.spriteState).toBe('special');
  });

  it('applies damage bonus for default-handler characters (orfevre)', () => {
    const state = initBattle('orfevre');
    const lowHp = {
      ...state,
      player: { ...state.player, currentHealth: 100 },
    };
    const newState = executePlayerSpecial(lowHp);

    const spec = GAME_CHARACTERS.orfevre.specialAbility;
    expect(newState.player.currentMinDamage).toBe(
      GAME_CHARACTERS.orfevre.attack.minDamage + spec.bonusMin
    );
    expect(newState.player.currentMaxDamage).toBe(
      GAME_CHARACTERS.orfevre.attack.maxDamage + spec.bonusMax
    );
    expect(newState.player.specialUsed).toBe(true);
  });
});

// ─── executeBossTurn ───────────────────────────────────────────────────────
describe('executeBossTurn', () => {
  it('deals damage to the player and returns to player_turn', () => {
    const state = initBattle('argos');
    // Boss attack: randInt(0) → min damage; phrase pick: 0 → first phrase
    const rng = sequenceRng([0, 0]);
    const { newState, damageDealt } = executeBossTurn(state, rng);

    expect(damageDealt).toBe(REY_ESCARLATA_BOSS.attack.minDamage);
    expect(newState.player.currentHealth).toBe(
      GAME_CHARACTERS.argos.maxHealth - REY_ESCARLATA_BOSS.attack.minDamage
    );
    expect(newState.turnPhase).toBe('player_turn');
    expect(newState.turnCount).toBe(2);
    expect(newState.boss.spriteState).toBe('attack');
  });

  it('reduces damage when player is defending', () => {
    const state = initBattle('argos');
    const defending = {
      ...state,
      player: { ...state.player, isDefending: true },
    };
    const rng = sequenceRng([0, 0]); // min boss damage, first phrase
    const { damageDealt } = executeBossTurn(defending, rng);

    const expected = Math.max(
      10,
      REY_ESCARLATA_BOSS.attack.minDamage - GAME_CHARACTERS.argos.defense.reduction
    );
    expect(damageDealt).toBe(expected);
  });

  it('doubles boss damage in phase 2 (boss HP <= 50%)', () => {
    const state = initBattle('argos');
    const phase2 = {
      ...state,
      boss: {
        ...state.boss,
        currentHealth: REY_ESCARLATA_BOSS.phase2HealthThreshold, // exactly at threshold
      },
    };
    const rng = sequenceRng([0, 0]); // min damage, first phrase
    const { damageDealt, newState } = executeBossTurn(phase2, rng);

    expect(damageDealt).toBe(REY_ESCARLATA_BOSS.attack.minDamage * 2);
    expect(newState.boss.isPhase2).toBe(true);
  });

  it('does NOT double damage in phase 2 when radiation field is active', () => {
    const state = initBattle('galileo');
    const withField = {
      ...state,
      boss: {
        ...state.boss,
        currentHealth: REY_ESCARLATA_BOSS.phase2HealthThreshold,
      },
      player: { ...state.player, radiationFieldTurns: 3 },
    };
    const rng = sequenceRng([0, 0]);
    const { damageDealt } = executeBossTurn(withField, rng);

    // Radiation nullifies phase 2 multiplier → base min damage
    expect(damageDealt).toBe(REY_ESCARLATA_BOSS.attack.minDamage);
  });

  it('applies radiation damage to boss and heal to player when field is active', () => {
    const state = initBattle('galileo');
    const damagedPlayer = {
      ...state,
      player: {
        ...state.player,
        currentHealth: 100,
        radiationFieldTurns: 2,
      },
    };
    const rng = sequenceRng([0, 0]);
    const { newState } = executeBossTurn(damagedPlayer, rng);

    // Radiation: 120 dmg to boss, 160 heal to player
    expect(newState.boss.currentHealth).toBe(
      REY_ESCARLATA_BOSS.maxHealth - 120 - 0 // boss also takes the attack dmg
    );
    // Player healed to 100+160=260, then takes boss min damage (75)
    expect(newState.player.currentHealth).toBe(260 - 75);
    expect(newState.player.radiationFieldTurns).toBe(1); // decremented
  });

  it('awards victory without boss attacking when radiation kills the boss', () => {
    const state = initBattle('galileo');
    const bossNearDeath = {
      ...state,
      boss: { ...state.boss, currentHealth: 50 },
      player: {
        ...state.player,
        currentHealth: 100,
        radiationFieldTurns: 1,
      },
    };
    const rng = sequenceRng([0, 0]);
    const { newState, damageDealt } = executeBossTurn(bossNearDeath, rng);

    // Radiation deals 120 → boss at 50 goes to 0 → victory, no boss attack.
    // The radiation field heals the player +160 BEFORE the boss-death check,
    // so player HP is 100 + 160 = 260 (no boss damage applied after).
    expect(newState.boss.currentHealth).toBe(0);
    expect(newState.turnPhase).toBe('victory');
    expect(newState.player.spriteState).toBe('victory');
    expect(newState.boss.spriteState).toBe('defeat');
    expect(newState.player.currentHealth).toBe(260);
    expect(damageDealt).toBe(0);
  });

  it('transitions to defeat when player HP reaches 0', () => {
    const state = initBattle('argos');
    const playerNearDeath = {
      ...state,
      player: { ...state.player, currentHealth: 1 },
    };
    const rng = sequenceRng([0, 0]); // boss min damage (75) > 1 HP
    const { newState } = executeBossTurn(playerNearDeath, rng);

    expect(newState.player.currentHealth).toBe(0);
    expect(newState.turnPhase).toBe('defeat');
    expect(newState.player.spriteState).toBe('defeat');
  });
});
