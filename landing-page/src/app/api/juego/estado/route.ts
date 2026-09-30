import { CredentialError, gameFirestore, jsonResponse } from '@/lib/gameServer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public health check for the game server. Reports only status codes, never
// any part of the credential or of stored data.
export async function GET() {
  let credencial = 'ok';
  let firestore = 'sin_probar';
  try {
    const db = gameFirestore();
    try {
      await db.collection('estado').doc('servidor').get();
      firestore = 'ok';
    } catch (error) {
      firestore = `error_${String((error as { code?: unknown })?.code ?? 'desconocido')}`;
    }
  } catch (error) {
    credencial = error instanceof CredentialError ? error.problem : 'error_inicializacion';
  }
  return jsonResponse({
    credencial,
    firestore,
    proyecto: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
  });
}
