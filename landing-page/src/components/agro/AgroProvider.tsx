'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import type { ActionOutcome, FarmAction, FarmState } from '@/lib/agroGame';

interface FarmResponse {
  farm: FarmState;
  now: number;
  local: boolean;
  outcome?: ActionOutcome;
  error?: string;
}
interface AgroContextValue {
  farm: FarmState | null;
  now: number;
  local: boolean;
  busy: boolean;
  error: string;
  notice: string;
  refresh: () => Promise<void>;
  act: (action: FarmAction) => Promise<ActionOutcome | null>;
}
const AgroContext = createContext<AgroContextValue | null>(null);
let pendingRead: { uid: string; promise: Promise<FarmResponse> } | null = null;
function readGame(user: User): Promise<FarmResponse> {
  if (pendingRead?.uid === user.uid) return pendingRead.promise;
  const promise: Promise<FarmResponse> = user.getIdToken()
    .then((token) =>
      fetch('/api/agro/partida', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      }),
    )
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'No se pudo abrir el huerto.');
      return data as FarmResponse;
    })
    .finally(() => {
      if (pendingRead?.promise === promise) pendingRead = null;
    });
  pendingRead = { uid: user.uid, promise };
  return promise;
}
export function AgroProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <AgroSessionProvider key={user?.uid ?? 'signed-out'} user={user}>
      {children}
    </AgroSessionProvider>
  );
}
function AgroSessionProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: User | null;
}) {
  const [farm, setFarm] = useState<FarmState | null>(null);
  const [now, setNow] = useState(0);
  const [local, setLocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);
  const farmRef = useRef<FarmState | null>(null);
  const activeUid = useRef<string | null>(null);
  const offset = useRef(0);
  const adopt = useCallback((data: FarmResponse, uid: string) => {
    if (activeUid.current !== uid) return;
    offset.current = data.now - Date.now();
    setNow(data.now);
    setLocal(data.local);
    if (!farmRef.current || data.farm.revision >= farmRef.current.revision) {
      farmRef.current = data.farm;
      setFarm(data.farm);
    }
  }, []);
  const refresh = useCallback(async () => {
    if (!user) return;
    const uid = user.uid;
    try {
      adopt(await readGame(user), uid);
      if (activeUid.current === uid) setError('');
    } catch (failure) {
      if (activeUid.current === uid)
        setError(
          failure instanceof Error
            ? failure.message
            : 'No pudimos conectar. Intenta de nuevo.',
        );
    }
  }, [adopt, user]);
  useEffect(() => {
    activeUid.current = user?.uid ?? null;
    if (user) {
      const uid = user.uid;
      void readGame(user)
        .then((data) => {
          adopt(data, uid);
          if (activeUid.current === uid) setError('');
        })
        .catch((failure) => {
          if (activeUid.current === uid)
            setError(
              failure instanceof Error
                ? failure.message
                : 'No pudimos conectar. Intenta de nuevo.',
            );
        });
    }
    const onVisible = () => {
      if (user && document.visibilityState === 'visible' && !busyRef.current)
        void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (activeUid.current === user?.uid) activeUid.current = null;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [adopt, refresh, user]);
  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(Date.now() + offset.current),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const act = useCallback(
    async (action: FarmAction) => {
      if (
        busyRef.current ||
        !farmRef.current ||
        !user ||
        activeUid.current !== user.uid
      )
        return null;
      const uid = user.uid;
      busyRef.current = true;
      setBusy(true);
      setError('');
      const body = JSON.stringify({
        action,
        revision: farmRef.current.revision,
        requestId: crypto.randomUUID(),
      });
      try {
        const token = await user.getIdToken();
        let response: Response | undefined;
        // Retry the identical request only after a transport failure. The server deduplicates its ID.
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            response = await fetch('/api/agro/partida', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body,
            });
            break;
          } catch (failure) {
            if (attempt === 1) throw failure;
          }
        }
        if (!response) throw new Error('No pudimos conectar.');
        const data: FarmResponse = await response.json();
        if (!response.ok) {
          if (response.status === 409) await refresh();
          throw new Error(data.error || 'No se pudo completar la acción.');
        }
        adopt(data, uid);
        if (activeUid.current === uid)
          setNotice(data.outcome?.message || 'Partida guardada.');
        return data.outcome || null;
      } catch (failure) {
        if (activeUid.current === uid)
          setError(
            failure instanceof Error
              ? failure.message
              : 'Conexión interrumpida. Actualiza para consultar tu partida e historial.',
          );
        return null;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [adopt, refresh, user],
  );
  return (
    <AgroContext.Provider
      value={{
        farm,
        now,
        local,
        busy,
        error,
        notice,
        act,
        refresh,
      }}
    >
      {children}
    </AgroContext.Provider>
  );
}
export function useAgro() {
  const context = useContext(AgroContext);
  if (!context) throw new Error('AgroProvider is required');
  return context;
}
export function AgroConnection() {
  const { user, loading } = useAuth();
  const { error, refresh } = useAgro();
  return (
    <div className="agro-page agro-connection">
      <p className="agro-eyebrow">EL HUERTO DE YGGDRASIL</p>
      <h1>
        {loading
          ? 'Comprobando tu sesión…'
          : !user
            ? 'Entra con tu cuenta para jugar'
            : error
              ? 'No pudimos abrir tu huerto'
              : 'Abriendo tu huerto…'}
      </h1>
      <p role="status">
        {error ||
          (user
            ? 'Recuperando tu colección y tu cosecha.'
            : 'El límite diario se guarda en tu cuenta de Einherjar Blitz.')}
      </p>
      {!loading && !user && (
        <Link
          className="agro-primary-link"
          href="/juego/login?next=%2Fevento%2Fagro"
        >
          Iniciar sesión
        </Link>
      )}
      {user && error && (
        <button
          type="button"
          className="agro-primary-link"
          onClick={() => void refresh()}
        >
          Volver a intentar
        </button>
      )}
    </div>
  );
}
