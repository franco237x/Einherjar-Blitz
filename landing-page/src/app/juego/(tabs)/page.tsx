'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@/config/firebase';
import { Icon } from '@/components/juego/Icon';
import { Modal } from '@/components/juego/Modal';
import { Spinner } from '@/components/juego/Spinner';
import { TransferModal } from '@/components/juego/TransferModal';
import { useUserData } from '@/hooks/useUserData';
import { convertKeysToSpheres } from '@/services/economy';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { userData, error: userDataError } = useUserData();

  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Convert states
  const [convertAmount, setConvertAmount] = useState('1');
  const [convertBusy, setConvertBusy] = useState(false);
  const [convertMsg, setConvertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const victorias = userData?.victorias || 0;
  const derrotas = userData?.derrotas || 0;
  const totalBattles = victorias + derrotas;
  const winrate = totalBattles > 0 ? Math.round((victorias / totalBattles) * 100) : 0;

  const exp = userData?.experiencia || 0;
  const progressCurrent = exp % 1000;
  const progressPercent = (progressCurrent / 1000) * 100;
  const progressRemaining = 1000 - progressCurrent;

  const parsedAmount = parseInt(convertAmount, 10) || 0;

  const handleConvert = async (event?: FormEvent) => {
    event?.preventDefault();
    setConvertMsg(null);
    if (userDataError) {
      setConvertMsg({ type: 'error', text: 'Espera a que el perfil vuelva a sincronizarse.' });
      return;
    }
    const amount = parseInt(convertAmount, 10);
    if (!amount || amount <= 0) {
      setConvertMsg({ type: 'error', text: 'Ingresa una cantidad válida de llaves.' });
      return;
    }
    const myKeys = userData?.keys || 0;
    if (amount > myKeys) {
      setConvertMsg({ type: 'error', text: `No tienes suficientes llaves. Tienes ${myKeys}.` });
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setConvertBusy(true);
    try {
      await convertKeysToSpheres(uid, amount);
      setConvertMsg({ type: 'success', text: `¡Convertiste ${amount} llaves en ${amount * 50} esferas!` });
      setConvertAmount('1');
      // onSnapshot in UserDataProvider refreshes balances automatically.
    } catch (error: unknown) {
      setConvertMsg({ type: 'error', text: (error as Error)?.message || 'Error al convertir llaves.' });
    } finally {
      setConvertBusy(false);
    }
  };

  const closeConvertModal = () => {
    setShowConvertModal(false);
    setConvertAmount('1');
    setConvertMsg(null);
  };

  const nivel = userData?.nivel || 1;
  const username = userData?.username || 'Guerrero';
  const rango = userData?.rango || 'Iniciado';
  const keys = userData?.keys || 0;
  const spheres = userData?.spheres || 0;
  const walletDisabled = Boolean(userDataError);

  return (
    <>
      <main className="relative z-10 mx-auto w-full max-w-[520px] px-4 pb-32 pt-5">
        {/* Greeting */}
        <header className="juego-rise mb-5">
          <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-gold">
            <span className="h-px w-5 bg-gold/60" aria-hidden="true" />
            Portal del guerrero
          </p>
          <h1 className="mt-2 truncate font-title text-[27px] leading-tight text-white/95">
            Salve, <span className="text-gold-light">{username}</span>
          </h1>
        </header>

        {userDataError ? (
          <p
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-[13px] text-red-300"
            role="alert"
          >
            <Icon name="cloud-offline" size={16} className="shrink-0" />
            No se pudieron sincronizar tus datos. Comprueba tu conexión antes de operar.
          </p>
        ) : null}

        {/* Warrior showcase */}
        <Link
          href="/juego/perfil"
          aria-label={`Ver perfil de ${username}, nivel ${nivel}`}
          className="juego-rise relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] p-4 transition active:scale-[0.985]"
          style={{ '--i': 1 } as CSSProperties}
        >
          <img
            src="/juego/loading_screen/orfevre.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
          />
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,9,0.35)_0%,rgba(11,10,9,0.05)_30%,rgba(11,10,9,0.85)_68%,#0b0a09_100%)]" />

          <span className="relative flex items-start justify-between gap-2">
            <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white/80 backdrop-blur-md">
              TEMPORADA ACTUAL
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-black/40 px-3 py-1 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] font-bold tracking-[0.16em] text-emerald-200">EN LÍNEA</span>
            </span>
          </span>

          <span className="relative block">
            <span className="flex items-center gap-3.5">
              <span className="relative h-14 w-14 shrink-0">
                {userData?.avatar ? (
                  <img
                    src={userData.avatar}
                    alt=""
                    className="h-14 w-14 rounded-full border-2 border-gold/80 object-cover shadow-[0_0_24px_rgba(201,170,113,0.35)]"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold/80 bg-[#17140f] shadow-[0_0_24px_rgba(201,170,113,0.35)]">
                    <Icon name="person" size={26} color="#c9aa71" />
                  </span>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#0b0a09] bg-gold px-1 text-[11px] font-bold text-[#0b0a09]">
                  {nivel}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-title text-[19px] leading-tight text-white">{rango}</span>
                <span className="mt-0.5 line-clamp-1 block text-[13px] italic text-white/65">
                  “{userData?.frase || 'Forjando mi destino...'}”
                </span>
              </span>
              <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" className="shrink-0" />
            </span>

            {/* Level progress */}
            <span className="mt-4 block">
              <span className="flex items-baseline justify-between text-[11px]">
                <span className="font-bold uppercase tracking-[0.16em] text-[#9be8f2]">Nivel {nivel}</span>
                <span className="tabular-nums text-white/55">
                  {progressCurrent} / 1000 EXP · faltan {progressRemaining}
                </span>
              </span>
              <span
                className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={progressCurrent}
                aria-valuemin={0}
                aria-valuemax={1000}
                aria-label="Experiencia del nivel actual"
              >
                <span
                  className="block h-full rounded-full bg-[linear-gradient(90deg,#3fb8c9,#9be8f2)] shadow-[0_0_12px_rgba(126,217,231,0.6)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </span>
            </span>

            <span className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/45 py-2.5 backdrop-blur-md">
              {[
                { value: (userData?.copas || 0).toLocaleString('es'), label: 'Copas', icon: 'trophy' },
                { value: victorias, label: 'Victorias', icon: 'flash' },
                { value: `${winrate}%`, label: 'Winrate', icon: 'stats-chart' },
              ].map((stat) => (
                <span key={stat.label} className="flex flex-col items-center px-1">
                  <span className="text-lg font-bold tabular-nums text-white">{stat.value}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gold">
                    <Icon name={stat.icon} size={10} />
                    {stat.label}
                  </span>
                </span>
              ))}
            </span>
          </span>
        </Link>

        {/* Wallet */}
        <section
          aria-labelledby="wallet-title"
          className="juego-rise mt-3 rounded-3xl border border-white/[0.07] bg-[linear-gradient(160deg,rgba(201,170,113,0.10),rgba(255,255,255,0.02)_45%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          style={{ '--i': 2 } as CSSProperties}
        >
          <div className="flex items-center justify-between">
            <h2 id="wallet-title" className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">
              Tesorería
            </h2>
            <span className="text-[11px] text-white/40">1 llave = 50 esferas</span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2.5">
            {[
              { label: 'Llaves', value: keys, icon: 'key', color: '#c9aa71' },
              { label: 'Esferas', value: spheres, icon: 'planet', color: '#7ed9e7' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-black/30 px-3.5 py-3">
                <dt className="flex items-center gap-1.5 text-[11px] font-medium text-white/55">
                  <Icon name={item.icon} size={14} color={item.color} />
                  {item.label}
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-white">{item.value.toLocaleString('es')}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              disabled={walletDisabled}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white/90 transition active:scale-[0.97] active:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Icon name="swap-horizontal" size={17} color="#c9aa71" />
              Transferir
            </button>
            <button
              type="button"
              onClick={() => setShowConvertModal(true)}
              disabled={walletDisabled}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#e2c68e,#c9aa71_55%,#a88a52)] text-sm font-bold text-[#0b0a09] shadow-[0_8px_24px_-10px_rgba(201,170,113,0.7)] transition active:scale-[0.97] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Icon name="sync" size={17} />
              Convertir
            </button>
          </div>
        </section>

        {/* Event */}
        <Link
          href="/evento/agro"
          className="juego-rise relative mt-3 flex items-center gap-3 overflow-hidden rounded-3xl border border-[#a7bb76]/30 bg-[linear-gradient(110deg,#17261c_0%,#131f18_55%,#0f1712_100%)] p-4 transition active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          style={{ '--i': 3 } as CSSProperties}
        >
          <span className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-[#a7bb76]/15 blur-3xl" aria-hidden="true" />
          <span className="relative z-10 min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#cfdb9c]/30 bg-[#cfdb9c]/10 px-2.5 py-0.5 text-[9px] font-bold tracking-[0.18em] text-[#d1dda3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cfdb9c]/60" />
              EVENTO FINALIZADO
            </span>
            <span className="mt-2 block font-title text-[20px] leading-tight text-white/95">El Huerto de Yggdrasil</span>
            <span className="mt-1 block text-[12px] leading-[18px] text-white/60">
              Gracias por participar. Mira los logros de tu huerto y tus vales.
            </span>
            <span className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#e5ce96]">
              Ver mis logros
              <Icon name="arrow-forward" size={15} />
            </span>
          </span>
          <Image
            src="/evento-agro/arbol-alba.png"
            alt=""
            width={112}
            height={112}
            sizes="96px"
            className="relative z-10 h-24 w-24 shrink-0 object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
          />
        </Link>

        {/* Explore */}
        <section aria-labelledby="explore-title" className="mt-7">
          <h2
            id="explore-title"
            className="juego-rise mb-3 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-gold"
            style={{ '--i': 4 } as CSSProperties}
          >
            <span className="h-px w-5 bg-gold/60" aria-hidden="true" />
            Explorar
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {EXPLORE.map((tile, i) => (
              <Link
                key={tile.key}
                href={tile.href}
                className="juego-rise relative flex aspect-[4/5] flex-col overflow-hidden rounded-3xl border border-white/[0.08] p-3.5 transition active:scale-[0.97]"
                style={{ '--i': 5 + i } as CSSProperties}
              >
                <img
                  src={tile.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: tile.focus }}
                />
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,9,0.05)_0%,rgba(11,10,9,0.6)_50%,rgba(11,10,9,0.97)_100%)]" />
                <span className="relative mt-auto block">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-black/50 backdrop-blur-md">
                    <Icon name={tile.icon} size={17} color="#c9aa71" />
                  </span>
                  <span className="mt-2 flex items-center justify-between gap-1">
                    <span className="font-title text-[17px] leading-tight text-white">{tile.title}</span>
                    <Icon name="arrow-forward" size={16} color="#c9aa71" className="shrink-0" />
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-white/60">{tile.description}</span>
                </span>
              </Link>
            ))}
          </div>

          {/* Arena */}
          {FEATURE_FLAGS.game ? (
            <Link
              href="/juego/jugar"
              aria-label="Abrir arena de combate"
              className="juego-rise relative mt-3 flex min-h-[88px] items-center gap-3.5 overflow-hidden rounded-3xl border border-white/[0.08] p-4 transition active:scale-[0.985]"
              style={{ '--i': 7 } as CSSProperties}
            >
              <ArenaStrip />
            </Link>
          ) : (
            <div
              className="juego-rise relative mt-3 flex min-h-[88px] items-center gap-3.5 overflow-hidden rounded-3xl border border-white/[0.08] p-4"
              style={{ '--i': 7 } as CSSProperties}
            >
              <ArenaStrip comingSoon />
            </div>
          )}
        </section>
      </main>

      <TransferModal
        visible={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        myKeys={userData?.keys || 0}
      />

      {/* Convert Keys to Spheres Modal */}
      <Modal visible={showConvertModal} onClose={closeConvertModal} label="Convertir llaves" locked={convertBusy}>
        <form onSubmit={handleConvert}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-title text-lg tracking-wide text-gold">Convertir Llaves</h2>
            <button type="button" onClick={closeConvertModal} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-white/90 active:bg-white/10" aria-label="Cerrar conversión">
              <Icon name="close" size={22} />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-1 rounded-lg bg-white/5 p-2 text-[13px] font-bold text-white/95">
            <Icon name="key-outline" size={18} color="#c9aa71" />
            <span>Llaves: {userData?.keys || 0}</span>
            <Icon name="planet-outline" size={18} color="#c9aa71" className="ml-4" />
            <span>Esferas: {userData?.spheres || 0}</span>
          </div>

          <label htmlFor="convert-amount" className="mb-1 mt-2 block text-xs text-white/70">
            Cantidad de llaves a convertir
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-white/5 text-gold active:scale-95"
              onClick={() => setConvertAmount(String(Math.max(1, (parseInt(convertAmount, 10) || 1) - 1)))}
              aria-label="Restar una llave"
            >
              <Icon name="remove" size={20} />
            </button>
            <input
              id="convert-amount"
              className="h-12 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-center text-base font-bold text-white/95 outline-none focus:border-gold/60"
              placeholder="1"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
            />
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-white/5 text-gold active:scale-95"
              onClick={() => setConvertAmount(String((parseInt(convertAmount, 10) || 0) + 1))}
              aria-label="Sumar una llave"
            >
              <Icon name="add" size={20} />
            </button>
          </div>

          <div className="mt-4 flex flex-col items-center rounded-lg bg-gold/[0.08] p-4">
            <p className="text-base font-bold text-gold">
              {parsedAmount} llaves → {parsedAmount * 50} esferas
            </p>
            <p className="mt-1 text-[11px] text-white/70">Tasa: 1 llave = 50 esferas</p>
          </div>

          {convertMsg && (
            <p
              className={cn('mt-2 text-center text-xs', convertMsg.type === 'error' ? 'text-[#e57373]' : 'text-[#81c784]')}
              role={convertMsg.type === 'error' ? 'alert' : 'status'}
            >
              {convertMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={convertBusy}
            className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e2c68e,#c9aa71_55%,#a88a52)] text-sm font-bold tracking-[0.15em] text-[#0b0a09] transition active:scale-[0.98] disabled:opacity-60"
          >
            {convertBusy ? <Spinner className="text-ink-deep" /> : 'CONVERTIR'}
          </button>
        </form>
      </Modal>
    </>
  );
}

const EXPLORE = [
  {
    key: 'gacha',
    title: 'Invocaciones',
    description: 'Gasta llaves en la Habitación Terciopelo.',
    icon: 'sparkles',
    href: '/juego/gacha',
    image: '/juego/gacha/banners/persona_banner.jpg',
    focus: '22% center',
  },
  {
    key: 'store',
    title: 'Tienda',
    description: 'Canjea tus esferas por artículos.',
    icon: 'storefront',
    href: '/juego/tienda',
    image: '/juego/loading_screen/manhattan.jpg',
    focus: 'center 25%',
  },
];

function ArenaStrip({ comingSoon }: { comingSoon?: boolean }) {
  return (
    <>
      <img
        src="/juego/game/arena-nordica.webp"
        alt=""
        className={cn('absolute inset-0 h-full w-full object-cover', comingSoon && 'grayscale-[60%]')}
      />
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,10,9,0.95)_0%,rgba(11,10,9,0.7)_60%,rgba(11,10,9,0.4)_100%)]" />
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-black/50">
        <Icon name="game-controller" size={21} color="#c9aa71" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-title text-[17px] text-white">Arena de combate</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-white/60">Prueba a tus personajes en el modo RPG.</span>
      </span>
      {comingSoon ? (
        <span className="relative shrink-0 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-white/75">
          PRONTO
        </span>
      ) : (
        <Icon name="chevron-forward" size={20} color="#c9aa71" className="relative shrink-0" />
      )}
    </>
  );
}
