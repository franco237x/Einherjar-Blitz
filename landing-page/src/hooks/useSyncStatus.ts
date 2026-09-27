'use client';

/**
 * useSyncStatus — Global real-time sync indicator.
 *
 * Tracks Firestore connection state:
 *   - 'connecting'  → spinner visible (initial connect or reconnect)
 *   - 'online'      → checkmark, fades out after 1.2s
 *   - 'offline'     → warning icon, persistent
 *
 * Also exposes a manual `refresh()` that bumps a counter to trigger
 * pull-to-refresh style reloads in any screen listening to `refreshTick`.
 */

import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

export type SyncStatus = 'connecting' | 'online' | 'offline';

let refreshTickGlobal = 0;
const refreshListeners = new Set<(tick: number) => void>();

/** Bump the global refresh tick — all listeners will reload their data. */
export function triggerGlobalRefresh() {
  refreshTickGlobal += 1;
  refreshListeners.forEach((fn) => fn(refreshTickGlobal));
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [tick, setTick] = useState(refreshTickGlobal);

  // Subscribe to global refresh ticks
  useEffect(() => {
    const listener = (newTick: number) => setTick(newTick);
    refreshListeners.add(listener);
    return () => {
      refreshListeners.delete(listener);
    };
  }, []);

  // Monitor Firestore connection via a lightweight onSnapshot on the user doc.
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupListener = () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        if (isMounted) setStatus('offline');
        return;
      }
      // Tear down any previous listener
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      unsubscribe = onSnapshot(
        doc(db, 'users', uid),
        () => {
          if (isMounted) setStatus('online');
        },
        (err) => {
          console.warn('Sync listener error:', err);
          if (isMounted) setStatus('offline');
        }
      );
    };

    setupListener();

    // Re-setup when the tab becomes visible again or the network comes back.
    const reconnect = () => {
      if (document.visibilityState !== 'visible') return;
      setStatus('connecting');
      setupListener();
    };
    const goOffline = () => setStatus('offline');

    document.addEventListener('visibilitychange', reconnect);
    window.addEventListener('online', reconnect);
    window.addEventListener('offline', goOffline);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', reconnect);
      window.removeEventListener('online', reconnect);
      window.removeEventListener('offline', goOffline);
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, []);

  const refresh = useCallback(() => {
    triggerGlobalRefresh();
  }, []);

  return { status, refresh, refreshTick: tick };
}
