'use client';

import type { PointerEvent, ReactNode } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRINGS } from './presets';

type TiltCardProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children: ReactNode;
  /** Maximum tilt in degrees. */
  max?: number;
  /** Soft light that follows the pointer. */
  glare?: boolean;
  /** Scale while pressed; set to 1 to disable. */
  press?: number;
};

/**
 * Card that leans toward the mouse with a glare highlight, and sinks a little
 * when pressed. Touch only gets the press; reduced motion gets neither tilt.
 */
export function TiltCard({ children, className, style, max = 8, glare = true, press = 0.97, ...props }: TiltCardProps) {
  const reduceMotion = useReducedMotion();
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useSpring(useMotionValue(0), { stiffness: 200, damping: 30 });
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22), transparent 55%)`;

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 2 * max);
    rotateX.set(-(py - 0.5) * 2 * max);
    glareX.set(px * 100);
    glareY.set(py * 100);
    glareOpacity.set(1);
  };

  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      {...props}
      className={cn('relative', className)}
      style={{ ...style, rotateX, rotateY, transformPerspective: 900 }}
      whileTap={press === 1 ? undefined : { scale: press }}
      transition={SPRINGS.snappy}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
      {glare && !reduceMotion ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{ background: glareBackground, opacity: glareOpacity }}
        />
      ) : null}
    </motion.div>
  );
}
