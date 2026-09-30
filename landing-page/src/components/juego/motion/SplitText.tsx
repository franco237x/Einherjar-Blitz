'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT_EXPO } from './presets';

interface SplitTextProps {
  text: string;
  className?: string;
  /** Seconds before the first letter. */
  delay?: number;
  /** Seconds between letters. */
  step?: number;
}

/**
 * Title whose letters rise out of a mask one after another. Screen readers get
 * the plain text; each word stays unbreakable.
 */
export function SplitText({ text, className, delay = 0, step = 0.028 }: SplitTextProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <span className={className}>{text}</span>;

  let letter = 0;
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {text.split(' ').map((word, wordIndex) => (
        <span key={wordIndex} aria-hidden="true" className="inline-block whitespace-nowrap">
          {Array.from(word).map((char) => {
            const index = letter++;
            return (
              <span key={index} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.7, delay: delay + index * step, ease: EASE_OUT_EXPO }}
                >
                  {char}
                </motion.span>
              </span>
            );
          })}
          {wordIndex < text.split(' ').length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}
