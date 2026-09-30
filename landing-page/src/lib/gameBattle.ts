import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { GAME_CHARACTERS, REY_ESCARLATA_BOSS } from '@/constants/battleData';
import {
  calculateRank,
  DAILY_BATTLE_STARTS,
  DAILY_REWARDED_VICTORIES,
  MAX_BATTLE_ACTIONS,
  VICTORY_REWARDS,
  type BattleOutcome,
} from '@/constants/battleRewards';
import { replayBattle } from '@/services/battleEngine';
import { argentinaDay, GameError, gameFirestore } from './gameServer';

// The UI waits 1.2 s before every boss turn; require most of that so a
// script cannot finish battles faster than a person could play them.
const MIN_MS_PER_BOSS_TURN = 1000;
const BATTLE_TTL_MS = 2 * 60 * 60 * 1000;
const BATTLE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface BattleProfile {
  battleDay?: string;
  battlesStartedToday?: number;
  victoriesRewardedToday?: number;
}

function countersFor(profile: BattleProfile | undefined, day: string) {
  const sameDay = profile?.battleDay === day;
  return {
    started: sameDay ? profile?.battlesStartedToday ?? 0 : 0,
    rewarded: sameDay ? profile?.victoriesRewardedToday ?? 0 : 0,
  };
}

export async function startServerBattle(
  uid: string,
  body: Record<string, unknown>,
): Promise<{ battleId: string; seed: string }> {
  const charId = body.charId;
  if (typeof charId !== 'string' || !Object.hasOwn(GAME_CHARACTERS, charId))
    throw new GameError('Ese personaje no existe.');

  const db = gameFirestore();
  const userRef = db.collection('users').doc(uid);
  const profileRef = userRef.collection('game').doc('profile');
  const battleId = randomUUID();
  const seed = randomBytes(16).toString('hex');
  const now = Date.now();
  const day = argentinaDay(now);

  await db.runTransaction(async (tx) => {
    const [userSnap, profileSnap] = await tx.getAll(userRef, profileRef);
    if (!userSnap.exists) throw new GameError('Usuario no encontrado.', 404);
    const counters = countersFor(profileSnap.data(), day);
    if (counters.started >= DAILY_BATTLE_STARTS)
      throw new GameError('Alcanzaste el límite de combates de hoy. Vuelve mañana.', 429);
    tx.set(
      profileRef,
      {
        battleDay: day,
        battlesStartedToday: counters.started + 1,
        victoriesRewardedToday: counters.rewarded,
      },
      { merge: true },
    );
    tx.create(userRef.collection('battles').doc(battleId), {
      charId,
      bossId: REY_ESCARLATA_BOSS.name,
      seed,
      status: 'active',
      startedAtMs: now,
      startedAt: FieldValue.serverTimestamp(),
    });
  });
  return { battleId, seed };
}

/**
 * Replays the battle from its server seed and the submitted actions, then
 * applies the outcome. Rewards depend only on that replay.
 */
export async function finishServerBattle(
  uid: string,
  body: Record<string, unknown>,
): Promise<BattleOutcome> {
  const { battleId, actions } = body;
  if (typeof battleId !== 'string' || !BATTLE_ID.test(battleId))
    throw new GameError('Identificador de batalla inválido.');
  if (
    !Array.isArray(actions) ||
    actions.length < 1 ||
    actions.length > MAX_BATTLE_ACTIONS
  )
    throw new GameError('Secuencia de acciones inválida.');

  const db = gameFirestore();
  const userRef = db.collection('users').doc(uid);
  const profileRef = userRef.collection('game').doc('profile');
  const battleRef = userRef.collection('battles').doc(battleId);

  return db.runTransaction(async (tx) => {
    const [userSnap, profileSnap, battleSnap] = await tx.getAll(
      userRef,
      profileRef,
      battleRef,
    );
    if (!userSnap.exists) throw new GameError('Usuario no encontrado.', 404);
    if (!battleSnap.exists) throw new GameError('Esa batalla no existe.', 404);
    const battle = battleSnap.data()!;
    // Retrying a finished battle returns its stored outcome.
    if (battle.status !== 'active') {
      if (battle.outcome) return battle.outcome as BattleOutcome;
      throw new GameError('Esa batalla ya terminó.', 409);
    }

    const now = Date.now();
    if (typeof battle.startedAtMs !== 'number' || now - battle.startedAtMs > BATTLE_TTL_MS)
      throw new GameError('La batalla expiró. Inicia un nuevo combate.', 409);

    let replay: ReturnType<typeof replayBattle>;
    try {
      replay = replayBattle(battle.charId, battle.seed, actions);
    } catch {
      throw new GameError('La batalla no coincide con el registro del servidor.', 409);
    }
    const { state, bossTurns } = replay;
    if (state.turnPhase !== 'victory' && state.turnPhase !== 'defeat')
      throw new GameError('La batalla todavía no terminó.', 409);
    if (now - battle.startedAtMs < bossTurns * MIN_MS_PER_BOSS_TURN)
      throw new GameError('La batalla terminó demasiado rápido.', 409);

    const user = userSnap.data()!;
    const day = argentinaDay(now);
    const counters = countersFor(profileSnap.data(), day);
    let outcome: BattleOutcome;

    if (state.turnPhase === 'victory') {
      const dailyLimitReached = counters.rewarded >= DAILY_REWARDED_VICTORIES;
      if (dailyLimitReached) {
        outcome = { result: 'victory', rewards: null, dailyLimitReached };
        tx.update(userRef, { victorias: FieldValue.increment(1) });
      } else {
        const currentCopas = typeof user.copas === 'number' ? user.copas : 0;
        const previousRank =
          typeof user.rango === 'string' ? user.rango : calculateRank(currentCopas);
        const newRank = calculateRank(currentCopas + VICTORY_REWARDS.copas);
        tx.update(userRef, {
          copas: FieldValue.increment(VICTORY_REWARDS.copas),
          victorias: FieldValue.increment(1),
          jefes_derrotados: FieldValue.increment(1),
          spheres: FieldValue.increment(VICTORY_REWARDS.spheres),
          experiencia: FieldValue.increment(VICTORY_REWARDS.experiencia),
          rango: newRank,
        });
        tx.set(
          profileRef,
          {
            battleDay: day,
            battlesStartedToday: counters.started,
            victoriesRewardedToday: counters.rewarded + 1,
          },
          { merge: true },
        );
        outcome = {
          result: 'victory',
          rewards: {
            copasGained: VICTORY_REWARDS.copas,
            spheresGained: VICTORY_REWARDS.spheres,
            xpGained: VICTORY_REWARDS.experiencia,
            newRank,
            previousRank,
          },
          dailyLimitReached: false,
        };
      }
    } else {
      outcome = { result: 'defeat', rewards: null, dailyLimitReached: false };
      tx.update(userRef, { derrotas: FieldValue.increment(1) });
    }

    tx.update(battleRef, {
      status: outcome.result,
      turns: state.turnCount,
      actions: actions.length,
      outcome,
      completedAt: FieldValue.serverTimestamp(),
    });
    return outcome;
  });
}
