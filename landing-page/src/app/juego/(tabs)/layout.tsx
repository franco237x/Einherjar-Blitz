'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Background } from '@/components/juego/Background';
import { Icon } from '@/components/juego/Icon';
import { ParticlesBackground } from '@/components/juego/ParticlesBackground';
import { SyncIndicator } from '@/components/juego/SyncIndicator';
import { AnimatedNumber, SPRINGS } from '@/components/juego/motion';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useUserData } from '@/hooks/useUserData';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/juego', label: 'Inicio', icon: 'home' },
  { href: '/juego/gacha', label: 'Gacha', icon: 'sparkles' },
  { href: '/juego/tienda', label: 'Tienda', icon: 'cart' },
  { href: '/juego/jugar', label: 'Jugar', icon: 'game-controller', hidden: !FEATURE_FLAGS.game },
  { href: '/juego/perfil', label: 'Perfil', icon: 'person' },
].filter((tab) => !tab.hidden);

function isActive(pathname: string, href: string) {
  return href === '/juego' ? pathname === '/juego' : pathname.startsWith(href);
}

/** Balance pill: the number rolls to its new value and the change floats off it. */
function CurrencyChip({ icon, color, value, label }: { icon: string; color: string; value: number; label: string }) {
  const [seen, setSeen] = useState(value);
  const [change, setChange] = useState<{ id: number; delta: number } | null>(null);
  if (value !== seen) {
    setSeen(value);
    setChange({ id: (change?.id ?? 0) + 1, delta: value - seen });
  }

  return (
    <span
      className="relative flex h-9 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] pl-2.5 pr-3"
      aria-label={`${value.toLocaleString('es')} ${label}`}
    >
      <motion.span
        key={change?.id ?? 0}
        className="flex"
        initial={change ? { rotate: -25, scale: 1.35 } : false}
        animate={{ rotate: 0, scale: 1 }}
        transition={SPRINGS.bouncy}
      >
        <Icon name={icon} size={15} color={color} />
      </motion.span>
      <AnimatedNumber value={value} className="text-[13px] font-bold tabular-nums text-white/90" />
      <AnimatePresence>
        {change ? (
          <motion.span
            key={change.id}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full border"
            style={{ borderColor: change.delta > 0 ? color : '#f87171' }}
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {change ? (
          <motion.span
            key={`delta-${change.id}`}
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-full text-[11px] font-bold tabular-nums"
            style={{ color: change.delta > 0 ? color : '#f87171' }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-6, 4, 10, 16] }}
            transition={{ duration: 1.6, times: [0, 0.15, 0.7, 1] }}
          >
            {change.delta > 0 ? '+' : '−'}
            {Math.abs(change.delta).toLocaleString('es')}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

/**
 * Lobby shell, designed as a phone app: compact top bar with balances and a
 * floating bottom tab bar. On bigger screens the same column is centered.
 */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userData } = useUserData();

  return (
    <MotionConfig reducedMotion="user">
      <Background>
        <ParticlesBackground />

        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0b0a09]/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[520px] items-center gap-3 px-4">
            <Link href="/juego" className="flex shrink-0 items-center gap-2.5" aria-label="Einherjar Blitz, inicio del juego">
              <Image src="/assets/einherjer-logo.jpg" alt="" width={28} height={28} className="rounded-md" priority />
              <span className="hidden font-title text-[12px] tracking-[0.2em] text-white/85 min-[400px]:inline">EINHERJAR</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <CurrencyChip icon="key" color="#c9aa71" value={userData?.keys || 0} label="llaves" />
              <CurrencyChip icon="planet" color="#7ed9e7" value={userData?.spheres || 0} label="esferas" />
            </div>
          </div>
        </header>

        <SyncIndicator />
        {children}

        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <ul className="mx-auto flex h-16 max-w-[496px] items-center rounded-2xl border border-white/[0.08] bg-[#141210]/90 px-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            {TABS.map((tab) => {
              const active = isActive(pathname, tab.href);
              return (
                <li key={tab.href} className="flex-1">
                  <Link
                    href={tab.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative mx-auto flex h-[52px] flex-col items-center justify-center gap-1 rounded-xl transition-colors',
                      active ? 'text-gold' : 'text-white/45'
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="juego-tab-indicator"
                        transition={SPRINGS.snappy}
                        className="absolute inset-x-2 inset-y-0 rounded-xl border border-gold/15 bg-[radial-gradient(ellipse_at_top,rgba(201,170,113,0.26),rgba(201,170,113,0.04)_70%)]"
                        aria-hidden="true"
                      />
                    ) : null}
                    <motion.span
                      className="relative flex"
                      animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
                      whileTap={{ scale: 0.85 }}
                      transition={SPRINGS.bouncy}
                    >
                      <Icon name={tab.icon} size={21} strokeWidth={active ? 2.2 : 1.75} />
                    </motion.span>
                    <span className="relative text-[10px] font-bold tracking-wide">{tab.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Background>
    </MotionConfig>
  );
}
