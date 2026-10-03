'use client';

import { useState } from 'react';
import { Copy, Download, ExternalLink, Share2, X } from 'lucide-react';
import type { AgroVoucher } from '@/lib/agroGame';
import { LEVELS } from '@/lib/jardin/engine';
import { voucherPdfUrl } from './jardinApi';

const coins = (value: number) => value.toLocaleString('es-AR');

/**
 * Messenger, Facebook and Instagram open links in their own browser, which
 * cannot download files; neither can an iPhone web app opened from the home
 * screen. Those players get the card (a screenshot works) and other routes.
 */
function limitedBrowser() {
  if (typeof window === 'undefined') return false;
  const inApp = /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Line\/|; wv\)/i.test(navigator.userAgent);
  const homeScreen =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  return inApp || homeScreen;
}

/** Can this browser share the PDF itself (Android Chrome, iOS Safari)? */
function canShareFiles() {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files: [new File([''], 'vale.pdf', { type: 'application/pdf' })] });
  } catch {
    return false;
  }
}

export function VoucherView({ voucher, onClose }: { voucher: AgroVoucher; onClose: () => void }) {
  const [limited] = useState(limitedBrowser);
  const [shareable] = useState(canShareFiles);
  const [status, setStatus] = useState<string | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(voucher.id);
      setStatus('Folio copiado. Pégalo en el grupo de Messenger.');
    } catch {
      setStatus('No se pudo copiar: mantén presionado el folio para seleccionarlo.');
    }
  };

  const share = async () => {
    setStatus('Preparando el PDF…');
    try {
      const response = await fetch(voucherPdfUrl(voucher.id), { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const file = new File([await response.blob()], `${voucher.id}.pdf`, { type: 'application/pdf' });
      await navigator.share({ files: [file], title: 'Vale del Jardín de Yggdrasil', text: `Folio ${voucher.id}` });
      setStatus(null);
    } catch (error) {
      // Closing the share sheet is not an error.
      setStatus(error instanceof DOMException && error.name === 'AbortError' ? null : 'No se pudo compartir. Prueba con Descargar o una captura.');
    }
  };

  const action = 'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3"
      role="dialog"
      aria-modal="true"
      aria-label={`Vale ${voucher.id}`}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="my-auto w-full max-w-md">
        {/* The card is the voucher itself: a screenshot of it is enough to claim. */}
        <div className="relative rounded-3xl border-4 border-[#5b3b1d] bg-gradient-to-b from-[#f7eed2] to-[#e0cd9a] p-4 text-center text-[#3a2612] shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full p-1.5 text-[#5b3b1d] hover:bg-black/10"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a5a3a]">Jardín de Yggdrasil · Vale de monedas</p>
          <p className="mt-1 font-title text-4xl font-bold">🪙 {coins(voucher.amount)}</p>
          <p className="mt-1 text-sm">
            A nombre de <b>{voucher.playerName}</b>
          </p>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7a5a3a]">Folio</p>
          <p className="select-all break-all rounded-lg bg-white/70 px-2 py-1.5 font-mono text-sm font-bold">{voucher.id}</p>
          <p className="mt-2 text-xs text-[#5a4228]">
            Emitido el {new Date(voucher.createdAt).toLocaleDateString('es-AR')} · Niveles superados {voucher.plantsGrowing} de {LEVELS.length}
          </p>
          <p className={`mt-1 text-xs font-bold ${voucher.redeemedAt ? 'text-[#2f7a14]' : 'text-[#7a5a3a]'}`}>
            {voucher.redeemedAt
              ? `Canjeado el ${new Date(voucher.redeemedAt).toLocaleDateString('es-AR')}`
              : 'Pendiente de canje'}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={voucherPdfUrl(voucher.id)} download={`${voucher.id}.pdf`} className={`${action} bg-amber-300 text-[#2a1c0c]`}>
            <Download size={16} aria-hidden /> Descargar PDF
          </a>
          <a href={`${voucherPdfUrl(voucher.id)}&ver=1`} target="_blank" rel="noopener" className={`${action} bg-white/15 text-white`}>
            <ExternalLink size={16} aria-hidden /> Abrir PDF
          </a>
          {shareable && (
            <button type="button" onClick={share} className={`${action} bg-white/15 text-white`}>
              <Share2 size={16} aria-hidden /> Compartir
            </button>
          )}
          <button type="button" onClick={copy} className={`${action} bg-white/15 text-white ${shareable ? '' : 'col-span-2'}`}>
            <Copy size={16} aria-hidden /> Copiar folio
          </button>
        </div>
        {status && (
          <p className="mt-2 text-center text-xs text-amber-100" role="status">
            {status}
          </p>
        )}
        <p className={`mt-3 rounded-xl p-2.5 text-xs leading-snug ${limited ? 'bg-amber-300/90 text-[#2a1c0c]' : 'bg-black/50 text-white/75'}`}>
          {limited ? (
            <>
              <b>Estás en el navegador de Messenger o en la app de inicio, que no descargan archivos.</b> Haz una captura de
              este vale, o abre la página en Chrome o Safari (menú <b>⋯</b> → <b>Abrir en el navegador</b>) para bajar el PDF.
            </>
          ) : (
            <>Si el PDF no se descarga, una captura de este vale o el folio copiado también sirven para canjearlo.</>
          )}
        </p>
      </div>
    </div>
  );
}
