/**
 * SummonConverge — Rarity-specific convergence coreographies.
 *
 * Each component receives a `progress` SharedValue (0 → 1) driven by the
 * parent orchestrator. The duration differs per rarity so the pacing itself
 * communicates the pull's value (1.5s common → 5s mythic).
 *
 *  Mythic    — red lightning, screen shake, slow-mo, intense pulse
 *  Legendary — golden pillar of light, meteor streaks, ascending particles
 *  Epic      — purple galaxy spiral, orbiting particles
 *  Rare      — blue concentric ripples, soft drift
 *  Common    — minimal convergence, quick
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RARITIES, type RarityKey } from '@/constants/gachaData';
import {
  Particle,
  LightningBolt,
  MeteorStreak,
  Ripple,
} from './SummonPrimitives';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Shared orb component ─────────────────────────────────────────────
interface OrbProps {
  progress: SharedValue<number>;
  color: string;
  glowColor: string;
  baseSize?: number;
  pulse?: boolean;
}

const Orb = ({ progress, color, glowColor, baseSize = 70, pulse = true }: OrbProps) => {
  const style = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 0.9, 1], [0.1, 0.6, 1, 1.3]);
    const opacity = interpolate(progress.value, [0, 0.3, 0.8, 1], [0.3, 0.6, 0.9, 1]);
    const pulseScale = pulse
      ? 1 + Math.sin(progress.value * Math.PI * 8) * 0.08
      : 1;
    return {
      transform: [{ scale: scale * pulseScale }],
      opacity,
    };
  });

  const haloStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.2, 1, 1.8]);
    const opacity = interpolate(progress.value, [0, 0.4, 0.9, 1], [0, 0.3, 0.5, 0.2]);
    return { transform: [{ scale }], opacity };
  });

  return (
    <>
      {/* Outer halo */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: baseSize * 3,
            height: baseSize * 3,
            borderRadius: baseSize * 1.5,
            backgroundColor: glowColor,
          },
          haloStyle,
        ]}
      />
      {/* Core orb */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: baseSize,
            height: baseSize,
            borderRadius: baseSize / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 40,
            elevation: 30,
          },
          style,
        ]}
      />
      {/* Inner highlight */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: baseSize * 0.4,
            height: baseSize * 0.4,
            borderRadius: (baseSize * 0.4) / 2,
            backgroundColor: 'rgba(255,255,255,0.9)',
          },
          style,
        ]}
      />
    </>
  );
};

// ─── CenterIcon — icon that fades in with progress (uses useAnimatedStyle) ─
interface CenterIconProps {
  progress: SharedValue<number>;
  name: React.ComponentProps<typeof Ionicons>['name'];
  size: number;
}

const CenterIcon = ({ progress, name, size }: CenterIconProps) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));
  return (
    <Animated.View style={style}>
      <Ionicons name={name} size={size} color="#fff" />
    </Animated.View>
  );
};

// ─── Vignette overlay ─────────────────────────────────────────────────
const Vignette = ({ color, intensity = 0.6 }: { color: string; intensity?: number }) => (
  <LinearGradient
    colors={['transparent', 'transparent', color]}
    locations={[0, 0.6, 1]}
    style={StyleSheet.absoluteFill}
    pointerEvents="none"
  />
);

// ═══════════════════════════════════════════════════════════════════════
// MYTHIC — red lightning + screen shake + slow-mo
// ═══════════════════════════════════════════════════════════════════════
const BOLT_COUNT = 5;
const MYTHIC_PARTICLES = 28;

