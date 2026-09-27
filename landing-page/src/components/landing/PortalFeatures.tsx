'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Gem,
  KeyRound,
  Orbit,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Trophy,
  User,
} from 'lucide-react';
import { RARITIES, REWARDS_TABLE } from '@/constants/gachaData';
import { cn } from '@/lib/utils';
import { EASE_OUT, SectionHeading } from './primitives';

function Tile({
  children,
  title,
  description,
  icon,
  className,
  index,
}: {
  children: ReactNode;
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay: index * 0.08, ease: EASE_OUT }}
      whileHover={{ y: -6 }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-[#141210] to-[#0a0a0a] p-6 transition-colors hover:border-primary/35',
        className
      )}
    >
      <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative mb-6 flex min-h-[150px] flex-1 items-center justify-center">{children}</div>
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <h3 className="font-title text-lg text-white/95">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-white/55">{description}</p>
        </div>
      </div>
    </motion.article>
  );
}

function SummonDemo() {
  const featured = [REWARDS_TABLE[1], REWARDS_TABLE[0], REWARDS_TABLE[3]];
  return (
    <div className="flex items-end gap-3 [perspective:900px]">
      {featured.map((item, i) => {
        const rarity = RARITIES[item.rarity];
        return (
          <div
            key={item.name}
            className={cn('relative', i === 1 ? 'h-44 w-32' : 'h-36 w-24')}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="landing-flip absolute inset-0" style={{ animationDelay: `${i * 0.35}s` } as CSSProperties}>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl border bg-[#07090e] [backface-visibility:hidden] [transform:rotateY(180deg)]"
                style={{ borderColor: rarity.color, boxShadow: `0 0 18px ${rarity.glowColor}` }}
              >
                <Gem className="h-8 w-8" color={rarity.color} />
              </div>
              <div
                className="absolute inset-0 overflow-hidden rounded-xl border-2 [backface-visibility:hidden]"
                style={{ borderColor: rarity.color, boxShadow: `0 0 26px ${rarity.glowColor}` }}
              >
                <img src={item.image ?? ''} alt="" className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent px-1.5 pb-1.5 pt-6 text-center">
                  <span className="flex justify-center gap-0.5">
                    {Array.from({ length: rarity.stars }).map((_, s) => (
                      <Star key={s} className="h-2 w-2" fill={rarity.color} color={rarity.color} />
                    ))}
                  </span>
                  <span className="block truncate text-[10px] font-bold" style={{ color: rarity.color }}>
                    {item.name}
                  </span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConvertDemo() {
  return (
    <div className="flex w-full max-w-[260px] items-center justify-between">
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 shadow-[0_0_24px_rgba(201,170,113,0.25)]">
          <KeyRound className="h-8 w-8 text-primary" />
        </span>
        <span className="text-xs font-bold text-white/60">1 llave</span>
      </div>
      <div className="relative mx-2 h-px flex-1 bg-gradient-to-r from-primary/60 to-cyan-300/60">
        <span className="landing-travel absolute -top-1 h-2 w-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_#fff]" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_24px_rgba(126,217,231,0.25)]">
          <Orbit className="landing-spin-slow h-8 w-8 text-cyan-300" />
        </span>
        <span className="text-xs font-bold text-white/60">50 esferas</span>
      </div>
    </div>
  );
}

function TransferDemo() {
  return (
    <div className="relative flex w-full max-w-[240px] items-center justify-between" style={{ '--hop-distance': '150px' } as CSSProperties}>
      {['Tú', 'Aliado'].map((label, i) => (
        <div key={label} className="relative z-10 flex flex-col items-center gap-2">
          <span className={cn('flex h-14 w-14 items-center justify-center rounded-full border-2 bg-[#17140f]', i === 0 ? 'border-primary' : 'border-cyan-300/70')}>
            <User className={cn('h-6 w-6', i === 0 ? 'text-primary' : 'text-cyan-300')} />
          </span>
          <span className="text-xs font-bold text-white/60">{label}</span>
        </div>
      ))}
      <span className="landing-key-hop absolute left-11 top-4">
        <KeyRound className="h-5 w-5 text-primary drop-shadow-[0_0_6px_rgba(201,170,113,0.9)]" />
      </span>
    </div>
  );
}

function StoreDemo() {
  const tags = [
    { label: 'Armas', price: 300, x: '-70px', y: '-34px' },
    { label: 'Exclusivo', price: 1200, x: '60px', y: '-52px', gold: true },
    { label: 'Consumibles', price: 50, x: '20px', y: '40px' },
  ];
  return (
    <div className="relative h-40 w-full">
      <ShoppingBag className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-primary/25" />
      {tags.map((tag, i) => (
        <span
          key={tag.label}
          className="absolute left-1/2 top-1/2"
          style={{ transform: `translate(calc(-50% + ${tag.x}), calc(-50% + ${tag.y}))` }}
        >
          <span
            className={cn(
              'landing-float flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold',
              tag.gold ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#f3dca6]' : 'border-white/15 bg-black/60 text-white/80'
            )}
            style={{ animationDelay: `${i * 0.7}s` }}
          >
            <Tag className="h-3 w-3" />
            {tag.label}
            <span className="text-cyan-300">{tag.price}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function ProfileDemo() {
  return (
    <div className="w-full max-w-[260px]">
      <div className="flex items-center gap-3">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-[#17140f]">
          <User className="h-6 w-6 text-primary" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-primary text-[10px] font-bold text-black">
            7
          </span>
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-white/90">Guerrero</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="landing-fill h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-200" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['180', 'Copas'],
          ['14', 'Victorias'],
          ['70%', 'Winrate'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-black/40 py-2">
            <p className="text-sm font-bold text-white/90">{value}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-primary">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SyncDemo() {
  return (
    <div className="flex items-center gap-5">
      <span className="flex h-24 w-14 flex-col items-center justify-center rounded-2xl border border-white/20 bg-black/60">
        <span className="h-10 w-8 rounded-md bg-gradient-to-b from-primary/40 to-primary/10" />
      </span>
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="landing-pulse-ring absolute inset-0 rounded-full border border-emerald-400/60" />
        <RefreshCw className="landing-spin-slow h-6 w-6 text-emerald-400" />
      </span>
      <span className="flex h-20 w-28 items-center justify-center rounded-xl border border-white/20 bg-black/60">
        <span className="h-12 w-20 rounded-md bg-gradient-to-b from-primary/40 to-primary/10" />
      </span>
    </div>
  );
}

export function PortalFeatures() {
  return (
    <section id="portal" className="relative mx-auto max-w-7xl px-5 py-28 md:py-36">
      <SectionHeading
        eyebrow="El portal"
        title="Todo tu reino,"
        highlight="en un solo lugar"
        subtitle="La versión web de Einherjar Blitz: las mismas mecánicas, la misma cuenta y los mismos recursos que en la app, sincronizados en tiempo real."
      />

      <div className="grid gap-4 md:grid-cols-6">
        <Tile
          index={0}
          className="md:col-span-3 md:row-span-2"
          title="Invocaciones cinematográficas"
          description="Ceremonias únicas según la rareza, desde el destello común hasta el rayo mítico. Tiradas de 1 o 10."
          icon={<Sparkles className="h-5 w-5" />}
        >
          <SummonDemo />
        </Tile>
        <Tile
          index={1}
          className="md:col-span-3"
          title="Economía de llaves y esferas"
          description="Convierte llaves en esferas al instante con una tasa fija de 1 a 50."
          icon={<KeyRound className="h-5 w-5" />}
        >
          <ConvertDemo />
        </Tile>
        <Tile
          index={2}
          className="md:col-span-3"
          title="Transferencias entre jugadores"
          description="Busca a un aliado por su nombre y envíale llaves en tres pasos."
          icon={<ArrowLeftRight className="h-5 w-5" />}
        >
          <TransferDemo />
        </Tile>
        <Tile
          index={3}
          className="md:col-span-2"
          title="Tienda oficial"
          description="Catálogo por categorías, artículos exclusivos y certificados de compra."
          icon={<ShoppingBag className="h-5 w-5" />}
        >
          <StoreDemo />
        </Tile>
        <Tile
          index={4}
          className="md:col-span-2"
          title="Perfil de guerrero"
          description="Avatar, frase, nivel, copas y winrate siempre a la vista."
          icon={<Trophy className="h-5 w-5" />}
        >
          <ProfileDemo />
        </Tile>
        <Tile
          index={5}
          className="md:col-span-2"
          title="App y web sincronizadas"
          description="Inicia sesión donde quieras: tu progreso te sigue a todas partes."
          icon={<RefreshCw className="h-5 w-5" />}
        >
          <SyncDemo />
        </Tile>
      </div>
    </section>
  );
}
