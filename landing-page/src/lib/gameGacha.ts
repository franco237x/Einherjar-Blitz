import 'server-only';
import { randomInt } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import {
  BANNERS,
  pullMultiple,
  type RarityKey,
  type RewardType,
} from '@/constants/gachaData';
import { GameError, gameFirestore } from './gameServer';

export const GACHA_OPERATION_ID = /^gacha_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface GachaPullResult {
  itemId: string;
  name: string;
  rarity: RarityKey;
  type: RewardType;
}

export interface GachaPullResponse {
  results: GachaPullResult[];
  balance: number;
}

const RNG_RANGE = 2 ** 47;
/** Uniform float in [0, 1) from the OS CSPRNG. */
export function secureRng(): number {
  return randomInt(0, RNG_RANGE) / RNG_RANGE;
}

export function parseGachaRequest(body: Record<string, unknown>) {
  const banner = BANNERS.find((item) => item.id === body.bannerId);
  if (!banner) throw new GameError('Ese banner no existe.');
  const amount = body.amount;
  if (amount !== 1 && amount !== 10)
    throw new GameError('La tirada debe contener 1 o 10 recompensas.');
  const operationId = body.operationId;
  if (typeof operationId !== 'string' || !GACHA_OPERATION_ID.test(operationId))
    throw new GameError('Identificador de invocación inválido.');
  return { banner, amount, operationId };
}

/**
 * Charges the banner cost and grants server-rolled rewards in one Firestore
 * transaction. Retrying with the same operationId returns the stored result
 * without charging again.
 */
export async function performServerGachaPull(
  uid: string,
  body: Record<string, unknown>,
): Promise<GachaPullResponse> {
  const { banner, amount, operationId } = parseGachaRequest(body);
  const db = gameFirestore();
  const userRef = db.collection('users').doc(uid);
  const pullRef = userRef.collection('gachaPulls').doc(operationId);
  const operationRef = userRef.collection('operations').doc(operationId);

  return db.runTransaction(async (tx) => {
    const [userSnap, pullSnap, operationSnap] = await tx.getAll(
      userRef,
      pullRef,
      operationRef,
    );
    if (!userSnap.exists) throw new GameError('Usuario no encontrado.', 404);
    const currentBalance = userSnap.get(banner.costType) ?? 0;
    if (!Number.isInteger(currentBalance))
      throw new GameError('El saldo del usuario no tiene un formato válido.', 409);

    if (pullSnap.exists) {
      const results = pullSnap.get('results');
      if (pullSnap.get('bannerId') !== banner.id || !Array.isArray(results))
        throw new GameError('Esa invocación ya fue registrada.', 409);
      return { results, balance: currentBalance };
    }
    if (operationSnap.exists)
      throw new GameError('Esa operación ya fue registrada.', 409);

    const totalCost = banner.costAmount * amount;
    if (currentBalance < totalCost)
      throw new GameError('Saldo insuficiente para realizar la invocación.', 409);

    const rewards = pullMultiple(banner.rewards, amount, secureRng);
    const itemRefs = rewards.map(() => userRef.collection('inventory').doc());
    const results: GachaPullResult[] = rewards.map((reward, index) => ({
      itemId: itemRefs[index].id,
      name: reward.name,
      rarity: reward.rarity,
      type: reward.type,
    }));
    const nextBalance = currentBalance - totalCost;
    const now = FieldValue.serverTimestamp();

    tx.update(userRef, {
      [banner.costType]: nextBalance,
      lastOperationId: operationId,
      lastOperationType: 'gacha',
      lastOperationAt: now,
    });
    tx.set(pullRef, {
      operationId,
      bannerId: banner.id,
      currency: banner.costType,
      unitCost: banner.costAmount,
      totalCost,
      amount,
      itemIds: results.map((result) => result.itemId),
      results,
      createdAt: now,
    });
    rewards.forEach((reward, index) => {
      tx.set(itemRefs[index], {
        name: reward.name,
        type: reward.type,
        rarity: reward.rarity,
        bannerId: banner.id,
        sourceType: 'gacha',
        sourceId: operationId,
        status: 'active',
        obtainedAt: now,
      });
    });
    tx.set(operationRef, {
      type: 'gacha',
      currency: banner.costType,
      delta: -totalCost,
      balanceBefore: currentBalance,
      balanceAfter: nextBalance,
      relatedId: operationId,
      status: 'completed',
      createdAt: now,
    });
    return { results, balance: nextBalance };
  });
}
