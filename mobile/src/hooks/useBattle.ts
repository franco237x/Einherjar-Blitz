import { useState, useEffect, useRef } from 'react';
import {
  initBattle,
  executePlayerAttack,
  executePlayerDefend,
  executePlayerRegen,
  executePlayerSpecial,
  executeBossTurn,
  type BattleState,
} from '@/services/battleEngine';
import {
  saveBattleVictory,
  saveBattleDefeat,
  type VictoryRewards,
} from '@/services/battleService';
import { auth } from '@/config/firebase';

const BOSS_TURN_DELAY_MS = 1200;

export function useBattle(charId: string) {
  const [battleState, setBattleState] = useState<BattleState>(() =>
    initBattle(charId)
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewards, setRewards] = useState<VictoryRewards | null>(null);
  const [savingFirebase, setSavingFirebase] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Refs to avoid stale closures inside setTimeout and to allow cleanup.
  const bossTurnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const savingRef = useRef(false);
  const rewardsRef = useRef<VictoryRewards | null>(null);
  const uidRef = useRef<string | undefined>(auth.currentUser?.uid);

  // Track mount state so async callbacks never call setState on an unmounted
  // component (e.g. when the user exits mid-battle).
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (bossTurnTimerRef.current) {
        clearTimeout(bossTurnTimerRef.current);
        bossTurnTimerRef.current = null;
      }
    };
  }, []);

  // Keep uidRef in sync with auth state changes.
  useEffect(() => {
    uidRef.current = auth.currentUser?.uid;
  });

  // Persist victory/defeat to the server-side Cloud Function.
  // Reads from refs so the effect deps can stay narrow without missing updates.
  useEffect(() => {
    const phase = battleState.turnPhase;
    if (phase !== 'victory' && phase !== 'defeat') return;
    if (savingRef.current || rewardsRef.current) return;

    const uid = uidRef.current;
    if (!uid) {
      setSaveError('No hay sesión; no se pueden guardar las recompensas.');
      return;
    }

    savingRef.current = true;
    setSavingFirebase(true);
    setSaveError(null);

    const meta = {
      charId: battleState.player.def.id,
      bossId: battleState.boss.def.name,
      turns: battleState.turnCount,
    };

    const persist =
      phase === 'victory'
        ? saveBattleVictory(uid, meta).then((r) => {
            rewardsRef.current = r;
            if (isMountedRef.current) setRewards(r);
          })
        : saveBattleDefeat(uid, meta);

    persist
      .catch((err) => {
        console.error('Error reportando batalla al servidor:', err);
        if (isMountedRef.current) {
          setSaveError(
            err?.message ??
              'No se pudo registrar la batalla. Intenta de nuevo.'
          );
        }
      })
      .finally(() => {
        savingRef.current = false;
        if (isMountedRef.current) setSavingFirebase(false);
      });
  }, [battleState.turnPhase, battleState.turnCount, battleState.player.def.id, battleState.boss.def.name]);

  const scheduleBossTurn = (nextState: BattleState) => {
    if (bossTurnTimerRef.current) clearTimeout(bossTurnTimerRef.current);
    bossTurnTimerRef.current = setTimeout(() => {
      bossTurnTimerRef.current = null;
      if (!isMountedRef.current) return;
      const bossRes = executeBossTurn(nextState);
      setBattleState(bossRes.newState);
      setIsProcessing(false);
    }, BOSS_TURN_DELAY_MS);
  };

  const attack = () => {
    if (isProcessing || battleState.turnPhase !== 'player_turn') return;
    setIsProcessing(true);

    const { newState } = executePlayerAttack(battleState);
    setBattleState(newState);

    if (newState.turnPhase === 'victory') {
      setIsProcessing(false);
      return;
    }
    scheduleBossTurn(newState);
  };

  const defend = () => {
    if (isProcessing || battleState.turnPhase !== 'player_turn') return;
    setIsProcessing(true);

    const newState = executePlayerDefend(battleState);
    setBattleState(newState);
    scheduleBossTurn(newState);
  };

  const regen = () => {
    if (isProcessing || battleState.turnPhase !== 'player_turn') return;
    setIsProcessing(true);

    const { newState } = executePlayerRegen(battleState);
    setBattleState(newState);
    scheduleBossTurn(newState);
  };

  const special = () => {
    if (isProcessing || battleState.turnPhase !== 'player_turn') return;
    if (battleState.player.specialUsed) return;

    const canUse = battleState.player.currentHealth <= battleState.player.maxHealth * 0.5;
    if (!canUse) return;

    setIsProcessing(true);
    const newState = executePlayerSpecial(battleState);
    setBattleState(newState);
    scheduleBossTurn(newState);
  };

  return {
    battleState,
    isProcessing,
    rewards,
    savingFirebase,
    saveError,
    attack,
    defend,
    regen,
    special,
  };
}
