import { NextRequest } from 'next/server';
import { finishServerBattle, startServerBattle } from '@/lib/gameBattle';
import {
  GameError,
  gameApiError,
  jsonResponse,
  requireGameUser,
} from '@/lib/gameServer';
import { requestJson } from '@/lib/serverRequest';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const uid = await requireGameUser(request);
    const body = await requestJson(request);
    if (body.accion === 'iniciar')
      return jsonResponse(await startServerBattle(uid, body));
    if (body.accion === 'terminar')
      return jsonResponse(await finishServerBattle(uid, body));
    throw new GameError('Acción desconocida.');
  } catch (error) {
    return gameApiError(error);
  }
}
