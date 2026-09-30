'use client';

import { useState, useEffect, useRef } from 'react';
import {
  initBattle,
  applyPlayerAction,
  canPerformAction,
  createSeededRng,
  executeBossTurn,
  type BattleAction,
  type BattleState,
  type Rng,
} from '@/services/battleEngine';
import { finishBattle, startBattle } from '@/services/battleService';
import type { VictoryRewards } from '@/constants/battleRewards';

const BOSS_TURN_DELAY_MS = 1200;

interface BattleSession {
  battleId: string;
  rng: Rng;
}

export function useBattle(charId: string) {
  const [battleState, setBattleState] = useState<BattleState>(() =>
    initBattle(charId)
  );
  // Locked until the server issues the battle seed.
  const [isProcessing, setIsProcessing] = useState(true);
  const [rewards, setRewards] = useState<VictoryRewards | null>(null);
  const [savingFirebase, setSavingFirebase] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  // Refs are the source of truth for the replay: the server recomputes the
  // battle from exactly these actions, so two clicks in the same render must
  // never both apply to the same state.
  const stateRef = useRef(battleState);
  const processingRef = useRef(true);
  const sessionRef = useRef<BattleSession | null>(null);
  const actionsRef = useRef<BattleAction[]>([]);
  const finishedRef = useRef(false);
  const bossTurnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const commitState = (next: BattleState) => {
    stateRef.current = next;
    setBattleState(next);
  };
  const setProcessing = (value: boolean) => {
    processingRef.current = value;
    setIsProcessing(value);
  };

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

  // Ask the server for a battle id and its RNG seed.
  useEffect(() => {
    let cancelled = false;
    startBattle(charId)
      .then(({ battleId, seed }) => {
        if (cancelled) return;
        sessionRef.current = { battleId, rng: createSeededRng(seed) };
        actionsRef.current = [];
        processingRef.current = false;
        setIsProcessing(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setStartError(
          err instanceof Error ? err.message : 'No se pudo iniciar el combate.'
        );
      });
    return () => {
      cancelled = true;
    };
  }, [charId]);

  // Send the actions to the server, which replays them and grants rewards.
  useEffect(() => {
    const phase = battleState.turnPhase;
    if (phase !== 'victory' && phase !== 'defeat') return;
    const session = sessionRef.current;
    if (!session || finishedRef.current) return;
    finishedRef.current = true;

    setSavingFirebase(true);
    setSaveError(null);
    finishBattle(session.battleId, [...actionsRef.current])
      .then((outcome) => {
        if (!isMountedRef.current) return;
        setRewards(outcome.rewards);
        if (outcome.dailyLimitReached) {
          setSaveError(
            'Alcanzaste el límite diario de recompensas por combate. La victoria quedó registrada.'
          );
        }
      })
      .catch((err) => {
        console.error('Error reportando batalla al servidor:', err);
        if (isMountedRef.current) {
          setSaveError(
            err instanceof Error
              ? err.message
              : 'No se pudo registrar la batalla. Intenta de nuevo.'
          );
        }
      })
      .finally(() => {
        if (isMountedRef.current) setSavingFirebase(false);
      });
  }, [battleState.turnPhase]);

  const act = (action: BattleAction) => {
    const session = sessionRef.current;
    const current = stateRef.current;
    if (!session || processingRef.current || !canPerformAction(current, action)) return;
    setProcessing(true);
    actionsRef.current.push(action);

    const { state: next, bossTurnPending } = applyPlayerAction(current, action, session.rng);
    commitState(next);
    if (!bossTurnPending) {
      setProcessing(false);
      return;
    }

    bossTurnTimerRef.current = setTimeout(() => {
      bossTurnTimerRef.current = null;
      if (!isMountedRef.current) return;
      commitState(executeBossTurn(next, session.rng).newState);
      setProcessing(false);
    }, BOSS_TURN_DELAY_MS);
  };

  return {
    battleState,
    isProcessing,
    rewards,
    savingFirebase,
    saveError,
    startError,
    attack: () => act('attack'),
    defend: () => act('defend'),
    regen: () => act('regen'),
    special: () => act('special'),
  };
}
