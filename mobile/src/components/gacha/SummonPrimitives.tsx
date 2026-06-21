/**
 * SummonPrimitives — Reusable animated building blocks for the summon sequence.
 *
 * All components use react-native-reanimated (UI-thread) and accept a
 * `progress` SharedValue<number> (0 → 1) so the parent orchestrator can
 * drive them without re-rendering.
 *
 * Rules of Hooks compliance: every animated element used inside a `.map()`
 * is its own component, so hooks are always called at the top level.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { RARITIES, type RewardItem } from '@/constants/gachaData';

const { width: SCREEN_W, height: SCREEN_H } = require('react-native').Dimensions.get('window');

// ─── helpers ─────────────────────────────────────────────────────────
/** Deterministic pseudo-random in [0,1) from a seed — stable across renders. */
function rand(seed: number): number {
  const x = Math.sin(seed * 9999.137) * 43758.5453;
  return x - Math.floor(x);
}

// ═══════════════════════════════════════════════════════════════════════
// 1. Particle — single orbiting / converging dot
// ═══════════════════════════════════════════════════════════════════════
interface ParticleProps {
  progress: SharedValue<number>;
  index: number;
  total: number;
  color: string;
  startRadius: number;
  endRadius: number;
  size?: number;
  spin?: boolean;
}

export const Particle = ({
  progress,
  index,
  total,
  color,
  startRadius,
  endRadius,
  size = 6,
  spin = true,
}: ParticleProps) => {
  const angle = (index * 360) / total;
  const r = rand(index + 1);

  const style = useAnimatedStyle(() => {
    const radius = interpolate(progress.value, [0, 1], [startRadius, endRadius]);
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    const scale = interpolate(progress.value, [0, 0.7, 1], [0.4, 1, 1.4]);
    const opacity = interpolate(progress.value, [0, 0.3, 0.9, 1], [0, 0.6, 1, 0.8]);
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
        ...(spin ? [{ rotate: `${progress.value * 720 * r}deg` }] : []),
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 6,
          elevation: 4,
        },
        style,
      ]}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════
// 2. LightningBolt — jagged crackling line (mythic)
// ═══════════════════════════════════════════════════════════════════════
interface LightningBoltProps {
  progress: SharedValue<number>;
  seed: number;
  color: string;
  delay: number;
}

