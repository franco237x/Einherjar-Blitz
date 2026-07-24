import { useContext } from 'react';
import { UserDataContext } from '@/providers/UserDataProvider';

/**
 * useUserData — shared real-time hook for the current user's Firestore document.
 *
 * Subscribes to the user doc via onSnapshot so every tab sees the same
 * live data (keys, spheres, avatar, profile fields, etc.).  If the document
 * does not exist yet it is auto-created with sensible defaults (mirrors the
 * logic that used to live in the Home screen's fetchUserData).
 *
 * Returns:
 *   userData  — full user document data (or null)
 *   loading   — true until the first snapshot arrives
 *   error     — Firestore listener error (or null)
 *   refresh   — no-op helper kept for API compatibility (onSnapshot is live)
 */
export function useUserData() {
  const value = useContext(UserDataContext);
  if (!value) {
    throw new Error('useUserData debe utilizarse dentro de UserDataProvider.');
  }
  return value;
}
