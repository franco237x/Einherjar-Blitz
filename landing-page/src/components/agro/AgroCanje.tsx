'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import type { AgroVoucher } from '@/lib/agroGame';
import { AgroDialog } from './AgroDialog';

export function AgroCanje({ initialId }: { initialId: string }) {
  const [id, setId] = useState(initialId);
  const [voucher, setVoucher] = useState<AgroVoucher | null>(null);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!initialId) return;
    let active = true;
    fetch(`/api/agro/canje?id=${encodeURIComponent(initialId)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) setVoucher(data.voucher);
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, [initialId]);
  const lookup = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setVoucher(null);
    try {
      const response = await fetch(
        `/api/agro/canje?id=${encodeURIComponent(id.trim().toUpperCase())}`,
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setVoucher(data.voucher);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No pudimos consultar el folio.',
      );
    } finally {
      setBusy(false);
    }
  };
  const redeem = async () => {
    if (!voucher || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/agro/canje', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ id: voucher.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setVoucher(data.voucher);
      setConfirm(false);
      setKey('');
      setMessage(
        `Canje registrado. Acredita ${data.voucher.amount.toLocaleString('es-AR')} monedas a ${data.voucher.playerName} en el grupo.`,
      );
    } catch (error) {
      setConfirm(false);
      setMessage(
        error instanceof Error
          ? error.message
          : 'Conexión interrumpida. Consulta el folio antes de volver a acreditar.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="agro-page">
      <main className="agro-admin">
        <Link href="/evento/agro" className="agro-back">
          <ArrowLeft size={16} /> Volver al huerto
        </Link>
        <p className="agro-eyebrow">REGISTRO DE COSECHAS</p>
        <h1>Consultar un vale</h1>
        <p>
          Comprueba el nombre, las monedas y el estado del folio. Cada vale
          permite una sola acreditación manual en Messenger.
        </p>
        <form
          className="agro-voucher-card"
          onSubmit={(event) => void lookup(event)}
        >
          <label htmlFor="voucher-id">Folio del PDF</label>
          <input
            id="voucher-id"
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="AGRO-AAAAMMDD-…"
            required
            maxLength={50}
            autoCapitalize="characters"
            autoComplete="off"
          />
          <button className="agro-voucher-button" disabled={busy}>
            Consultar folio
          </button>
        </form>
        {message && (
          <p className="agro-admin-status" role="status">
            {message}
          </p>
        )}
        {voucher && (
          <section
            className="agro-voucher-card"
            aria-label="Datos registrados del vale"
          >
            <div className="agro-voucher-top">
              <span>{voucher.redeemedAt ? 'CANJEADO' : 'PENDIENTE'}</span>
              <span>
                {voucher.environment === 'local'
                  ? 'MUESTRA LOCAL'
                  : 'REGISTRO DEL EVENTO'}
              </span>
            </div>
            <div className="agro-voucher-amount">
              <strong>{voucher.amount.toLocaleString('es-AR')}</strong>
              <span>monedas · {voucher.playerName}</span>
            </div>
            <p className="agro-folio">{voucher.id}</p>
            <p>
              Emitido:{' '}
              {new Date(voucher.createdAt).toLocaleString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
              })}{' '}
              (Argentina)
            </p>
            {voucher.environment === 'local' && (
              <p className="agro-environment">
                Este vale de demostración no otorga monedas en el grupo.
              </p>
            )}
            {voucher.redeemedAt ? (
              <p>
                Canje registrado el{' '}
                {new Date(voucher.redeemedAt).toLocaleString('es-AR', {
                  timeZone: 'America/Argentina/Buenos_Aires',
                })}
                . No vuelvas a acreditar este folio.
              </p>
            ) : (
              <details className="agro-rules">
                <summary>Administrar el canje</summary>
                <p>
                  Comprueba que el nombre corresponda a quien presenta el PDF.
                  Registra el canje antes de acreditar el importe en el grupo.
                  La web guarda el estado del folio; la acreditación en
                  Messenger la realiza el administrador.
                </p>
                <label htmlFor="admin-key">Clave de administración</label>
                <input
                  id="admin-key"
                  type="password"
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="agro-voucher-button"
                  disabled={busy || key.length < 32}
                  onClick={() => setConfirm(true)}
                >
                  Registrar canje único
                </button>
              </details>
            )}
            <a
              className="agro-voucher-button"
              href={`/api/agro/vale?id=${voucher.id}`}
            >
              <Download size={17} /> Descargar comprobante
            </a>
          </section>
        )}
        <AgroDialog
          open={confirm}
          title="Registrar este canje"
          onClose={() => setConfirm(false)}
        >
          <p>
            Marcarás el folio como canjeado por{' '}
            <strong>{voucher?.amount.toLocaleString('es-AR')} monedas</strong>{' '}
            para <strong>{voucher?.playerName}</strong>. Después acredita ese
            importe una sola vez en el grupo.
          </p>
          <div className="agro-confirm-actions">
            <button
              type="button"
              className="agro-draw-ten"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="agro-draw-main"
              disabled={busy}
              onClick={() => void redeem()}
            >
              {busy ? 'Registrando…' : 'Registrar canje'}
            </button>
          </div>
        </AgroDialog>
      </main>
    </div>
  );
}
