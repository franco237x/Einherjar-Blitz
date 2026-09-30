'use client';

/**
 * GachaPage — "Altar de Invocación"
 *
 * - Data lives in @/constants/gachaData (rewards, banners, pull logic).
 * - UI components live in @/components/juego/gacha.
 * - This page is the orchestrator: it manages state, connects banners to the
 *   pull system, and triggers the cinematic summon animation.
 */

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, useScroll, type Variants } from 'framer-motion';
import { Icon } from '@/components/juego/Icon';
import { LobbyPageHeader } from '@/components/juego/LobbyPageHeader';
import { BannerCard } from '@/components/juego/gacha/BannerCard';
import { FeaturedRewards } from '@/components/juego/gacha/FeaturedRewards';
import { InventorySheet } from '@/components/juego/gacha/InventorySheet';
import { PAUSE_LOOPS } from '@/components/juego/gacha/fx';
import { ProbabilitiesPanel } from '@/components/juego/gacha/ProbabilitiesPanel';
import { SummonAnimation } from '@/components/juego/gacha/SummonCeremony';
import { SPRINGS } from '@/components/juego/motion';
import { BANNERS, type BannerDef, type RarityKey, type RewardItem } from '@/constants/gachaData';
import { auth } from '@/config/firebase';
import { performGachaPull } from '@/services/gacha';
import { useUserData } from '@/hooks/useUserData';
import { useDialog } from '@/providers/DialogProvider';
import { cn } from '@/lib/utils';

export default function GachaPage() {
  const dialog = useDialog();
  const { userData } = useUserData();
  const [activeBanner, setActiveBanner] = useState(0);
  // The banner the page is dressed for (spelled title, loops, Destacados/Tasas panel). It catches up
  // with activeBanner once the carousel settles, so the heavy swap never lands in the middle of a swipe.
  const [shownBanner, setShownBanner] = useState(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Summon state
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonBusy, setSummonBusy] = useState(false);
  const [summonResults, setSummonResults] = useState<RewardItem[]>([]);
  const summonLockRef = useRef(false);

  const [showInventory, setShowInventory] = useState(false);
  const [showRates, setShowRates] = useState(false);
  // +1 when the Tasas tab slides in from the right, -1 when Destacados comes back.
  const [panelDirection, setPanelDirection] = useState(1);

  const carouselRef = useRef<HTMLDivElement>(null);
  // Drives the banner parallax; read by motion values only, never during render.
  const { scrollXProgress } = useScroll({ container: carouselRef });

  const settleBanner = () => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index === shownBanner || index < 0 || index >= BANNERS.length) return;
    // A new banner crossfades the panel; only the tabs slide it sideways.
    setPanelDirection(0);
    setShownBanner(index);
  };

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeBanner && index >= 0 && index < BANNERS.length) {
      setActiveBanner(index);
    }
    // `scrollend` settles the banner once the snap is done. Browsers without it settle after a quiet
    // moment instead (only there: a janky frame mid-swipe must not count as the end of the gesture).
    if (!('onscrollend' in window)) {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(settleBanner, 160);
    }
  };

  useEffect(
    () => () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    },
    []
  );

  // Uses the banner whose button was pressed: mid-swipe, the neighbour's buttons are tappable too.
  const handleSummon = async (banner: BannerDef, amount: 1 | 10) => {
    if (summonLockRef.current || summonBusy) return;
    const costKey = banner.costType;
    const totalCost = banner.costAmount * amount;

    if ((userData?.[costKey] || 0) < totalCost) {
      void dialog.alert(
        'Saldo Insuficiente',
        `No tienes suficientes ${costKey === 'keys' ? 'Llaves' : 'Esferas'} para esta invocación.`
      );
      return;
    }

    if (!auth.currentUser) {
      void dialog.alert('Error', 'Debes iniciar sesión para invocar.');
      return;
    }

    summonLockRef.current = true;
    setSummonBusy(true);
    try {
      // The server rolls the rewards and commits balance, pull ledger and
      // inventory together; the browser only animates the result.
      const results = await performGachaPull(banner, amount);

      setSummonResults(results);
      setIsSummoning(true);
    } catch (error) {
      console.error('Error during summon:', error);
      void dialog.alert(
        'Error',
        error instanceof Error ? error.message : 'Hubo un problema de conexión al procesar la invocación.'
      );
    } finally {
      summonLockRef.current = false;
      setSummonBusy(false);
    }
  };

  // Stable handle for the (memoized) banner cards, so crossing into the next banner mid-swipe does not
  // re-render them; it always runs the latest handleSummon.
  const latestSummonRef = useRef<typeof handleSummon | null>(null);
  useLayoutEffect(() => {
    latestSummonRef.current = handleSummon;
  });
  const onSummon = useCallback((banner: BannerDef, amount: 1 | 10) => {
    void latestSummonRef.current?.(banner, amount);
  }, []);
  const closeInventory = useCallback(() => setShowInventory(false), []);
  const inventoryButton = useMemo(
    () => (
      <motion.button
        type="button"
        onClick={() => setShowInventory(true)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.93 }}
        transition={SPRINGS.snappy}
        className="flex min-h-11 items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 text-[13px] font-bold text-gold transition-colors hover:bg-gold/15 active:bg-gold/20"
      >
        <Icon name="briefcase" size={16} />
        Inventario
      </motion.button>
    ),
    []
  );

  // Nothing in the lobby is visible under the ceremony or the inventory, so its loops hold still.
  const lobbyCovered = isSummoning || showInventory;

  // Stable, so the memoized details skip the re-render when only the swipe position changes.
  // Pressing the tab that is already selected changes nothing on screen.
  const selectRates = useCallback((next: boolean) => {
    setPanelDirection(next ? 1 : -1);
    setShowRates(next);
  }, []);

  return (
    <>
      <main className={cn('relative z-10 mx-auto w-full max-w-[520px] px-4 pb-32 pt-5', lobbyCovered && PAUSE_LOOPS)}>
        <LobbyPageHeader
          eyebrow="Cámara Einherjar"
          title="Invocaciones"
          action={inventoryButton}
        />

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          onScrollEnd={settleBanner}
          className="juego-rise relative -mx-4 flex h-[clamp(440px,122vw,600px)] snap-x snap-mandatory overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ '--i': 1 } as CSSProperties}
        >
          {BANNERS.map((item, index) => (
            <div key={item.id} className="h-full w-full shrink-0 snap-center px-1">
              <BannerCard
                banner={item}
                onSummon={onSummon}
                disabled={summonBusy}
                active={index === shownBanner}
                progress={scrollXProgress}
                index={index}
                count={BANNERS.length}
                paused={lobbyCovered}
              />
            </div>
          ))}
        </div>

        {BANNERS.length > 1 && (
          <div className="mt-3 flex justify-center">
            <div className="flex gap-1 rounded-full bg-black/40 px-2.5 py-1.5">
              {BANNERS.map((item, i) => (
                <span key={item.id} className="relative flex h-1.5 w-5 items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  {activeBanner === i ? (
                    <motion.span
                      layoutId="gacha-banner-dot"
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: item.accentColor, boxShadow: `0 0 10px ${item.accentColor}` }}
                      transition={SPRINGS.snappy}
                    />
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        )}

        <BannerDetails
          banner={BANNERS[shownBanner]}
          showRates={showRates}
          panelDirection={panelDirection}
          onSelectRates={selectRates}
        />
      </main>

      <SummonAnimation
        visible={isSummoning}
        results={summonResults}
        onClose={() => {
          setIsSummoning(false);
          setSummonResults([]);
        }}
      />

      <InventorySheet visible={showInventory} onClose={closeInventory} />
    </>
  );
}

