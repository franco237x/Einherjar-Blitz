import 'server-only';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { NextRequest } from 'next/server';
import { GameError } from './agroGame';
import { verifyFirebaseUser } from './serverRequest';

export { GameError };

// The /juego economy lives in the default Firestore database of the login
// project (NEXT_PUBLIC_FIREBASE_PROJECT_ID). The Admin SDK bypasses Firestore
// Rules, which is why the rules deny these writes to browsers: only this
// server decides gacha results and battle rewards. Works on the Spark plan.
const APP_NAME = 'game-server';

export function gameFirestore(): Firestore {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serviceAccount = process.env.GAME_FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!projectId || (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS))
    throw new GameError(
      'El servidor del juego todavía no está configurado. Intenta más tarde.',
      503,
    );
  const app =
    getApps().find((existing) => existing.name === APP_NAME) ||
    initializeApp(
      {
        projectId,
        credential: serviceAccount
          ? cert(JSON.parse(serviceAccount))
          : applicationDefault(),
      },
      APP_NAME,
    );
  return getFirestore(app);
}

export function requireGameUser(request: NextRequest): Promise<string> {
  return verifyFirebaseUser(request, {
    missing: 'Inicia sesión para continuar.',
    expired: 'Tu sesión venció. Vuelve a iniciar sesión.',
    unverified: 'Verifica tu correo para usar la economía del juego.',
  });
}

export function gameApiError(error: unknown): Response {
  if (error instanceof GameError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { 'Cache-Control': 'no-store' } },
    );
  // Do not leak credentials, request bodies, or database diagnostics.
  console.error(
    '[juego] Operation failed:',
    error instanceof Error ? error.name : 'UnknownError',
  );
  return Response.json(
    {
      error:
        'No pudimos confirmar la operación. Revisa tu saldo e inventario antes de repetirla.',
    },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}

export function jsonResponse(data: unknown): Response {
  return Response.json(data, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

/** Calendar day in Argentina (UTC-3, no DST), matching the agro event. */
export function argentinaDay(now = Date.now()): string {
  return new Date(now - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
