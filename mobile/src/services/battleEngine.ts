/**
 * Battle Engine — Pure combat logic for the RPG turn-based system.
 *
 * No UI, no React, no Firebase. Pure functions that take state and return
 * new state + a log of events for the UI to render.
 *
 * The engine handles:
 *   - Turn order (by speed)
 *   - Damage calculation (physical / magical)
 *   - Skills, items, defending, fleeing
 *   - Status effects (poison, stun, regen, buffs)
 *   - Passive abilities (counter, lifesteal, regen, guaranteed crit)
 *   - Enemy AI
 */

import {
  type CharacterDef,
  type CharacterStats,
  type EnemyDef,
  type Skill,
  type ItemDef,
  type StatusInstance,
  type StatusEffect,
  type Passive,
  CHARACTER_BY_ID,
  ITEM_BY_ID,
  getStatsAtLevel,
  getSkillsForLevel,
} from '@/constants/gameData';

// ═══════════════════════════════════════════════════════════════════════
// COMBATANT TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface Combatant {
  id: string;
  name: string;
  isPlayer: boolean;
  level: number;
  stats: CharacterStats;        // current stats (including buffs)
  baseStats: CharacterStats;    // original stats (for buff removal)
  maxHP: number;
  maxMP: number;
  currentHP: number;
  currentMP: number;
  statuses: StatusInstance[];
  defending: boolean;
  // For player characters
  charId?: string;
  passives?: Passive[];
  skills?: Skill[];
  // For enemies
  enemyDef?: EnemyDef;
  // Visual
  accentColor: string;
  fallbackIcon: string;
}

export type BattlePhase =
  | 'intro'
  | 'player_turn'
  | 'enemy_turn'
  | 'animating'
  | 'victory'
  | 'defeat'
  | 'fled';

export interface BattleLogEntry {
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee' | 'status' | 'passive' | 'info' | 'crit' | 'miss';
  actorId: string;
  targetId: string;
  message: string;
  damage?: number;
  heal?: number;
  statusApplied?: StatusEffect;
}

