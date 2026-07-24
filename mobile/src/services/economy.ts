import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { db } from '@/config/firebase';

export type EconomyOperationType =
  | 'conversion'
  | 'transfer_sent'
  | 'transfer_received'
  | 'gacha'
  | 'purchase';

export function createOperationId(prefix: string): string {
  return `${prefix}_${Crypto.randomUUID()}`;
}

export function buildOperationData(input: {
  type: EconomyOperationType;
  currency: 'keys' | 'spheres';
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  relatedId: string;
}) {
  return {
    ...input,
    status: 'completed' as const,
    createdAt: serverTimestamp(),
  };
}

export async function convertKeysToSpheres(
  uid: string,
  amount: number,
  operationId = createOperationId('conversion')
): Promise<{ keysSpent: number; spheresGained: number }> {
  if (!uid) throw new Error('Debes iniciar sesión.');
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('La cantidad debe ser un número entero positivo.');
  }

  const userRef = doc(db, 'users', uid);
  const operationRef = doc(db, 'users', uid, 'operations', operationId);
  const spheresGained = amount * 50;

  return runTransaction(db, async (tx) => {
    const [userSnap, operationSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(operationRef),
    ]);

    if (!userSnap.exists()) throw new Error('Usuario no encontrado.');
    if (operationSnap.exists()) {
      return { keysSpent: amount, spheresGained };
    }

    const userData = userSnap.data();
    const currentKeys = userData.keys ?? 0;
    const currentSpheres = userData.spheres ?? 0;

    if (!Number.isInteger(currentKeys) || !Number.isInteger(currentSpheres)) {
      throw new Error('El saldo del usuario no tiene un formato válido.');
    }
    if (currentKeys < amount) throw new Error('Saldo insuficiente.');

    const nextKeys = currentKeys - amount;
    const nextSpheres = currentSpheres + spheresGained;

    tx.update(userRef, {
      keys: nextKeys,
      spheres: nextSpheres,
      lastOperationId: operationId,
      lastOperationType: 'conversion',
      lastOperationAt: serverTimestamp(),
    });
    tx.set(
      operationRef,
      buildOperationData({
        type: 'conversion',
        currency: 'keys',
        delta: -amount,
        balanceBefore: currentKeys,
        balanceAfter: nextKeys,
        relatedId: operationId,
      })
    );

    return { keysSpent: amount, spheresGained };
  });
}
