'use client';

import { motion } from 'framer-motion';
import { EASE_OUT_EXPO, SplitText } from '@/components/juego/motion';

/** Gold rule + label that draw in from the left; used by the section eyebrows. */
export function EyebrowContent({ text, delay = 0, inView = false }: { text: string; delay?: number; inView?: boolean }) {
  const lineShown = { scaleX: 1, transition: { duration: 0.8, delay, ease: EASE_OUT_EXPO } };
  const textShown = { opacity: 1, x: 0, transition: { duration: 0.6, delay: delay + 0.12, ease: EASE_OUT_EXPO } };
  const trigger = inView
    ? { whileInView: 'shown', viewport: { once: true, amount: 0.8 } }
    : { animate: 'shown' };

  return (
    <>
      <motion.span
        aria-hidden="true"
        className="h-px w-5 origin-left bg-gold/60"
        initial="hidden"
        variants={{ hidden: { scaleX: 0 }, shown: lineShown }}
        {...trigger}
      />
      <motion.span initial="hidden" variants={{ hidden: { opacity: 0, x: -10 }, shown: textShown }} {...trigger}>
        {text}
      </motion.span>
    </>
  );
}

export function Greeting({ username }: { username: string }) {
  return (
    <header className="mb-5">
      <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-gold">
        <EyebrowContent text="Portal del guerrero" />
      </p>
      <h1 className="mt-2 truncate font-title text-[27px] leading-tight text-white/95">
        <SplitText text="Salve," delay={0.08} step={0.03} />{' '}
        <SplitText text={username} className="text-gold-light" delay={0.26} step={0.035} />
      </h1>
    </header>
  );
}
