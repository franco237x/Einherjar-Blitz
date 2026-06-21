/**
 * useSyncStatus — Global real-time sync indicator.
 *
 * Tracks Firestore connection state:
 *   - 'connecting'  → spinner visible (initial connect or reconnect)
 *   - 'online'      → checkmark, fades out after 1.5s
 *   - 'offline'     → warning icon, persistent
 *
 * Also exposes a manual `refresh()` that bumps a counter to trigger
 * pull-to-refresh style reloads in any screen listening to `refreshTick`.
 */

import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AppState, AppStateStatus } from 'react-native';
import { getAuth } from 'firebase/auth';

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
  // This is the same listener pattern used elsewhere in the app — no
  // enableNetwork/disableNetwork calls that cause "Target ID already exists".
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupListener = () => {
      const auth = getAuth();
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

    // Initial
    setStatus('connecting');
    setupListener();

    // Re-setup when app returns to foreground
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        setStatus('connecting');
        setupListener();
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      sub.remove();
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
