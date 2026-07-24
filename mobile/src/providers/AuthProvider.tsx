import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/config/firebase';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        if (nextUser && !nextUser.emailVerified) {
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(nextUser);
        setLoading(false);
      }),
    []
  );

  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
