import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          let data = docSnap.data();
          // Sync avatar from Google auth photoURL if missing
          if (!data.avatar && user.photoURL) {
            data.avatar = user.photoURL;
            await setDoc(docRef, { avatar: data.avatar }, { merge: true });
          }
          setUserData(data);
        } else {
          // Create default user document
          const defaultData = {
            email: user.email,
            username: user.displayName || 'Guerrero',
            createdAt: new Date(),
            keys: 0,
            spheres: 0,
            avatar: user.photoURL || null,
            nivel: 1,
            experiencia: 0,
            copas: 0,
            victorias: 0,
            derrotas: 0,
            rango: 'Iniciado',
            horas_jugadas: 0,
            frase: 'Forjando mi destino...',
          };
          await setDoc(docRef, defaultData);
          setUserData(defaultData);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useUserData error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // onSnapshot is already real-time, so refresh is a no-op kept for
  // pull-to-refresh / API compatibility scenarios.
  const refresh = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    // The onSnapshot listener will handle updates automatically.
  }, []);

  return { userData, loading, error, refresh };
}
