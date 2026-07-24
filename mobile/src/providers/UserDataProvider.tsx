import React, {
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

export function UserDataProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setUserData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const publicUserRef = doc(db, 'publicUsers', user.uid);

    return onSnapshot(
      userRef,
      (snapshot) => {
        void (async () => {
          try {
            if (!snapshot.exists()) {
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

            const data = snapshot.data();
            const username =
              typeof data.username === 'string' && data.username.trim()
                ? data.username.trim()
                : user.displayName?.trim() || 'Guerrero';
            const avatar = data.avatar || user.photoURL || null;

            setUserData({ ...data, username, avatar });
            setError(null);
            setLoading(false);

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
              if (__DEV__) {
                console.warn('Public profile sync warning:', (cause as Error)?.message);
              }
            });
          } catch (cause) {
            const nextError =
              cause instanceof Error ? cause : new Error('No se pudo cargar el perfil.');
            console.error('User profile sync error:', nextError.message);
            setError(nextError);
            setLoading(false);
          }
        })();
      },
      (cause) => {
        const nextError =
          cause instanceof Error ? cause : new Error('No se pudo sincronizar el perfil.');
        console.error('User profile listener error:', nextError.message);
        setError(nextError);
        setLoading(false);
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
