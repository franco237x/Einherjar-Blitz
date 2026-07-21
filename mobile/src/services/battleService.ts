import { doc, getDoc, updateDoc, setDoc, increment, runTransaction } from 'firebase/firestore';
import { db } from '@/config/firebase';

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

export interface BattleMeta {
  charId: string;
  bossId: string;
  turns: number;
  battleId?: string;
}

/**
 * ─── SPARK PLAN SECURITY MODEL ───────────────────────────────────────────
 *
 * The Firebase project is on the Spark (free) plan, which does NOT support
 * Cloud Functions. Without a server-side validator we cannot prove a battle
 * actually occurred. The defenses below are the maximum possible in Spark:
 *
 * 1. FIXED INCREMENTS — rewards are written with `increment(N)` where N is
 *    a hardcoded constant. Firestore Rules enforce that the deltas match
 *    exactly (copas +10, spheres +5, experiencia +15, victorias +1, etc.).
 *    A client cannot inject `copas: 999999` — the rules reject it.
 *
 * 2. ANTI-REPLAY (BEST-EFFORT) — before writing rewards, the client creates
 *    a doc at `users/{uid}/game/battles/{battleId}` with create-only
 *    semantics. Firestore rejects the create if the battleId already exists.
 *    Firestore Rules require this doc to exist before allowing the
 *    `victorias`/`derrotas` increment on the user profile.
 *
 *    LIMITATION: a determined attacker can still farm by generating fresh
 *    battleIds in a loop. This is the inherent trade-off of the Spark plan.
 *    Upgrading to Blaze + the Cloud Function in `mobile/functions/` closes
 *    this hole completely.
 *
 * 3. RANK CONSISTENCY — the new rank is computed client-side from the new
 *    copas total, and Firestore Rules validate that the written `rango`
 *    matches the expected rank for `copas + 10`. A client cannot set an
 *    arbitrary rank.
 */

const VICTORY_REWARDS = {
  copas: 10,
  spheres: 5,
  experiencia: 15,
} as const;

function generateBattleId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Creates the anti-replay battle record. Firestore Rules enforce that this
 * doc does not already exist (create-only). Throws if the battleId is a
 * duplicate, which the caller should surface as an error.
 */
async function createBattleRecord(
  uid: string,
  battleId: string,
  meta: BattleMeta,
  result: 'victory' | 'defeat'
): Promise<void> {
  const battleRef = doc(db, 'users', uid, 'game', 'battles', battleId);
  // setDoc with no merge option fails if the doc exists (create-only).
  await setDoc(battleRef, {
    result,
    charId: meta.charId,
    bossId: meta.bossId,
    turns: meta.turns,
    completedAt: new Date(),
  });
}

/**
 * Saves a battle victory to the user's Firestore document.
 *
 * Updates copas (+10), victorias (+1), jefes_derrotados (+1), spheres (+5),
 * experiencia (+15) and recalculates the rank based on copas.
 *
 * Anti-replay: creates a battle record first; if the battleId already
 * exists, the create fails and no rewards are written.
 */
export async function saveBattleVictory(
  uid: string,
  meta: BattleMeta
): Promise<VictoryRewards> {
  const battleId = meta.battleId ?? generateBattleId();

  // Step 1: create the anti-replay record. If this throws (already exists),
  // we abort — no rewards are written.
  await createBattleRecord(uid, battleId, meta, 'victory');

  // Step 2: read current copas to compute the new rank.
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  let currentCopas = 0;
  let previousRank = 'Iniciado';

  if (snap.exists()) {
    const data = snap.data();
    currentCopas = typeof data.copas === 'number' ? data.copas : 0;
    previousRank = data.rango || calculateRank(currentCopas);
  }

  const newCopas = currentCopas + VICTORY_REWARDS.copas;
  const newRank = calculateRank(newCopas);

  // Step 3: write rewards with fixed increments. Firestore Rules validate
  // that the deltas match exactly (see firestore.rules).
  await updateDoc(userRef, {
    copas: increment(VICTORY_REWARDS.copas),
    victorias: increment(1),
    jefes_derrotados: increment(1),
    spheres: increment(VICTORY_REWARDS.spheres),
    experiencia: increment(VICTORY_REWARDS.experiencia),
    rango: newRank,
  });

  return {
    copasGained: VICTORY_REWARDS.copas,
    spheresGained: VICTORY_REWARDS.spheres,
    xpGained: VICTORY_REWARDS.experiencia,
    newRank,
    previousRank,
  };
}

/**
 * Saves a battle defeat to the user's Firestore document.
 * Increments derrotas (+1).
 *
 * Anti-replay: same battle record mechanism as victory.
 */
export async function saveBattleDefeat(
  uid: string,
  meta: BattleMeta
): Promise<void> {
  const battleId = meta.battleId ?? generateBattleId();

  await createBattleRecord(uid, battleId, meta, 'defeat');

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    derrotas: increment(1),
  });
}
