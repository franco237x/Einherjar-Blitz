/**
 * useInventory — real-time hook for the user's gacha inventory.
 *
 * Subscribes to users/{uid}/inventory ordered by obtainedAt desc.
 * Returns grouped + raw lists, loading state, and error.
 */

import { useEffect, useState, useCallback } from 'react';
import { auth } from '@/config/firebase';
import {
  streamInventory,
  groupInventory,
  type InventoryItem,
} from '@/services/inventory';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = streamInventory(
      uid,
      (next) => {
        setItems(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const grouped = useCallback(
    () => groupInventory(items),
    [items]
  );

  return {
    items,
    grouped: grouped(),
    loading,
    error,
    count: items.length,
  };
}