export const LightningBolt = ({ progress, seed, color, delay }: LightningBoltProps) => {
  // Build a jagged vertical path with deterministic offsets
  const segments = useMemo(() => {
    const segs: { dx: number; dy: number }[] = [];
    const segCount = 6;
    const segHeight = SCREEN_H / segCount;
    for (let i = 0; i < segCount; i++) {
      segs.push({
        dx: (rand(seed * 13 + i) - 0.5) * 80,
        dy: segHeight,
      });
    }
    return segs;
  }, [seed]);

  const startX = useMemo(() => rand(seed * 7) * SCREEN_W, [seed]);
  const angle = useMemo(() => (rand(seed * 3) - 0.5) * 30, [seed]);

  const style = useAnimatedStyle(() => {
    // Bolt flickers: appears at random intervals during progress
    const t = progress.value;
    const flicker = Math.sin((t + seed) * 40) > 0.6 ? 1 : 0;
    const visible = t > 0.2 && t < 0.95 ? flicker : 0;
    const opacity = visible * interpolate(t, [0.2, 0.6, 0.95], [0.3, 1, 0]);
    return {
      opacity,
      transform: [
        { translateX: startX },
        { rotate: `${angle}deg` },
        { scaleY: interpolate(t, [0, 0.4, 1], [0, 1, 1]) },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, style]}>
      {segments.map((seg, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: i * (SCREEN_H / segments.length),
            left: seg.dx,
            width: 3,
            height: seg.dy + 4,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 8,
            transform: [{ skewX: `${seg.dx * 0.3}deg` }],
          }}
        />
      ))}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// 3. MeteorStreak — diagonal falling streak (legendary)
// ═══════════════════════════════════════════════════════════════════════
interface MeteorStreakProps {
  progress: SharedValue<number>;
  index: number;
  color: string;
}

export const MeteorStreak = ({ progress, index, color }: MeteorStreakProps) => {
  const startX = rand(index + 1) * SCREEN_W * 1.3 - SCREEN_W * 0.15;
  const delay = rand(index + 7) * 0.5; // 0..0.5 of progress
  const length = 80 + rand(index + 3) * 120;
  const speed = 0.8 + rand(index + 11) * 0.4;

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const local = interpolate(t, [delay, delay + 0.3 * speed], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const travelX = -SCREEN_W * 0.6;
    const travelY = SCREEN_H * 1.2;
    return {
      opacity: interpolate(local, [0, 0.1, 0.8, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: startX + travelX * local },
        { translateY: -100 + travelY * local },
        { rotate: '135deg' },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, style]}>
      <LinearGradient
        colors={[color, 'transparent']}
        style={{ width: length, height: 3, borderRadius: 2 }}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// 4. Ripple — expanding concentric ring (rare)
// ═══════════════════════════════════════════════════════════════════════
interface RippleProps {
  progress: SharedValue<number>;
  index: number;
  total: number;
  color: string;
  maxRadius: number;
}

export const Ripple = ({ progress, index, total, color, maxRadius }: RippleProps) => {
  const delay = (index / total) * 0.6;

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const local = interpolate(t, [delay, delay + 0.4], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const scale = interpolate(local, [0, 1], [0.1, 1]);
    const opacity = interpolate(local, [0, 0.2, 0.8, 1], [0, 0.8, 0.4, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: maxRadius * 2,
          height: maxRadius * 2,
          borderRadius: maxRadius,
          borderWidth: 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════
// 5. StarRays — radial god-ray halo behind the best card (reveal)
// ═══════════════════════════════════════════════════════════════════════
interface StarRaysProps {
  revealProgress: SharedValue<number>;
  color: string;
  rayCount?: number;
}

export const StarRays = ({ revealProgress, color, rayCount = 16 }: StarRaysProps) => {
  const spin = useSharedValue(0);

  React.useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 20000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [spin]);

  const containerStyle = useAnimatedStyle(() => {
    const t = revealProgress.value;
    return {
      opacity: interpolate(t, [0, 0.3, 1], [0, 0.6, 0.4]),
      transform: [{ scale: interpolate(t, [0, 1], [0.5, 1.1]) }],
    };
  });

  const spinStyle = useAnimatedStyle(() => {
    const degrees = interpolate(spin.value, [0, 1], [0, 360]);
    return { transform: [{ rotate: `${degrees}deg` }] };
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, containerStyle]}
      pointerEvents="none"
    >
      <Animated.View style={spinStyle}>
        {Array.from({ length: rayCount }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 3,
              height: 400,
              backgroundColor: color,
              opacity: 0.15,
              transformOrigin: 'bottom center',
              transform: [{ rotate: `${(i * 360) / rayCount}deg` }],
            }}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// 6. BurstParticle — particle that explodes outward from center (flash)
// ═══════════════════════════════════════════════════════════════════════
interface BurstParticleProps {
  trigger: SharedValue<number>; // jumps 0 → 1 to trigger
  index: number;
  color: string;
  maxSize: number;
}

export const BurstParticle = ({ trigger, index, color, maxSize }: BurstParticleProps) => {
  const angle = rand(index + 1) * Math.PI * 2;
  const distance = 150 + rand(index + 5) * 250;
  const size = 4 + rand(index + 9) * maxSize;
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance;

  const style = useAnimatedStyle(() => {
    const t = trigger.value;
    const scale = interpolate(t, [0, 0.1, 1], [0, 1, 0]);
    const opacity = interpolate(t, [0, 0.1, 0.7, 1], [0, 1, 1, 0]);
    return {
      transform: [
        { translateX: interpolate(t, [0, 1], [0, tx]) },
        { translateY: interpolate(t, [0, 1], [0, ty]) },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 6,
        },
        style,
      ]}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════
// 7. FlipCard3D — 3D flip reveal for a reward card
// ═══════════════════════════════════════════════════════════════════════
interface FlipCard3DProps {
  item: RewardItem;
  index: number;
  isBest: boolean;
  delayMs: number;
}

export const FlipCard3D = ({ item, index, isBest, delayMs }: FlipCard3DProps) => {
  const flip = useSharedValue(0);
  const rarity = RARITIES[item.rarity];

  React.useEffect(() => {
    flip.value = withDelay(
      delayMs,
      withSpring(1, { damping: 14, stiffness: 120, mass: 0.6 }),
    );
  }, [flip, delayMs]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [180, 0]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: interpolate(flip.value, [0, 0.5, 1], [0, 0, 1]),
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [0, 180])
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: interpolate(flip.value, [0, 0.5, 1], [1, 0, 0]),
    };
  });

  const typeLabel =
    item.type === 'persona' ? 'Persona' : item.type === 'invocacion' ? 'Invocación' : 'Recurso';

  return (
    <View style={styles3d.cardWrap} pointerEvents="none">
      {/* Back face (card back) */}
      <Animated.View style={[styles3d.face, styles3d.back, backStyle]}>
        <View style={[styles3d.backPattern, { borderColor: rarity.color }]}>
          <Ionicons name="diamond" size={32} color={rarity.color} />
          <View style={styles3d.backStars}>
            {Array.from({ length: rarity.stars }).map((_, i) => (
              <Ionicons key={i} name="star" size={8} color={rarity.color} />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Front face (revealed) */}
      <Animated.View style={[styles3d.face, styles3d.front, frontStyle]}>
        <View style={[styles3d.cardInner, { borderColor: rarity.color }]}>
          {/* Image / fallback */}
          <View style={styles3d.imageWrap}>
            {item.image ? (
              <Animated.Image
                source={item.image}
                style={styles3d.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles3d.fallback, { backgroundColor: rarity.glowColor }]}>
                <Ionicons name={item.fallbackIcon as any} size={40} color={rarity.color} />
              </View>
            )}
            <View style={[styles3d.imageOverlay, { backgroundColor: rarity.glowColor }]} />
          </View>

          {/* Info */}
          <View style={styles3d.info}>
            <View style={styles3d.stars}>
              {Array.from({ length: rarity.stars }).map((_, i) => (
                <Ionicons key={i} name="star" size={10} color={rarity.color} />
              ))}
            </View>
            <Animated.Text
              style={[styles3d.name, { color: rarity.color }]}
              numberOfLines={2}
            >
              {item.name}
            </Animated.Text>
            <View style={[styles3d.typeBadge, { borderColor: rarity.color }]}>
              <Animated.Text style={[styles3d.typeText, { color: rarity.color }]}>
                {typeLabel}
              </Animated.Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles3d = StyleSheet.create({
  cardWrap: {
    width: (SCREEN_W - Spacing.xl * 2 - Spacing.md) / 2,
    height: 240,
    marginBottom: Spacing.md,
    transform: [{ perspective: 1000 }],
  },
  face: {
    ...StyleSheet.absoluteFill,
    backfaceVisibility: 'hidden',
  },
  back: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPattern: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    borderWidth: 2,
    backgroundColor: 'rgba(10,10,10,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  backStars: {
    flexDirection: 'row',
    gap: 2,
  },
  front: {},
  cardInner: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    opacity: 0.5,
  },
  info: {
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  typeText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
