import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/agroServer';
import { NO_STORE, requireJardinUser } from '@/lib/jardinRequest';
import { issueVoucher } from '@/lib/jardinServer';
import { requestJson } from '@/lib/serverRequest';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const uid = await requireJardinUser(request);
    return Response.json(await issueVoucher(uid, await requestJson(request)), NO_STORE);
  } catch (error) {
    return apiError(error);
  }
}
