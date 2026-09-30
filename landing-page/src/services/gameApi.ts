import { auth } from '@/config/firebase';

/**
 * Calls a /api/juego route as the signed-in user. Every request carries an
 * idempotent identifier where it matters, so a transport failure is retried
 * once with the identical body.
 */
export async function callGameApi<T>(path: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión.');
  const token = await user.getIdToken();
  const init: RequestInit = {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  };
  let response: Response | undefined;
  for (let attempt = 0; attempt < 2 && !response; attempt++) {
    try {
      response = await fetch(path, init);
    } catch {
      if (attempt === 1) {
        throw new Error('No hay conexión con el servidor. Revisa tu red e intenta de nuevo.');
      }
    }
  }
  const data = await response!.json().catch(() => null);
  if (!response!.ok) {
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : 'No se pudo completar la operación. Intenta de nuevo.'
    );
  }
  return data as T;
}
