import { NextRequest } from 'next/server';
import {
  apiError,
  isLocalStore,
  legacyOwnerId,
  loadFarm,
  performAction,
  requestJson,
  requireAgroUser,
} from '@/lib/agroServer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const uid = await requireAgroUser(request);
    const farm = await loadFarm(uid, legacyOwnerId(request));
    return Response.json(
      { farm, now: Date.now(), local: isLocalStore() },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const uid = await requireAgroUser(request);
    const body = await requestJson(request);
    return Response.json(
      {
        ...(await performAction(uid, body)),
        now: Date.now(),
        local: isLocalStore(),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
