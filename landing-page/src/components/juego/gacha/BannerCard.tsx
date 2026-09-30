'use client';

/**
 * BannerCard — Premium visual card for a Gacha banner.
 *
 * Layout: the character art fills the card, while the title stays on the
 * right/top and the buttons at the bottom with a strong gradient so they
 * remain readable. This mimics Genshin Impact's wish screen layout.
 *
 * Motion: the art lags behind the card while the carousel scrolls (parallax),
 * cards away from the center shrink and dim, and the centered banner gets its
 * title spelled in, drifting motes and a breathing glow in its accent color.
 */

import { memo, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';
import { type BannerDef } from '@/constants/gachaData';
import { SPRINGS, Sheen, SplitText } from '../motion';
import { Icon } from '../Icon';
import { cn } from '@/lib/utils';
import { Motes, ProcessingLabel, ProcessingShimmer, useTapRipple } from './fx';
import styles from './gacha.module.css';

interface BannerCardProps {
  banner: BannerDef;
  onSummon: (banner: BannerDef, amount: 1 | 10) => void;
  disabled?: boolean;
  /** True for the banner centered in the carousel. */
  active: boolean;
  /** Horizontal scroll progress of the carousel (0 → 1). */
  progress: MotionValue<number>;
  index: number;
  count: number;
  /** True while the ceremony or a sheet covers the lobby: the JS-driven loops stop (CSS ones are paused by the page). */
  paused?: boolean;
}

export const BannerCard = memo(function BannerCard({
  banner,
  onSummon,
  disabled = false,
  active,
  progress,
  index,
  count,
  paused = false,
}: BannerCardProps) {
  const [imageError, setImageError] = useState(false);
  const reduceMotion = useReducedMotion();
  const costIcon = banner.costType === 'keys' ? 'key' : 'planet';
  const currency = banner.costType === 'keys' ? 'llaves' : 'esferas';
  const accent = banner.accentColor;

  // -1 when the card sits one slot to the right of center, +1 one slot to the left.
  const step = count > 1 ? 1 / (count - 1) : 1;
  const center = count > 1 ? index * step : 0;
  const offset = useTransform(progress, [center - step, center, center + step], [-1, 0, 1]);
  const artX = useTransform(offset, [-1, 1], ['-8%', '8%']);
  const cardScale = useTransform(offset, [-1, 0, 1], [0.9, 1, 0.9]);
  // Shrink away from the viewport edge so the neighbour keeps peeking in.
  const cardOrigin = useTransform(offset, [-1, 1], [0, 1]);
  const dim = useTransform(offset, [-1, 0, 1], [0.55, 0, 0.55]);

  const single = useTapRipple();
  const multi = useTapRipple('rgba(255,244,214,0.6)');

  return (
    <motion.div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0a0a14]"
      style={{ scale: cardScale, originX: cardOrigin, boxShadow: `0 40px 80px -40px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.06)` }}
    >
      {/* Art: wider than the card so it can lag behind the swipe. */}
      <motion.div className="absolute inset-y-0 -left-[11%] -right-[11%]" style={{ x: artX }}>
        {!imageError ? (
          <div className={cn('h-full w-full', active && styles.artDrift)}>
            <img
              src={banner.bannerImage}
              alt={`Ilustración del banner ${banner.title}`}
              className="h-full w-full object-cover object-left"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon name={banner.iconName} size={100} color={accent} style={{ opacity: 0.15 }} />
          </div>
        )}
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        <span className="absolute inset-0 bg-[linear-gradient(200deg,rgba(5,5,8,0.85)_0%,rgba(5,5,8,0.1)_45%)]" />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,8,0)_50%,rgba(5,5,8,0.97)_100%)]" />
        {/* Accent light pooling behind the buttons, breathing while the banner is centered. */}
        <span
          className={cn('absolute -inset-x-[20%] bottom-[-18%] h-[55%]', active && !reduceMotion && styles.breathe)}
          style={{ background: `radial-gradient(ellipse at 50% 100%, ${accent}66, ${accent}1f 45%, transparent 70%)` }}
        />
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
        {active ? <Motes color={accent} count={9} seed={index + 1} rise={380} /> : null}
      </div>

      {/* Cards away from the center fade into the dark. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[4] bg-[#050508]"
        style={{ opacity: dim }}
      />

      <div className="relative z-[2] flex flex-1 flex-col justify-between p-4">
        <div className="ml-auto flex max-w-[82%] flex-col items-end text-right">
          <span
            className="mb-3 flex items-center gap-1.5 rounded-full border bg-black/40 px-3 py-1 text-[10px] font-bold tracking-[0.2em] backdrop-blur-md"
            style={{ borderColor: `${accent}99`, color: '#c7c9ff' }}
          >
            <span className="relative flex h-3 w-3 items-center justify-center" aria-hidden="true">
              {active && !reduceMotion && !paused ? (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: accent }}
                  initial={{ scale: 0.6, opacity: 0.7 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
              ) : null}
              <Icon name={banner.iconName} size={12} color={accent} className="relative" />
            </span>
            BANNER ACTIVO
          </span>
          <h3
            className="font-title text-[28px] leading-[1.1] text-white"
            style={{ textShadow: `0 0 32px ${accent}` }}
          >
            {active ? <SplitText key={banner.id} text={banner.title} delay={0.08} step={0.032} /> : banner.title}
          </h3>
          <motion.p
            key={`sub-${active}`}
            className="mt-2 text-[13px] tracking-wide text-white/75"
            initial={active ? { opacity: 0, x: 14 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRINGS.soft, delay: 0.4 }}
          >
            {banner.subtitle}
          </motion.p>
          <motion.p
            key={`cost-${active}`}
            className="mt-3 flex items-center gap-1.5 text-xs text-white/55"
            initial={active ? { opacity: 0, x: 14 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRINGS.soft, delay: 0.5 }}
          >
            <Icon name={costIcon} size={13} color="#c9aa71" />
            {banner.costAmount} {banner.costAmount === 1 ? currency.slice(0, -1) : currency} por invocación
          </motion.p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/55 p-1.5 backdrop-blur-md">
          <motion.button
            type="button"
            onClick={(event) => {
              single.trigger(event);
              onSummon(banner, 1);
            }}
            disabled={disabled}
            aria-busy={disabled || undefined}
            aria-label={`Invocar una vez por ${banner.costAmount} ${currency}`}
            whileHover={disabled ? undefined : { y: -2 }}
            whileTap={disabled ? undefined : { scale: 0.94 }}
            transition={SPRINGS.snappy}
            className="relative flex min-h-[62px] flex-col items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/[0.04] text-white transition-colors hover:border-white/30 active:bg-white/[0.1] disabled:opacity-70"
          >
            {single.ripple}
            {disabled ? <ProcessingShimmer /> : null}
            <span className="relative text-sm font-bold uppercase tracking-[0.14em]">
              {disabled ? <ProcessingLabel /> : 'Invocar ×1'}
            </span>
            <span className="relative mt-1 flex items-center gap-1 text-xs font-bold text-white/65">
              <Icon name={costIcon} size={12} color="#c9aa71" />
              {banner.costAmount}
            </span>
          </motion.button>

          <motion.button
            type="button"
            onClick={(event) => {
              multi.trigger(event);
              onSummon(banner, 10);
            }}
            disabled={disabled}
            aria-busy={disabled || undefined}
            aria-label={`Invocar diez veces por ${banner.costAmount * 10} ${currency}`}
            whileHover={disabled ? undefined : { y: -2, scale: 1.02 }}
            whileTap={disabled ? undefined : { scale: 0.93 }}
            transition={SPRINGS.snappy}
            className={cn(
              'relative flex min-h-[62px] flex-col items-center justify-center overflow-hidden rounded-xl text-white disabled:opacity-80',
              // The running arc is for the centred banner only; the peeking neighbour stays still.
              active && !disabled && 'juego-aura'
            )}
            style={
              {
                background: `linear-gradient(135deg, ${accent}, #8b5cf6)`,
                boxShadow: `0 10px 30px -10px ${accent}`,
                '--juego-aura-color': '#ffe2b0',
                '--juego-aura-width': '1.5px',
              } as CSSProperties
            }
          >
            {multi.ripple}
            {disabled ? (
              <ProcessingShimmer />
            ) : paused ? null : (
              <Sheen every={3.2} duration={1.1} delay={1.2} color="rgba(255,255,255,0.38)" />
            )}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent)]"
            />
            <span className="relative z-10 text-sm font-bold uppercase tracking-[0.14em]">
              {disabled ? <ProcessingLabel /> : 'Invocar ×10'}
            </span>
            <span className="relative z-10 mt-1 flex items-center gap-1 text-xs font-bold text-white/85">
              <Icon name={costIcon} size={12} />
              {banner.costAmount * 10}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});
