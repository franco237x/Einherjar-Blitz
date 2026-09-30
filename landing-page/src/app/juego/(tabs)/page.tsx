'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { auth } from '@/config/firebase';
import { Icon } from '@/components/juego/Icon';
import { Modal } from '@/components/juego/Modal';
import { TransferModal } from '@/components/juego/TransferModal';
import { ConvertPanel, type ConvertSuccess } from '@/components/juego/dashboard/ConvertPanel';
import { EventCard } from '@/components/juego/dashboard/EventCard';
import { ArenaStrip, ExploreTile, type ExploreTileData } from '@/components/juego/dashboard/ExploreTiles';
import { EyebrowContent, Greeting } from '@/components/juego/dashboard/Greeting';
import { WalletPanel } from '@/components/juego/dashboard/WalletPanel';
import { WarriorCard } from '@/components/juego/dashboard/WarriorCard';
import { SPRINGS } from '@/components/juego/motion';
import { useUserData } from '@/hooks/useUserData';
import { convertKeysToSpheres } from '@/services/economy';
import { FEATURE_FLAGS } from '@/config/featureFlags';

/** Entrance choreography (seconds from mount): greeting, hero, wallet, then the rest as it scrolls in. */
const CUE = { hero: 0.12, wallet: 0.26, event: 0.34, explore: 0.1, arena: 0.24 };

export default function DashboardPage() {
  const { userData, error: userDataError } = useUserData();

  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Convert states
  const [convertAmount, setConvertAmount] = useState('1');
  const [convertBusy, setConvertBusy] = useState(false);
  const [convertMsg, setConvertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Drives the success celebration only; the message above stays the source of truth.
  const [convertFx, setConvertFx] = useState<ConvertSuccess | null>(null);

  const victorias = userData?.victorias || 0;
  const derrotas = userData?.derrotas || 0;
  const totalBattles = victorias + derrotas;
  const winrate = totalBattles > 0 ? Math.round((victorias / totalBattles) * 100) : 0;

  const exp = userData?.experiencia || 0;
  const progressCurrent = exp % 1000;
  const progressPercent = (progressCurrent / 1000) * 100;
  const progressRemaining = 1000 - progressCurrent;

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
      setConvertFx((previous) => ({ id: (previous?.id ?? 0) + 1, spheres: amount * 50 }));
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
        <Greeting username={username} />

        {userDataError ? (
          <motion.p
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-[13px] text-red-300"
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRINGS.soft}
          >
            <Icon name="cloud-offline" size={16} className="shrink-0" />
            No se pudieron sincronizar tus datos. Comprueba tu conexión antes de operar.
          </motion.p>
        ) : null}

        <WarriorCard
          delay={CUE.hero}
          username={username}
          nivel={nivel}
          rango={rango}
          frase={userData?.frase || 'Forjando mi destino...'}
          avatar={userData?.avatar}
          progressCurrent={progressCurrent}
          progressPercent={progressPercent}
          progressRemaining={progressRemaining}
          copas={userData?.copas || 0}
          victorias={victorias}
          winrate={winrate}
        />

        <WalletPanel
          delay={CUE.wallet}
          keys={keys}
          spheres={spheres}
          ready={Boolean(userData)}
          disabled={walletDisabled}
          onTransfer={() => setShowTransferModal(true)}
          onConvert={() => setShowConvertModal(true)}
        />

        <EventCard delay={CUE.event} />

        {/* Explore */}
        <section aria-labelledby="explore-title" className="mt-7">
          <h2
            id="explore-title"
            className="mb-3 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-gold"
          >
            <EyebrowContent text="Explorar" delay={CUE.explore} inView />
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {EXPLORE.map((tile, index) => (
              <ExploreTile key={tile.key} tile={tile} index={index} delay={CUE.explore + 0.06} />
            ))}
          </div>

          <ArenaStrip delay={CUE.arena} comingSoon={!FEATURE_FLAGS.game} />
        </section>
      </main>

      <TransferModal
        visible={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        myKeys={userData?.keys || 0}
      />

      {/* Convert Keys to Spheres Modal */}
      <Modal visible={showConvertModal} onClose={closeConvertModal} label="Convertir llaves" locked={convertBusy}>
        <ConvertPanel
          amount={convertAmount}
          onAmountChange={setConvertAmount}
          keys={userData?.keys || 0}
          spheres={userData?.spheres || 0}
          busy={convertBusy}
          message={convertMsg}
          success={convertMsg?.type === 'success' ? convertFx : null}
          onSubmit={handleConvert}
          onClose={closeConvertModal}
        />
      </Modal>
    </>
  );
}

const EXPLORE: ExploreTileData[] = [
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
