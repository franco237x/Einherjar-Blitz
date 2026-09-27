'use client';

import { memo, useEffect, useState } from 'react';
import type { CharacterAnimationClip, CharacterAnimationName } from '@/constants/characterAssets';
import { cn } from '@/lib/utils';

interface SpriteActorProps {
  animation: CharacterAnimationName;
  clip: CharacterAnimationClip;
  mirrored?: boolean;
  compact?: boolean;
  className?: string;
  onComplete?: () => void;
}

const decodedFrameCache = new Map<string, Promise<void>>();

/** Preloads and decodes a frame so swapping `src` never flashes. */
function decodeFrame(src: string): Promise<void> {
  const cached = decodedFrameCache.get(src);
  if (cached) return cached;

  const image = new Image();
  image.src = src;
  const pending = image.decode().catch(() => {
    decodedFrameCache.delete(src);
  });
  decodedFrameCache.set(src, pending);
  return pending;
}

export const SpriteActor = memo(function SpriteActor({
  animation,
  clip,
  mirrored = false,
  compact = false,
  className,
  onComplete,
}: SpriteActorProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    setFrameIndex(0);

    const startPlayback = () => {
      if (clip.frames.length <= 1) {
        if (!clip.loop) onComplete?.();
        return;
      }

      timer = setInterval(() => {
        setFrameIndex((current) => {
          const next = current + 1;
          if (next < clip.frames.length) return next;
          if (clip.loop) return 0;
          if (timer) clearInterval(timer);
          onComplete?.();
          return current;
        });
      }, clip.frameDurationMs);
    };

    // Start once every frame is decoded; decoding errors still play the clip.
    void Promise.all(clip.frames.map(decodeFrame)).finally(() => {
      if (!cancelled) startPlayback();
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [animation, clip, onComplete]);

  return (
    <img
      src={clip.frames[frameIndex] ?? clip.frames[0]}
      alt=""
      draggable={false}
      className={cn(
        'pointer-events-none select-none object-contain',
        compact ? 'h-[min(42vh,190px)] w-[min(42vh,190px)]' : 'h-[min(52vh,280px)] w-[min(52vh,280px)]',
        mirrored && '-scale-x-100',
        className
      )}
    />
  );
});
