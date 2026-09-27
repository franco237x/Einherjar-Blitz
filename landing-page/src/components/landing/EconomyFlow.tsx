'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useInView } from 'framer-motion';
import { ArrowLeftRight, Gift, KeyRound, Orbit, ShoppingBag, Sparkles } from 'lucide-react';
import { EASE_OUT, SectionHeading } from './primitives';

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.6, ease: EASE_OUT, onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

function Node({
  icon,
  title,
  value,
  caption,
  accent,
  delay,
  children,
}: {
  icon: ReactNode;
  title: string;
  value: ReactNode;
  caption: string;
  accent: string;
  delay: number;
  children?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: EASE_OUT }}
      className="relative z-10 flex flex-col items-center text-center"
    >
      <div className="relative mb-5">
        <span className="landing-pulse-ring absolute inset-0 rounded-[28px] border" style={{ borderColor: accent }} />
        <span
          className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border bg-black/70 backdrop-blur-sm"
          style={{ borderColor: accent, boxShadow: `0 0 40px ${accent}40, inset 0 0 20px ${accent}20` }}
        >
          {icon}
        </span>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">{title}</p>
      <p className="mt-1 font-title text-4xl" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-white/55">{caption}</p>
      {children}
    </motion.div>
  );
}

function Connector({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay, ease: EASE_OUT }}
      className="relative hidden h-px flex-1 origin-left self-start md:mt-12 md:block"
      aria-hidden="true"
    >
      <svg className="absolute -top-[3px] h-[7px] w-full overflow-visible" preserveAspectRatio="none">
        <line x1="0" y1="3.5" x2="100%" y2="3.5" stroke="rgba(201,170,113,0.5)" strokeWidth="1.5" className="landing-dash" />
      </svg>
      <span className="landing-travel absolute -top-[5px] h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_14px_#c9aa71]" />
    </motion.div>
  );
}

export function EconomyFlow() {
  return (
    <section id="economia" className="relative overflow-hidden border-y border-primary/10 bg-[#050505] py-28 md:py-36">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,170,113,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,170,113,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Economía del reino"
          title="Cada llave"
          highlight="cuenta"
          subtitle="Un sistema simple y transparente: consigue llaves, conviértelas en esferas y gástalas en el altar o en la tienda. Todo con transacciones seguras en la nube."
        />

        <div className="flex flex-col items-stretch gap-14 md:flex-row md:items-start md:gap-4">
          <Node
            icon={<KeyRound className="h-10 w-10 text-primary" />}
            title="Llaves"
            value="1"
            caption="La moneda base. Se obtienen jugando y se pueden transferir a otros guerreros."
            accent="#c9aa71"
            delay={0}
          >
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              <ArrowLeftRight className="h-3.5 w-3.5 text-primary" /> Transferibles
            </span>
          </Node>
          <Connector delay={0.4} />
          <Node
            icon={<Orbit className="landing-spin-slow h-10 w-10 text-cyan-300" />}
            title="Esferas"
            value={<CountUp to={50} />}
            caption="Por cada llave convertida recibes 50 esferas, al instante."
            accent="#7ed9e7"
            delay={0.25}
          >
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              Tasa fija 1 : 50
            </span>
          </Node>
          <Connector delay={0.7} />
          <Node
            icon={<Gift className="h-10 w-10 text-purple-400" />}
            title="Recompensas"
            value={<CountUp to={17} suffix="+" />}
            caption="Úsalas en invocaciones y en la tienda oficial para conseguir tus favoritos."
            accent="#a855f7"
            delay={0.5}
          >
            <span className="mt-4 flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Gacha
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                <ShoppingBag className="h-3.5 w-3.5 text-purple-400" /> Tienda
              </span>
            </span>
          </Node>
        </div>
      </div>
    </section>
  );
}
