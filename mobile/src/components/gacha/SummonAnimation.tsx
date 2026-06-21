/**
 * SummonAnimation — Full-screen cinematic gacha experience (v2).
 *
 * Reanimated 4 — runs on the UI thread for 60fps.
 *
 * Phases:
 *   1. Converge — rarity-specific coreography (1.5s common → 5s mythic)
 *   2. Flash    — particle burst + color flash
 *   3. Reveal   — 3D flip cards with star rays + glassmorphism
 *
 * The best rarity pulled drives the entire visual identity (color, pacing,
 * coreography, particle count).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { RARITIES, type RewardItem, type RarityKey } from '@/constants/gachaData';
import { ConvergePhase, CONVERGE_DURATION } from './SummonConverge';
import { BurstParticle, StarRays, FlipCard3D } from './SummonPrimitives';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface SummonAnimationProps {
  visible: boolean;
  results: RewardItem[];
  onClose: () => void;
}

const RARITY_ORDER: RarityKey[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];

function getBestRarity(items: RewardItem[]): RarityKey {
  for (const r of RARITY_ORDER) {
    if (items.some((i) => i.rarity === r)) return r;
  }
  return 'common';
}

// Particle burst count per rarity
const BURST_COUNT: Record<RarityKey, number> = {
  mythic: 60,
  legendary: 45,
  epic: 30,
  rare: 20,
  common: 12,
};

type Phase = 'converge' | 'flash' | 'reveal';

export const SummonAnimation = ({ visible, results, onClose }: SummonAnimationProps) => {
  const [phase, setPhase] = useState<Phase>('converge');
  const phaseRef = useRef<Phase>('converge');

  // Shared values (UI thread)
  const progress = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const burst = useSharedValue(0);
  const revealOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bestRarity = getBestRarity(results);
  const bestConfig = RARITIES[bestRarity];
  const convergeDuration = CONVERGE_DURATION[bestRarity];
  const burstCount = BURST_COUNT[bestRarity];

  // Flash color escalates with rarity
  const flashColor =
    bestRarity === 'mythic'
      ? '#ef4444'
      : bestRarity === 'legendary'
        ? Colors.primaryGold
        : bestRarity === 'epic'
          ? '#a855f7'
          : bestRarity === 'rare'
            ? '#3b82f6'
            : '#ffffff';

  // ─── Phase orchestration ───────────────────────────────────────────
  const goToFlash = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Guard via ref — no stale closure
    if (phaseRef.current !== 'converge') return;
    phaseRef.current = 'flash';
    setPhase('flash');

    // Trigger particle burst
    burst.value = 0;
    burst.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });

    // Flash in → out
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withDelay(150, withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) })),
    );

    // After flash, go to reveal
    timeoutRef.current = setTimeout(() => {
      phaseRef.current = 'reveal';
      setPhase('reveal');
      revealOpacity.value = withTiming(1, { duration: 400 });
    }, 550);
  }, []);

  const startConvergence = useCallback(() => {
    progress.value = 0;
    textOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

    progress.value = withTiming(1, {
      duration: convergeDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    timeoutRef.current = setTimeout(() => goToFlash(), convergeDuration);
  }, [convergeDuration, goToFlash]);

  useEffect(() => {
    if (visible) {
      // Reset everything — ref first so goToFlash guard works immediately
      phaseRef.current = 'converge';
      setPhase('converge');
      progress.value = 0;
      flashOpacity.value = 0;
      burst.value = 0;
      revealOpacity.value = 0;
      textOpacity.value = 0;
      // Start on next frame to ensure shared values are reset
      requestAnimationFrame(() => startConvergence());
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ─── Animated styles ───────────────────────────────────────────────
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
    transform: [{ scale: interpolate(revealOpacity.value, [0, 1], [0.95, 1]) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(textOpacity.value, [0, 1], [0, 0.7]),
    transform: [{ scale: interpolate(textOpacity.value, [0, 1], [0.9, 1]) }],
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {/* ═══════════════════════════════════════════════════════════
            PHASE: Convergence
         ═══════════════════════════════════════════════════════════ */}
        {phase === 'converge' && (
          <ConvergePhase rarity={bestRarity} progress={progress} />
        )}

        {/* "Invocando..." text — visible during converge */}
        {phase === 'converge' && (
          <Animated.View style={[styles.textWrap, textStyle]} pointerEvents="none">
            <Text style={styles.convergenceText}>INVOCANDO</Text>
            <View style={[styles.convergenceDots, { borderColor: bestConfig.color }]}>
              {Array.from({ length: 3 }).map((_, i) => (
                <PulsingDot key={i} delay={i * 200} color={bestConfig.color} />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Skip button */}
        {phase === 'converge' && (
          <TouchableOpacity style={styles.skipBtn} onPress={goToFlash} activeOpacity={0.6}>
            <Ionicons name="play-forward" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.skipText}>SALTAR</Text>
          </TouchableOpacity>
        )}

        {/* ═══════════════════════════════════════════════════════════
            PHASE: Flash + Particle Burst
         ═══════════════════════════════════════════════════════════ */}
        {phase === 'flash' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Particle burst from center */}
            <View style={styles.burstCenter}>
              {Array.from({ length: burstCount }).map((_, i) => (
                <BurstParticle
                  key={`burst-${i}`}
                  trigger={burst}
                  index={i}
                  color={flashColor}
                  maxSize={6}
                />
              ))}
            </View>

            {/* Color flash overlay */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: flashColor },
                flashStyle,
              ]}
            />

            {/* Expanding shockwave ring */}
            <Shockwave trigger={burst} color={flashColor} />
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            PHASE: Reveal — 3D flip cards
         ═══════════════════════════════════════════════════════════ */}
        {phase === 'reveal' && (
          <Animated.View style={[styles.revealWrap, revealStyle]}>
            {/* Star rays behind everything for high rarities */}
            {bestRarity !== 'common' && (
              <StarRays revealProgress={revealOpacity} color={bestConfig.color} />
            )}

            {/* Title */}
            <Text style={styles.revealTitle}>RESULTADOS</Text>

            {/* Best rarity badge */}
            <View style={[styles.rarityBadge, { borderColor: bestConfig.color }]}>
              <Ionicons name="star" size={14} color={bestConfig.color} />
              <Text style={[styles.rarityLabel, { color: bestConfig.color }]}>
                {bestConfig.label}
              </Text>
            </View>

            {/* Cards grid with 3D flip */}
            <ScrollView
              contentContainerStyle={styles.resultsGrid}
              showsVerticalScrollIndicator={false}
            >
              {results.map((item, i) => (
                <FlipCard3D
                  key={`${item.name}-${i}`}
                  item={item}
                  index={i}
                  isBest={item.rarity === bestRarity}
                  delayMs={150 + i * 60}
                />
              ))}
            </ScrollView>

            {/* Action button */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.closeBtnText}>LISTO</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

// ─── PulsingDot (for "INVOCANDO..." text) ─────────────────────────────
const PulsingDot = ({ delay, color }: { delay: number; color: string }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(1, { duration: 400 })),
        withTiming(0.3, { duration: 400 }),
      ),
      -1,
      false,
    );
  }, [opacity, delay]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }, style]}
    />
  );
};

