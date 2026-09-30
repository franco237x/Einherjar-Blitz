import type { BattleOutcome } from '@/constants/battleRewards';
import type { BattleAction } from '@/services/battleEngine';
import { callGameApi } from '@/services/gameApi';

/**
 * Battles are server-authoritative: the server issues the RNG seed when the
 * battle starts and, at the end, replays the submitted actions with that seed
 * to decide the result and grant rewards. The browser never reports a result.
 */
export function startBattle(charId: string): Promise<{ battleId: string; seed: string }> {
  return callGameApi('/api/juego/batalla', { accion: 'iniciar', charId });
}

export function finishBattle(battleId: string, actions: BattleAction[]): Promise<BattleOutcome> {
  return callGameApi('/api/juego/batalla', { accion: 'terminar', battleId, actions });
}
