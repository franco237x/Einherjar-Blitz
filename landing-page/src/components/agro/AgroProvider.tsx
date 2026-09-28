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
let pendingRead: Promise<FarmResponse> | null = null;
async function readGame() {
  if (!pendingRead) {
    pendingRead = fetch('/api/agro/partida', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || 'No se pudo abrir el huerto.');
        return data as FarmResponse;
      })
      .finally(() => {
        pendingRead = null;
      });
  }
  return pendingRead;
}
export function AgroProvider({ children }: { children: ReactNode }) {
  const [farm, setFarm] = useState<FarmState | null>(null);
  const [now, setNow] = useState(0);
  const [local, setLocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);
  const farmRef = useRef<FarmState | null>(null);
  const offset = useRef(0);
  const adopt = useCallback((data: FarmResponse) => {
    offset.current = data.now - Date.now();
    setNow(data.now);
    setLocal(data.local);
    if (!farmRef.current || data.farm.revision >= farmRef.current.revision) {
      farmRef.current = data.farm;
      setFarm(data.farm);
    }
  }, []);
  const refresh = useCallback(async () => {
    try {
      adopt(await readGame());
      setError('');
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'No pudimos conectar. Intenta de nuevo.',
      );
    }
  }, [adopt]);
  useEffect(() => {
    let active = true;
    readGame()
      .then((data) => {
        if (active) adopt(data);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !busyRef.current)
        void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(
      () => setNow(Date.now() + offset.current),
      1000,
    );
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [adopt, refresh]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const act = useCallback(
    async (action: FarmAction) => {
      if (busyRef.current || !farmRef.current) return null;
      busyRef.current = true;
      setBusy(true);
      setError('');
      const body = JSON.stringify({
        action,
        revision: farmRef.current.revision,
        requestId: crypto.randomUUID(),
      });
      try {
        let response: Response | undefined;
        // Retry the identical request only after a transport failure. The server deduplicates its ID.
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            response = await fetch('/api/agro/partida', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
        adopt(data);
        setNotice(data.outcome?.message || 'Partida guardada.');
        return data.outcome || null;
      } catch (failure) {
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
    [adopt, refresh],
  );
  return (
    <AgroContext.Provider
      value={{ farm, now, local, busy, error, notice, act, refresh }}
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
  const { error, refresh } = useAgro();
  return (
    <div className="agro-page agro-connection">
      <p className="agro-eyebrow">EL HUERTO DE YGGDRASIL</p>
      <h1>{error ? 'El huerto está en preparación' : 'Abriendo tu huerto…'}</h1>
      <p role="status">{error || 'Recuperando tu colección y tu cosecha.'}</p>
      {error && (
        <button className="agro-primary-link" onClick={() => void refresh()}>
          Volver a intentar
        </button>
      )}
    </div>
  );
}
