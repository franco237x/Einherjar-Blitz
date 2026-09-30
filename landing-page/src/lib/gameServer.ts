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

export type CredentialProblem =
  | 'falta'
  | 'json_invalido'
  | 'no_es_cuenta_de_servicio'
  | 'proyecto_distinto';

export class CredentialError extends GameError {
  constructor(public problem: CredentialProblem) {
    super(
      problem === 'falta'
        ? 'El servidor del juego todavía no está configurado. Intenta más tarde.'
        : 'La credencial del servidor del juego es inválida. Revisa GAME_FIREBASE_SERVICE_ACCOUNT_JSON.',
      503,
    );
  }
}

/**
 * Parses the service-account JSON pasted into the hosting panel. Tolerates
 * the usual copy/paste accidents (surrounding quotes, a `NAME=` prefix,
 * double-encoded JSON, escaped newlines in the key). Never includes any part
 * of the value in errors or logs.
 */
export function parseServiceAccount(raw: string, projectId: string) {
  let text = raw.trim().replace(/^GAME_FIREBASE_SERVICE_ACCOUNT_JSON\s*=\s*/, '');
  if (/^'[\s\S]*'$/.test(text)) text = text.slice(1, -1);
  let value: unknown;
  try {
    value = JSON.parse(text);
    if (typeof value === 'string') value = JSON.parse(value);
  } catch {
    throw new CredentialError('json_invalido');
  }
  const account = value as Record<string, unknown> | null;
  if (
    !account ||
    typeof account !== 'object' ||
    account.type !== 'service_account' ||
    typeof account.client_email !== 'string' ||
    typeof account.private_key !== 'string'
  )
    throw new CredentialError('no_es_cuenta_de_servicio');
  if (account.project_id !== projectId)
    throw new CredentialError('proyecto_distinto');
  const privateKey = account.private_key.includes('\\n')
    ? account.private_key.replace(/\\n/g, '\n')
    : account.private_key;
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----'))
    throw new CredentialError('no_es_cuenta_de_servicio');
  return {
    projectId,
    clientEmail: account.client_email,
    privateKey,
  };
}

export function gameFirestore(): Firestore {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serviceAccount = process.env.GAME_FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!projectId || (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS))
    throw new CredentialError('falta');
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) return getFirestore(existing);
  const credential = serviceAccount
    ? cert(parseServiceAccount(serviceAccount, projectId))
    : applicationDefault();
  return getFirestore(initializeApp({ projectId, credential }, APP_NAME));
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
  // Log the error class and gRPC/Firebase code only: messages may echo data.
  console.error(
    '[juego] Operation failed:',
    error instanceof Error ? error.name : 'UnknownError',
    (error as { code?: unknown })?.code ?? '',
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
