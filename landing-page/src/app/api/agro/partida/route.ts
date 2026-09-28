import { NextRequest, NextResponse } from 'next/server';
import {
  AGRO_COOKIE,
  apiError,
  isLocalStore,
  loadFarm,
  performAction,
  requestJson,
  sessionIdentity,
} from '@/lib/agroServer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = sessionIdentity(request, true);
    const farm = await loadFarm(session.ownerId);
    const response = NextResponse.json(
      { farm, now: Date.now(), local: isLocalStore() },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
    response.cookies.set(AGRO_COOKIE, session.token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await requestJson(request);
    const { ownerId } = sessionIdentity(request);
    return Response.json(
      {
        ...(await performAction(ownerId, body)),
        now: Date.now(),
        local: isLocalStore(),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
