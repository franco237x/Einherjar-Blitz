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
 * Rewards remain as an immutable audit trail after being claimed.
 */

import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { RarityKey } from '@/constants/gachaData';
import { createOperationId } from '@/services/economy';

export interface InventoryItem {
  id: string;
  name: string;
  type: 'persona' | 'invocacion' | 'otros';
  rarity: RarityKey;
  obtainedAt: Date | null;
  bannerId?: string;
  sourceId?: string;
  status: 'active' | 'claimed';
  claimId?: string | null;
  claimedAt?: Date | null;
}

const invCollection = (uid: string) =>
  collection(doc(db, 'users', uid), 'inventory');

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
          sourceId?: string;
          status?: 'active' | 'claimed';
          claimId?: string | null;
          claimedAt?: Timestamp | null;
        };
        return {
          id: d.id,
          name: data.name,
          type: data.type,
          rarity: data.rarity,
          obtainedAt: data.obtainedAt instanceof Timestamp ? data.obtainedAt.toDate() : null,
          bannerId: data.bannerId,
          sourceId: data.sourceId,
          status: data.status ?? 'active',
          claimId: data.claimId ?? null,
          claimedAt:
            data.claimedAt instanceof Timestamp ? data.claimedAt.toDate() : null,
        };
      }).filter((item) => item.status !== 'claimed');
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
 * Mark inventory items as claimed without deleting their audit history.
 */
export async function markInventoryItemsClaimed(
  uid: string,
  itemIds: string[],
  format: 'pdf' | 'txt',
  claimId = createOperationId('claim_inventory')
): Promise<string> {
  if (!uid) throw new Error('UID requerido');
  if (itemIds.length === 0) throw new Error('No hay recompensas para reclamar.');

  for (let offset = 0; offset < itemIds.length; offset += 400) {
    const ids = itemIds.slice(offset, offset + 400);
    const chunkClaimId = offset === 0 ? claimId : `${claimId}_${offset / 400}`;
    const batch = writeBatch(db);
    ids.forEach((id) => {
      batch.update(doc(db, 'users', uid, 'inventory', id), {
        status: 'claimed',
        claimId: chunkClaimId,
        claimedAt: serverTimestamp(),
      });
    });
    batch.set(doc(db, 'users', uid, 'claims', chunkClaimId), {
      type: 'inventory',
      format,
      itemIds: ids,
      status: 'completed',
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  }
  return claimId;
}
