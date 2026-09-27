'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';

interface UserDataContextValue {
  userData: DocumentData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const UserDataContext = createContext<UserDataContextValue | null>(null);

function publicAvatarUrl(avatar: unknown): string | null {
  return typeof avatar === 'string' && /^https:\/\//i.test(avatar)
    ? avatar
    : null;
}

interface ProfileSnapshot {
  uid: string;
  data: DocumentData | null;
  error: Error | null;
}

export function UserDataProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  // Keyed by uid so a sign-out / account switch never shows stale data.
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);

  const current = user && snapshot?.uid === user.uid ? snapshot : null;
  const userData = current?.data ?? null;
  const error = current?.error ?? null;
  const loading = authLoading || (Boolean(user) && !current);

  useEffect(() => {
    if (authLoading || !user) return;

    const userRef = doc(db, 'users', user.uid);
    const publicUserRef = doc(db, 'publicUsers', user.uid);
    const fail = (nextError: Error) =>
      setSnapshot((prev) => ({
        uid: user.uid,
        data: prev?.uid === user.uid ? prev.data : null,
        error: nextError,
      }));

    return onSnapshot(
      userRef,
      (docSnapshot) => {
        void (async () => {
          try {
            if (!docSnapshot.exists()) {
              const defaults = {
                email: user.email ?? '',
                username: user.displayName?.trim() || 'Guerrero',
                createdAt: serverTimestamp(),
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
              await setDoc(userRef, defaults);
              return;
            }

            const data = docSnapshot.data();
            const username =
              typeof data.username === 'string' && data.username.trim()
                ? data.username.trim()
                : user.displayName?.trim() || 'Guerrero';
            const avatar = data.avatar || user.photoURL || null;

            setSnapshot({ uid: user.uid, data: { ...data, username, avatar }, error: null });

            const profileWrites: Promise<unknown>[] = [
              setDoc(
                publicUserRef,
                {
                  uid: user.uid,
                  username,
                  transferCode: user.uid.slice(0, 8),
                  avatarUrl: publicAvatarUrl(avatar),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ),
            ];
            if (!data.avatar && user.photoURL) {
              profileWrites.push(
                setDoc(userRef, { avatar: user.photoURL }, { merge: true })
              );
            }
            await Promise.all(profileWrites).catch((cause) => {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('Public profile sync warning:', (cause as Error)?.message);
              }
            });
          } catch (cause) {
            const nextError =
              cause instanceof Error ? cause : new Error('No se pudo cargar el perfil.');
            console.error('User profile sync error:', nextError.message);
            fail(nextError);
          }
        })();
      },
      (cause) => {
        const nextError =
          cause instanceof Error ? cause : new Error('No se pudo sincronizar el perfil.');
        console.error('User profile listener error:', nextError.message);
        fail(nextError);
      }
    );
  }, [authLoading, user]);

  const refresh = useCallback(async () => {
    // Firestore onSnapshot keeps this provider current.
  }, []);

  const value = useMemo(
    () => ({ userData, loading, error, refresh }),
    [userData, loading, error, refresh]
  );

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}
