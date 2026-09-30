'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { EASE_OUT_EXPO } from '../motion';

/**
 * StoreBackdrop — Blurred city art behind the store header. It settles from a
 * slight zoom on arrival and drifts up slower than the page while scrolling.
 */
export function StoreBackdrop({ src = '/juego/loading_screen/manhattan.jpg' }: { src?: string }) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, -150]);
  const opacity = useTransform(scrollY, [0, 520], [0.2, 0.08]);

  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 h-[50vh] w-full object-cover blur-[3px] will-change-transform [mask-image:linear-gradient(180deg,#000_0%,transparent_100%)]"
      style={reduceMotion ? { opacity: 0.2 } : { y, opacity }}
      initial={{ scale: 1.14 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2.4, ease: EASE_OUT_EXPO }}
    />
  );
}
