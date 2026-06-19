/**
 * SummonAnimation — Full-screen cinematic gacha experience.
 *
 * Inspired by Genshin Impact / FGO summon animations:
 *
 * Phase 1 — "Convergence": Energy lines converge toward the center.
 *           A glowing orb forms and grows. Multiple concentric rings
 *           spin and expand. Light intensity builds over 3 seconds.
 *
 * Phase 2 — "Flash": The orb explodes into a white flash.
 *           The flash color is based on the best rarity pulled.
 *
 * Phase 3 — "Reveal": Results grid fades in with staggered cards.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { RARITIES, type RewardItem, type RarityKey } from '@/constants/gachaData';
import { RewardCard } from './RewardCard';

const { width, height } = Dimensions.get('window');

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

// Number of orbiting energy particles
const ORBIT_COUNT = 16;
// Number of radial light rays
const RAY_COUNT = 12;

export const SummonAnimation = ({ visible, results, onClose }: SummonAnimationProps) => {
  const [phase, setPhase] = useState<'converge' | 'flash' | 'reveal'>('converge');

  // Core animations
  const masterProgress = useRef(new Animated.Value(0)).current;  // 0 → 1 over convergence
  const spinSlow = useRef(new Animated.Value(0)).current;         // perpetual slow spin
  const spinFast = useRef(new Animated.Value(0)).current;         // perpetual fast counter-spin
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bestRarity = getBestRarity(results);
  const bestConfig = RARITIES[bestRarity];

  // Rarity-based flash color
  const flashColor = bestRarity === 'mythic'
    ? '#ef4444'
    : bestRarity === 'legendary'
    ? Colors.primaryGold
    : bestRarity === 'epic'
    ? '#a855f7'
    : '#ffffff';

  useEffect(() => {
    if (visible) {
      // Reset
      setPhase('converge');
      masterProgress.setValue(0);
      spinSlow.setValue(0);
      spinFast.setValue(0);
      flashOpacity.setValue(0);
      revealOpacity.setValue(0);
      startConvergence();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible]);

  const startConvergence = () => {
    // Master progress: 0 → 1 over 3.5 seconds (controls orb growth, convergence, intensity)
    Animated.timing(masterProgress, {
      toValue: 1,
      duration: 3500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();

    // Slow clockwise spin (outer ring)
    Animated.loop(
      Animated.timing(spinSlow, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fast counter-clockwise spin (inner ring)
    Animated.loop(
      Animated.timing(spinFast, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Auto-transition after convergence completes
    timeoutRef.current = setTimeout(() => goToFlash(), 3500);
  };

  const goToFlash = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    spinSlow.stopAnimation();
    spinFast.stopAnimation();
    masterProgress.stopAnimation();
    setPhase('flash');

    // Flash in → out
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(300),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPhase('reveal');
      Animated.timing(revealOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Derived interpolations
  const slowSpin = spinSlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const fastSpin = spinFast.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  // Orb grows from tiny to full size
  const orbScale = masterProgress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.1, 0.5, 1.2],
  });
  const orbOpacity = masterProgress.interpolate({
    inputRange: [0, 0.3, 0.8, 1],
    outputRange: [0.2, 0.5, 0.8, 1],
  });

  // Rings expand outward as energy builds
  const ring1Scale = masterProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1.1],
  });
  const ring2Scale = masterProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.4],
  });
  const ring3Scale = masterProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1.8],
  });

  // Ring opacity pulses as they grow
  const ringOpacity = masterProgress.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: [0.1, 0.4, 0.7, 0.9],
  });

  // Light rays grow and brighten
  const rayOpacity = masterProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.15, 0.5],
  });
  const rayScale = masterProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {/* ═══════════════════════════════════════════════════════════
            PHASE: Convergence
         ═══════════════════════════════════════════════════════════ */}
        {phase === 'converge' && (
          <View style={styles.convergenceWrap}>

            {/* ─── Radial Light Rays ─── */}
            {Array.from({ length: RAY_COUNT }).map((_, i) => (
              <Animated.View
                key={`ray-${i}`}
                style={[
                  styles.ray,
                  {
                    backgroundColor: bestConfig.color,
                    opacity: rayOpacity,
                    transform: [
                      { rotate: `${(i * 360) / RAY_COUNT}deg` },
                      { scaleY: rayScale },
                    ],
                  },
                ]}
              />
            ))}

            {/* ─── Outer Ring (slow spin) ─── */}
            <Animated.View
              style={[
                styles.ring,
                styles.ringOuter,
                {
                  borderColor: bestConfig.color,
                  opacity: ringOpacity,
                  transform: [{ rotate: slowSpin }, { scale: ring3Scale }],
                },
              ]}
            />

            {/* ─── Middle Ring (fast counter-spin) ─── */}
            <Animated.View
              style={[
                styles.ring,
                styles.ringMiddle,
                {
                  borderColor: bestConfig.color,
                  opacity: ringOpacity,
                  transform: [{ rotate: fastSpin }, { scale: ring2Scale }],
                },
              ]}
            />

            {/* ─── Inner Ring (slow spin, dashed) ─── */}
            <Animated.View
              style={[
                styles.ring,
                styles.ringInner,
                {
                  borderColor: bestConfig.color,
                  opacity: ringOpacity,
                  transform: [{ rotate: slowSpin }, { scale: ring1Scale }],
                },
              ]}
            />

            {/* ─── Orbiting Energy Particles ─── */}
            {Array.from({ length: ORBIT_COUNT }).map((_, i) => {
              const angle = (i * 360) / ORBIT_COUNT;
              // Particles converge toward center over time
              const particleRadius = masterProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [180, 20],
              });
              return (
                <Animated.View
                  key={`orb-particle-${i}`}
                  style={[
                    styles.energyParticle,
                    {
                      backgroundColor: bestConfig.color,
                      opacity: masterProgress.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 0.7, 1],
                      }),
                      transform: [
                        { rotate: `${angle}deg` },
                        { translateY: Animated.multiply(particleRadius, -1) },
                        {
                          scale: masterProgress.interpolate({
                            inputRange: [0, 0.8, 1],
                            outputRange: [0.5, 1, 1.5],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              );
            })}

            {/* ─── Central Orb (growing, glowing) ─── */}
            <Animated.View
              style={[
                styles.centralOrb,
                {
                  backgroundColor: bestConfig.color,
                  opacity: orbOpacity,
                  transform: [{ scale: orbScale }],
                  shadowColor: bestConfig.color,
                },
              ]}
            />

            {/* ─── Center Icon ─── */}
            <Animated.View style={{ opacity: orbOpacity }}>
              <Ionicons name="diamond" size={36} color="#fff" />
            </Animated.View>

            {/* ─── "Invocando..." text ─── */}
            <Animated.Text
              style={[
                styles.convergenceText,
                {
                  opacity: masterProgress.interpolate({
                    inputRange: [0, 0.3],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              Invocando...
            </Animated.Text>

            {/* ─── Skip Button ─── */}
            <TouchableOpacity style={styles.skipBtn} onPress={goToFlash}>
              <Ionicons name="play-forward" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.skipText}>SALTAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            PHASE: Flash
         ═══════════════════════════════════════════════════════════ */}
        <Animated.View
          pointerEvents="none"
          style={[styles.flashOverlay, { backgroundColor: flashColor, opacity: flashOpacity }]}
        />

        {/* ═══════════════════════════════════════════════════════════
            PHASE: Reveal
         ═══════════════════════════════════════════════════════════ */}
        {phase === 'reveal' && (
          <Animated.View style={[styles.revealWrap, { opacity: revealOpacity }]}>
            <Text style={styles.revealTitle}>RESULTADOS</Text>

            {/* Best rarity label */}
            <View style={[styles.rarityBadge, { borderColor: bestConfig.color }]}>
              <Ionicons name="star" size={14} color={bestConfig.color} />
              <Text style={[styles.rarityLabel, { color: bestConfig.color }]}>
                {bestConfig.label}
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.resultsGrid}
              showsVerticalScrollIndicator={false}
            >
              {results.map((item, i) => (
                <RewardCard key={`${item.name}-${i}`} item={item} index={i} />
              ))}
            </ScrollView>

            <View style={styles.actionButtonsRow}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(2,2,8,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ─── Convergence Phase ─── */
  convergenceWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  /* Light rays emanating from center */
  ray: {
    position: 'absolute',
    width: 2,
    height: height * 0.5,
    bottom: '50%',
    transformOrigin: 'bottom center',
  },

  /* Concentric rings */
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
  ringOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderStyle: 'dotted',
  },
  ringMiddle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  ringInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderStyle: 'dashed',
    borderWidth: 2,
  },

  /* Orbiting energy particles */
  energyParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* Central glowing orb */
  centralOrb: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },

  convergenceText: {
    position: 'absolute',
    bottom: height * 0.2,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 6,
  },

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

  /* ─── Flash ─── */
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  /* ─── Reveal Phase ─── */
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
    textShadowRadius: 20,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: Spacing.lg,
  },
  rarityLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 100,
  },
  actionButtonsRow: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: Colors.primaryGold,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  closeBtnText: {
    color: Colors.bgDark,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 3,
  },
});
