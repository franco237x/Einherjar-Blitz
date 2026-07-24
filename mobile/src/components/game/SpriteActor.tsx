import React, { memo, useEffect, useState } from 'react';
import {
  Image,
  type ImageRef,
  type ImageSource,
} from 'expo-image';
import {
  StyleSheet,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import type {
  CharacterAnimationClip,
  CharacterAnimationName,
} from '@/constants/characterAssets';

interface SpriteActorProps {
  animation: CharacterAnimationName;
  clip: CharacterAnimationClip;
  mirrored?: boolean;
  compact?: boolean;
  style?: StyleProp<ImageStyle>;
  onComplete?: () => void;
}

const decodedFrameCache = new Map<
  ImageSourcePropType,
  Promise<ImageRef>
>();

function getLoadableSource(
  source: ImageSourcePropType
): ImageSource | number {
  if (Array.isArray(source)) {
    const firstSource = source[0];

    if (!firstSource) {
      throw new Error('Animation frame source cannot be empty.');
    }

    return firstSource;
  }

  return source;
}

function decodeFrame(source: ImageSourcePropType): Promise<ImageRef> {
  const cachedFrame = decodedFrameCache.get(source);
  if (cachedFrame) return cachedFrame;

  const pendingFrame = Image.loadAsync(getLoadableSource(source));
  decodedFrameCache.set(source, pendingFrame);
  pendingFrame.catch(() => decodedFrameCache.delete(source));

  return pendingFrame;
}

export const SpriteActor = memo(function SpriteActor({
  animation,
  clip,
  mirrored = false,
  compact = false,
  style,
  onComplete,
}: SpriteActorProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [decodedFrames, setDecodedFrames] = useState<
    readonly ImageRef[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    setFrameIndex(0);
    setDecodedFrames(null);

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

    Promise.all(clip.frames.map(decodeFrame))
      .then((frames) => {
        if (cancelled) return;

        setDecodedFrames(frames);
        startPlayback();
      })
      .catch(() => {
        if (cancelled) return;

        // Bundled assets should always decode. Keep the animation functional if
        // a platform decoder fails, using the original sources as a fallback.
        startPlayback();
      });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [animation, clip, onComplete]);

  return (
    <Image
      source={
        decodedFrames?.[frameIndex] ??
        getLoadableSource(clip.frames[0])
      }
      style={[
        styles.sprite,
        compact && styles.compact,
        mirrored && styles.mirrored,
        style,
      ]}
      contentFit="contain"
      transition={0}
    />
  );
});

const styles = StyleSheet.create({
  sprite: {
    width: '100%',
    height: '100%',
    maxHeight: 295,
  },
  compact: {
    maxHeight: 210,
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
});
