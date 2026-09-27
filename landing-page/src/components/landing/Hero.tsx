'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown, Sparkles, UserPlus } from 'lucide-react';
import { REWARDS_TABLE } from '@/constants/gachaData';
import { EASE_OUT, Embers } from './primitives';
import { scrollToSection } from './SiteHeader';

const SLIDES = [
  { src: '/juego/loading_screen/orfevre.jpg', name: 'Orfevre', title: 'Esgrimista Dorado' },
  { src: '/juego/loading_screen/argos.jpg', name: 'Argos', title: 'El Prodigio de Acero' },
  { src: '/juego/loading_screen/nathan.jpg', name: 'Nathan', title: 'Relámpago Silencioso' },
  { src: '/juego/loading_screen/manhattan.jpg', name: 'Manhattan', title: 'Guardián del Reino' },
];

const HERO_STATS = [
  { value: '5', label: 'Rarezas' },
  { value: String(REWARDS_TABLE.length), label: 'Recompensas' },
  { value: '6', label: 'Rangos' },
];

function AnimatedWord({ text, delay, className }: { text: string; delay: number; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block"
          initial={{ opacity: 0, y: 40, rotateX: -90, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: delay + i * 0.06, ease: EASE_OUT }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(interval);
  }, []);

  // Scroll parallax: background drifts slower, content fades out.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Pointer parallax on the emblem and glow.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const glowX = useTransform(sx, (v) => v * 40);
  const glowY = useTransform(sy, (v) => v * 40);
  const emblemX = useTransform(sx, (v) => v * -14);
  const emblemY = useTransform(sy, (v) => v * -14);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set((event.clientX - rect.left) / rect.width - 0.5);
    my.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const current = SLIDES[slide];

  return (
    <section
      id="inicio"
      ref={ref}
      onPointerMove={onPointerMove}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-black"
    >
      {/* Crossfading key art with Ken Burns */}
      <motion.div className="absolute inset-0" style={{ y: bgY }} aria-hidden="true">
        {SLIDES.map((s, i) => (
          <div
            key={s.src}
            className="absolute inset-0 transition-opacity duration-[1800ms] ease-in-out"
            style={{ opacity: i === slide ? 1 : 0 }}
          >
            <Image
              src={s.src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={i === slide ? 'landing-ken-burns object-cover' : 'object-cover'}
            />
          </div>
        ))}
      </motion.div>

      {/* Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.75)_60%,#000_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black" />
      <div
        className="landing-spin-slower absolute left-1/2 top-1/2 h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
        style={{ background: 'repeating-conic-gradient(from 0deg, #c9aa71 0deg 2deg, transparent 2deg 18deg)' }}
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]"
        style={{ x: glowX, y: glowY }}
        aria-hidden="true"
      />
      <Embers count={40} />

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pb-24 pt-28 text-center"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          className="relative mb-8"
          style={{ x: emblemX, y: emblemY }}
          initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: EASE_OUT }}
        >
          <span className="landing-spin-slow absolute -inset-5 rounded-full border border-dashed border-primary/40" />
          <span className="landing-pulse-ring absolute -inset-2 rounded-3xl border border-primary/50" />
          <Image
            src="/assets/einherjer-logo.jpg"
            alt="Emblema de Einherjar Blitz"
            width={112}
            height={112}
            priority
            className="relative rounded-3xl border border-primary/40 shadow-[0_0_60px_rgba(201,170,113,0.45)]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.1em' }}
          animate={{ opacity: 1, letterSpacing: '0.45em' }}
          transition={{ duration: 1.4, delay: 0.3, ease: EASE_OUT }}
          className="mb-5 text-[11px] font-bold uppercase text-primary/90 sm:text-xs"
        >
          Portal del Guerrero
        </motion.p>

        <h1 className="font-title text-[13vw] leading-[0.95] tracking-[0.04em] [perspective:800px] min-[500px]:text-7xl md:text-8xl lg:text-[7.5rem]">
          <AnimatedWord text="EINHERJAR" delay={0.5} className="landing-shimmer-text block" />
          <AnimatedWord text="BLITZ" delay={1.05} className="block text-white/95" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.5, ease: EASE_OUT }}
          className="mt-7 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
        >
          Invoca leyendas, forja tu economía y escala los rangos del Valhalla.
          Tu cuenta, tu inventario y tus recursos, ahora desde el navegador.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.75, ease: EASE_OUT }}
          className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
        >
          <Link
            href="/juego"
            className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-[0_0_40px_rgba(201,170,113,0.5)] transition-all hover:shadow-[0_0_60px_rgba(201,170,113,0.75)] sm:w-auto"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Sparkles className="relative h-5 w-5" />
            <span className="relative">Entrar al portal</span>
            <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/juego/registro"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-primary/40 bg-black/30 px-7 py-4 text-base font-bold text-primary backdrop-blur-sm transition-colors hover:border-primary/70 hover:bg-primary/10 sm:w-auto"
          >
            <UserPlus className="h-5 w-5" />
            Crear cuenta
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.1, duration: 1 }}
          className="mt-4 text-xs text-white/40"
        >
          La misma cuenta que usas en la app · Gratis
        </motion.p>

        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.9, ease: EASE_OUT }}
          className="mt-14 grid w-full max-w-md grid-cols-3 divide-x divide-primary/15 rounded-2xl border border-primary/15 bg-black/40 py-4 backdrop-blur-md"
        >
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col px-2">
              <dt className="order-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">{stat.label}</dt>
              <dd className="font-title text-2xl text-primary">{stat.value}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      {/* Current champion caption */}
      <div className="absolute bottom-8 left-6 z-10 hidden md:block" aria-live="polite">
        <motion.div key={current.name} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Campeón</p>
          <p className="font-title text-xl text-white/90">{current.name}</p>
          <p className="text-xs text-primary/80">{current.title}</p>
        </motion.div>
        <div className="mt-3 flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`Mostrar a ${s.name}`}
              className={`h-1 rounded-full transition-all duration-500 ${i === slide ? 'w-8 bg-primary' : 'w-3 bg-white/25 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      <motion.button
        type="button"
        onClick={() => scrollToSection('portal')}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/40 transition-colors hover:text-primary"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
        aria-label="Bajar a la siguiente sección"
      >
        <ChevronDown className="h-7 w-7" />
      </motion.button>
    </section>
  );
}
