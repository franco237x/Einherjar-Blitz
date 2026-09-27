'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Newspaper, Shield, Sparkles, Star, Swords, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE_OUT, Embers, GoldRule, Reveal, SectionHeading } from './primitives';
import { SECTIONS, scrollToSection } from './SiteHeader';

const RELEASE_NOTES = [
  {
    icon: Star,
    title: 'Portal web',
    description: 'Einherjar Blitz ya se juega desde el navegador con la misma cuenta, inventario y recursos que en la app.',
  },
  {
    icon: Sparkles,
    title: 'Invocación reforjada',
    description: 'Ceremonias por rareza, resultados claros, probabilidades públicas e inventario integrado.',
  },
  {
    icon: Shield,
    title: 'Economía más sólida',
    description: 'Compras, conversiones, transferencias y recompensas con transacciones atómicas en la nube.',
  },
  {
    icon: Swords,
    title: 'Combate en preparación',
    description: 'La arena, los sprites y el balance del primer enfrentamiento están en su etapa final.',
  },
] as const;

export function NewsSection() {
  return (
    <section id="novedades" className="relative mx-auto max-w-7xl px-5 py-28 md:py-32">
      <SectionHeading eyebrow="Novedades" title="Lo último del" highlight="reino" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {RELEASE_NOTES.map(({ icon: Icon, title, description }, i) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: EASE_OUT }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0c0b0a] p-6 transition-colors hover:border-primary/35"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent transition-all duration-500 group-hover:via-primary/80" />
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary transition-transform duration-500 group-hover:rotate-[10deg] group-hover:scale-110">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-title text-lg text-white/95">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{description}</p>
          </motion.article>
        ))}
      </div>
      <Reveal delay={0.2} className="mt-10 text-center">
        <Link
          href="/noticias"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
        >
          <Newspaper className="h-4 w-4" />
          Ver todas las noticias
        </Link>
      </Reveal>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-32 md:py-44">
      <Image src="/juego/loading_screen/argos.jpg" alt="" fill sizes="100vw" className="object-cover object-[center_30%]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,170,113,0.18)_0%,transparent_60%)]" />
      <Embers count={30} />

      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">El salón te espera</p>
          <h2 className="mt-6 font-title text-4xl leading-[1.05] text-white/95 min-[400px]:text-5xl md:text-7xl">
            Forja tu <span className="landing-shimmer-text">destino</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/65 md:text-lg">
            Entra al portal, reclama tus recursos y comienza a invocar. Sin descargas, sin instalaciones.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/juego"
            className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-9 py-4 text-base font-bold text-primary-foreground shadow-[0_0_50px_rgba(201,170,113,0.55)] transition-shadow hover:shadow-[0_0_70px_rgba(201,170,113,0.8)] sm:w-auto"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">Entrar al portal</span>
            <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/juego/registro"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-primary/40 bg-black/40 px-8 py-4 text-base font-bold text-primary backdrop-blur-sm transition-colors hover:bg-primary/10 sm:w-auto"
          >
            <UserPlus className="h-5 w-5" />
            Crear cuenta
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative bg-black">
      <GoldRule />
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row">
        <div className="flex items-center gap-3">
          <Image src="/assets/einherjer-logo.jpg" alt="" width={32} height={32} className="rounded-lg border border-primary/20" />
          <div>
            <p className="font-title text-sm tracking-[0.2em] text-primary">EINHERJAR BLITZ</p>
            <p className="text-xs text-white/40">© {new Date().getFullYear()} · Juego en desarrollo</p>
          </div>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/50" aria-label="Pie de página">
          <Link href="/juego" className="transition-colors hover:text-primary">Portal</Link>
          <Link href="/juego/registro" className="transition-colors hover:text-primary">Crear cuenta</Link>
          <Link href="/noticias" className="transition-colors hover:text-primary">Noticias</Link>
        </nav>
      </div>
    </footer>
  );
}

export function SideDots({ activeSection }: { activeSection: string }) {
  return (
    <nav className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 xl:flex" aria-label="Navegación rápida">
      {SECTIONS.map(({ id, label }) => (
        <button key={id} type="button" onClick={() => scrollToSection(id)} className="group relative flex items-center justify-end" aria-label={label}>
          <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded-md border border-primary/20 bg-black/80 px-2 py-1 text-xs text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
            {label}
          </span>
          <span
            className={cn(
              'block rounded-full transition-all duration-300',
              activeSection === id ? 'h-6 w-1.5 bg-primary shadow-[0_0_10px_rgba(201,170,113,0.8)]' : 'h-1.5 w-1.5 bg-white/30 group-hover:bg-primary/70'
            )}
          />
        </button>
      ))}
    </nav>
  );
}