export interface BattleState {
  phase: BattlePhase;
  player: Combatant;
  enemy: Combatant;
  turnQueue: string[];          // 'player' / 'enemy' order
  currentTurnIndex: number;
  log: BattleLogEntry[];
  turnCount: number;
  fled: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// FACTORY: Create combatants
// ═══════════════════════════════════════════════════════════════════════

export function createPlayerCombatant(
  charId: string,
  level: number,
  currentHP?: number,
  currentMP?: number
): Combatant {
  const char = CHARACTER_BY_ID.get(charId);
  if (!char) throw new Error(`Unknown character: ${charId}`);

  const stats = getStatsAtLevel(charId, level);
  const skills = getSkillsForLevel(charId, level);

  return {
    id: 'player',
    name: char.name,
    isPlayer: true,
    level,
    stats: { ...stats },
    baseStats: { ...stats },
    maxHP: stats.hp,
    maxMP: stats.mp,
    currentHP: currentHP ?? stats.hp,
    currentMP: currentMP ?? stats.mp,
    statuses: [],
    defending: false,
    charId,
    passives: char.passives,
    skills,
    accentColor: char.accentColor,
    fallbackIcon: char.fallbackIcon,
  };
}

export function createEnemyCombatant(enemyDef: EnemyDef): Combatant {
  return {
    id: 'enemy',
    name: enemyDef.name,
    isPlayer: false,
    level: 1,
    stats: { ...enemyDef.stats },
    baseStats: { ...enemyDef.stats },
    maxHP: enemyDef.stats.hp,
    maxMP: enemyDef.stats.mp,
    currentHP: enemyDef.stats.hp,
    currentMP: enemyDef.stats.mp,
    statuses: [],
    defending: false,
    enemyDef,
    accentColor: enemyDef.accentColor,
    fallbackIcon: enemyDef.fallbackIcon,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// INIT BATTLE
// ═══════════════════════════════════════════════════════════════════════

export function initBattle(
  charId: string,
  level: number,
  currentHP: number,
  currentMP: number,
  enemyDef: EnemyDef
): BattleState {
  const player = createPlayerCombatant(charId, level, currentHP, currentMP);
  const enemy = createEnemyCombatant(enemyDef);

  // Determine turn order by speed
  const queue = [player, enemy].sort((a, b) => b.stats.speed - a.stats.speed);
  const turnQueue = queue.map((c) => c.id);

  return {
    phase: 'intro',
    player,
    enemy,
    turnQueue,
    currentTurnIndex: 0,
    log: [],
    turnCount: 1,
    fled: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// DAMAGE CALCULATION
// ═══════════════════════════════════════════════════════════════════════

interface DamageSkillRef {
  type: 'physical' | 'magical' | 'heal' | 'buff';
  power: number;
  effect?: Skill['effect'];
}

function calculateDamage(
  attacker: Combatant,
  defender: Combatant,
  skill: DamageSkillRef
): { damage: number; isCrit: boolean } {
  const isPhysical = skill.type === 'physical';
  const attackStat = isPhysical ? attacker.stats.attack : attacker.stats.magic;
  const defenseStat = isPhysical ? defender.stats.defense : defender.stats.resistance;

  // Base damage
  let damage = attackStat * skill.power;

  // Defense reduction formula
  damage *= 1 - defenseStat / (defenseStat + 100);

  // Random variation (±10%)
  damage *= 0.9 + Math.random() * 0.2;

  // Critical hit (15% base chance, 1.5x multiplier)
  let isCrit = Math.random() < 0.15;

  // Check passives for guaranteed crit
  if (attacker.passives) {
    for (const passive of attacker.passives) {
      if (passive.handler === 'guaranteed_crit_low_hp') {
        const threshold = passive.params?.threshold ?? 0.3;
        if (attacker.currentHP / attacker.maxHP <= threshold) {
          isCrit = true;
        }
      }
    }
  }

  if (isCrit) {
    damage *= 1.5;
  }

  // Defender takes 50% less damage if defending
  if (defender.defending) {
    damage *= 0.5;
  }

  return { damage: Math.max(1, Math.floor(damage)), isCrit };
}

// ═══════════════════════════════════════════════════════════════════════
// STATUS EFFECTS
// ═══════════════════════════════════════════════════════════════════════

function applyStatus(target: Combatant, status: StatusInstance): void {
  // If same status already exists, refresh duration
  const existing = target.statuses.find((s) => s.effect === status.effect);
  if (existing) {
    existing.duration = Math.max(existing.duration, status.duration);
    existing.potency = Math.max(existing.potency, status.potency);
  } else {
    target.statuses.push({ ...status });
  }
}

function processStatuses(combatant: Combatant, log: BattleLogEntry[]): void {
  const remaining: StatusInstance[] = [];

  for (const status of combatant.statuses) {
    switch (status.effect) {
      case 'poison': {
        const dmg = status.potency;
        combatant.currentHP = Math.max(0, combatant.currentHP - dmg);
        log.push({
          type: 'status',
          actorId: combatant.id,
          targetId: combatant.id,
          message: `${combatant.name} sufre ${dmg} de daño por veneno.`,
          damage: dmg,
          statusApplied: 'poison',
        });
        break;
      }
      case 'regen_hp': {
        const heal = Math.floor(combatant.maxHP * (status.potency / 100));
        combatant.currentHP = Math.min(combatant.maxHP, combatant.currentHP + heal);
        log.push({
          type: 'status',
          actorId: combatant.id,
          targetId: combatant.id,
          message: `${combatant.name} regenera ${heal} HP.`,
          heal,
          statusApplied: 'regen_hp',
        });
        break;
      }
      case 'regen_mp': {
        const heal = Math.floor(combatant.maxMP * (status.potency / 100));
        combatant.currentMP = Math.min(combatant.maxMP, combatant.currentMP + heal);
        break;
      }
      case 'defense_up': {
        // Buff is active — no per-turn processing needed
        break;
      }
      case 'stun': {
        // Stun just prevents action; duration handled below
        break;
      }
    }

    status.duration -= 1;
    if (status.duration > 0) {
      remaining.push(status);
    } else {
      // Remove buff effect when expired
      if (status.effect === 'defense_up' && status.potency === 0) {
        // Buff stat removal handled by buffAmount tracking
      }
      log.push({
        type: 'info',
        actorId: combatant.id,
        targetId: combatant.id,
        message: `${combatant.name} ya no está afectado por ${status.effect}.`,
      });
    }
  }

  combatant.statuses = remaining;
}

function isStunned(combatant: Combatant): boolean {
  return combatant.statuses.some((s) => s.effect === 'stun');
}

// ═══════════════════════════════════════════════════════════════════════
// PASSIVE HANDLERS
// ═══════════════════════════════════════════════════════════════════════

function handlePassivesOnTurnStart(
  combatant: Combatant,
  log: BattleLogEntry[]
): void {
  if (!combatant.passives) return;

  for (const passive of combatant.passives) {
    if (passive.trigger !== 'on_turn_start') continue;

    if (passive.handler === 'regen_mp') {
      const percent = passive.params?.percent ?? 0.05;
      const regen = Math.floor(combatant.maxMP * percent);
      combatant.currentMP = Math.min(combatant.maxMP, combatant.currentMP + regen);
      log.push({
        type: 'passive',
        actorId: combatant.id,
        targetId: combatant.id,
        message: `${passive.name}: ${combatant.name} regenera ${regen} MP.`,
      });
    }
  }
}

function handlePassivesOnAttack(
  attacker: Combatant,
  damageDealt: number,
  log: BattleLogEntry[]
): void {
  if (!attacker.passives) return;

  for (const passive of attacker.passives) {
    if (passive.trigger !== 'on_attack') continue;

    if (passive.handler === 'lifesteal') {
      const percent = passive.params?.percent ?? 0.1;
      const heal = Math.floor(damageDealt * percent);
      attacker.currentHP = Math.min(attacker.maxHP, attacker.currentHP + heal);
      log.push({
        type: 'passive',
        actorId: attacker.id,
        targetId: attacker.id,
        message: `${passive.name}: ${attacker.name} recupera ${heal} HP.`,
        heal,
      });
    }
  }
}

function handlePassivesOnHitReceived(
  defender: Combatant,
  attacker: Combatant,
  damage: number,
  isPhysical: boolean,
  log: BattleLogEntry[]
): { countered: boolean; counterDamage: number } {
  if (!defender.passives) return { countered: false, counterDamage: 0 };

  for (const passive of defender.passives) {
    if (passive.trigger !== 'on_hit_received') continue;
    if (!isPhysical) continue; // counter only works on physical

    if (passive.handler === 'counter_attack') {
      const chance = passive.params?.chance ?? 0.5;
      if (Math.random() < chance) {
        const counterDmg = Math.floor(defender.stats.attack * 0.7);
        attacker.currentHP = Math.max(0, attacker.currentHP - counterDmg);
        log.push({
          type: 'passive',
          actorId: defender.id,
          targetId: attacker.id,
          message: `${passive.name}: ${defender.name} contraataca por ${counterDmg} daño!`,
          damage: counterDmg,
        });
        return { countered: true, counterDamage: counterDmg };
      }
    }
  }

  return { countered: false, counterDamage: 0 };
}

// ═══════════════════════════════════════════════════════════════════════
// PLAYER ACTIONS
// ═══════════════════════════════════════════════════════════════════════

export interface ActionResult {
  state: BattleState;
  logs: BattleLogEntry[];
}

export function playerAttack(state: BattleState): ActionResult {
  const logs: BattleLogEntry[] = [];
  const { player, enemy } = state;

  const { damage, isCrit } = calculateDamage(player, enemy, {
    type: 'physical',
    power: 1.0,
  });

  enemy.currentHP = Math.max(0, enemy.currentHP - damage);

  logs.push({
    type: isCrit ? 'crit' : 'attack',
    actorId: player.id,
    targetId: enemy.id,
    message: `${player.name} ataca a ${enemy.name} por ${damage} de daño${isCrit ? ' (CRÍTICO!)' : ''}.`,
    damage,
  });

  // Lifesteal passive
  handlePassivesOnAttack(player, damage, logs);

  // Counter passive (enemy)
  handlePassivesOnHitReceived(enemy, player, damage, true, logs);

  const newState = checkBattleEnd({ ...state, log: [...state.log, ...logs] });
  return { state: newState, logs };
}

export function playerUseSkill(state: BattleState, skillId: string): ActionResult {
  const logs: BattleLogEntry[] = [];
  const { player, enemy } = state;

  const skill = player.skills?.find((s) => s.id === skillId);
  if (!skill) {
    logs.push({
      type: 'info',
      actorId: player.id,
      targetId: player.id,
      message: 'Habilidad no disponible.',
    });
    return { state: { ...state, log: [...state.log, ...logs] }, logs };
  }

  if (player.currentMP < skill.mpCost) {
    logs.push({
      type: 'info',
      actorId: player.id,
      targetId: player.id,
      message: 'No tienes suficiente MP.',
    });
    return { state: { ...state, log: [...state.log, ...logs] }, logs };
  }

  player.currentMP -= skill.mpCost;

  // Handle skill types
  if (skill.type === 'heal') {
    const healAmount = Math.floor(player.maxHP * skill.power);
    player.currentHP = Math.min(player.maxHP, player.currentHP + healAmount);
    logs.push({
      type: 'skill',
      actorId: player.id,
      targetId: player.id,
      message: `${player.name} usa ${skill.name} y recupera ${healAmount} HP.`,
      heal: healAmount,
    });
  } else if (skill.type === 'buff') {
    if (skill.effect?.buffStat && skill.effect?.buffAmount) {
      player.stats[skill.effect.buffStat] += skill.effect.buffAmount;
      applyStatus(player, {
        effect: 'defense_up',
        duration: skill.effect.statusDuration ?? 3,
        potency: skill.effect.buffAmount,
      });
      logs.push({
        type: 'skill',
        actorId: player.id,
        targetId: player.id,
        message: `${player.name} usa ${skill.name}. ${skill.effect.buffStat} +${skill.effect.buffAmount} por ${skill.effect.statusDuration ?? 3} turnos.`,
      });
    }
  } else {
    // Physical or magical attack
    const { damage, isCrit } = calculateDamage(player, enemy, skill);
    enemy.currentHP = Math.max(0, enemy.currentHP - damage);

    logs.push({
      type: isCrit ? 'crit' : 'skill',
      actorId: player.id,
      targetId: enemy.id,
      message: `${player.name} usa ${skill.name} contra ${enemy.name} por ${damage} de daño${isCrit ? ' (CRÍTICO!)' : ''}.`,
      damage,
    });

    // Apply status effect from skill
    if (skill.effect?.status && skill.effect?.statusChance) {
      if (Math.random() < skill.effect.statusChance) {
        applyStatus(enemy, {
          effect: skill.effect.status,
          duration: skill.effect.statusDuration ?? 2,
          potency: skill.effect.statusPotency ?? 0,
        });
        logs.push({
          type: 'status',
          actorId: player.id,
          targetId: enemy.id,
          message: `${enemy.name} ahora está afectado por ${skill.effect.status}.`,
          statusApplied: skill.effect.status,
        });
      }
    }

    // Lifesteal passive
    handlePassivesOnAttack(player, damage, logs);

    // Counter passive (enemy)
    handlePassivesOnHitReceived(enemy, player, damage, skill.type === 'physical', logs);
  }

  const newState = checkBattleEnd({ ...state, log: [...state.log, ...logs] });
  return { state: newState, logs };
}

export function playerUseItem(
  state: BattleState,
  itemId: string
): { state: BattleState; logs: BattleLogEntry[]; success: boolean } {
  const logs: BattleLogEntry[] = [];
  const { player } = state;
  const item = ITEM_BY_ID.get(itemId);

  if (!item) {
    return { state, logs: [], success: false };
  }

  if (item.type === 'heal_hp') {
    const heal = Math.min(item.amount, player.maxHP - player.currentHP);
    player.currentHP += heal;
    logs.push({
      type: 'item',
      actorId: player.id,
      targetId: player.id,
      message: `${player.name} usa ${item.name} y recupera ${heal} HP.`,
      heal,
    });
  } else if (item.type === 'heal_mp') {
    const heal = Math.min(item.amount, player.maxMP - player.currentMP);
    player.currentMP += heal;
    logs.push({
      type: 'item',
      actorId: player.id,
      targetId: player.id,
      message: `${player.name} usa ${item.name} y recupera ${heal} MP.`,
      heal,
    });
  } else if (item.type === 'cure_status') {
    player.statuses = player.statuses.filter((s) => s.effect !== 'poison');
    logs.push({
      type: 'item',
      actorId: player.id,
      targetId: player.id,
      message: `${player.name} usa ${item.name} y se cura del envenenamiento.`,
    });
  }

  return {
    state: { ...state, log: [...state.log, ...logs] },
    logs,
    success: true,
  };
}

export function playerDefend(state: BattleState): ActionResult {
  const logs: BattleLogEntry[] = [];
  state.player.defending = true;
  logs.push({
    type: 'defend',
    actorId: state.player.id,
    targetId: state.player.id,
    message: `${state.player.name} se defiende, reduciendo el daño del próximo ataque.`,
  });
  return { state: { ...state, log: [...state.log, ...logs] }, logs };
}

export function playerFlee(state: BattleState): ActionResult {
  const logs: BattleLogEntry[] = [];
  const { enemy } = state;

  // Can't flee from bosses
  if (enemy.enemyDef?.isBoss) {
    logs.push({
      type: 'info',
      actorId: state.player.id,
      targetId: state.player.id,
      message: 'No puedes huir de un jefe.',
    });
    return { state: { ...state, log: [...state.log, ...logs] }, logs };
  }

  const success = Math.random() < 0.7;
  if (success) {
    logs.push({
      type: 'flee',
      actorId: state.player.id,
      targetId: state.player.id,
      message: `${state.player.name} ha huido de la batalla.`,
    });
    return {
      state: { ...state, phase: 'fled', fled: true, log: [...state.log, ...logs] },
      logs,
    };
  } else {
    logs.push({
      type: 'info',
      actorId: state.player.id,
      targetId: state.player.id,
      message: 'No pudiste huir.',
    });
    return { state: { ...state, log: [...state.log, ...logs] }, logs };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ENEMY AI
// ═══════════════════════════════════════════════════════════════════════

export function enemyTurn(state: BattleState): ActionResult {
  const logs: BattleLogEntry[] = [];
  const { enemy, player } = state;

  // Process statuses at turn start
  processStatuses(enemy, logs);

  // Check if stunned
  if (isStunned(enemy)) {
    logs.push({
      type: 'status',
      actorId: enemy.id,
      targetId: enemy.id,
      message: `${enemy.name} está aturdido y no puede actuar.`,
      statusApplied: 'stun',
    });
    return { state: { ...state, log: [...state.log, ...logs] }, logs };
  }

  // Check if dead from poison
  if (enemy.currentHP <= 0) {
    const newState = checkBattleEnd({ ...state, log: [...state.log, ...logs] });
    return { state: newState, logs };
  }

  const ai = enemy.enemyDef?.ai;
  if (!ai) {
    // Fallback: just attack
    const { damage, isCrit } = calculateDamage(enemy, player, {
      type: 'physical',
      power: 1.0,
    });
    player.currentHP = Math.max(0, player.currentHP - damage);
    logs.push({
      type: isCrit ? 'crit' : 'attack',
      actorId: enemy.id,
      targetId: player.id,
      message: `${enemy.name} ataca a ${player.name} por ${damage} de daño${isCrit ? ' (CRÍTICO!)' : ''}.`,
      damage,
    });
    const newState = checkBattleEnd({ ...state, log: [...state.log, ...logs] });
    return { state: newState, logs };
  }

  // Check heal threshold
  const hpPercent = enemy.currentHP / enemy.maxHP;
  if (hpPercent < ai.healThreshold && Math.random() < ai.healChance) {
    const healAmount = Math.floor(enemy.maxHP * 0.2);
    enemy.currentHP = Math.min(enemy.maxHP, enemy.currentHP + healAmount);
    logs.push({
      type: 'skill',
      actorId: enemy.id,
      targetId: enemy.id,
      message: `${enemy.name} se cura ${healAmount} HP.`,
      heal: healAmount,
    });
    return { state: { ...state, log: [...state.log, ...logs] }, logs };
  }

  // Decide action
  const roll = Math.random();
  const skills = enemy.enemyDef?.skills || [];

  // Special (boss only, when HP < 30%)
  if (roll < ai.specialChance && hpPercent < 0.3) {
    const specialSkill = skills.find((s) => s.isSpecial);
    if (specialSkill && enemy.currentMP >= specialSkill.mpCost) {
      enemy.currentMP -= specialSkill.mpCost;
      const { damage, isCrit } = calculateDamage(enemy, player, specialSkill);
      player.currentHP = Math.max(0, player.currentHP - damage);
      logs.push({
        type: isCrit ? 'crit' : 'skill',
        actorId: enemy.id,
        targetId: player.id,
        message: `${enemy.name} usa ${specialSkill.name}! ${damage} de daño${isCrit ? ' (CRÍTICO!)' : ''}.`,
        damage,
      });
      if (specialSkill.effect?.status && specialSkill.effect?.statusChance) {
        if (Math.random() < specialSkill.effect.statusChance) {
          applyStatus(player, {
            effect: specialSkill.effect.status,
            duration: specialSkill.effect.statusDuration ?? 2,
            potency: specialSkill.effect.statusPotency ?? 0,
          });
          logs.push({
            type: 'status',
            actorId: enemy.id,
            targetId: player.id,
            message: `${player.name} ahora está afectado por ${specialSkill.effect.status}.`,
            statusApplied: specialSkill.effect.status,
          });
        }
      }
      const newState = checkBattleEnd({ ...state, log: [...state.log, ...logs] });
      return { state: newState, logs };
    }
  }

  // Skill
  if (roll < ai.specialChance + ai.skillChance) {
    const usableSkills = skills.filter(
      (s) => !s.isSpecial && enemy.currentMP >= s.mpCost
    );
    if (usableSkills.length > 0) {
      const skill = usableSkills[Math.floor(Math.random() * usableSkills.length)];
      enemy.currentMP -= skill.mpCost;

      if (skill.type === 'heal') {
        const heal = Math.floor(enemy.maxHP * skill.power);
        enemy.currentHP = Math.min(enemy.maxHP, enemy.currentHP + heal);
        logs.push({
          type: 'skill',
          actorId: enemy.id,
          targetId: enemy.id,
          message: `${enemy.name} usa ${skill.name} y recupera ${heal} HP.`,
          heal,
        });
      } else {
        const { damage, isCrit } = calculateDamage(enemy, player, skill);
        player.currentHP = Math.max(0, player.currentHP - damage);
        logs.push({
          type: isCrit ? 'crit' : 'skill',
          actorId: enemy.id,
          targetId: player.id,
          message: `${enemy.name} usa ${skill.name}! ${damage} de daño${isCrit ? ' (CRÍTICO!)' : ''}.`,
          damage,
        });
        if (skill.effect?.status && skill.effect?.statusChance) {
          if (Math.random() < skill.effect.statusChance) {
            applyStatus(player, {
              effect: skill.effect.status,
              duration: skill.effect.statusDuration ?? 2,
              potency: skill.effect.statusPotency ?? 0,
            });
            logs.push({
              type: 'status',
              actorId: enemy.id,
              targetId: player.id,
              message: `${player.name} ahora está afectado por ${skill.effect.status}.`,
              statusApplied: skill.effect.status,
            });
          }
        }
      }
      const newState = checkBattleEnd({ ...state, log: [...state.log, ...logs] });
      return { state: newState, logs };
    }
  }

  // Basic attack
  const { damage, isCrit } = calculateDamage(enemy, player, {
    type: 'physical',
    power: 1.0,
  });
  player.currentHP = Math.max(0, player.currentHP - damage);
  logs.push({
    type: isCrit ? 'crit' : 'attack',
    actorId: enemy.id,
    targetId: player.id,
    message: `${enemy.name} ataca a ${player.name} por ${damage} de daño${isCrit ? ' (CRÍTICO!)' : ''}.`,
    damage,
  });

  // Counter passive (player)
  handlePassivesOnHitReceived(player, enemy, damage, true, logs);

  const newState = checkBattleEnd({ ...state, log: [...state.log, ...logs] });
  return { state: newState, logs };
}

// ═══════════════════════════════════════════════════════════════════════
// TURN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

export function startPlayerTurn(state: BattleState): BattleState {
  const logs: BattleLogEntry[] = [];
  const player = { ...state.player };

  // Process player statuses
  processStatuses(player, logs);

  // Handle on_turn_start passives
  handlePassivesOnTurnStart(player, logs);

  // Reset defending flag
  player.defending = false;

  return {
    ...state,
    player,
    phase: 'player_turn',
    log: [...state.log, ...logs],
  };
}

export function startEnemyTurn(state: BattleState): BattleState {
  return { ...state, phase: 'enemy_turn' };
}

export function advanceTurn(state: BattleState): BattleState {
  const nextIndex = (state.currentTurnIndex + 1) % state.turnQueue.length;
  const nextActor = state.turnQueue[nextIndex];
  const turnCount = nextIndex === 0 ? state.turnCount + 1 : state.turnCount;

  if (nextActor === 'player') {
    return startPlayerTurn({ ...state, currentTurnIndex: nextIndex, turnCount });
  } else {
    return startEnemyTurn({ ...state, currentTurnIndex: nextIndex, turnCount });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// BATTLE END CHECK
// ═══════════════════════════════════════════════════════════════════════

function checkBattleEnd(state: BattleState): BattleState {
  if (state.enemy.currentHP <= 0) {
    return { ...state, phase: 'victory' };
  }
  if (state.player.currentHP <= 0) {
    return { ...state, phase: 'defeat' };
  }
  return state;
}

// ═══════════════════════════════════════════════════════════════════════
// REWARD CALCULATION
// ═══════════════════════════════════════════════════════════════════════

export interface BattleRewards {
  xp: number;
  spheres: number;
  leveledUp: boolean;
  newLevel: number;
  newSkillLearned: string | null;
}

export function calculateRewards(
  enemyDef: EnemyDef,
  playerLevel: number,
  charId: string
): BattleRewards {
  const xp = enemyDef.xpReward;
  const spheres = enemyDef.sphereReward;

  // Level up check is handled by the caller (needs current XP)
  return {
    xp,
    spheres,
    leveledUp: false,
    newLevel: playerLevel,
    newSkillLearned: null,
  };
}

// Check if XP causes a level up, return updated level + any new skill
export function checkLevelUp(
  currentLevel: number,
  currentXP: number,
  xpGained: number,
  charId: string
): {
  newLevel: number;
  remainingXP: number;
  leveledUp: boolean;
  newSkillLearned: string | null;
} {
  let level = currentLevel;
  let xp = currentXP + xpGained;
  let leveledUp = false;
  let newSkillLearned: string | null = null;

  // Import here to avoid circular dependency issues
  const { xpToNextLevel, getNewSkillAtLevel } = require('@/constants/gameData');

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    leveledUp = true;
    const newSkill = getNewSkillAtLevel(charId, level);
    if (newSkill) {
      newSkillLearned = newSkill.name;
    }
  }

  return {
    newLevel: level,
    remainingXP: xp,
    leveledUp,
    newSkillLearned,
  };
}
