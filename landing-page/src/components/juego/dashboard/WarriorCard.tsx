'use client';

import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Icon } from '@/components/juego/Icon';
import { EASE_IN_OUT, EASE_OUT_EXPO, ParticleBurst, SPRINGS, TiltCard } from '@/components/juego/motion';
import { cn } from '@/lib/utils';
import { CountUp } from './CountUp';
import { enterAt } from './reveal';
import styles from './dashboard.module.css';

interface WarriorCardProps {
  /** Seconds into the page choreography when the card lands. */
  delay: number;
  username: string;
  nivel: number;
  rango: string;
  frase: string;
  avatar?: string | null;
  progressCurrent: number;
  progressPercent: number;
  progressRemaining: number;
  copas: number;
  victorias: number;
  winrate: number;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { ...SPRINGS.soft, delay, opacity: { duration: 0.4, delay } } },
});

/**
 * Hero of the lobby: the portrait settles in and drifts like a camera, the
 * border carries a running gold aura, and every number counts up in turn.
 */
export function WarriorCard({
  delay: t,
  username,
  nivel,
  rango,
  frase,
  avatar,
  progressCurrent,
  progressPercent,
  progressRemaining,
  copas,
  victorias,
  winrate,
}: WarriorCardProps) {
  const reduceMotion = useReducedMotion();
  const [badgeBurst, setBadgeBurst] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // The aura's conic sweep repaints every frame, so it only runs while the card is on screen.
  const cardInView = useInView(cardRef, { margin: '80px 0px' });
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ['start end', 'end start'] });
  const scrollY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-30, 30]);
  // With a mouse the portrait slides against the pointer, so the card reads as a window with depth.
  const pointerX = useSpring(0, { stiffness: 120, damping: 20 });
  const pointerY = useSpring(0, { stiffness: 120, damping: 20 });
  const portraitY = useTransform([scrollY, pointerY], ([fromScroll, fromPointer]: number[]) => fromScroll + fromPointer);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(-((event.clientX - rect.left) / rect.width - 0.5) * 18);
    pointerY.set(-((event.clientY - rect.top) / rect.height - 0.5) * 14);
  };
  const onPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const stats = [
    { value: copas, label: 'Copas', icon: 'trophy', suffix: '' },
    { value: victorias, label: 'Victorias', icon: 'flash', suffix: '' },
    { value: winrate, label: 'Winrate', icon: 'stats-chart', suffix: '%' },
  ];

  return (
    <motion.div ref={cardRef} {...enterAt(t)} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      {/* tabIndex -1: whileTap would otherwise make the wrapper a second, empty tab stop before the link. */}
      <TiltCard max={4} press={0.985} className="rounded-3xl" tabIndex={-1}>
        <Link
          href="/juego/perfil"
          aria-label={`Ver perfil de ${username}, nivel ${nivel}`}
          className={cn(
            'group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] p-4 outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0a09]',
            cardInView && 'juego-aura'
          )}
          style={{ '--juego-aura-color': '#c9aa71' } as CSSProperties}
        >
          {/* Portrait: scroll/pointer parallax > intro zoom > idle camera drift, one transform per layer. */}
          <motion.span
            aria-hidden="true"
            className="absolute -inset-x-[4%] -inset-y-[10%] block"
            style={{ x: pointerX, y: portraitY }}
          >
            <motion.span
              className="absolute inset-0 block"
              initial={{ scale: 1.22, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ scale: { duration: 2, delay: t, ease: EASE_OUT_EXPO }, opacity: { duration: 0.7, delay: t } }}
            >
              <img
                src="/juego/loading_screen/orfevre.jpg"
                alt=""
                className={cn('h-full w-full object-cover object-[center_30%]', styles.kenBurns)}
              />
            </motion.span>
          </motion.span>
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,9,0.35)_0%,rgba(11,10,9,0.05)_30%,rgba(11,10,9,0.85)_68%,#0b0a09_100%)]" />
          {!reduceMotion ? (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-[linear-gradient(90deg,transparent,rgba(255,232,190,0.2),transparent)]"
              style={{ skewX: -12 }}
              initial={{ x: '-130%' }}
              animate={{ x: '260%' }}
              transition={{ duration: 1.4, delay: t + 0.35, ease: EASE_IN_OUT }}
            />
          ) : null}

          <span className="relative flex items-start justify-between gap-2">
            <motion.span
              className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white/80 backdrop-blur-md"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRINGS.soft, delay: t + 0.3 }}
            >
              TEMPORADA ACTUAL
            </motion.span>
            <motion.span
              className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-black/40 px-3 py-1 backdrop-blur-md"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRINGS.soft, delay: t + 0.38 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <span className="text-[10px] font-bold tracking-[0.16em] text-emerald-200">EN LÍNEA</span>
            </motion.span>
          </span>

          <span className="relative block">
            <span className="flex items-center gap-3.5">
              <motion.span
                className="relative h-14 w-14 shrink-0"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...SPRINGS.bouncy, delay: t + 0.42, opacity: { duration: 0.25, delay: t + 0.42 } }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -inset-[5px] rounded-full bg-[conic-gradient(from_0deg,transparent_0_50%,rgba(226,198,142,0.95)_78%,transparent_92%)] [mask:radial-gradient(farthest-side,transparent_calc(100%-2px),#000_calc(100%-1.5px))]',
                    styles.orbit
                  )}
                />
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    className="h-14 w-14 rounded-full border-2 border-gold/80 object-cover shadow-[0_0_24px_rgba(201,170,113,0.35)]"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold/80 bg-[#17140f] shadow-[0_0_24px_rgba(201,170,113,0.35)]">
                    <Icon name="person" size={26} color="#c9aa71" />
                  </span>
                )}
                {/* Keyed by level: a level-up replays the pop and the sparks. */}
                <motion.span
                  key={nivel}
                  className="absolute -bottom-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#0b0a09] bg-[linear-gradient(135deg,#f0d9a6,#c9aa71)] px-1 text-[11px] font-bold text-[#0b0a09] shadow-[0_0_14px_rgba(226,198,142,0.55)]"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...SPRINGS.bouncy, delay: t + 0.7 }}
                  onUpdate={(latest) => {
                    // Sparks fire as the badge first reaches full size, at the top of the pop.
                    if (badgeBurst !== nivel && Number(latest.scale) >= 1) setBadgeBurst(nivel);
                  }}
                >
                  {nivel}
                  <ParticleBurst
                    burstKey={badgeBurst}
                    colors={['#fff3d6', '#e2c68e']}
                    count={10}
                    distance={[14, 30]}
                    size={[2, 4]}
                    shape="spark"
                    duration={0.7}
                  />
                </motion.span>
              </motion.span>
              <span className="min-w-0 flex-1">
                <motion.span className="block truncate font-title text-[19px] leading-tight text-white" {...fadeUp(t + 0.5)}>
                  {rango}
                </motion.span>
                <motion.span className="mt-0.5 line-clamp-1 block text-[13px] italic text-white/65" {...fadeUp(t + 0.58)}>
                  “{frase}”
                </motion.span>
              </span>
              <Icon
                name="chevron-forward"
                size={18}
                color="rgba(255,255,255,0.5)"
                className="shrink-0 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
              />
            </span>

            {/* Level progress */}
            <motion.span className="mt-4 block" {...fadeUp(t + 0.56)}>
              <span className="flex items-baseline justify-between text-[11px]">
                <span className="font-bold uppercase tracking-[0.16em] text-[#9be8f2]">Nivel {nivel}</span>
                <span className="tabular-nums text-white/55">
                  <CountUp value={progressCurrent} delay={t + 0.62} duration={1.5} /> / 1000 EXP · faltan{' '}
                  <CountUp value={progressRemaining} from={1000} delay={t + 0.62} duration={1.5} />
                </span>
              </span>
              <span
                className="relative mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={progressCurrent}
                aria-valuemin={0}
                aria-valuemax={1000}
                aria-label="Experiencia del nivel actual"
              >
                {/* Full-width fill slid in from the left keeps its rounded tip without animating width. */}
                <motion.span
                  className="absolute inset-0 block rounded-full bg-[linear-gradient(90deg,#2e9fb1,#9be8f2)]"
                  initial={{ x: '-100%' }}
                  animate={{ x: `${progressPercent - 100}%` }}
                  transition={{ duration: 1.5, delay: t + 0.62, ease: EASE_OUT_EXPO }}
                >
                  <span className="absolute inset-y-0 right-0 w-3 rounded-full bg-white/90 blur-[3px]" />
                </motion.span>
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
                  style={{ width: `${progressPercent}%` }}
                >
                  <span
                    className={cn(
                      'absolute inset-y-0 left-0 w-[45%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent)]',
                      styles.streak
                    )}
                  />
                </span>
              </span>
            </motion.span>

            <motion.span
              className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/55 py-2.5"
              {...fadeUp(t + 0.66)}
            >
              {stats.map((stat, index) => {
                const at = t + 0.72 + index * 0.1;
                return (
                  <motion.span key={stat.label} className="flex flex-col items-center px-1" {...fadeUp(at)}>
                    <CountUp
                      value={stat.value}
                      delay={at}
                      duration={1.4}
                      suffix={stat.suffix}
                      className="text-lg font-bold tabular-nums text-white"
                    />
                    <span className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gold">
                      <Icon name={stat.icon} size={10} />
                      {stat.label}
                    </span>
                  </motion.span>
                );
              })}
            </motion.span>
          </span>
        </Link>
      </TiltCard>
    </motion.div>
  );
}
