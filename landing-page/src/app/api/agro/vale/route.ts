import type { NextRequest } from 'next/server';
import { createAgroVoucherPdf } from '@/lib/agroPdf';
import { apiError, lookupVoucher } from '@/lib/agroServer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // Only the recorded folio is accepted. Amounts and names from the URL are ignored.
    const voucher = await lookupVoucher(
      request.nextUrl.searchParams.get('id') || '',
    );
    const origin = process.env.AGRO_PUBLIC_URL || request.nextUrl.origin;
    const pdf = await createAgroVoucherPdf(
      voucher,
      `${origin}/evento/agro/canje?id=${voucher.id}`,
    );
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        // `ver=1` shows it in the browser's viewer instead of downloading it.
        'Content-Disposition': `${request.nextUrl.searchParams.get('ver') === '1' ? 'inline' : 'attachment'}; filename="${voucher.environment === 'local' ? 'DEMO-' : ''}${voucher.id}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
