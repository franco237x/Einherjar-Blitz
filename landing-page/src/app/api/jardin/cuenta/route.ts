import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/agroServer';
import { NO_STORE, requireJardinUser } from '@/lib/jardinRequest';
import { loadProgress } from '@/lib/jardinServer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const uid = await requireJardinUser(request);
    return Response.json({ progress: await loadProgress(uid) }, NO_STORE);
  } catch (error) {
    return apiError(error);
  }
}