export const MythicConverge = ({ progress }: { progress: SharedValue<number> }) => {
  const cfg = RARITIES.mythic;
  const shake = useSharedValue(0);

  useEffect(() => {
    // Screen shake: small random jolts, intensifying
    shake.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 80, easing: Easing.linear }),
        withTiming(-1, { duration: 80, easing: Easing.linear }),
      ),
      -1,
      true,
    );
  }, [shake]);

  const shakeStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const intensity = interpolate(t, [0, 0.5, 1], [0, 3, 12]);
    return {
      transform: [
        { translateX: shake.value * intensity },
        { translateY: shake.value * intensity * 0.5 },
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, shakeStyle]}>
      <Vignette color="rgba(120,0,0,0.5)" />

      {/* Lightning bolts */}
      {Array.from({ length: BOLT_COUNT }).map((_, i) => (
        <LightningBolt
          key={`bolt-${i}`}
          progress={progress}
          seed={i + 1}
          color={cfg.color}
          delay={i * 0.15}
        />
      ))}

      {/* Converging particles */}
      {Array.from({ length: MYTHIC_PARTICLES }).map((_, i) => (
        <Particle
          key={`p-${i}`}
          progress={progress}
          index={i}
          total={MYTHIC_PARTICLES}
          color={cfg.color}
          startRadius={220}
          endRadius={15}
          size={5 + (i % 3) * 2}
        />
      ))}

      {/* Central orb */}
      <View style={styles.center}>
        <Orb progress={progress} color={cfg.color} glowColor={cfg.glowColor} baseSize={80} />
        <CenterIcon progress={progress} name="flash" size={32} />
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// LEGENDARY — golden pillar + meteor streaks + ascending particles
// ═══════════════════════════════════════════════════════════════════════
const METEOR_COUNT = 8;
const LEGENDARY_PARTICLES = 24;

export const LegendaryConverge = ({ progress }: { progress: SharedValue<number> }) => {
  const cfg = RARITIES.legendary;

  const pillarStyle = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: interpolate(t, [0, 0.3, 0.9, 1], [0, 0.5, 0.8, 1]),
      transform: [{ scaleY: interpolate(t, [0, 1], [0, 1]) }],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Vignette color="rgba(80,60,20,0.4)" />

      {/* Golden pillar of light rising from bottom */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: SCREEN_W / 2 - 60,
            width: 120,
            height: SCREEN_H,
            transformOrigin: 'bottom center',
          },
          pillarStyle,
        ]}
      >
        <LinearGradient
          colors={['transparent', cfg.glowColor, cfg.color, cfg.glowColor, 'transparent']}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Meteor streaks falling */}
      {Array.from({ length: METEOR_COUNT }).map((_, i) => (
        <MeteorStreak key={`m-${i}`} progress={progress} index={i} color={cfg.color} />
      ))}

      {/* Ascending particles (opposite direction = endRadius > startRadius) */}
      {Array.from({ length: LEGENDARY_PARTICLES }).map((_, i) => (
        <Particle
          key={`p-${i}`}
          progress={progress}
          index={i}
          total={LEGENDARY_PARTICLES}
          color={cfg.color}
          startRadius={20}
          endRadius={200}
          size={4 + (i % 3) * 2}
          spin={false}
        />
      ))}

      {/* Central orb */}
      <View style={styles.center}>
        <Orb progress={progress} color={cfg.color} glowColor={cfg.glowColor} baseSize={75} />
        <CenterIcon progress={progress} name="sunny" size={30} />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// EPIC — purple galaxy spiral
// ═══════════════════════════════════════════════════════════════════════
const EPIC_PARTICLES = 32;

export const EpicConverge = ({ progress }: { progress: SharedValue<number> }) => {
  const cfg = RARITIES.epic;
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [spin]);

  const spiralStyle = useAnimatedStyle(() => {
    const degrees = interpolate(spin.value, [0, 1], [0, 360]);
    return {
      transform: [{ rotate: `${degrees}deg` }],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Vignette color="rgba(60,0,100,0.4)" />

      {/* Rotating spiral of particles */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, spiralStyle]}>
        {Array.from({ length: EPIC_PARTICLES }).map((_, i) => (
          <SpiralParticle
            key={`sp-${i}`}
            progress={progress}
            index={i}
            total={EPIC_PARTICLES}
            color={cfg.color}
          />
        ))}
      </Animated.View>

      {/* Central orb */}
      <View style={styles.center}>
        <Orb progress={progress} color={cfg.color} glowColor={cfg.glowColor} baseSize={70} />
        <CenterIcon progress={progress} name="sparkles" size={28} />
      </View>
    </View>
  );
};

