import type { User } from 'firebase/auth';
import type { AgroVoucher } from '@/lib/agroGame';
import type { LoggedCommand, PlantKind } from '@/lib/jardin/engine';

export interface JardinProgress {
  completed: Record<string, { coins: number; at: number }>;
  coins: number;
  totalEarned: number;
  vouchers: AgroVoucher[];
  unlocked: number;
}

async function call<T>(user: User, path: string, body?: unknown): Promise<T> {
  const token = await user.getIdToken();
  let response: Response;
  try {
    response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('No hay conexión con el servidor. Revisa tu red e intenta de nuevo.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'No se pudo completar la operación.');
  return data as T;
}

export const fetchProgress = (user: User) =>
  call<{ progress: JardinProgress }>(user, '/api/jardin/cuenta').then((data) => data.progress);

export const startLevel = (user: User, level: number, loadout: PlantKind[]) =>
  call<{ runId: string; seed: string }>(user, '/api/jardin/partida', { accion: 'iniciar', nivel: level, plantas: loadout });

export const finishLevel = (user: User, runId: string, log: LoggedCommand[]) =>
  call<{ outcome: 'victory' | 'defeat'; reward: number; firstClear: boolean; note?: string; progress: JardinProgress }>(
    user,
    '/api/jardin/partida',
    { accion: 'terminar', runId, comandos: log },
  );

export const issueVoucher = (user: User, name: string) =>
  call<{ voucher: AgroVoucher; progress: JardinProgress }>(user, '/api/jardin/vale', { nombre: name });

export const voucherPdfUrl = (id: string) => `/api/agro/vale?id=${encodeURIComponent(id)}`;
