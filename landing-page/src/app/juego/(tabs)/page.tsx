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
      <main className="relative z-10 mx-auto w-full max-w-[1120px] px-4 pb-32 pt-8 sm:px-6 md:pb-16 md:pt-10">
        {/* Greeting */}
        <header className="juego-rise mb-8">
          <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            <span className="h-px w-6 bg-gold/60" aria-hidden="true" />
            Portal del guerrero
          </p>
          <h1 className="mt-3 font-title text-[28px] leading-tight text-white/95 sm:text-[38px]">
            Salve, <span className="text-gold-light">{username}</span>
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {rango} · Nivel {nivel} · {totalBattles} {totalBattles === 1 ? 'batalla librada' : 'batallas libradas'}
          </p>
        </header>

        {userDataError ? (
          <p
            className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-[13px] text-red-300"
            role="alert"
          >
            <Icon name="cloud-offline" size={16} />
            No se pudieron sincronizar tus datos. Comprueba tu conexión antes de operar.
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Warrior showcase */}
          <Link
            href="/juego/perfil"
            aria-label={`Ver perfil de ${username}, nivel ${nivel}`}
            className="juego-rise group relative flex min-h-[380px] flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] p-5 sm:p-7 lg:col-span-8 lg:min-h-[440px]"
            style={{ '--i': 1 } as CSSProperties}
          >
            <img
              src="/juego/loading_screen/orfevre.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_30%] transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,9,0.35)_0%,rgba(11,10,9,0.05)_35%,rgba(11,10,9,0.85)_75%,#0b0a09_100%)]" />
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,10,9,0.7)_0%,transparent_60%)]" />

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
              <span className="flex items-center gap-4">
                <span className="relative h-16 w-16 shrink-0">
                  {userData?.avatar ? (
                    <img
                      src={userData.avatar}
                      alt=""
                      className="h-16 w-16 rounded-full border-2 border-gold/80 object-cover shadow-[0_0_24px_rgba(201,170,113,0.35)]"
                    />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold/80 bg-[#17140f] shadow-[0_0_24px_rgba(201,170,113,0.35)]">
                      <Icon name="person" size={28} color="#c9aa71" />
                    </span>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#0b0a09] bg-gold px-1 text-[11px] font-bold text-[#0b0a09]">
                    {nivel}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-title text-2xl text-white sm:text-[32px] sm:leading-tight">{rango}</span>
                  <span className="mt-1 line-clamp-1 block text-sm italic text-white/65">
                    “{userData?.frase || 'Forjando mi destino...'}”
                  </span>
                </span>
              </span>

              <span className="mt-6 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/45 py-3 backdrop-blur-md sm:max-w-[520px]">
                {[
                  { value: (userData?.copas || 0).toLocaleString('es'), label: 'Copas', icon: 'trophy' },
                  { value: victorias, label: 'Victorias', icon: 'flash' },
                  { value: `${winrate}%`, label: 'Winrate', icon: 'stats-chart' },
                ].map((stat) => (
                  <span key={stat.label} className="flex flex-col items-center px-2 sm:items-start sm:px-5">
                    <span className="text-xl font-bold tabular-nums text-white">{stat.value}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
                      <Icon name={stat.icon} size={11} />
                      {stat.label}
                    </span>
                  </span>
                ))}
              </span>
            </span>
          </Link>

          <div className="flex flex-col gap-4 lg:col-span-4">
            {/* Wallet */}
            <section
              aria-labelledby="wallet-title"
              className="juego-rise rounded-3xl border border-white/[0.07] bg-[linear-gradient(160deg,rgba(201,170,113,0.10),rgba(255,255,255,0.02)_45%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              style={{ '--i': 2 } as CSSProperties}
            >
              <div className="flex items-center justify-between">
                <h2 id="wallet-title" className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">
                  Tesorería
                </h2>
                <Icon name="shield" size={16} color="rgba(201,170,113,0.6)" />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Llaves', value: keys, icon: 'key', color: '#c9aa71' },
                  { label: 'Esferas', value: spheres, icon: 'planet', color: '#7ed9e7' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-black/30 p-3.5">
                    <dt className="flex items-center gap-1.5 text-[11px] font-medium text-white/55">
                      <Icon name={item.icon} size={14} color={item.color} />
                      {item.label}
                    </dt>
                    <dd className="mt-1.5 text-2xl font-bold tabular-nums text-white">{item.value.toLocaleString('es')}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  disabled={walletDisabled}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white/90 transition hover:border-gold/40 hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Icon name="swap-horizontal" size={16} color="#c9aa71" />
                  Transferir
                </button>
                <button
                  type="button"
                  onClick={() => setShowConvertModal(true)}
                  disabled={walletDisabled}
                  className="juego-sheen flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#e2c68e,#c9aa71_55%,#a88a52)] text-sm font-bold text-[#0b0a09] shadow-[0_8px_24px_-10px_rgba(201,170,113,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Icon name="sync" size={16} />
                  Convertir
                </button>
              </div>
              <p className="mt-3 text-center text-[11px] text-white/40">1 llave = 50 esferas</p>
            </section>

            {/* Level */}
            <section
              aria-labelledby="level-title"
              className="juego-rise flex flex-1 items-center gap-5 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              style={{ '--i': 3 } as CSSProperties}
            >
              <LevelRing level={nivel} percent={progressPercent} />
              <div className="min-w-0 flex-1">
                <h2 id="level-title" className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">
                  Progreso
                </h2>
                <p className="mt-1 font-title text-xl text-white/95">Nivel {nivel}</p>
                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
                  role="progressbar"
                  aria-valuenow={progressCurrent}
                  aria-valuemin={0}
                  aria-valuemax={1000}
                  aria-label="Experiencia del nivel actual"
                >
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#3fb8c9,#9be8f2)] shadow-[0_0_12px_rgba(126,217,231,0.6)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 flex justify-between text-[11px] text-white/50">
                  <span className="tabular-nums">{progressCurrent} / 1000 EXP</span>
                  <span className="tabular-nums">{progressRemaining} para nv. {nivel + 1}</span>
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Event */}
        <Link
          href="/evento/agro"
          className="juego-rise group relative mt-4 flex min-h-[168px] items-center gap-4 overflow-hidden rounded-3xl border border-[#a7bb76]/30 bg-[linear-gradient(110deg,#17261c_0%,#131f18_55%,#0f1712_100%)] p-5 transition-colors hover:border-[#cfdb9c]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:p-7"
          style={{ '--i': 4 } as CSSProperties}
        >
          <span className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-[#a7bb76]/15 blur-3xl" aria-hidden="true" />
          <span className="pointer-events-none absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-[#cfdb9c]/40 to-transparent" aria-hidden="true" />
          <span className="relative z-10 min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#cfdb9c]/30 bg-[#cfdb9c]/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-[#d1dda3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cfdb9c]" />
              EVENTO ACTIVO
            </span>
            <span className="mt-3 block font-title text-[22px] leading-tight text-white/95 sm:text-[30px]">
              El Huerto de Yggdrasil
            </span>
            <span className="mt-2 block max-w-xl text-[13px] leading-5 text-white/65 sm:text-sm">
              Planta, riega y fusiona. Cosecha monedas y genera tu vale PDF.
            </span>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#e5ce96]">
              Entrar al Huerto
              <Icon name="arrow-forward" size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </span>
          <Image
            src="/evento-agro/arbol-alba.png"
            alt=""
            width={180}
            height={180}
            sizes="(max-width: 640px) 104px, 180px"
            className="relative z-10 h-[104px] w-[104px] shrink-0 object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:-translate-y-1 group-hover:rotate-1 sm:h-44 sm:w-44"
          />
        </Link>

        {/* Explore */}
        <section aria-labelledby="explore-title" className="mt-12">
          <div className="juego-rise mb-5 flex items-end justify-between" style={{ '--i': 5 } as CSSProperties}>
            <div>
              <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                <span className="h-px w-6 bg-gold/60" aria-hidden="true" />
                Explorar
              </p>
              <h2 id="explore-title" className="mt-2 font-title text-2xl text-white/95">Tu próxima parada</h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {EXPLORE.map((tile, i) => {
              const locked = tile.key === 'arena' && !FEATURE_FLAGS.game;
              const content = (
                <>
                  <img
                    src={tile.image}
                    alt=""
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out',
                      !locked && 'group-hover:scale-105',
                      locked && 'grayscale-[60%]'
                    )}
                    style={{ objectPosition: tile.focus }}
                  />
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,9,0.1)_0%,rgba(11,10,9,0.65)_45%,rgba(11,10,9,0.97)_100%)]" />
                  {locked ? (
                    <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-white/75 backdrop-blur-md">
                      PRÓXIMAMENTE
                    </span>
                  ) : null}
                  <span className="relative mt-auto block">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-black/50 backdrop-blur-md">
                      <Icon name={tile.icon} size={19} color="#c9aa71" />
                    </span>
                    <span className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-title text-xl text-white">{tile.title}</span>
                      {!locked ? (
                        <Icon
                          name="arrow-forward"
                          size={18}
                          color="#c9aa71"
                          className="transition-transform group-hover:translate-x-1"
                        />
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[13px] leading-5 text-white/60">{tile.description}</span>
                  </span>
                </>
              );
              const className =
                'juego-rise group relative flex min-h-[200px] flex-col overflow-hidden rounded-3xl border border-white/[0.08] p-5 transition-colors sm:min-h-[260px]';
              const style = { '--i': 6 + i } as CSSProperties;
              return locked ? (
                <div key={tile.key} className={cn(className, 'opacity-80')} style={style}>
                  {content}
                </div>
              ) : (
                <Link key={tile.key} href={tile.href} className={cn(className, 'hover:border-gold/40')} style={style}>
                  {content}
                </Link>
              );
            })}
          </div>
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
            <button type="button" onClick={closeConvertModal} className="rounded-lg p-1 text-white/90 hover:bg-white/10" aria-label="Cerrar conversión">
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
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 bg-white/5 text-gold"
              onClick={() => setConvertAmount(String(Math.max(1, (parseInt(convertAmount, 10) || 1) - 1)))}
              aria-label="Restar una llave"
            >
              <Icon name="remove" size={20} />
            </button>
            <input
              id="convert-amount"
              className="h-11 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-4 text-center text-sm text-white/95 outline-none focus:border-gold/60"
              placeholder="1"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
            />
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 bg-white/5 text-gold"
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
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-gold text-sm font-bold tracking-[0.15em] text-ink-deep transition hover:brightness-110 disabled:opacity-60"
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
    description: 'Gasta llaves en la Habitación Terciopelo y reclama premios.',
    icon: 'sparkles',
    href: '/juego/gacha',
    image: '/juego/gacha/banners/persona_banner.jpg',
    focus: '30% center',
  },
  {
    key: 'store',
    title: 'Tienda',
    description: 'Canjea tus esferas por artículos del catálogo.',
    icon: 'storefront',
    href: '/juego/tienda',
    image: '/juego/loading_screen/manhattan.jpg',
    focus: 'center 25%',
  },
  {
    key: 'arena',
    title: 'Arena',
    description: 'Prueba a tus personajes en el modo RPG por turnos.',
    icon: 'game-controller',
    href: '/juego/jugar',
    image: '/juego/game/arena-nordica.webp',
    focus: 'center',
  },
];

/** Circular level badge with the current EXP progress as a ring. */
function LevelRing({ level, percent }: { level: number; percent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 84 84" className="absolute inset-0 -rotate-90">
        <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="url(#level-ring)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
        <defs>
          <linearGradient id="level-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9be8f2" />
            <stop offset="100%" stopColor="#3fb8c9" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-center">
        <span className="block text-[9px] font-bold tracking-[0.18em] text-white/45">NV.</span>
        <span className="block font-title text-2xl leading-none text-white">{level}</span>
      </span>
    </span>
  );
}
