'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { scrollToSection } from './smoothScroll';

export const SECTIONS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'portal', label: 'El portal' },
  { id: 'personajes', label: 'Personajes' },
  { id: 'invocaciones', label: 'Invocaciones' },
  { id: 'progresion', label: 'Progresión' },
  { id: 'evento', label: 'Evento' },
] as const;

export function SiteHeader({ activeSection }: { activeSection: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
        scrolled || menuOpen ? 'border-b border-white/[0.06] bg-[#0b0a09]/85 backdrop-blur-md' : 'border-b border-transparent'
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <button type="button" onClick={() => go('inicio')} className="flex items-center gap-3" aria-label="Ir al inicio">
          <Image src="/assets/einherjer-logo.jpg" alt="" width={30} height={30} className="rounded-md" priority />
          <span className="font-title text-[15px] tracking-[0.22em] text-white/90">EINHERJAR BLITZ</span>
        </button>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Secciones">
          {SECTIONS.slice(1).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              aria-current={activeSection === id ? 'true' : undefined}
              className={cn(
                'relative py-2 text-sm transition-colors',
                activeSection === id ? 'text-white' : 'text-white/50 hover:text-white/85'
              )}
            >
              {label}
              <span
                className={cn(
                  'absolute inset-x-0 -bottom-0.5 h-px origin-left bg-primary transition-transform duration-500',
                  activeSection === id ? 'scale-x-100' : 'scale-x-0'
                )}
              />
            </button>
          ))}
          <Link href="/noticias" className="py-2 text-sm text-white/50 transition-colors hover:text-white/85">
            Noticias
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/juego"
            className="group hidden items-center gap-2 rounded-full border border-primary/50 px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:inline-flex"
          >
            Entrar
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            className="p-2 text-white/80 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06] md:hidden"
            aria-label="Secciones"
          >
            <div className="flex flex-col px-6 py-4">
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => go(id)}
                  className={cn('py-3 text-left text-base', activeSection === id ? 'text-primary' : 'text-white/75')}
                >
                  {label}
                </button>
              ))}
              <Link href="/noticias" onClick={() => setMenuOpen(false)} className="py-3 text-base text-white/75">
                Noticias
              </Link>
              <Link
                href="/juego"
                className="mt-3 flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground"
              >
                Entrar al portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
