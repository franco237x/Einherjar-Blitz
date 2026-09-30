import { NextRequest } from 'next/server';
import { performServerGachaPull } from '@/lib/gameGacha';
import { gameApiError, jsonResponse, requireGameUser } from '@/lib/gameServer';
import { requestJson } from '@/lib/serverRequest';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const uid = await requireGameUser(request);
    const body = await requestJson(request);
    return jsonResponse(await performServerGachaPull(uid, body));
  } catch (error) {
    return gameApiError(error);
  }
}
