'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { ArrowLeft, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ALBUM_FAMILIES, ALBUM_MILESTONES, ALBUM_PLANTS } from '@/lib/agroAlbum';
import { DAILY_COIN_LIMIT, cultivatedCount, type FarmState } from '@/lib/agroGame';

type Status =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; farm: FarmState | null };

const number = (value: number) => value.toLocaleString('es-AR');
const date = (value: number) =>
  new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

async function fetchFarm(user: User): Promise<FarmState | null> {
  const token = await user.getIdToken();
  const response = await fetch('/api/agro/partida', {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No pudimos cargar tus logros.');
  return data.farm ?? null;
}

/**
 * The Agro event is over: this page thanks the player and shows what they
 * achieved. It only reads the farm; the server no longer accepts actions.
 */
export function AgroThanks() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchFarm(user)
      .then((farm) => {
        if (!cancelled) setStatus({ kind: 'ready', farm });
      })
      .catch((failure) => {
        if (!cancelled)
          setStatus({
            kind: 'error',
            message: failure instanceof Error ? failure.message : 'No pudimos cargar tus logros.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [user, attempt]);

  const retry = () => {
    setStatus({ kind: 'loading' });
    setAttempt((value) => value + 1);
  };

  return (
    <main className="agro-page">
      <div className="agro-page-glow" aria-hidden="true" />
      <div className="agro-thanks">
        <p className="agro-eyebrow">
          <span aria-hidden="true" />
          EL HUERTO DE YGGDRASIL · EVENTO FINALIZADO
        </p>
        <h1>Gracias por participar del evento Agro</h1>
        <p className="agro-thanks-intro">
          El huerto cerró sus puertas. Gracias por sembrar, regar y fusionar con nosotros. Estos son los logros que
          conseguiste durante el evento.
        </p>

        {loading || (user && status.kind === 'loading') ? (
          <p className="agro-thanks-note" role="status">
            Buscando tus logros…
          </p>
        ) : !user ? (
          <div className="agro-thanks-note">
            <p>Inicia sesión con tu cuenta de Einherjar Blitz para ver tus logros.</p>
            <Link className="agro-primary-link" href="/juego/login?next=%2Fevento%2Fagro">
              Iniciar sesión
            </Link>
          </div>
        ) : status.kind === 'error' ? (
          <div className="agro-thanks-note" role="alert">
            <p>{status.message}</p>
            <button type="button" className="agro-primary-link" onClick={retry}>
              Volver a intentar
            </button>
          </div>
        ) : status.kind === 'ready' && status.farm ? (
          <Achievements farm={status.farm} user={user} onFarm={(farm) => setStatus({ kind: 'ready', farm })} />
        ) : (
          <p className="agro-thanks-note">
            No encontramos un huerto en tu cuenta. ¡Te esperamos en el próximo evento!
          </p>
        )}

        <Link href="/juego" className="agro-text-link agro-thanks-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al portal
        </Link>
      </div>
    </main>
  );
}

function Achievements({
  farm,
  user,
  onFarm,
}: {
  farm: FarmState;
  user: User;
  onFarm: (farm: FarmState) => void;
}) {
  const discovered = ALBUM_PLANTS.filter((plant) => farm.album[plant.id]?.discovered);
  const rarest = discovered.reduce<(typeof ALBUM_PLANTS)[number] | null>(
    (best, plant) => (!best || plant.tier > best.tier ? plant : best),
    null
  );
  const vouchers = [...farm.vouchers].sort((a, b) => b.createdAt - a.createdAt);
  const voucherTotal = vouchers.reduce((sum, voucher) => sum + voucher.amount, 0);

  const stats = [
    { value: number(farm.totalHarvested), label: 'Monedas cosechadas' },
    { value: `${discovered.length} / ${ALBUM_PLANTS.length}`, label: 'Especies descubiertas' },
    { value: `${cultivatedCount(farm)} / ${ALBUM_PLANTS.length}`, label: 'Especies cultivadas' },
    { value: number(farm.pullCount), label: 'Invocaciones' },
    { value: `${farm.familySeals.length} / ${ALBUM_FAMILIES.length}`, label: 'Sellos de linaje' },
    { value: `${farm.claimedMilestones.length} / ${ALBUM_MILESTONES.length}`, label: 'Premios del herbario' },
  ];

  return (
    <>
      {farm.playerName ? <p className="agro-thanks-player">{farm.playerName}</p> : null}

      <dl className="agro-thanks-stats">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {rarest ? (
        <section className="agro-thanks-featured" aria-labelledby="agro-rarest">
          <Image src={rarest.image} alt="" width={160} height={160} sizes="120px" />
          <div>
            <p className="agro-eyebrow">TU ESPECIE MÁS RARA</p>
            <h2 id="agro-rarest">{rarest.name}</h2>
            <p>{rarest.rarity}</p>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="agro-herbarium">
        <h2 id="agro-herbarium" className="agro-thanks-heading">
          Tu herbario
        </h2>
        <ul className="agro-thanks-plants">
          {ALBUM_PLANTS.map((plant) => {
            const found = Boolean(farm.album[plant.id]?.discovered);
            return (
              <li key={plant.id} data-found={found}>
                <Image src={plant.image} alt="" width={96} height={96} sizes="72px" />
                <span>{found ? plant.name : 'Sin descubrir'}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {farm.coins > 0 ? <FinalVoucher farm={farm} user={user} onFarm={onFarm} /> : null}

      {vouchers.length > 0 ? (
        <section aria-labelledby="agro-vouchers">
          <h2 id="agro-vouchers" className="agro-thanks-heading">
            Tus vales · {number(voucherTotal)} monedas
          </h2>
          <ul className="agro-thanks-vouchers">
            {vouchers.map((voucher) => (
              <li key={voucher.id}>
                <div>
                  <strong>{number(voucher.amount)} monedas</strong>
                  <span>
                    {date(voucher.createdAt)} · {voucher.redeemedAt ? 'Canjeado' : 'Pendiente de canje'}
                  </span>
                  <span className="agro-folio">{voucher.id}</span>
                </div>
                <div className="agro-thanks-voucher-links">
                  <a href={`/api/agro/vale?id=${voucher.id}`} className="agro-text-link">
                    <Download size={14} aria-hidden="true" /> PDF
                  </a>
                  <Link href={`/evento/agro/canje?id=${voucher.id}`} className="agro-text-link">
                    Consultar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <p className="agro-thanks-small">Los vales pendientes se siguen canjeando en el grupo con su folio.</p>
        </section>
      ) : null}
    </>
  );
}

/** The only action left after the event: turn the harvested balance into a voucher. */
function FinalVoucher({
  farm,
  user,
  onFarm,
}: {
  farm: FarmState;
  user: User;
  onFarm: (farm: FarmState) => void;
}) {
  const [name, setName] = useState(farm.playerName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  const issue = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/agro/partida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: { type: 'voucher', playerName: name },
          revision: farm.revision,
          requestId: crypto.randomUUID(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        // Another tab changed the farm: reload it so the next try uses the new revision.
        if (response.status === 409) onFarm((await fetchFarm(user)) ?? farm);
        throw new Error(data.error || 'No se pudo emitir el vale.');
      }
      onFarm(data.farm);
      setMessage({ error: false, text: data.outcome?.message || 'Vale emitido.' });
    } catch (failure) {
      setMessage({
        error: true,
        text: failure instanceof Error ? failure.message : 'No se pudo emitir el vale.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="agro-thanks-final" aria-labelledby="agro-final-voucher">
      <h2 id="agro-final-voucher" className="agro-thanks-heading">
        Te quedaron {number(farm.coins)} monedas
      </h2>
      <p>
        Emite un último vale con tu saldo cosechado y preséntalo en el grupo. Se pueden emitir hasta{' '}
        {number(DAILY_COIN_LIMIT)} monedas por día; si tienes más, el resto queda para mañana.
      </p>
      <form onSubmit={issue}>
        <label htmlFor="agro-final-name">Tu nombre en el grupo</label>
        <div>
          <input
            id="agro-final-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={48}
            required
            autoComplete="nickname"
          />
          <button type="submit" className="agro-primary-link" disabled={busy}>
            {busy ? 'Emitiendo…' : 'Emitir vale final'}
          </button>
        </div>
      </form>
      {message ? (
        <p role={message.error ? 'alert' : 'status'} className={message.error ? 'agro-inline-error' : 'agro-thanks-small'}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
