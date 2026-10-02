import type { NextRequest } from 'next/server';
import { GameError } from '@/lib/agroGame';
import { apiError } from '@/lib/agroServer';
import { NO_STORE, requireJardinUser } from '@/lib/jardinRequest';
import { finishRun, startRun } from '@/lib/jardinServer';
import { requestJson } from '@/lib/serverRequest';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const uid = await requireJardinUser(request);
    // A finished level carries its whole command log.
    const body = await requestJson(request, 256 * 1024);
    if (body.accion === 'iniciar') return Response.json(await startRun(uid, body), NO_STORE);
    if (body.accion === 'terminar') return Response.json(await finishRun(uid, body), NO_STORE);
    throw new GameError('Acción desconocida.');
  } catch (error) {
    return apiError(error);
  }
}