// ─── Shockwave (expanding ring during flash) ──────────────────────────
const Shockwave = ({ trigger, color }: { trigger: SharedValue<number>; color: string }) => {
  const style = useAnimatedStyle(() => {
    const t = trigger.value;
    return {
      transform: [{ scale: interpolate(t, [0, 1], [0, 8]) }],
      opacity: interpolate(t, [0, 0.2, 1], [0.8, 0.6, 0]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 100,
          height: 100,
          borderRadius: 50,
          borderWidth: 3,
          borderColor: color,
          top: SCREEN_H / 2 - 50,
          left: SCREEN_W / 2 - 50,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
};

// ─── styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(2,2,8,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ─── Convergence text ─── */
  textWrap: {
    position: 'absolute',
    bottom: SCREEN_H * 0.18,
    alignItems: 'center',
    gap: 12,
  },
  convergenceText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 8,
  },
  convergenceDots: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  /* ─── Skip ─── */
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
  },

  /* ─── Flash burst ─── */
  burstCenter: {
    position: 'absolute',
    top: SCREEN_H / 2,
    left: SCREEN_W / 2,
    width: 0,
    height: 0,
  },

  /* ─── Reveal ─── */
  revealWrap: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.xl,
    paddingTop: 70,
    alignItems: 'center',
  },
  revealTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 28,
    letterSpacing: 5,
    marginBottom: Spacing.sm,
    textShadowColor: Colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginBottom: Spacing.lg,
  },
  rarityLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 3,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 100,
  },
  actionRow: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: Colors.primaryGold,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: Radius.full,
    shadowColor: Colors.glowGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  closeBtnText: {
    color: '#0a0a0a',
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 4,
  },
});
