'use client';

/**
 * GachaPage — "Altar de Invocación"
 *
 * - Data lives in @/constants/gachaData (rewards, banners, pull logic).
 * - UI components live in @/components/juego/gacha.
 * - This page is the orchestrator: it manages state, connects banners to the
 *   pull system, and triggers the cinematic summon animation.
 */

import { useRef, useState } from 'react';
import { Background } from '@/components/juego/Background';
import { ParticlesBackground } from '@/components/juego/ParticlesBackground';
import { Icon } from '@/components/juego/Icon';
import { BannerCard } from '@/components/juego/gacha/BannerCard';
import { InventorySheet } from '@/components/juego/gacha/InventorySheet';
import { ProbabilitiesPanel } from '@/components/juego/gacha/ProbabilitiesPanel';
import { SummonAnimation } from '@/components/juego/gacha/SummonCeremony';
import { BANNERS, pullMultiple, type RewardItem } from '@/constants/gachaData';
import { auth } from '@/config/firebase';
import { performGachaPull } from '@/services/gacha';
import { useUserData } from '@/hooks/useUserData';
import { useDialog } from '@/providers/DialogProvider';
import { cn } from '@/lib/utils';

export default function GachaPage() {
  const dialog = useDialog();
  const { userData } = useUserData();
  const [activeBanner, setActiveBanner] = useState(0);

  // Summon state
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonBusy, setSummonBusy] = useState(false);
  const [summonResults, setSummonResults] = useState<RewardItem[]>([]);
  const summonLockRef = useRef(false);

  const [showInventory, setShowInventory] = useState(false);
  const [showRates, setShowRates] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeBanner && index >= 0 && index < BANNERS.length) {
      setActiveBanner(index);
    }
  };

  const handleSummon = async (amount: number) => {
    if (summonLockRef.current || summonBusy) return;
    const banner = BANNERS[activeBanner];
    const costKey = banner.costType;
    const totalCost = banner.costAmount * amount;

    if ((userData?.[costKey] || 0) < totalCost) {
      void dialog.alert(
        'Saldo Insuficiente',
        `No tienes suficientes ${costKey === 'keys' ? 'Llaves' : 'Esferas'} para esta invocación.`
      );
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      void dialog.alert('Error', 'Debes iniciar sesión para invocar.');
      return;
    }

    summonLockRef.current = true;
    setSummonBusy(true);
    try {
      // Pull rewards FIRST (pure RNG, no side effects).
      const results = pullMultiple(banner.rewards, amount);
      // Balance, pull ledger and every inventory item are committed together.
      // If any write fails, Firestore rolls the complete transaction back.
      await performGachaPull(uid, banner, results);

      setSummonResults(results);
      setIsSummoning(true);
    } catch (error) {
      console.error('Error during summon:', error);
      void dialog.alert('Error', 'Hubo un problema de conexión al procesar la invocación.');
    } finally {
      summonLockRef.current = false;
      setSummonBusy(false);
    }
  };

  const railTab = (active: boolean) =>
    cn(
      'flex min-h-11 flex-1 items-center justify-center gap-2 text-[11px] font-bold tracking-[0.15em] transition',
      active ? 'border-b-2 border-gold text-gold' : 'border-b-2 border-transparent text-white/50 hover:text-white/80'
    );

  return (
    <Background>
      <ParticlesBackground />

      <main className="juego-fade-in relative z-10 mx-auto w-full max-w-[1040px] px-4 pb-28 pt-4 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
          <div className="flex items-center gap-3">
            <Icon name="sparkles" size={22} color="#c9aa71" />
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-gold">CÁMARA EINHERJAR</p>
              <h1 className="font-title text-2xl text-white/95">Invocaciones</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="flex min-h-10 items-center gap-1.5 rounded-full border border-gold/20 bg-ink/90 px-3"
              aria-label={`${userData?.keys || 0} llaves`}
            >
              <Icon name="key" size={16} color="#c9aa71" />
              <span className="text-sm font-bold text-white/95">{userData?.keys || 0}</span>
            </span>
            <span
              className="flex min-h-10 items-center gap-1.5 rounded-full border border-gold/20 bg-ink/90 px-3"
              aria-label={`${userData?.spheres || 0} esferas`}
            >
              <Icon name="planet" size={16} color="#7ed9e7" />
              <span className="text-sm font-bold text-white/95">{userData?.spheres || 0}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowInventory(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 transition hover:bg-gold/20"
              aria-label="Abrir inventario"
            >
              <Icon name="briefcase-outline" size={20} color="#c9aa71" />
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/50">BANNER ACTIVO</p>
            <h2 className="font-title text-lg text-white/95">{BANNERS[activeBanner].title}</h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold tracking-[0.12em] text-emerald-400">DISPONIBLE</span>
          </span>
        </div>

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex h-[clamp(340px,102vw,520px)] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:h-[clamp(340px,56vw,520px)] [&::-webkit-scrollbar]:hidden"
        >
          {BANNERS.map((banner) => (
            <div key={banner.id} className="h-full w-full shrink-0 snap-center">
              <BannerCard banner={banner} onSummon={handleSummon} disabled={summonBusy} />
            </div>
          ))}
        </div>

        {BANNERS.length > 1 && (
          <div className="mt-3 flex justify-center">
            <div className="flex gap-1.5 rounded-full bg-black/40 px-3 py-1.5">
              {BANNERS.map((banner, i) => (
                <span
                  key={banner.id}
                  className={cn('h-1.5 rounded-full transition-all', activeBanner === i ? 'w-5' : 'w-1.5 bg-white/30')}
                  style={activeBanner === i ? { backgroundColor: banner.accentColor } : undefined}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex border-b border-white/10" role="tablist">
          <button type="button" role="tab" aria-selected={!showRates} className={railTab(!showRates)} onClick={() => setShowRates(false)}>
            <Icon name="sparkles-outline" size={18} />
            DESTACADO
          </button>
          <button type="button" role="tab" aria-selected={showRates} className={railTab(showRates)} onClick={() => setShowRates(true)}>
            <Icon name="stats-chart-outline" size={18} />
            TASAS
          </button>
          <button type="button" className={railTab(false)} onClick={() => setShowInventory(true)} aria-label="Abrir inventario">
            <Icon name="albums-outline" size={18} />
            INVENTARIO
          </button>
        </div>

        {showRates ? (
          <section className="mt-4">
            <div className="mb-3">
              <h3 className="font-title text-base text-white/95">Probabilidades del banner</h3>
              <p className="mt-0.5 text-xs text-white/50">Tasas calculadas sobre todos los objetos disponibles.</p>
            </div>
            <ProbabilitiesPanel rewards={BANNERS[activeBanner].rewards} />
          </section>
        ) : null}
      </main>

      <SummonAnimation
        visible={isSummoning}
        results={summonResults}
        onClose={() => {
          setIsSummoning(false);
          setSummonResults([]);
        }}
      />

      <InventorySheet visible={showInventory} onClose={() => setShowInventory(false)} />
    </Background>
  );
}
