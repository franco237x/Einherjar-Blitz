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
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { StoreProduct, PurchaseRecord } from '@/constants/storeData';

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
  productId: string
): Promise<{ productName: string; price: number }> {
  if (!uid) throw new Error('Debes iniciar sesión.');
  if (!productId) throw new Error('Producto inválido.');

  const userRef = doc(db, 'users', uid);
  const productRef = doc(db, 'products', productId);

  const result = await runTransaction(db, async (tx) => {
    // Read both docs inside the transaction
    const [userSnap, productSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(productRef),
    ]);

    if (!userSnap.exists()) throw new Error('No se pudo validar tu usuario.');
    if (!productSnap.exists()) throw new Error('Este producto no existe o fue retirado.');

    const userData = userSnap.data();
    const productData = productSnap.data() as Omit<StoreProduct, 'id'>;

    const currentSpheres = userData.spheres || 0;
    const currentStock = productData.stock || 0;

    if (currentSpheres < productData.price) {
      throw new Error('No tienes Esferas suficientes.');
    }
    if (currentStock <= 0) {
      throw new Error('Este producto está agotado.');
    }

    // Write: deduct spheres
    tx.update(userRef, { spheres: currentSpheres - productData.price });
    // Write: decrement stock
    tx.update(productRef, { stock: currentStock - 1 });

    return {
      productName: productData.name,
      price: productData.price,
    };
  });

  // Record purchase AFTER transaction succeeds (fire-and-forget)
  try {
    await addDoc(purchasesCol(uid), {
      productId,
      productName: result.productName,
      price: result.price,
      purchasedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to record purchase:', err);
  }

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
        };
        return {
          id: d.id,
          productId: data.productId,
          productName: data.productName,
          price: data.price,
          purchasedAt:
            data.purchasedAt instanceof Timestamp ? data.purchasedAt.toDate() : null,
        };
      });
      onPurchases(items);
    },
    (err) => onError?.(err as Error)
  );
}

/**
 * Delete a single purchase record by its document id.
 * Called after the user claims a purchase via PDF — once claimed, the
 * record is removed so it can't be claimed again.
 */
export async function deletePurchase(uid: string, purchaseId: string): Promise<void> {
  if (!uid) throw new Error('UID requerido para eliminar compra');
  if (!purchaseId) throw new Error('purchaseId requerido');
  await deleteDoc(doc(db, 'users', uid, 'purchases', purchaseId));
}

/**
 * Delete all purchase records for a user (bulk claim).
 */
export async function deleteAllPurchases(uid: string, purchaseIds: string[]): Promise<void> {
  if (!uid) throw new Error('UID requerido');
  if (purchaseIds.length === 0) return;
  await Promise.all(purchaseIds.map((id) => deletePurchase(uid, id)));
}
