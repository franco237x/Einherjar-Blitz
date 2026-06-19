/**
 * Inventory Service — Einherjar Blitz Mobile
 *
 * Reads/writes gacha rewards to Firestore subcollection:
 *   users/{uid}/inventory/{itemId}
 *
 * Schema (validated by firestore.rules):
 *   - name: string (1-80 chars)
 *   - type: 'persona' | 'invocacion' | 'otros'
 *   - rarity: 'mythic' | 'legendary' | 'epic' | 'rare' | 'common'
 *   - obtainedAt: timestamp (serverTimestamp)
 *   - bannerId?: string
 *
 * Rewards can be deleted by the owner when claimed via PDF.
 */

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { RewardItem, RarityKey } from '@/constants/gachaData';

export interface InventoryItem {
  id: string;
  name: string;
  type: 'persona' | 'invocacion' | 'otros';
  rarity: RarityKey;
  obtainedAt: Date | null;
  bannerId?: string;
}

export interface InventoryItemInput {
  name: string;
  type: RewardItem['type'];
  rarity: RarityKey;
  bannerId?: string;
}

const invCollection = (uid: string) =>
  collection(doc(db, 'users', uid), 'inventory');

/**
 * Append pulled rewards to the user's inventory.
 * Uses a batch-free sequential addDoc loop: each addDoc is independent and
 * the firestore.rules validate every doc. If one fails the schema check,
 * the others still succeed (we don't want to lose pulls due to a single
 * malformed entry). Caller is responsible for the balance deduction which
 * happens BEFORE this call.
 */
export async function addInventoryItems(
  uid: string,
  items: InventoryItemInput[]
): Promise<void> {
  if (!uid) throw new Error('UID requerido para escribir inventario');
  if (items.length === 0) return;

  const writes = items.map((item) =>
    addDoc(invCollection(uid), {
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      obtainedAt: serverTimestamp(),
      ...(item.bannerId ? { bannerId: item.bannerId } : {}),
    })
  );

  await Promise.all(writes);
}

/**
 * Real-time stream of the user's inventory, newest first.
 * Returns an unsubscribe function.
 */
export function streamInventory(
  uid: string,
  onItems: (items: InventoryItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!uid) {
    onItems([]);
    return () => {};
  }

  const q = query(invCollection(uid), orderBy('obtainedAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: InventoryItem[] = snap.docs.map((d) => {
        const data = d.data() as {
          name: string;
          type: InventoryItem['type'];
          rarity: RarityKey;
          obtainedAt?: Timestamp | null;
          bannerId?: string;
        };
        return {
          id: d.id,
          name: data.name,
          type: data.type,
          rarity: data.rarity,
          obtainedAt: data.obtainedAt instanceof Timestamp ? data.obtainedAt.toDate() : null,
          bannerId: data.bannerId,
        };
      });
      onItems(items);
    },
    (err) => onError?.(err as Error)
  );
}

/**
 * Aggregate inventory by name+rarity, returning grouped counts.
 * Useful for compact UI display of duplicates.
 */
export function groupInventory(items: InventoryItem[]): Array<InventoryItem & { count: number }> {
  const map = new Map<string, InventoryItem & { count: number }>();
  for (const item of items) {
    const key = `${item.name}::${item.rarity}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { ...item, count: 1 });
    }
  }
  return Array.from(map.values());
}

/**
 * Delete a single inventory item by its document id.
 * Used when the user claims a reward via PDF — once claimed, the item is
 * removed from Firestore so it can't be claimed again.
 */
export async function deleteInventoryItem(uid: string, itemId: string): Promise<void> {
  if (!uid) throw new Error('UID requerido para eliminar item');
  if (!itemId) throw new Error('itemId requerido');
  await deleteDoc(doc(db, 'users', uid, 'inventory', itemId));
}
