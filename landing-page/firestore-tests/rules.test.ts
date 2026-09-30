import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// Runs against the Firestore emulator: `npm run test:rules`.
let env: RulesTestEnvironment;
const UID = 'alice';

function alice(): Firestore {
  return env
    .authenticatedContext(UID, { email: 'alice@example.com', email_verified: true })
    .firestore() as unknown as Firestore;
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-einherjar',
    firestore: { rules: readFileSync(process.env.RULES_FILE ?? resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', UID), {
      email: 'alice@example.com',
      username: 'alice',
      keys: 20,
      spheres: 0,
      copas: 0,
      victorias: 0,
      derrotas: 0,
      rango: 'Iniciado',
    });
    await setDoc(doc(db, 'users', UID, 'inventory', 'item1'), {
      name: 'Izanagi',
      type: 'persona',
      rarity: 'epic',
      bannerId: 'persona',
      sourceType: 'gacha',
      sourceId: 'gacha_x',
      status: 'active',
    });
  });
});

describe('gacha is server-only', () => {
  it('rejects the old client pull transaction (debit + pull + chosen item)', async () => {
    const db = alice();
    const opId = 'gacha_client';
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', UID), {
      keys: 19,
      lastOperationId: opId,
      lastOperationType: 'gacha',
      lastOperationAt: serverTimestamp(),
    });
    batch.set(doc(db, 'users', UID, 'gachaPulls', opId), {
      operationId: opId,
      bannerId: 'persona',
      currency: 'keys',
      unitCost: 1,
      totalCost: 1,
      amount: 1,
      itemIds: ['mythic1'],
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, 'users', UID, 'inventory', 'mythic1'), {
      name: 'Messiah',
      type: 'persona',
      rarity: 'mythic',
      bannerId: 'persona',
      sourceType: 'gacha',
      sourceId: opId,
      status: 'active',
      obtainedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'users', UID, 'operations', opId), {
      type: 'gacha',
      currency: 'keys',
      delta: -1,
      balanceBefore: 20,
      balanceAfter: 19,
      relatedId: opId,
      status: 'completed',
      createdAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
  });

  it('rejects creating inventory items directly', async () => {
    await assertFails(
      setDoc(doc(alice(), 'users', UID, 'inventory', 'free'), {
        name: 'Messiah',
        type: 'persona',
        rarity: 'mythic',
        bannerId: 'persona',
        sourceType: 'gacha',
        sourceId: 'x',
        status: 'active',
        obtainedAt: serverTimestamp(),
      })
    );
  });

  it('still lets the owner claim an active item', async () => {
    await assertSucceeds(
      updateDoc(doc(alice(), 'users', UID, 'inventory', 'item1'), {
        status: 'claimed',
        claimId: 'claim1',
        claimedAt: serverTimestamp(),
      })
    );
  });
});

describe('battles are server-only', () => {
  it('rejects client battle records', async () => {
    await assertFails(
      setDoc(doc(alice(), 'users', UID, 'battles', 'b1'), {
        result: 'victory',
        charId: 'argos',
        bossId: 'boss',
        turns: 3,
        completedAt: serverTimestamp(),
      })
    );
    await assertFails(setDoc(doc(alice(), 'users', UID, 'game', 'profile'), { victoriesRewardedToday: 0 }));
  });

  it('rejects the old fixed-increment victory and defeat updates', async () => {
    await assertFails(
      updateDoc(doc(alice(), 'users', UID), {
        copas: increment(10),
        victorias: increment(1),
        jefes_derrotados: increment(1),
        spheres: increment(5),
        experiencia: increment(15),
        rango: 'Iniciado',
      })
    );
    await assertFails(updateDoc(doc(alice(), 'users', UID), { derrotas: increment(1) }));
  });

  it('lets the owner read their battles', async () => {
    const { getDoc } = await import('firebase/firestore');
    await assertSucceeds(getDoc(doc(alice(), 'users', UID, 'battles', 'any')));
  });
});

describe('flows that stay on the client keep working', () => {
  it('converts keys to spheres with its ledger entry', async () => {
    const db = alice();
    const opId = 'conversion_1';
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', UID), {
      keys: 18,
      spheres: 100,
      lastOperationId: opId,
      lastOperationType: 'conversion',
      lastOperationAt: serverTimestamp(),
    });
    batch.set(doc(db, 'users', UID, 'operations', opId), {
      type: 'conversion',
      currency: 'keys',
      delta: -2,
      balanceBefore: 20,
      balanceAfter: 18,
      relatedId: opId,
      status: 'completed',
      createdAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it('updates cosmetic profile fields', async () => {
    await assertSucceeds(updateDoc(doc(alice(), 'users', UID), { frase: 'Hola' }));
  });

  it('never lets the owner raise their own balance', async () => {
    await assertFails(updateDoc(doc(alice(), 'users', UID), { keys: 999 }));
    await assertFails(updateDoc(doc(alice(), 'users', UID), { spheres: 999 }));
  });
});
