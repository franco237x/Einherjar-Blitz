'use client';

/**
 * GachaPage — "Altar de Invocación"
 *
 * - Data lives in @/constants/gachaData (rewards, banners, pull logic).
 * - UI components live in @/components/juego/gacha.
 * - This page is the orchestrator: it manages state, connects banners to the
 *   pull system, and triggers the cinematic summon animation.
 */

import { useRef, useState, type CSSProperties } from 'react';
import { Icon } from '@/components/juego/Icon';
import { LobbyPageHeader } from '@/components/juego/LobbyPageHeader';
import { BannerCard } from '@/components/juego/gacha/BannerCard';
import { InventorySheet } from '@/components/juego/gacha/InventorySheet';
import { ProbabilitiesPanel } from '@/components/juego/gacha/ProbabilitiesPanel';
import { SummonAnimation } from '@/components/juego/gacha/SummonCeremony';
import { BANNERS, RARITIES, pullMultiple, type RarityKey, type RewardItem } from '@/constants/gachaData';
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

  const banner = BANNERS[activeBanner];
  const featured = banner.rewards.filter((reward) => FEATURED_RARITIES.includes(reward.rarity));

  const segment = (active: boolean) =>
    cn(
      'flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold tracking-[0.12em] transition',
      active ? 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-white/50 hover:text-white/80'
    );

  return (
    <>
      <main className="relative z-10 mx-auto w-full max-w-[1120px] px-4 pb-32 pt-8 sm:px-6 md:pb-16 md:pt-10">
        <LobbyPageHeader
          eyebrow="Cámara Einherjar"
          title="Invocaciones"
          subtitle="Usa tus llaves para invocar personas, héroes y artefactos. Todo lo que obtengas queda en tu inventario."
          action={
            <button
              type="button"
              onClick={() => setShowInventory(true)}
              className="flex min-h-11 items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 text-sm font-bold text-gold transition hover:bg-gold/20"
            >
              <Icon name="briefcase" size={17} />
              Inventario
            </button>
          }
        />

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="juego-rise flex h-[clamp(420px,120vw,560px)] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:h-[clamp(420px,50vw,560px)] [&::-webkit-scrollbar]:hidden"
          style={{ '--i': 1 } as CSSProperties}
        >
          {BANNERS.map((item) => (
            <div key={item.id} className="h-full w-full shrink-0 snap-center">
              <BannerCard banner={item} onSummon={handleSummon} disabled={summonBusy} />
            </div>
          ))}
        </div>

        {BANNERS.length > 1 && (
          <div className="mt-3 flex justify-center">
            <div className="flex gap-1.5 rounded-full bg-black/40 px-3 py-1.5">
              {BANNERS.map((item, i) => (
                <span
                  key={item.id}
                  className={cn('h-1.5 rounded-full transition-all', activeBanner === i ? 'w-5' : 'w-1.5 bg-white/30')}
                  style={activeBanner === i ? { backgroundColor: item.accentColor } : undefined}
                />
              ))}
            </div>
          </div>
        )}

        <div className="juego-rise mt-10 flex flex-wrap items-center justify-between gap-4" style={{ '--i': 2 } as CSSProperties}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">{banner.title}</p>
            <h2 className="mt-1 font-title text-2xl text-white/95">
              {showRates ? 'Probabilidades' : 'Recompensas destacadas'}
            </h2>
          </div>
          <div className="flex rounded-full border border-white/[0.08] bg-black/30 p-1" role="tablist" aria-label="Detalle del banner">
            <button type="button" role="tab" aria-selected={!showRates} className={segment(!showRates)} onClick={() => setShowRates(false)}>
              <Icon name="sparkles" size={15} />
              Destacados
            </button>
            <button type="button" role="tab" aria-selected={showRates} className={segment(showRates)} onClick={() => setShowRates(true)}>
              <Icon name="stats-chart" size={15} />
              Tasas
            </button>
          </div>
        </div>

        <section className="juego-rise mt-5" style={{ '--i': 3 } as CSSProperties}>
          {showRates ? (
            <ProbabilitiesPanel rewards={banner.rewards} />
          ) : (
            <ul className="juego-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:pb-0">
              {featured.map((reward) => (
                <FeaturedReward key={reward.name} reward={reward} />
              ))}
            </ul>
          )}
        </section>
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
    </>
  );
}

const FEATURED_RARITIES: RarityKey[] = ['mythic', 'legendary', 'epic'];

function FeaturedReward({ reward }: { reward: RewardItem }) {
  const [imageError, setImageError] = useState(false);
  const rarity = RARITIES[reward.rarity];
  return (
    <li
      className="group relative w-[150px] shrink-0 snap-start overflow-hidden rounded-2xl border bg-[#0e0d0c] transition-transform duration-300 hover:-translate-y-1 sm:w-[156px] lg:w-auto"
      style={{ borderColor: `${rarity.color}55` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {reward.image && !imageError ? (
          <img
            src={reward.image}
            alt=""
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon name={reward.fallbackIcon} size={40} color={rarity.color} />
          </div>
        )}
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent 45%, ${rarity.glowColor} 85%, #0e0d0c 100%)` }}
        />
        <span
          className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] backdrop-blur-md"
          style={{ color: rarity.color }}
        >
          {rarity.label}
        </span>
      </div>
      <div className="px-3 pb-3 pt-2">
        <p className="truncate text-sm font-bold text-white/95">{reward.name}</p>
        <div className="mt-1 flex gap-px" aria-label={`${rarity.stars} estrellas`}>
          {Array.from({ length: rarity.stars }).map((_, i) => (
            <Icon key={i} name="star" size={10} color={rarity.color} />
          ))}
        </div>
      </div>
    </li>
  );
}
