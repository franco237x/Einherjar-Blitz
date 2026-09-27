'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { auth } from '@/config/firebase';
import { Background } from '@/components/juego/Background';
import { GlassCard } from '@/components/juego/GlassCard';
import { ParticlesBackground } from '@/components/juego/ParticlesBackground';
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

  const operations = [
    {
      key: 'transfer',
      title: 'Transferir',
      description: 'Envía llaves a otro usuario',
      icon: 'swap-horizontal-outline',
      onClick: () => setShowTransferModal(true),
      disabled: Boolean(userDataError),
    },
    {
      key: 'convert',
      title: 'Convertir',
      description: 'Cambia llaves por esferas',
      icon: 'sync-outline',
      onClick: () => setShowConvertModal(true),
      disabled: Boolean(userDataError),
    },
    { key: 'gacha', title: 'Gacha', description: 'Usa esferas y reclama premios', icon: 'sparkles-outline', href: '/juego/gacha' },
    { key: 'store', title: 'Tienda', description: 'Compra y revisa el catálogo', icon: 'bag-handle-outline', href: '/juego/tienda' },
  ];

  const operationClass =
    'flex min-h-[112px] flex-col items-start rounded-xl border border-gold/20 bg-[#121212] p-4 text-left transition hover:border-gold/40 hover:bg-[#161616] disabled:cursor-not-allowed disabled:opacity-45';

  return (
    <Background>
      <ParticlesBackground />
      <main className="juego-fade-in relative z-10 mx-auto w-full max-w-[1040px] px-4 pb-28 pt-4 sm:px-6">
        {/* Player lobby header */}
        <div className="mb-4 flex flex-col gap-2 min-[620px]:flex-row min-[620px]:items-center min-[620px]:justify-between min-[620px]:gap-4">
          <Link
            href="/juego/perfil"
            className="flex min-h-[58px] min-w-0 flex-1 items-center gap-2 pr-1"
            aria-label={`Ver perfil de ${userData?.username || 'Guerrero'}, nivel ${userData?.nivel || 1}`}
          >
            <span className="relative h-[52px] w-[52px] shrink-0">
              {userData?.avatar ? (
                <img
                  src={userData.avatar}
                  alt=""
                  className="h-[52px] w-[52px] rounded-full border-[1.5px] border-gold object-cover"
                />
              ) : (
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-[1.5px] border-gold bg-[#17140f]">
                  <Icon name="person" size={25} color="#c9aa71" />
                </span>
              )}
              <span className="absolute -bottom-[3px] -right-[3px] flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink-deep bg-gold px-1 text-[10px] font-bold text-ink-deep">
                {userData?.nivel || 1}
              </span>
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-bold text-white/95">
                {userData?.username || 'Guerrero'}
              </span>
              <span className="block truncate text-xs font-medium text-gold">{userData?.rango || 'Iniciado'}</span>
              <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-[#67d9e7]" style={{ width: `${progressPercent}%` }} />
              </span>
            </span>
            <Icon name="chevron-forward" size={17} color="rgba(255,255,255,0.5)" />
          </Link>

          <div className="flex gap-2" aria-label="Tus recursos">
            {[
              { label: 'LLAVES', value: userData?.keys || 0, icon: 'key-outline', color: '#c9aa71' },
              { label: 'ESFERAS', value: userData?.spheres || 0, icon: 'planet-outline', color: '#7ed9e7' },
            ].map((pill) => (
              <div
                key={pill.label}
                className="flex min-h-11 min-w-[104px] flex-1 items-center gap-2 rounded-xl border border-gold/20 bg-ink/90 px-2 min-[620px]:flex-none"
              >
                <Icon name={pill.icon} size={18} color={pill.color} />
                <div>
                  <p className="text-[9px] font-bold tracking-[0.08em] text-white/50">{pill.label}</p>
                  <p className="text-base font-bold leading-[18px] text-white/95">{pill.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {userDataError ? (
          <p className="mb-6 text-center text-[13px] text-red-500" role="alert">
            No se pudieron sincronizar tus datos. Comprueba tu conexión antes de operar.
          </p>
        ) : null}

        {/* Player showcase */}
        <Link
          href="/juego/perfil"
          aria-label="Abrir perfil y trayectoria"
          className="relative mb-4 flex h-[270px] flex-col justify-between overflow-hidden rounded-2xl border border-gold/30 bg-ink-card p-4 md:h-[330px] md:p-6"
        >
          <img
            src="/juego/loading_screen/orfevre.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
          />
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.06)_0%,rgba(5,5,5,0.44)_50%,rgba(5,5,5,0.96)_100%)]" />

          <span className="relative flex items-start justify-between gap-2">
            <span>
              <span className="block text-[11px] font-bold tracking-[0.15em] text-gold">PERFIL DE GUERRERO</span>
              <span className="mt-0.5 block text-xs text-white/70">Temporada actual</span>
            </span>
            <span className="flex min-h-7 items-center gap-1.5 rounded-full border border-white/15 bg-ink-deep/70 px-2">
              <span className="h-[7px] w-[7px] rounded-full bg-emerald-500" />
              <span className="text-[9px] font-bold tracking-[0.1em] text-white/95">EN LÍNEA</span>
            </span>
          </span>

          <span className="relative block max-w-[520px]">
            <span className="block font-title text-[27px] tracking-wide text-white/95">{userData?.rango || 'Iniciado'}</span>
            <span className="mt-1 line-clamp-2 block text-sm leading-[19px] text-white/70">
              {userData?.frase || 'Forjando mi destino...'}
            </span>
            <span className="mt-4 flex min-h-[52px] items-center rounded-xl border border-white/10 bg-ink-deep/75 px-4">
              {[
                { value: userData?.copas || 0, label: 'COPAS' },
                { value: victorias, label: 'VICTORIAS' },
                { value: `${winrate}%`, label: 'WINRATE' },
              ].map((stat, i) => (
                <span key={stat.label} className="flex flex-1 items-center">
                  {i > 0 && <span className="mr-2 h-7 w-px bg-white/15" />}
                  <span>
                    <span className="block text-[17px] font-bold text-white/95">{stat.value}</span>
                    <span className="mt-px block text-[9px] font-bold tracking-[0.08em] text-gold">{stat.label}</span>
                  </span>
                </span>
              ))}
            </span>
          </span>
        </Link>

        {/* Progress */}
        <GlassCard className="mb-8" contentClassName="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-gold">PROGRESO GENERAL</p>
              <p className="font-title text-[17px] text-white/95">Nivel {userData?.nivel || 1}</p>
            </div>
            <div className="flex min-h-[42px] min-w-[58px] flex-col items-center justify-center rounded-lg border border-gold/30 bg-gold/[0.07] px-2">
              <span className="text-[8px] font-bold tracking-[0.08em] text-white/50">SIGUIENTE</span>
              <span className="text-base font-bold leading-[17px] text-gold">{(userData?.nivel || 1) + 1}</span>
            </div>
          </div>
          <div
            className="mb-2 h-[7px] overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={progressCurrent}
            aria-valuemin={0}
            aria-valuemax={1000}
            aria-label="Experiencia del nivel actual"
          >
            <div className="h-full bg-[#67d9e7]" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gold">
            <span>{progressCurrent} EXP</span>
            <span>{progressRemaining} restante</span>
          </div>
        </GlassCard>

        {/* Economy operations */}
        <div className="mb-2">
          <h2 className="font-title text-base tracking-[0.08em] text-white/95">Operaciones</h2>
          <p className="mt-0.5 text-xs text-white/50">Gestiona tu economía</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-2 md:grid-cols-4">
          {operations.map((op) => {
            const content = (
              <>
                <span className="mb-2 flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                  <Icon name={op.icon} size={23} color="#c9aa71" />
                </span>
                <span className="text-[15px] font-bold text-white/95">{op.title}</span>
                <span className="mt-0.5 text-[11px] leading-[15px] text-white/50">{op.description}</span>
              </>
            );
            return op.href ? (
              <Link key={op.key} href={op.href} className={operationClass}>
                {content}
              </Link>
            ) : (
              <button key={op.key} type="button" onClick={op.onClick} disabled={op.disabled} className={operationClass}>
                {content}
              </button>
            );
          })}
        </div>

        <h2 className="font-title text-base tracking-[0.08em] text-white/95">Modo de juego</h2>
        {FEATURE_FLAGS.game ? (
          <Link
            href="/juego/jugar"
            className="mt-2 flex min-h-[76px] items-center gap-4 rounded-xl border border-white/10 bg-[#111111] p-4 transition hover:border-gold/30"
            aria-label="Abrir arena de combate"
          >
            <ArenaStripContent />
          </Link>
        ) : (
          <div className="mt-2 flex min-h-[76px] items-center gap-4 rounded-xl border border-white/10 bg-[#111111] p-4 opacity-60">
            <ArenaStripContent comingSoon />
          </div>
        )}
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
    </Background>
  );
}

function ArenaStripContent({ comingSoon }: { comingSoon?: boolean }) {
  return (
    <>
      <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/[0.08]">
        <Icon name="game-controller-outline" size={25} color="#c9aa71" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-white/95">Arena de combate</span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-4 text-white/50">
          {comingSoon ? 'Próximamente: prueba tus personajes en el modo RPG' : 'Prueba tus personajes en el modo RPG'}
        </span>
      </span>
      {!comingSoon && <Icon name="chevron-forward" size={21} color="rgba(255,255,255,0.5)" />}
    </>
  );
}
