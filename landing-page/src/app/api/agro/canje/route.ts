import type { NextRequest } from 'next/server';
import {
  apiError,
  lookupVoucher,
  redeemVoucher,
  requestJson,
  requireAdmin,
} from '@/lib/agroServer';
import { GameError } from '@/lib/agroGame';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const voucher = await lookupVoucher(
      request.nextUrl.searchParams.get('id') || '',
    );
    return Response.json(
      { voucher },
      { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await requestJson(request);
    await requireAdmin(request);
    if (typeof body.id !== 'string') throw new GameError('Indica el folio.');
    return Response.json(
      { voucher: await redeemVoucher(body.id) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
