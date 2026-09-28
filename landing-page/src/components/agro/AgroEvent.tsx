'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleHelp,
  Coins,
  Download,
  Droplets,
  Ellipsis,
  Flower2,
  Gift,
  Plus,
  Sparkles,
  Sprout,
  Ticket,
  Trash2,
} from 'lucide-react';
import { ALBUM_FAMILIES, type AlbumFamilyId } from '@/lib/agroAlbum';
import {
  BASE_ODDS,
  DAILY_ACTION_LIMIT,
  DAILY_COIN_LIMIT,
  PITY_LIMITS,
  PLANTS,
  RARITIES,
  TEN_DRAW_COST,
  WATERINGS_TO_GROW,
  canFuse,
  cultivatedCount,
  dailyUsage,
  eventDay,
  formatDuration,
  fusionPartner,
  getPlant,
  isMature,
  nextCoinIn,
  readyCoins,
  type AgroVoucher,
  type FarmAction,
  type FarmPlot,
  type FarmState,
} from '@/lib/agroGame';
import { AgroConnection, useAgro } from './AgroProvider';
import { AgroDialog } from './AgroDialog';

const number = (value: number) => value.toLocaleString('es-AR');

/** Color per rarity tier: común, rara, épica, legendaria, mítica. */
const TIER_COLORS = ['#b7c4b0', '#7cc4f0', '#c49bf5', '#f0cf73', '#ff8a7a'];

type Tab = 'huerto' | 'altar' | 'semillas' | 'canje';
type FxKind = 'coins' | 'water' | 'grow' | 'plant' | 'wait';
interface Fx {
  id: number;
  plot: number;
  kind: FxKind;
  text: string;
  /** Random offsets for the coin burst, fixed when the effect is created. */
  spread: [number, number][];
}

/** Short vibration on phones that support it; silently ignored elsewhere. */
function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Some browsers block vibration without a user gesture.
  }
}

