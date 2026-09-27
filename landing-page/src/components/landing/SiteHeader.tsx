'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, Newspaper, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SECTIONS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'portal', label: 'El portal' },
  { id: 'invocaciones', label: 'Invocaciones' },
  { id: 'economia', label: 'Economía' },
  { id: 'rangos', label: 'Rangos' },
  { id: 'arena', label: 'Arena' },
] as const;

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

export function SiteHeader({ activeSection }: { activeSection: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    setTimeout(() => scrollToSection(id), 80);
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500',
        scrolled || menuOpen
          ? 'border-b border-primary/15 bg-black/70 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button type="button" onClick={() => go('inicio')} className="group flex items-center gap-3" aria-label="Ir al inicio">
          <span className="relative">
            <Image
              src="/assets/einherjer-logo.jpg"
              alt=""
              width={34}
              height={34}
              className="rounded-lg border border-primary/30 transition-transform duration-500 group-hover:rotate-[8deg]"
              priority
            />
            <span className="absolute inset-0 rounded-lg shadow-[0_0_18px_rgba(201,170,113,0.45)] opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          <span className="hidden font-title text-lg tracking-[0.2em] text-primary min-[380px]:inline">EINHERJAR BLITZ</span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones">
          {SECTIONS.slice(1).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className={cn(
                'relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                activeSection === id ? 'text-primary' : 'text-white/60 hover:text-white'
              )}
            >
              {activeSection === id && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full border border-primary/30 bg-primary/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
          <Link href="/noticias" className="rounded-full px-3.5 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white">
            Noticias
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/juego"
            className="group relative hidden items-center gap-2 overflow-hidden rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_0_24px_rgba(201,170,113,0.35)] transition-shadow hover:shadow-[0_0_36px_rgba(201,170,113,0.6)] sm:inline-flex"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">Entrar al portal</span>
            <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            className="rounded-full p-2 text-primary lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-primary/10 lg:hidden"
            aria-label="Secciones"
          >
            <div className="flex flex-col gap-1 p-4">
              {SECTIONS.map(({ id, label }, i) => (
                <motion.button
                  key={id}
                  type="button"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => go(id)}
                  className={cn(
                    'rounded-xl px-4 py-3 text-left text-base font-medium',
                    activeSection === id ? 'bg-primary/10 text-primary' : 'text-white/80 hover:bg-white/5'
                  )}
                >
                  {label}
                </motion.button>
              ))}
              <Link
                href="/noticias"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-medium text-white/80 hover:bg-white/5"
              >
                <Newspaper className="h-4 w-4 text-primary" />
                Noticias
              </Link>
              <Link
                href="/juego"
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 font-bold text-primary-foreground"
              >
                Entrar al portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