// Spiral particle — radius grows with index, creating a galaxy arm
const SpiralParticle = ({
  progress,
  index,
  total,
  color,
}: {
  progress: SharedValue<number>;
  index: number;
  total: number;
  color: string;
}) => {
  const armOffset = (index % 3) * 120; // 3 spiral arms
  const angle = (index * 720) / total + armOffset;
  const maxRadius = 60 + (index / total) * 180;

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const radius = interpolate(t, [0, 1], [0, maxRadius]);
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    const opacity = interpolate(t, [0, 0.3, 0.9, 1], [0, 0.5, 1, 0.8]);
    const scale = interpolate(t, [0, 0.5, 1], [0.3, 1, 1.3]);
    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════
// RARE — blue concentric ripples
// ═══════════════════════════════════════════════════════════════════════
const RIPPLE_COUNT = 5;
const RARE_PARTICLES = 16;

export const RareConverge = ({ progress }: { progress: SharedValue<number> }) => {
  const cfg = RARITIES.rare;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Vignette color="rgba(0,30,80,0.3)" />

      {/* Concentric ripples */}
      <View style={styles.center}>
        {Array.from({ length: RIPPLE_COUNT }).map((_, i) => (
          <Ripple
            key={`r-${i}`}
            progress={progress}
            index={i}
            total={RIPPLE_COUNT}
            color={cfg.color}
            maxRadius={160}
          />
        ))}

        {/* Drifting particles */}
        {Array.from({ length: RARE_PARTICLES }).map((_, i) => (
          <Particle
            key={`p-${i}`}
            progress={progress}
            index={i}
            total={RARE_PARTICLES}
            color={cfg.color}
            startRadius={140}
            endRadius={30}
            size={5}
            spin={false}
          />
        ))}

        {/* Central orb */}
        <Orb progress={progress} color={cfg.color} glowColor={cfg.glowColor} baseSize={60} />
        <CenterIcon progress={progress} name="water" size={26} />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// COMMON — minimal quick convergence
// ═══════════════════════════════════════════════════════════════════════
const COMMON_PARTICLES = 10;

export const CommonConverge = ({ progress }: { progress: SharedValue<number> }) => {
  const cfg = RARITIES.common;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.center}>
        {Array.from({ length: COMMON_PARTICLES }).map((_, i) => (
          <Particle
            key={`p-${i}`}
            progress={progress}
            index={i}
            total={COMMON_PARTICLES}
            color={cfg.color}
            startRadius={120}
            endRadius={20}
            size={4}
            spin={false}
          />
        ))}

        <Orb progress={progress} color="#ffffff" glowColor={cfg.glowColor} baseSize={50} pulse={false} />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Switcher
// ═══════════════════════════════════════════════════════════════════════
export const ConvergePhase = ({
  rarity,
  progress,
}: {
  rarity: RarityKey;
  progress: SharedValue<number>;
}) => {
  switch (rarity) {
    case 'mythic':
      return <MythicConverge progress={progress} />;
    case 'legendary':
      return <LegendaryConverge progress={progress} />;
    case 'epic':
      return <EpicConverge progress={progress} />;
    case 'rare':
      return <RareConverge progress={progress} />;
    default:
      return <CommonConverge progress={progress} />;
  }
};

// ─── Pacing per rarity (ms) ───────────────────────────────────────────
export const CONVERGE_DURATION: Record<RarityKey, number> = {
  mythic: 2500,
  legendary: 2500,
  epic: 2500,
  rare: 2500,
  common: 2500,
};

// ─── styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
