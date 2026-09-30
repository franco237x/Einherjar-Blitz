import { NextRequest } from 'next/server';
import {
  apiError,
  isLocalStore,
  performAction,
  readFarm,
  requestJson,
  requireAgroUser,
} from '@/lib/agroServer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The event closed on 2026-09-30. Players can still read their farm to see
// their achievements and turn their harvested balance into a final voucher;
// every other action is rejected. Issued vouchers keep working through
// /api/agro/vale and /api/agro/canje.
export async function GET(request: NextRequest) {
  try {
    const uid = await requireAgroUser(request);
    const farm = await readFarm(uid);
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
    const action = body.action;
    if (
      !action ||
      typeof action !== 'object' ||
      (action as { type?: unknown }).type !== 'voucher'
    )
      return Response.json(
        { error: 'El evento Agro terminó. Gracias por participar.' },
        { status: 410, headers: { 'Cache-Control': 'no-store' } },
      );
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