const FEATURED_RARITIES: RarityKey[] = ['mythic', 'legendary', 'epic'];

/** Destacados/Tasas for the banner the page is dressed for. */
const BannerDetails = memo(function BannerDetails({
  banner,
  showRates,
  panelDirection,
  onSelectRates,
}: {
  banner: BannerDef;
  showRates: boolean;
  panelDirection: number;
  onSelectRates: (next: boolean) => void;
}) {
  const featured = useMemo(
    () => banner.rewards.filter((reward) => FEATURED_RARITIES.includes(reward.rarity)),
    [banner]
  );
  return (
    <>
      <div className="juego-rise mt-6" style={{ '--i': 2 } as CSSProperties}>
        <div className="grid grid-cols-2 rounded-full border border-white/[0.08] bg-black/30 p-1" role="tablist" aria-label="Detalle del banner">
          <SegmentTab active={!showRates} onSelect={() => onSelectRates(false)} icon="sparkles">
            Destacados
          </SegmentTab>
          <SegmentTab active={showRates} onSelect={() => onSelectRates(true)} icon="stats-chart">
            Tasas
          </SegmentTab>
        </div>
        <div className="relative mt-5 h-7 overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout" custom={panelDirection}>
            <motion.h2
              key={showRates ? 'rates' : 'featured'}
              className="font-title text-xl text-white/95"
              custom={panelDirection}
              variants={titleSwap}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {showRates ? 'Probabilidades' : 'Recompensas destacadas'}
            </motion.h2>
          </AnimatePresence>
        </div>
      </div>

      <section className="juego-rise mt-3" style={{ '--i': 3 } as CSSProperties}>
        <AnimatePresence initial={false} mode="wait" custom={panelDirection}>
          <motion.div
            key={`${showRates ? 'rates' : 'featured'}-${banner.id}`}
            custom={panelDirection}
            variants={panelSwap}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {showRates ? <ProbabilitiesPanel rewards={banner.rewards} /> : <FeaturedRewards rewards={featured} />}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
});

/** direction: +1 / -1 slide with the tabs, 0 crossfades in place (banner change). */
const panelSwap: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 36 }),
  center: { opacity: 1, x: 0, transition: { ...SPRINGS.soft, opacity: { duration: 0.2 } } },
  exit: (direction: number) => ({ opacity: 0, x: direction * -36, transition: { duration: 0.14, ease: 'easeIn' } }),
};

const titleSwap: Variants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0, transition: SPRINGS.soft },
  exit: { opacity: 0, y: -18, transition: { duration: 0.16, ease: 'easeIn' } },
};

/** Segmented-control tab; the lit pill slides between tabs. */
function SegmentTab({
  active,
  onSelect,
  icon,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  icon: string;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      whileTap={{ scale: 0.96 }}
      transition={SPRINGS.snappy}
      className={cn(
        'relative flex min-h-11 items-center justify-center rounded-full px-4 text-xs font-bold tracking-[0.12em] transition-colors',
        active ? 'text-white' : 'text-white/50 hover:text-white/80'
      )}
    >
      {active ? (
        <motion.span
          layoutId="gacha-segment-pill"
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-gold/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.05))] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_6px_18px_-8px_rgba(201,170,113,0.45)]"
          transition={SPRINGS.snappy}
        />
      ) : null}
      <span className="relative flex items-center gap-2">
        <motion.span
          className="flex"
          animate={{ rotate: active ? 0 : -12, scale: active ? 1.1 : 1 }}
          transition={SPRINGS.bouncy}
        >
          <Icon name={icon} size={15} color={active ? '#e2c68e' : undefined} />
        </motion.span>
        {children}
      </span>
    </motion.button>
  );
}
