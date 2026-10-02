'use client';

import { useEffect, useRef } from 'react';
import { ATLAS_COLUMNS, FRAME_SIZE } from '@/lib/jardin/sprites';

/** Loops an atlas clip on a small canvas (almanac and menus). */
export function AnimatedSprite({
  url,
  frames,
  size,
  flip = false,
  className = '',
}: {
  url: string;
  frames: number;
  size: number;
  flip?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const image = new Image();
    image.src = url;
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      if (image.complete && image.naturalWidth) {
        const frame = Math.floor(((now - start) / 1000) * 30) % frames;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);
        if (flip) {
          ctx.translate(size, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(
          image,
          (frame % ATLAS_COLUMNS) * FRAME_SIZE,
          Math.floor(frame / ATLAS_COLUMNS) * FRAME_SIZE,
          FRAME_SIZE,
          FRAME_SIZE,
          0,
          0,
          size,
          size,
        );
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [url, frames, size, flip]);
  return <canvas ref={canvasRef} style={{ width: size, height: size }} className={className} aria-hidden />;
}
