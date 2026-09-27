import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { BannerDef, RewardItem } from '@/constants/gachaData';
import {
  buildOperationData,
  createOperationId,
} from '@/services/economy';

export async function performGachaPull(
  uid: string,
  banner: BannerDef,
  rewards: RewardItem[],
  operationId = createOperationId('gacha')
): Promise<void> {
  if (!uid) throw new Error('Debes iniciar sesión.');
  if (rewards.length !== 1 && rewards.length !== 10) {
    throw new Error('La tirada debe contener 1 o 10 recompensas.');
  }

  const totalCost = banner.costAmount * rewards.length;
  const userRef = doc(db, 'users', uid);
  const pullRef = doc(db, 'users', uid, 'gachaPulls', operationId);
  const operationRef = doc(db, 'users', uid, 'operations', operationId);
  const inventoryRefs = rewards.map(() =>
    doc(collection(db, 'users', uid, 'inventory'))
  );

  await runTransaction(db, async (tx) => {
    const [userSnap, pullSnap, operationSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(pullRef),
      tx.get(operationRef),
    ]);

    if (!userSnap.exists()) throw new Error('Usuario no encontrado.');
    if (pullSnap.exists() || operationSnap.exists()) return;

    const userData = userSnap.data();
    const currentBalance = userData[banner.costType] ?? 0;
    if (!Number.isInteger(currentBalance)) {
      throw new Error('El saldo del usuario no tiene un formato válido.');
    }
    if (currentBalance < totalCost) {
      throw new Error('Saldo insuficiente para realizar la invocación.');
    }

    const nextBalance = currentBalance - totalCost;
    tx.update(userRef, {
      [banner.costType]: nextBalance,
      lastOperationId: operationId,
      lastOperationType: 'gacha',
      lastOperationAt: serverTimestamp(),
    });

    tx.set(pullRef, {
      operationId,
      bannerId: banner.id,
      currency: banner.costType,
      unitCost: banner.costAmount,
      totalCost,
      amount: rewards.length,
      itemIds: inventoryRefs.map((ref) => ref.id),
      createdAt: serverTimestamp(),
    });

    rewards.forEach((reward, index) => {
      tx.set(inventoryRefs[index], {
        name: reward.name,
        type: reward.type,
        rarity: reward.rarity,
        bannerId: banner.id,
        sourceType: 'gacha',
        sourceId: operationId,
        status: 'active',
        obtainedAt: serverTimestamp(),
      });
    });

    tx.set(
      operationRef,
      buildOperationData({
        type: 'gacha',
        currency: banner.costType,
        delta: -totalCost,
        balanceBefore: currentBalance,
        balanceAfter: nextBalance,
        relatedId: operationId,
      })
    );
  });
}
