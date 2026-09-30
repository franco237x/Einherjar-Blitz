// Shared by the battle UI and the server that grants the rewards.

export const VICTORY_REWARDS = {
  copas: 10,
  spheres: 5,
  experiencia: 15,
} as const;

/** Rewarded victories per account and day (Argentina time). */
export const DAILY_REWARDED_VICTORIES = 20;
/** Battles an account may start per day; bounds server writes. */
export const DAILY_BATTLE_STARTS = 120;
/** Maximum player actions accepted for one battle. */
export const MAX_BATTLE_ACTIONS = 200;

export function calculateRank(copas: number): string {
  if (copas >= 800) return 'Einherjar';
  if (copas >= 500) return 'Elite';
  if (copas >= 300) return 'Veterano';
  if (copas >= 150) return 'Guerrero';
  if (copas >= 50) return 'Recluta';
  return 'Iniciado';
}

export interface VictoryRewards {
  copasGained: number;
  spheresGained: number;
  xpGained: number;
  newRank: string;
  previousRank: string;
}

export interface BattleOutcome {
  result: 'victory' | 'defeat';
  /** Null on defeat, or when the daily reward limit was already reached. */
  rewards: VictoryRewards | null;
  dailyLimitReached: boolean;
}
