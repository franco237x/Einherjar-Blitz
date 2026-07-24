/**
 * Store Service — Einherjar Blitz Mobile
 *
 * Reads products from Firestore `products` collection.
 * Handles purchases atomically via `runTransaction`:
 *   1. Check user has enough spheres
 *   2. Check product is in stock
 *   3. Deduct spheres from user
 *   4. Decrement product stock
 *   5. Record purchase in users/{uid}/purchases
 *
 * Purchase history is streamed in real-time.
 */

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { StoreProduct, PurchaseRecord } from '@/constants/storeData';
import {
  buildOperationData,
  createOperationId,
} from '@/services/economy';

const productsCol = () => collection(db, 'products');
const purchasesCol = (uid: string) =>
  collection(doc(db, 'users', uid), 'purchases');

/**
 * Fetch all products once (no real-time). Sorted by name.
 */
export async function fetchProducts(): Promise<StoreProduct[]> {
  const snap = await getDocs(productsCol());
  return snap.docs
    .map((d) => {
      const data = d.data() as Omit<StoreProduct, 'id' | 'createdAt'> & {
        createdAt?: Timestamp;
      };
      return {
        id: d.id,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        stock: data.stock,
        category: data.category || 'General',
        isExclusive: data.isExclusive || false,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
      } as StoreProduct;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Atomically purchase a product:
 * - Verify spheres >= price
 * - Verify stock > 0
 * - Deduct spheres, decrement stock, record purchase
 *
 * Throws Error with a user-friendly message on failure.
 */
export async function purchaseProduct(
  uid: string,
  productId: string,
  operationId = createOperationId('purchase')
): Promise<{ productName: string; price: number }> {
  if (!uid) throw new Error('Debes iniciar sesión.');
  if (!productId) throw new Error('Producto inválido.');

  const userRef = doc(db, 'users', uid);
  const productRef = doc(db, 'products', productId);
  const purchaseRef = doc(db, 'users', uid, 'purchases', operationId);
  const operationRef = doc(db, 'users', uid, 'operations', operationId);

  const result = await runTransaction(db, async (tx) => {
    const [userSnap, productSnap, purchaseSnap, operationSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(productRef),
      tx.get(purchaseRef),
      tx.get(operationRef),
    ]);

    if (!userSnap.exists()) throw new Error('No se pudo validar tu usuario.');
    if (!productSnap.exists()) throw new Error('Este producto no existe o fue retirado.');
    if (purchaseSnap.exists() || operationSnap.exists()) {
      const previous = purchaseSnap.data();
      return {
        productName: previous?.productName ?? 'Producto',
        price: previous?.price ?? 0,
      };
    }

    const userData = userSnap.data();
    const productData = productSnap.data() as Omit<StoreProduct, 'id'>;

    const currentSpheres = userData.spheres ?? 0;
    const currentStock = productData.stock ?? 0;

    if (
      !Number.isInteger(currentSpheres) ||
      !Number.isInteger(currentStock) ||
      !Number.isInteger(productData.price) ||
      productData.price < 0
    ) {
      throw new Error('El producto o el saldo tienen un formato inválido.');
    }

    if (currentSpheres < productData.price) {
      throw new Error('No tienes Esferas suficientes.');
    }
    if (currentStock <= 0) {
      throw new Error('Este producto está agotado.');
    }

    const nextSpheres = currentSpheres - productData.price;

    tx.update(userRef, {
      spheres: nextSpheres,
      lastOperationId: operationId,
      lastOperationType: 'purchase',
      lastOperationAt: serverTimestamp(),
    });
    tx.update(productRef, {
      stock: currentStock - 1,
      lastPurchaseId: operationId,
      lastPurchaseBy: uid,
    });
    tx.set(purchaseRef, {
      operationId,
      productId,
      productName: productData.name,
      price: productData.price,
      status: 'active',
      claimId: null,
      claimedAt: null,
      purchasedAt: serverTimestamp(),
    });
    tx.set(
      operationRef,
      buildOperationData({
        type: 'purchase',
        currency: 'spheres',
        delta: -productData.price,
        balanceBefore: currentSpheres,
        balanceAfter: nextSpheres,
        relatedId: productId,
      })
    );

    return {
      productName: productData.name,
      price: productData.price,
    };
  });

  return result;
}

/**
 * Real-time stream of the user's purchase history, newest first.
 */
export function streamPurchases(
  uid: string,
  onPurchases: (purchases: PurchaseRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!uid) {
    onPurchases([]);
    return () => {};
  }

  const q = query(purchasesCol(uid), orderBy('purchasedAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: PurchaseRecord[] = snap.docs.map((d) => {
        const data = d.data() as {
          productId: string;
          productName: string;
          price: number;
          purchasedAt?: Timestamp | null;
          status?: 'active' | 'claimed';
          claimId?: string | null;
          claimedAt?: Timestamp | null;
        };
        return {
          id: d.id,
          productId: data.productId,
          productName: data.productName,
          price: data.price,
          purchasedAt:
            data.purchasedAt instanceof Timestamp ? data.purchasedAt.toDate() : null,
          status: data.status ?? 'active',
          claimId: data.claimId ?? null,
          claimedAt:
            data.claimedAt instanceof Timestamp ? data.claimedAt.toDate() : null,
        };
      });
      onPurchases(items);
    },
    (err) => onError?.(err as Error)
  );
}

/**
 * Mark purchases as claimed while preserving the immutable purchase history.
 * This runs only after the file service confirms that the certificate was
 * saved or handed to the native share sheet.
 */
export async function markPurchasesClaimed(
  uid: string,
  purchaseIds: string[],
  claimId = createOperationId('claim_purchase')
): Promise<string> {
  if (!uid) throw new Error('UID requerido');
  if (purchaseIds.length === 0) {
    throw new Error('No hay compras para reclamar.');
  }

  for (let offset = 0; offset < purchaseIds.length; offset += 400) {
    const ids = purchaseIds.slice(offset, offset + 400);
    const chunkClaimId = offset === 0 ? claimId : `${claimId}_${offset / 400}`;
    const batch = writeBatch(db);
    ids.forEach((id) => {
      batch.update(doc(db, 'users', uid, 'purchases', id), {
        status: 'claimed',
        claimId: chunkClaimId,
        claimedAt: serverTimestamp(),
      });
    });
    batch.set(doc(db, 'users', uid, 'claims', chunkClaimId), {
      type: 'purchase',
      format: 'pdf',
      itemIds: ids,
      status: 'completed',
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  }
  return claimId;
}