/** Eases a number towards its new value so balance changes feel earned. */
function useCountUp(target: number) {
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    if (from === target) return;
    const start = performance.now();
    let frame = 0;
    const step = (time: number) => {
      const progress = Math.min(1, (time - start) / 700);
      const value = Math.round(from + (target - from) * (1 - (1 - progress) ** 3));
      current.current = value;
      setShown(value);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return shown;
}

function PlantArt({
  id,
  className = '',
  priority = false,
}: {
  id: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={getPlant(id).image}
      alt=""
      width={700}
      height={700}
      sizes={priority ? '(max-width: 640px) 80vw, 420px' : '(max-width: 640px) 45vw, 220px'}
      priority={priority}
      className={className}
    />
  );
}

const maxBonus = (plot: FarmPlot) => (getPlant(plot.plantId).family === 'brasas' ? 6 : 3);
const plantScale = (plot: FarmPlot) =>
  isMature(plot) ? 1 : [0.5, 0.66, 0.82][Math.min(plot.waterings, 2)];

function FxLayer({ items }: { items: Fx[] }) {
  return (
    <>
      {items.map((item) => (
        <span key={item.id} className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
          {item.kind === 'coins' &&
            item.spread.map(([dx, dy], i) => (
              <span
                key={i}
                className="hg-coin"
                style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${i * 40}ms` } as CSSProperties}
              />
            ))}
          {item.kind === 'water' &&
            [-18, 0, 18].map((dx, i) => (
              <span key={i} className="hg-drop" style={{ '--dx': `${dx}px`, animationDelay: `${i * 90}ms` } as CSSProperties} />
            ))}
          {item.kind === 'grow' && <span className="hg-burst" />}
          <span className={`hg-float hg-float-${item.kind}`}>{item.text}</span>
        </span>
      ))}
    </>
  );
}

function PlotTile({
  plot,
  index,
  farm,
  now,
  coinsLeft,
  seedId,
  fx,
  onTap,
  onMore,
  disabled,
}: {
  plot: FarmPlot | null;
  index: number;
  farm: FarmState;
  now: number;
  coinsLeft: number;
  seedId: string | undefined;
  fx: Fx[];
  onTap: () => void;
  onMore: () => void;
  disabled: boolean;
}) {
  if (!plot) {
    const seed = seedId ? getPlant(seedId) : null;
    return (
      <div className="relative aspect-[5/6]">
        <button
          type="button"
          onClick={onTap}
          disabled={disabled}
          aria-label={seed ? `Plantar ${seed.name} en parcela ${index + 1}` : `Parcela ${index + 1} vacía, elegir semilla`}
          className="hg-tap flex h-full w-full flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#d8bb7d]/30 bg-[radial-gradient(ellipse_at_50%_80%,rgba(92,74,40,0.35),transparent_65%),linear-gradient(180deg,#0e1c15,#0a140f)] p-3 text-center disabled:opacity-60"
        >
          <span className="relative flex h-16 w-16 items-center justify-center">
            {seed ? (
              <PlantArt id={seed.id} className="h-16 w-16 object-contain opacity-35 grayscale-[30%]" />
            ) : null}
            <span className="absolute flex h-9 w-9 items-center justify-center rounded-full border border-[#d8bb7d]/50 bg-[#07110d]/80 text-[#d8bb7d]">
              <Plus size={18} />
            </span>
          </span>
          <span className="text-[13px] font-bold text-[#f0eadb]">{seed ? 'Toca para plantar' : 'Sin semillas'}</span>
          <span className="line-clamp-1 text-[11px] text-[#9bac9c]">{seed ? seed.name : 'Invoca en el Altar'}</span>
        </button>
        <FxLayer items={fx} />
      </div>
    );
  }

  const plant = getPlant(plot.plantId);
  const tierColor = TIER_COLORS[plant.tier];
  const mature = isMature(plot);
  const ready = readyCoins(plot, now);
  const wait = Math.max(0, plot.nextWaterAt - now);
  const harvestable = mature && ready > 0 && coinsLeft > 0;
  const fusion = canFuse(farm, index);
  const cycleProgress = mature ? 1 - nextCoinIn(plot, now) / plant.cycleMs : 0;

  let status: ReactNode;
  if (harvestable) status = <span className="text-[#f4d493]">Toca para cosechar</span>;
  else if (!mature)
    status = (
      <span className="flex items-center gap-1.5">
        <span className="flex gap-0.5" aria-hidden="true">
          {Array.from({ length: WATERINGS_TO_GROW }).map((_, i) => (
            <Droplets key={i} size={12} className={i < plot.waterings ? 'text-[#7cc4f0]' : 'text-white/20'} />
          ))}
        </span>
        <span className={wait ? 'tabular-nums text-[#9bac9c]' : 'text-[#9fd6f5]'}>{wait ? formatDuration(wait) : 'Regar'}</span>
      </span>
    );
  else
    status = (
      <span className="tabular-nums text-[#9bac9c]">
        +{plant.yield} en {formatDuration(nextCoinIn(plot, now))}
      </span>
    );

  return (
    <div className="relative aspect-[5/6]" style={{ '--plant-color': plant.color, '--tier': tierColor } as CSSProperties}>
      <button
        type="button"
        onClick={onTap}
        disabled={disabled}
        aria-label={`Parcela ${index + 1}: ${plant.name}. ${harvestable ? `${ready} monedas listas` : mature ? 'Madura' : `${plot.waterings} de 3 riegos`}`}
        className={`hg-tap relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border bg-[radial-gradient(ellipse_at_50%_78%,color-mix(in_srgb,var(--plant-color)_22%,transparent),transparent_62%),linear-gradient(180deg,#112219,#0a140f)] text-left disabled:opacity-70 ${
          harvestable ? 'hg-ready border-[#f0cf73]/80' : 'border-white/[0.09]'
        }`}
      >
        <span className="absolute inset-x-0 bottom-[3.2rem] mx-auto h-5 w-[72%] rounded-[50%] bg-[#3a2c18]/70 blur-[2px]" aria-hidden="true" />
        <span className="relative flex flex-1 items-end justify-center px-2 pt-7">
          <span
            className="block transition-transform duration-700 ease-[cubic-bezier(.34,1.56,.64,1)]"
            style={{ transform: `scale(${plantScale(plot)})`, transformOrigin: '50% 100%' }}
          >
            <PlantArt
              key={plot.waterings}
              id={plant.id}
              className={`h-[clamp(88px,27vw,140px)] w-auto object-contain drop-shadow-[0_10px_16px_rgba(0,0,0,0.55)] ${mature ? 'hg-sway' : 'hg-pop'}`}
            />
          </span>
        </span>
        <span className="relative z-10 block bg-gradient-to-t from-[#07110d] via-[#07110d]/90 to-transparent px-3 pb-2.5 pt-3">
          <span className="block truncate text-[13px] font-bold text-[#f0eadb]">{plant.name}</span>
          <span className="mt-0.5 flex items-center justify-between gap-1 text-[11px]">
            {status}
            {plot.bonusCycles > 0 ? (
              <span className="rounded-full bg-[#d9986e]/20 px-1.5 text-[10px] font-bold text-[#f2b48c]">+{plot.bonusCycles}</span>
            ) : null}
          </span>
          {mature && !harvestable ? (
            <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-[#d8bb7d]" style={{ width: `${cycleProgress * 100}%` }} />
            </span>
          ) : null}
        </span>
      </button>

      <span
        className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] backdrop-blur"
        style={{ color: tierColor }}
      >
        {plant.rarity}
      </span>
      {harvestable ? (
        <span className="hg-bounce pointer-events-none absolute left-1/2 top-8 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[linear-gradient(135deg,#ffe7a3,#d8a84a)] px-2.5 py-1 text-xs font-extrabold text-[#2a1d05] shadow-[0_6px_18px_rgba(240,207,115,0.45)]">
          <Coins size={13} /> {number(Math.min(ready, coinsLeft))}
        </span>
      ) : fusion ? (
        <span className="pointer-events-none absolute left-1/2 top-8 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#c49bf5]/50 bg-[#2a1d3d]/85 px-2 py-0.5 text-[10px] font-bold text-[#e2cdfc]">
          <Sparkles size={11} /> Fusión lista
        </span>
      ) : null}
      <button
        type="button"
        onClick={onMore}
        aria-label={`Opciones de ${plant.name} en parcela ${index + 1}`}
        className="absolute right-1.5 top-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/70 active:bg-white/10"
      >
        <Ellipsis size={18} />
      </button>
      <FxLayer items={fx} />
    </div>
  );
}

function PlotSheet({
  index,
  plot,
  farm,
  now,
  coinsLeft,
  locked,
  onWater,
  onHarvest,
  onFuse,
  onUproot,
}: {
  index: number;
  plot: FarmPlot;
  farm: FarmState;
  now: number;
  coinsLeft: number;
  locked: boolean;
  onWater: () => void;
  onHarvest: () => void;
  onFuse: (partnerIndex: number) => void;
  onUproot: () => void;
}) {
  const plant = getPlant(plot.plantId);
  const mature = isMature(plot);
  const ready = readyCoins(plot, now);
  const wait = Math.max(0, plot.nextWaterAt - now);
  const partnerIndex = fusionPartner(farm, index);
  const fusionReady = ready + (partnerIndex >= 0 ? readyCoins(farm.plots[partnerIndex]!, now) : 0);
  const bonusFull = plot.bonusCycles >= maxBonus(plot);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <PlantArt id={plant.id} className="h-24 w-24 shrink-0 object-contain" />
        <div className="min-w-0 text-[12.5px] leading-5 text-[#bfccbb]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: TIER_COLORS[plant.tier] }}>
            {plant.rarity} · Parcela {index + 1}
          </p>
          <p>
            {mature
              ? `+${plant.yield} cada ${plant.cycleMs / 1000} s · reserva ${plant.reserve} ciclos`
              : `Crecimiento · ${plot.waterings}/3 riegos`}
          </p>
          <p className="italic text-[#9bac9c]">{plant.lore}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="agro-draw-ten" disabled={locked || wait > 0 || bonusFull} onClick={onWater}>
          <Droplets size={15} />
          {wait ? formatDuration(wait) : bonusFull ? 'Bono lleno' : mature ? 'Regar + bono' : 'Regar'}
        </button>
        <button type="button" className="agro-draw-main" disabled={locked || coinsLeft < 1 || ready < 1} onClick={onHarvest}>
          <Coins size={15} /> Cosechar {ready ? number(Math.min(ready, coinsLeft)) : ''}
        </button>
        <button
          type="button"
          className="agro-draw-ten"
          disabled={locked || !canFuse(farm, index) || fusionReady > coinsLeft}
          onClick={() => onFuse(partnerIndex)}
        >
          <Sparkles size={15} /> {plant.tier === 4 ? 'Crear sello' : 'Fusionar 2'}
        </button>
        <button type="button" className="agro-draw-ten" disabled={locked || ready > coinsLeft} onClick={onUproot}>
          <Trash2 size={15} /> Retirar
        </button>
      </div>
      {!canFuse(farm, index) && mature ? (
        <p className="text-[11.5px] text-[#9bac9c]">Para fusionar necesitas otra {plant.name} madura en el huerto.</p>
      ) : null}
    </div>
  );
}

function FamilyChips({
  family,
  onChange,
}: {
  family: AlbumFamilyId;
  onChange: (id: AlbumFamilyId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Linaje">
      {ALBUM_FAMILIES.map((item) => {
        const active = family === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.id)}
            className="hg-tap flex min-h-[58px] flex-col items-start justify-center rounded-2xl border px-3 text-left transition-colors"
            style={{
              borderColor: active ? item.accent : 'rgba(255,255,255,0.08)',
              background: active ? `color-mix(in srgb, ${item.accent} 16%, #0d1a13)` : 'rgba(255,255,255,0.02)',
            }}
          >
            <strong className="text-[12px] font-bold leading-tight" style={{ color: active ? item.accent : '#f0eadb' }}>
              {item.name.replace(/^(Ciclo del|Valle de|Huerta de) /, '')}
            </strong>
            <small className="mt-0.5 text-[10px] leading-tight text-[#9bac9c]">{item.trait}</small>
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#d8bb7d]">{eyebrow}</p>
        <h2 className="mt-1 font-title text-[22px] leading-tight text-[#f0eadb]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function AgroEvent() {
  const { farm, now, local, busy, error, notice, act, refresh } = useAgro();
  const [tab, setTab] = useState<Tab>('huerto');
  const [family, setFamily] = useState<AlbumFamilyId>('alba');
  const [selected, setSelected] = useState('brote-bruma');
  const [reveal, setReveal] = useState<{ ids: string[]; fresh: string[]; fusion: boolean } | null>(null);
  const [confirmation, setConfirmation] = useState<FarmAction | null>(null);
  const [voucher, setVoucher] = useState<AgroVoucher | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [sheet, setSheet] = useState<number | null>(null);
  const [guide, setGuide] = useState(false);
  const [hint, setHint] = useState('');
  const [fx, setFx] = useState<Fx[]>([]);
  const fxId = useRef(0);
  const coinsShown = useCountUp(farm?.coins ?? 0);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(''), 3500);
    return () => window.clearTimeout(timer);
  }, [hint]);

  if (!farm) return <AgroConnection />;

  const usage = dailyUsage(farm, now);
  const coinsLeft = Math.max(0, DAILY_COIN_LIMIT - usage.earned);
  const actionsFull = usage.actions >= DAILY_ACTION_LIMIT;
  const voucherLeft = Math.max(0, DAILY_COIN_LIMIT - usage.redeemed);
  const voucherAmount = Math.min(farm.coins, voucherLeft);
  const count = cultivatedCount(farm);
  const readyTotal = farm.plots.reduce((sum, plot) => sum + (plot ? readyCoins(plot, now) : 0), 0);
  const freeReady = now >= farm.nextFreeDrawAt;
  const giftReady = farm.lastDailyGift !== eventDay(now);
  const familyInfo = ALBUM_FAMILIES.find((item) => item.id === family)!;
  const familyPlants = PLANTS.filter((plant) => plant.family === family);
  const totalSeeds = PLANTS.reduce((sum, plant) => sum + farm.seeds[plant.id], 0);
  // Plant the chosen seed, or fall back to any seed left so an empty plot is always one tap.
  const seedId =
    farm.seeds[selected] > 0 ? selected : [...PLANTS].reverse().find((plant) => farm.seeds[plant.id] > 0)?.id;
  const firstSteps = farm.totalHarvested === 0 && farm.plots.every((plot) => !plot || !isMature(plot));
  const sheetPlot = sheet !== null ? farm.plots[sheet] : null;

  const confirmPlant =
    confirmation && 'index' in confirmation && farm.plots[confirmation.index]
      ? getPlant(farm.plots[confirmation.index]!.plantId)
      : null;
  const fusedPlant =
    confirmPlant && confirmPlant.tier < 4
      ? PLANTS.find((plant) => plant.family === confirmPlant.family && plant.tier === confirmPlant.tier + 1)
      : null;

  const spawn = (plot: number, kind: FxKind, text: string) => {
    const id = ++fxId.current;
    const spread = Array.from({ length: kind === 'coins' ? 7 : 0 }, (): [number, number] => [
      (Math.random() - 0.5) * 110,
      -40 - Math.random() * 70,
    ]);
    setFx((items) => [...items, { id, plot, kind, text, spread }]);
    window.setTimeout(() => setFx((items) => items.filter((item) => item.id !== id)), 1400);
  };

  const chooseFamily = (id: AlbumFamilyId) => {
    setFamily(id);
    const owned = PLANTS.find((plant) => plant.family === id && farm.seeds[plant.id] > 0);
    if (owned) setSelected(owned.id);
  };

  const plantAt = async (index: number) => {
    if (!seedId) return;
    const name = getPlant(seedId).name;
    if (await act({ type: 'plant', index, plantId: seedId })) {
      spawn(index, 'plant', '¡Plantada!');
      buzz(12);
      setHint(`${name} plantada. Tócala para regarla.`);
    }
  };

  const waterAt = async (index: number) => {
    const plot = farm.plots[index];
    if (!plot) return;
    const wasMature = isMature(plot);
    const next = plot.waterings + 1;
    if (await act({ type: 'water', index })) {
      if (!wasMature && next >= WATERINGS_TO_GROW) {
        spawn(index, 'grow', '¡Madura!');
        buzz([15, 40, 25]);
      } else {
        spawn(index, 'water', wasMature ? '+ bono' : `${next}/${WATERINGS_TO_GROW}`);
        buzz(10);
      }
    }
  };

  const harvestAt = async (index: number) => {
    const plot = farm.plots[index];
    if (!plot) return;
    const amount = Math.min(readyCoins(plot, now), coinsLeft);
    if (await act({ type: 'harvest', index })) {
      spawn(index, 'coins', `+${number(amount)}`);
      buzz(18);
    }
  };

  const harvestAll = async () => {
    let left = coinsLeft;
    const parts: [number, number][] = [];
    farm.plots.forEach((plot, i) => {
      if (!plot) return;
      const amount = Math.min(readyCoins(plot, now), left);
      left -= amount;
      if (amount > 0) parts.push([i, amount]);
    });
    if (await act({ type: 'harvestAll' })) {
      parts.forEach(([i, amount], order) => window.setTimeout(() => spawn(i, 'coins', `+${number(amount)}`), order * 120));
      buzz([12, 50, 12, 50, 20]);
    }
  };

  /** One tap does the obvious thing; anything else opens the plot sheet. */
  const tapPlot = (index: number) => {
    const plot = farm.plots[index];
    if (!plot) {
      if (seedId && !actionsFull) void plantAt(index);
      else if (!seedId) {
        setTab('altar');
        setHint('No te quedan semillas. Invoca nuevas en el Altar.');
      }
      return;
    }
    const mature = isMature(plot);
    const ready = readyCoins(plot, now);
    const canWater = plot.nextWaterAt <= now && plot.bonusCycles < maxBonus(plot);
    if (actionsFull) return setSheet(index);
    if (mature && ready > 0 && coinsLeft > 0) return void harvestAt(index);
    if (canWater) return void waterAt(index);
    // Nothing to do yet: say when, right on the plant.
    const plant = getPlant(plot.plantId);
    if (!mature) spawn(index, 'wait', `Riego en ${formatDuration(plot.nextWaterAt - now)}`);
    else if (coinsLeft < 1) setHint('Llegaste al cupo de hoy. La cosecha queda guardada en la planta.');
    else spawn(index, 'wait', `+${plant.yield} en ${formatDuration(nextCoinIn(plot, now))}`);
    buzz(6);
  };

  const draw = async (amount: 1 | 10) => {
    const known = new Set(PLANTS.filter((plant) => farm.album[plant.id]?.discovered).map((plant) => plant.id));
    const outcome = await act({ type: 'draw', count: amount, family });
    if (outcome?.results) {
      const best = [...outcome.results].sort((a, b) => getPlant(b).tier - getPlant(a).tier)[0];
      setReveal({
        ids: outcome.results,
        fresh: [...new Set(outcome.results.filter((id) => !known.has(id)))],
        fusion: false,
      });
      setSelected(best);
      buzz([20, 60, 30]);
    }
  };

  const confirm = async () => {
    if (!confirmation) return;
    const known = new Set(PLANTS.filter((plant) => farm.album[plant.id]?.discovered).map((plant) => plant.id));
    const outcome = await act(confirmation);
    if (outcome) {
      setConfirmation(null);
      if (outcome.results) {
        setReveal({ ids: outcome.results, fresh: outcome.results.filter((id) => !known.has(id)), fusion: true });
        buzz([20, 60, 30]);
      }
      if (outcome.voucher) setVoucher(outcome.voucher);
    }
  };

  const toast = error || hint || notice;
  const dock: { id: Tab; label: string; icon: ReactNode; dot: boolean }[] = [
    { id: 'huerto', label: 'Huerto', icon: <Sprout size={21} />, dot: readyTotal > 0 && coinsLeft > 0 },
    { id: 'altar', label: 'Altar', icon: <Sparkles size={21} />, dot: freeReady || giftReady },
    { id: 'semillas', label: 'Semillas', icon: <Flower2 size={21} />, dot: false },
    { id: 'canje', label: 'Canje', icon: <Ticket size={21} />, dot: voucherAmount > 0 },
  ];

  return (
    <div className="agro-page hg-page">
      <div className="agro-page-glow" />

      {/* HUD */}
      <header className="sticky top-0 z-30 border-b border-[#d8bb7d]/15 bg-[#07110d]/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[520px] items-center gap-2 px-3">
          <Link href="/juego" aria-label="Volver al juego" className="flex h-10 w-10 items-center justify-center rounded-full text-[#c0c9ba] active:bg-white/10">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#d8bb7d]">Evento</p>
            <h1 className="truncate font-title text-[15px] leading-tight text-[#f0eadb]">El Huerto de Yggdrasil</h1>
          </div>
          <Link href="/evento/agro/album" aria-label={`Herbario, ${count} de 15`} className="flex h-10 w-10 items-center justify-center rounded-full text-[#d8bb7d] active:bg-white/10">
            <BookOpen size={19} />
          </Link>
          <button type="button" onClick={() => setGuide(true)} aria-label="Cómo jugar" className="flex h-10 w-10 items-center justify-center rounded-full text-[#d8bb7d] active:bg-white/10">
            <CircleHelp size={20} />
          </button>
        </div>
        <div className="mx-auto grid max-w-[520px] grid-cols-3 gap-2 px-3 pb-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-[#f0cf73]/25 bg-[#f0cf73]/[0.07] px-2.5 py-1.5">
            <span key={farm.coins} className="hg-pop text-[#f0cf73]">
              <Coins size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-extrabold leading-none tabular-nums text-[#fff3d1]">{number(coinsShown)}</span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-[#9bac9c]">Monedas</span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5">
            <span key={farm.pollen} className="hg-pop text-[#e8d77a]">
              <Sparkles size={16} />
            </span>
            <span>
              <span className="block text-[15px] font-extrabold leading-none tabular-nums text-[#f0eadb]">{number(farm.pollen)}</span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-[#9bac9c]">Polen</span>
            </span>
          </div>
          <Link href="/evento/agro/album" className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 active:bg-white/[0.06]">
            <Flower2 size={16} className="text-[#9ecfd4]" />
            <span>
              <span className="block text-[15px] font-extrabold leading-none tabular-nums text-[#f0eadb]">{count}/15</span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-[#9bac9c]">Especies</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Toast */}
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+7.75rem)] z-40 flex justify-center px-4">
        {toast ? (
          <div
            key={toast}
            role={error ? 'alert' : 'status'}
            aria-live="polite"
            className={`hg-toast pointer-events-auto flex max-w-[480px] items-center gap-3 rounded-2xl border px-4 py-2.5 text-[13px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl ${
              error ? 'border-[#d69981]/60 bg-[#38231f]/95 text-[#ffddd0]' : 'border-[#d8bb7d]/40 bg-[#162a1d]/95 text-[#f0eadb]'
            }`}
          >
            <span>{toast}</span>
            {error ? (
              <button type="button" className="shrink-0 font-bold underline" onClick={() => void refresh()}>
                Actualizar
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[520px] px-3 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-4">
        {local ? (
          <p className="mb-3 rounded-xl border border-[#a68550]/60 bg-[#392c16]/40 px-3 py-2 text-[11px] text-[#e2c48e]">
            Vista local · los vales de esta versión son de demostración.
          </p>
        ) : null}

        {tab === 'huerto' && (
          <section aria-labelledby="huerto-title" className="hg-panel">
            {firstSteps ? (
              <div className="mb-3 rounded-2xl border border-[#d8bb7d]/30 bg-[linear-gradient(135deg,rgba(216,187,125,0.12),rgba(216,187,125,0.02))] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d8bb7d]">Primeros pasos</p>
                <ol className="mt-2 space-y-1 text-[12.5px] leading-5 text-[#dfe6d8]">
                  <li>1 · Toca una parcela vacía para plantar.</li>
                  <li>2 · Tócala 3 veces para regarla (cada 8 s).</li>
                  <li>3 · Madura sola: vuelve y toca para cosechar monedas.</li>
                </ol>
              </div>
            ) : null}

            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="huerto-title" className="font-title text-[22px] text-[#f0eadb]">Mi huerto</h2>
              <button
                type="button"
                onClick={() => setTab('semillas')}
                className="hg-tap flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1.5 pr-3 text-[12px] text-[#dfe6d8]"
              >
                {seedId ? (
                  <>
                    <PlantArt id={seedId} className="h-7 w-7 object-contain" />
                    <span className="max-w-[120px] truncate">{getPlant(seedId).name}</span>
                    <b className="text-[#d8bb7d]">×{farm.seeds[seedId]}</b>
                  </>
                ) : (
                  <span className="pl-1.5">Sin semillas</span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => void harvestAll()}
              disabled={busy || actionsFull || coinsLeft < 1 || readyTotal < 1}
              className={`hg-tap relative mb-2 flex min-h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[15px] font-extrabold transition disabled:opacity-100 ${
                readyTotal > 0 && coinsLeft > 0
                  ? 'hg-glow bg-[linear-gradient(135deg,#ffe7a3,#d8a84a_60%,#b98a34)] text-[#2a1d05]'
                  : 'border border-white/[0.08] bg-white/[0.03] text-[#9bac9c]'
              }`}
            >
              <Coins size={19} />
              {readyTotal > 0 && coinsLeft > 0 ? `Cosechar todo · ${number(Math.min(readyTotal, coinsLeft))}` : 'Nada para cosechar aún'}
            </button>
            <div className="mb-4 px-1">
              <div className="flex justify-between text-[10.5px] text-[#9bac9c]">
                <span>Cosechado hoy</span>
                <span className="tabular-nums">
                  {number(usage.earned)} / {number(DAILY_COIN_LIMIT)}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#d8bb7d]" style={{ width: `${(usage.earned / DAILY_COIN_LIMIT) * 100}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5" id="parcelas">
              {farm.plots.map((plot, index) => (
                <PlotTile
                  key={index}
                  plot={plot}
                  index={index}
                  farm={farm}
                  now={now}
                  coinsLeft={coinsLeft}
                  seedId={seedId}
                  fx={fx.filter((item) => item.plot === index)}
                  onTap={() => tapPlot(index)}
                  onMore={() => setSheet(index)}
                  disabled={busy}
                />
              ))}
            </div>

            <Link
              href="/evento/agro/album"
              className="hg-tap mt-4 flex items-center gap-3 rounded-2xl border border-[#d8bb7d]/25 bg-white/[0.02] p-3.5 text-[#d8bb7d]"
            >
              <BookOpen size={22} />
              <span className="min-w-0 flex-1">
                <strong className="block text-[14px] text-[#f0eadb]">Tu herbario · {count}/15</strong>
                <small className="text-[11.5px] text-[#9bac9c]">Recompensas al cultivar 3, 6, 9, 12 y 15 especies</small>
              </span>
              <ArrowRight size={18} />
            </Link>
          </section>
        )}

        {tab === 'altar' && (
          <section aria-labelledby="altar-title" className="hg-panel space-y-4">
            <SectionTitle eyebrow="Altar de semillas" title="Invoca un brote" />
            <FamilyChips family={family} onChange={chooseFamily} />

            <div
              className="relative overflow-hidden rounded-3xl border p-4 text-center"
              style={{
                borderColor: `color-mix(in srgb, ${familyInfo.accent} 45%, transparent)`,
                background: `radial-gradient(circle at 50% 38%, color-mix(in srgb, ${familyInfo.accent} 22%, transparent), transparent 62%), #0b1711`,
              }}
            >
              <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
                <span className="hg-spin-slow absolute inset-0 rounded-full border border-dashed" style={{ borderColor: `${familyInfo.accent}80` }} />
                <span className="hg-spin-rev absolute inset-5 rounded-full border" style={{ borderColor: `${familyInfo.accent}40` }} />
                <PlantArt id={familyPlants[2].id} className="hg-float-idle relative h-36 w-36 object-contain" priority />
              </div>
              <h2 id="altar-title" className="mt-1 font-title text-lg text-[#f0eadb]">
                {familyInfo.name}
              </h2>
              <p className="mt-1 text-[12px] text-[#9bac9c]">{familyInfo.description}</p>

              <button
                type="button"
                onClick={() => void draw(1)}
                disabled={busy || actionsFull || (!freeReady && farm.pollen < 1)}
                className={`hg-tap relative mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[15px] font-extrabold text-[#20170a] disabled:opacity-50 ${freeReady ? 'hg-glow' : ''}`}
                style={{ background: `linear-gradient(135deg, #fff1c7, ${familyInfo.accent})` }}
              >
                <Sparkles size={18} />
                {freeReady ? 'Invocar gratis' : 'Invocar · 1 polen'}
              </button>
              <p className="mt-1.5 text-[11px] tabular-nums text-[#9bac9c]">
                {freeReady ? 'Una invocación gratis cada minuto' : `Próxima gratis en ${formatDuration(farm.nextFreeDrawAt - now)}`}
              </p>
              <button
                type="button"
                onClick={() => void draw(10)}
                disabled={busy || actionsFull || farm.pollen < TEN_DRAW_COST}
                className="hg-tap mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] text-[14px] font-bold text-[#f0eadb] disabled:opacity-45"
              >
                Invocar ×10 · {TEN_DRAW_COST} polen
              </button>
            </div>

            <button
              type="button"
              onClick={() => void act({ type: 'daily' }).then((outcome) => outcome && buzz([10, 40, 10]))}
              disabled={busy || actionsFull || !giftReady}
              className={`hg-tap flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left disabled:opacity-60 ${
                giftReady ? 'hg-glow border-[#f0cf73]/60 bg-[#f0cf73]/[0.08]' : 'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${giftReady ? 'hg-bounce bg-[#f0cf73] text-[#2a1d05]' : 'bg-white/5 text-[#9bac9c]'}`}>
                <Gift size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[14px] text-[#f0eadb]">{giftReady ? 'Regalo del día' : 'Regalo recogido'}</strong>
                <small className="text-[11.5px] text-[#9bac9c]">{giftReady ? 'Toca para recibir +5 de polen' : 'Vuelve a las 00:00 de Argentina'}</small>
              </span>
            </button>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#d8bb7d]">Garantías</p>
              <div className="space-y-2.5">
                {PITY_LIMITS.map((limit, i) => (
                  <div key={limit}>
                    <div className="flex justify-between text-[11.5px]">
                      <span style={{ color: TIER_COLORS[i + 1] }}>{RARITIES[i + 1]} o superior</span>
                      <span className="tabular-nums text-[#9bac9c]">en ≤ {limit - farm.pity[i]} tiradas</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${(farm.pity[i] / limit) * 100}%`, background: TIER_COLORS[i + 1] }} />
                    </div>
                  </div>
                ))}
              </div>
              <details className="mt-3 text-[12px] text-[#bfccbb]">
                <summary className="cursor-pointer text-[#d8bb7d]">Probabilidades</summary>
                <ul className="mt-2 space-y-1">
                  {BASE_ODDS.map((chance, index) => (
                    <li key={chance} className="flex justify-between">
                      <span style={{ color: TIER_COLORS[index] }}>{RARITIES[index]}</span>
                      <strong>{chance}</strong>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 leading-5 text-[#9bac9c]">
                  Probabilidades base. Las garantías elevan la rareza mínima. Todos los linajes comparten contadores; obtener una
                  rareza reinicia su contador y los inferiores. Las tiradas gratis también cuentan.
                </p>
              </details>
            </div>
          </section>
        )}

        {tab === 'semillas' && (
          <section aria-labelledby="seeds-title" className="hg-panel space-y-4">
            <SectionTitle eyebrow={`${number(totalSeeds)} semillas`} title="Semillero">
              <button
                type="button"
                onClick={() => setTab('altar')}
                className="hg-tap flex min-h-10 items-center gap-1.5 rounded-full border border-[#d8bb7d]/40 px-3 text-[12px] font-bold text-[#d8bb7d]"
              >
                <Sparkles size={14} /> Invocar
              </button>
            </SectionTitle>
            <FamilyChips family={family} onChange={chooseFamily} />
            <p className="text-[12px] leading-5 text-[#9bac9c]">
              Elige qué plantar. Dos plantas maduras idénticas se fusionan en la siguiente rareza.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {familyPlants.map((plant) => {
                const owned = farm.seeds[plant.id];
                const discovered = farm.album[plant.id]?.discovered;
                const active = seedId === plant.id;
                return (
                  <button
                    key={plant.id}
                    type="button"
                    disabled={owned < 1}
                    aria-pressed={active}
                    onClick={() => {
                      setSelected(plant.id);
                      setTab('huerto');
                      setHint(`${plant.name} elegida. Toca una parcela vacía.`);
                    }}
                    className="hg-tap relative flex flex-col items-center rounded-2xl border p-3 text-center disabled:opacity-45"
                    style={{
                      borderColor: active ? TIER_COLORS[plant.tier] : 'rgba(255,255,255,0.08)',
                      background: `radial-gradient(circle at 50% 35%, color-mix(in srgb, ${TIER_COLORS[plant.tier]} 14%, transparent), transparent 70%), #0b1711`,
                    }}
                  >
                    <b className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-[#f0eadb]">×{owned}</b>
                    <PlantArt id={plant.id} className={`h-24 w-24 object-contain ${discovered ? '' : 'brightness-0 opacity-40'}`} />
                    <strong className="mt-1 line-clamp-1 text-[12.5px] text-[#f0eadb]">{discovered ? plant.name : '???'}</strong>
                    <small className="text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: TIER_COLORS[plant.tier] }}>
                      {plant.rarity}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {tab === 'canje' && (
          <section aria-labelledby="canje-title" className="hg-panel space-y-4">
            <SectionTitle eyebrow="El fruto de tu cuidado" title="Canje" />
            <form
              className="rounded-3xl border border-[#d8bb7d]/40 bg-[radial-gradient(circle_at_85%_20%,rgba(240,207,115,0.14),transparent_45%),#0b1711] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                setConfirmation({ type: 'voucher', playerName: (playerName ?? farm.playerName).trim() });
              }}
            >
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-[#d8bb7d]">
                <span>Einherjar Blitz</span>
                <span>Vale de cosecha</span>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <Coins size={26} className="mb-1.5 text-[#f0cf73]" />
                <strong className="font-title text-[44px] leading-none text-[#fff3d1]">{number(voucherAmount)}</strong>
              </div>
              <p className="mt-1 text-[11.5px] text-[#9bac9c]">
                monedas para el próximo vale · {number(usage.redeemed)} / {number(DAILY_COIN_LIMIT)} emitidas hoy
              </p>
              <label htmlFor="agro-player" className="mt-4 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#bfccbb]">
                Tu nombre en el grupo de Messenger
              </label>
              <input
                id="agro-player"
                name="playerName"
                autoComplete="nickname"
                required
                minLength={2}
                maxLength={48}
                value={playerName ?? farm.playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Nombre con el que te conocen"
                className="mt-1.5 h-12 w-full rounded-xl border border-white/15 bg-black/30 px-3.5 text-[16px] text-[#f0eadb] outline-none placeholder:text-white/30 focus:border-[#d8bb7d]"
              />
              <button
                type="submit"
                disabled={busy || actionsFull || voucherAmount < 1}
                className="hg-tap mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#ffe7a3,#d8a84a)] text-[15px] font-extrabold text-[#2a1d05] disabled:opacity-45"
              >
                <Download size={18} /> Preparar vale PDF
              </button>
              <small className="mt-2 block text-[11px] leading-4 text-[#9bac9c]">
                {local
                  ? 'Este entorno emite muestras locales sin validez de canje.'
                  : 'Se reservará el importe mostrado. El saldo que exceda el cupo seguirá disponible mañana. Descargar otra vez no crea un nuevo vale.'}
              </small>
            </form>
            <p className="px-1 text-[12px] leading-5 text-[#9bac9c]">
              Envía el PDF a Messenger. El administrador consulta el importe y registra un único canje antes de acreditar tus
              monedas.{' '}
              <Link href="/evento/agro/canje" className="text-[#d8bb7d] underline">
                Consultar un folio
              </Link>
            </p>

            {farm.vouchers.length > 0 && (
              <div>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#d8bb7d]">Tus vales</h3>
                <ul className="space-y-2">
                  {farm.vouchers.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setVoucher(item)}
                        className="hg-tap flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <strong className="block text-[14px] text-[#f0eadb]">{number(item.amount)} monedas</strong>
                          <span className="block truncate font-mono text-[10.5px] text-[#9bac9c]">{item.id}</span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.redeemedAt ? 'bg-emerald-400/15 text-emerald-300' : 'bg-[#f0cf73]/15 text-[#f0cf73]'
                          }`}
                        >
                          {item.redeemedAt ? 'Canjeado' : 'Pendiente'}
                        </span>
                        <Download size={16} className="shrink-0 text-[#d8bb7d]" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="px-1 text-[11px] leading-4 text-[#7f8f80]">
              Hoy: {number(usage.actions)} / {number(DAILY_ACTION_LIMIT)} acciones. Los cupos se reinician a las 00:00 de
              Argentina.
            </p>
          </section>
        )}
      </main>

      {/* Bottom dock */}
      <nav aria-label="Secciones del huerto" className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <ul className="mx-auto flex h-16 max-w-[496px] items-center rounded-2xl border border-[#d8bb7d]/20 bg-[#0c1812]/90 px-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {dock.map((item) => {
            const active = tab === item.id;
            return (
              <li key={item.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    window.scrollTo({ top: 0 });
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`hg-tap relative mx-auto flex h-[52px] w-full flex-col items-center justify-center gap-1 rounded-xl ${
                    active ? 'text-[#f0cf73]' : 'text-[#9bac9c]'
                  }`}
                >
                  {active ? (
                    <span className="absolute inset-x-1.5 inset-y-0 rounded-xl bg-[radial-gradient(ellipse_at_top,rgba(240,207,115,0.2),rgba(240,207,115,0.03)_70%)]" aria-hidden="true" />
                  ) : null}
                  <span className="relative">
                    {item.icon}
                    {item.dot ? <span className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0c1812] bg-[#ff8a5c]" /> : null}
                  </span>
                  <span className="relative text-[10px] font-bold tracking-wide">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Plot sheet */}
      <AgroDialog open={sheet !== null && !!sheetPlot} title={sheetPlot ? getPlant(sheetPlot.plantId).name : 'Parcela'} onClose={() => setSheet(null)}>
        {sheet !== null && sheetPlot ? (
          <PlotSheet
            index={sheet}
            plot={sheetPlot}
            farm={farm}
            now={now}
            coinsLeft={coinsLeft}
            locked={busy || actionsFull}
            onWater={() => {
              setSheet(null);
              void waterAt(sheet);
            }}
            onHarvest={() => {
              setSheet(null);
              void harvestAt(sheet);
            }}
            onFuse={(partnerIndex) => {
              setSheet(null);
              setConfirmation({ type: 'fuse', index: sheet, partnerIndex });
            }}
            onUproot={() => {
              setSheet(null);
              setConfirmation({ type: 'uproot', index: sheet });
            }}
          />
        ) : null}
      </AgroDialog>

      {/* Reveal ceremony */}
      <AgroDialog
        open={!!reveal}
        title={reveal?.fusion ? '¡Fusión completa!' : reveal?.ids.length === 1 ? 'Una nueva vida' : 'Diez nuevas vidas'}
        onClose={() => setReveal(null)}
      >
        {reveal ? (
          <>
            {reveal.ids.length === 1 ? (
              (() => {
                const plant = getPlant(reveal.ids[0]);
                return (
                  <div className="relative flex flex-col items-center py-2 text-center" style={{ '--tier': TIER_COLORS[plant.tier] } as CSSProperties}>
                    <span className="hg-orb" aria-hidden="true" />
                    <div className="hg-reveal-single relative flex flex-col items-center">
                      <span className="hg-rays" aria-hidden="true" />
                      <PlantArt id={plant.id} className="relative h-52 w-52 object-contain" priority />
                      {reveal.fresh.includes(plant.id) ? (
                        <span className="relative mt-1 rounded-full bg-[#ff8a5c] px-2.5 py-0.5 text-[10px] font-extrabold tracking-[0.16em] text-[#2a1206]">
                          NUEVA ESPECIE
                        </span>
                      ) : null}
                      <strong className="relative mt-2 font-title text-2xl text-[#f0eadb]">{plant.name}</strong>
                      <span className="relative text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: TIER_COLORS[plant.tier] }}>
                        {plant.rarity}
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <>
                <p className="-mt-2 mb-3 text-[12px] text-[#9bac9c]">
                  Mejor: <b style={{ color: TIER_COLORS[Math.max(...reveal.ids.map((id) => getPlant(id).tier))] }}>
                    {RARITIES[Math.max(...reveal.ids.map((id) => getPlant(id).tier))]}
                  </b>
                  {reveal.fresh.length ? ` · ${reveal.fresh.length} ${reveal.fresh.length === 1 ? 'especie nueva' : 'especies nuevas'}` : ''}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[...reveal.ids]
                    .sort((a, b) => getPlant(b).tier - getPlant(a).tier)
                    .map((id, i, sorted) => {
                    const plant = getPlant(id);
                    // Mark only the first copy of a newly discovered species.
                    const fresh = reveal.fresh.includes(id) && sorted.indexOf(id) === i;
                    return (
                      <div
                        key={`${id}-${i}`}
                        className={`hg-card relative flex flex-col items-center rounded-2xl border p-1.5 text-center ${plant.tier >= 2 ? 'hg-card-rare' : ''} ${
                          sorted.length === 10 && i === 9 ? 'col-start-2' : ''
                        }`}
                        style={{ '--i': i, '--tier': TIER_COLORS[plant.tier], borderColor: `${TIER_COLORS[plant.tier]}80` } as CSSProperties}
                      >
                        {fresh ? (
                          <span className="absolute -top-1.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#ff8a5c] px-1.5 text-[8px] font-extrabold tracking-[0.1em] text-[#2a1206]">
                            NUEVA
                          </span>
                        ) : null}
                        <PlantArt id={id} className="h-16 w-16 object-contain" />
                        <strong className="line-clamp-2 min-h-[2.2em] text-[10px] leading-tight text-[#f0eadb]">{plant.name}</strong>
                        <span className="text-[8.5px] font-bold uppercase tracking-[0.08em]" style={{ color: TIER_COLORS[plant.tier] }}>
                          {plant.rarity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="agro-draw-ten" onClick={() => setReveal(null)}>
                {reveal.fusion ? 'Cerrar' : 'Seguir invocando'}
              </button>
              <button
                type="button"
                className="agro-draw-main"
                onClick={() => {
                  setReveal(null);
                  setTab('huerto');
                }}
              >
                Ir al huerto <ArrowRight size={16} />
              </button>
            </div>
          </>
        ) : null}
      </AgroDialog>

      {/* Confirmations: voucher, uproot, fusion */}
      <AgroDialog
        open={!!confirmation}
        title={
          confirmation?.type === 'voucher'
            ? 'Emitir tu vale'
            : confirmation?.type === 'uproot'
              ? 'Retirar esta planta'
              : confirmPlant?.tier === 4
                ? 'Crear sello de linaje'
                : 'Fusionar dos plantas'
        }
        onClose={() => setConfirmation(null)}
      >
        {confirmation?.type === 'voucher' ? (
          <p>
            Vas a reservar <strong>{number(voucherAmount)} monedas</strong> a nombre de <strong>{confirmation.playerName}</strong>. El
            saldo quedará en un folio que podrás descargar desde tu historial.
          </p>
        ) : confirmation?.type === 'uproot' ? (
          <p>
            Retirarás <strong>{confirmPlant?.name}</strong> y liberarás su parcela. La semilla se consume; su lámina permanece en el
            álbum. Recogemos antes la cosecha disponible.
          </p>
        ) : (
          <>
            <div className="agro-fusion-preview">
              {confirmPlant && <PlantArt id={confirmPlant.id} className="agro-reveal-grid-art" />}
              <span>× 2 →</span>
              {fusedPlant ? <PlantArt id={fusedPlant.id} className="agro-reveal-grid-art" /> : <Sparkles size={50} />}
            </div>
            <p>
              {fusedPlant
                ? `Obtendrás ${fusedPlant.name}. Las dos plantas originales se consumen y la nueva necesita tres riegos.`
                : 'Conservarás una mítica madura y obtendrás el sello decorativo de su linaje. La segunda planta se consume.'}{' '}
              La cosecha pendiente se recoge automáticamente.
            </p>
          </>
        )}
        {error && (
          <p className="agro-inline-error" role="alert">
            {error}
          </p>
        )}
        <div className="agro-confirm-actions">
          <button type="button" className="agro-draw-ten" disabled={busy} onClick={() => setConfirmation(null)}>
            Cancelar
          </button>
          <button
            type="button"
            className="agro-draw-main"
            disabled={busy || actionsFull || (confirmation?.type === 'voucher' && voucherAmount < 1)}
            onClick={() => void confirm()}
          >
            {busy ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </AgroDialog>

      <AgroDialog open={!!voucher} title="Tu vale de cosecha" onClose={() => setVoucher(null)}>
        {voucher && (
          <>
            <div className="agro-voucher-amount">
              <strong>{number(voucher.amount)}</strong>
              <span>monedas · {voucher.playerName}</span>
            </div>
            <p className="agro-folio">{voucher.id}</p>
            <p>Guarda el PDF y preséntalo en el grupo. El folio solo puede canjearse una vez.</p>
            {voucher.environment === 'local' && <p className="agro-environment">Demostración local sin validez de canje.</p>}
            <a className="agro-voucher-button" href={`/api/agro/vale?id=${voucher.id}`}>
              <Download size={18} /> Descargar PDF
            </a>
            <Link className="agro-text-link" href={`/evento/agro/canje?id=${voucher.id}`} onClick={() => setVoucher(null)}>
              Consultar estado del folio
            </Link>
          </>
        )}
      </AgroDialog>

      {/* Guide */}
      <AgroDialog open={guide} title="Cómo jugar" onClose={() => setGuide(false)}>
        <ol className="space-y-3 text-[13px] leading-5 text-[#dfe6d8]">
          <li>
            <strong className="text-[#d8bb7d]">1 · Invoca y planta.</strong> Empiezas con una semilla común de cada linaje y 5 de
            polen. Toca una de tus seis parcelas para plantar.
          </li>
          <li>
            <strong className="text-[#d8bb7d]">2 · Riega y cosecha.</strong> Tres riegos separados por 8 segundos. Al madurar,
            produce monedas sola y cada cosecha puede darte 1 polen por parcela cada minuto.
          </li>
          <li>
            <strong className="text-[#d8bb7d]">3 · Fusiona y colecciona.</strong> Dos plantas maduras idénticas crean la siguiente
            rareza del mismo linaje. La nueva planta necesita tres riegos.
          </li>
          <li>
            <strong className="text-[#d8bb7d]">4 · Comparte tu cosecha.</strong> Convierte tu saldo en un PDF en la pestaña Canje y
            envíalo al grupo.
          </li>
        </ol>
        <details className="agro-rules">
          <summary>Linajes, reservas y cuidado del progreso</summary>
          <p>
            <strong>Alba:</strong> produce cada 60 segundos. <strong>Escarcha:</strong> produce cada 75 segundos y guarda 480 ciclos
            (10 horas). <strong>Brasas:</strong> produce cada 75 segundos y cada riego maduro suma dos ciclos de bono. Alba y Brasas
            guardan 120 ciclos (2 h y 2 h 30 min). El bono acumula hasta tres riegos.
          </p>
          <p>
            Las rarezas producen 1, 2, 5, 12 y 28 monedas por ciclo. La reserva sigue creciendo con la página cerrada hasta su
            límite. El polen se entrega al cosechar; los minutos ausentes no acumulan polen.
          </p>
          <p>
            Con tres cosechas de una especie obtienes su sello de maestría. Dos míticas maduras idénticas permiten crear un sello de
            linaje: conservas una mítica madura. Los sellos son decorativos.
          </p>
          <p>
            Tu huerto y sus cupos se vinculan a tu cuenta de Einherjar Blitz. El regalo diario vuelve a las 00:00 de Argentina; no
            hay rachas que perder. Cada cuenta puede cosechar hasta 2.000 monedas, emitir vales por hasta 2.000 monedas y completar
            500 acciones por día.
          </p>
        </details>
        <a href="/evento-agro/guia-del-grupo.txt" download className="agro-text-link">
          Descargar guía para el grupo
        </a>
      </AgroDialog>
    </div>
  );
}
