import 'server-only';
import type { NextRequest } from 'next/server';
import { verifyFirebaseUser } from './serverRequest';

export function requireJardinUser(request: NextRequest): Promise<string> {
  return verifyFirebaseUser(request, {
    missing: 'Inicia sesión para jugar los niveles del jardín.',
    expired: 'Tu sesión venció. Vuelve a iniciar sesión.',
    unverified: 'Verifica tu correo para guardar tu progreso en el jardín.',
  });
}

export const NO_STORE = { headers: { 'Cache-Control': 'private, no-store' } };
