import 'server-only';
import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { GameError } from './agroGame';

// Shared by every API route that acts on behalf of a Firebase user. The UID
// always comes from a verified ID token, never from the request body.
const FIREBASE_SIGNING_KEYS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

export interface FirebaseUserMessages {
  missing: string;
  expired: string;
  unverified: string;
}

export async function verifyFirebaseUser(
  request: NextRequest,
  messages: FirebaseUserMessages,
): Promise<string> {
  const authorization = request.headers.get('authorization') || '';
  const token = /^Bearer ([A-Za-z0-9._-]{100,8192})$/.exec(authorization)?.[1];
  if (!token) throw new GameError(messages.missing, 401);
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId)
    throw new GameError('El acceso con cuenta todavía está en preparación.', 503);
  let verified: Awaited<ReturnType<typeof jwtVerify>>;
  try {
    verified = await jwtVerify(token, FIREBASE_SIGNING_KEYS, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });
  } catch (error) {
    if (error instanceof joseErrors.JWKSTimeout)
      throw new GameError('No pudimos validar tu sesión. Intenta de nuevo.', 503);
    throw new GameError(messages.expired, 401);
  }
  const { payload, protectedHeader } = verified;
  const now = Math.floor(Date.now() / 1000);
  if (
    !protectedHeader.kid ||
    payload.aud !== projectId ||
    typeof payload.sub !== 'string' ||
    payload.sub.length < 1 ||
    typeof payload.exp !== 'number' ||
    payload.exp <= now ||
    typeof payload.iat !== 'number' ||
    payload.iat > now ||
    typeof payload.auth_time !== 'number' ||
    payload.auth_time > now
  )
    throw new GameError(messages.expired, 401);
  if (payload.email_verified !== true)
    throw new GameError(messages.unverified, 403);
  return payload.sub;
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (
    !origin ||
    origin !== request.nextUrl.origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new GameError('Solicitud no permitida.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new GameError('Usa una solicitud JSON.', 415);
}

export async function requestJson(
  request: NextRequest,
  maxBytes = 4096,
): Promise<Record<string, unknown>> {
  assertSameOrigin(request);
  // Bound the body while reading it; Content-Length is not trusted.
  const reader = request.body?.getReader();
  if (!reader) throw new GameError('Falta la acción.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new GameError('Solicitud demasiado grande.', 413);
    }
    chunks.push(value);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data))
      throw new Error();
    return data;
  } catch {
    throw new GameError('Solicitud inválida.');
  }
}
