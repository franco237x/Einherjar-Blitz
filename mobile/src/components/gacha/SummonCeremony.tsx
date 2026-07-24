/**
 * Full-screen summon ceremony.
 *
 * Firestore has already committed the pull before this component is shown.
 * This component only presents the result and never mutates economy state.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Layout, Radius, Spacing } from '@/constants/theme';
import { RARITIES, type RarityKey, type RewardItem } from '@/constants/gachaData';
import { ConvergePhase, CONVERGE_DURATION } from './SummonConverge';
import { BurstParticle, FlipCard3D, StarRays } from './SummonPrimitives';

interface SummonAnimationProps {
  visible: boolean;
  results: RewardItem[];
  onClose: () => void;
}

type Phase = 'converge' | 'flash' | 'reveal';

const RARITY_ORDER: RarityKey[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];
const CHARGE_SEGMENTS = 7;

const BURST_COUNT: Record<RarityKey, number> = {
  mythic: 54,
  legendary: 42,
  epic: 30,
  rare: 20,
  common: 12,
};

function getBestRarity(items: RewardItem[]): RarityKey {
  return RARITY_ORDER.find((rarity) => items.some((item) => item.rarity === rarity)) ?? 'common';
}

export const SummonAnimation = ({
  visible,
  results,
  onClose,
}: SummonAnimationProps) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('converge');
  const [reduceMotion, setReduceMotion] = useState(false);
  const phaseRef = useRef<Phase>('converge');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);

  const progress = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const burst = useSharedValue(0);
  const revealOpacity = useSharedValue(0);

  const bestRarity = getBestRarity(results);
  const bestConfig = RARITIES[bestRarity];
  const bestResultCount = results.filter((item) => item.rarity === bestRarity).length;
  const compactWidth = width < 390;
  const shortViewport = height < 680;
  const wideViewport = width >= 700;
  const horizontalPadding = compactWidth ? 12 : Spacing.lg;
  const resultContentWidth = Math.min(
    Math.max(0, width - horizontalPadding * 2),
    Layout.contentMaxWidth,
  );
  const resultColumns =
    results.length <= 1 ? 1 : width >= 900 ? 5 : width >= 620 ? 4 : 2;
  const resultGap = compactWidth ? Spacing.sm : 12;
  const cardWidth =
    results.length <= 1
      ? Math.min(resultContentWidth, shortViewport ? 250 : 310)
      : Math.floor(
          (resultContentWidth - resultGap * Math.max(0, resultColumns - 1)) /
            resultColumns,
        );
  const cardHeight =
    results.length <= 1
      ? Math.min(shortViewport ? 310 : 410, Math.round(cardWidth * 1.34))
      : Math.max(188, Math.min(260, Math.round(cardWidth * 1.42)));
  const ritualSize = Math.min(width * 0.72, height * 0.46, wideViewport ? 390 : 320);
  const chargePanelWidth = Math.min(width * 0.82, 520);
  const convergeDuration = reduceMotion ? 220 : CONVERGE_DURATION[bestRarity];
  const burstCount = reduceMotion ? 0 : BURST_COUNT[bestRarity];
  const flashColor = bestRarity === 'common' ? '#e5e7eb' : bestConfig.color;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  const clearScheduledWork = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const goToFlash = useCallback(() => {
    clearScheduledWork();
    if (phaseRef.current !== 'converge') return;

    phaseRef.current = 'flash';
    setPhase('flash');
    burst.value = 0;
    burst.value = withTiming(1, {
      duration: reduceMotion ? 100 : 760,
      easing: Easing.out(Easing.cubic),
    });
    flashOpacity.value = withSequence(
      withTiming(1, {
        duration: reduceMotion ? 60 : 130,
        easing: Easing.out(Easing.cubic),
      }),
      withDelay(
        reduceMotion ? 20 : 120,
        withTiming(0, {
          duration: reduceMotion ? 90 : 330,
          easing: Easing.in(Easing.cubic),
        }),
      ),
    );

    timeoutRef.current = setTimeout(
      () => {
        phaseRef.current = 'reveal';
        setPhase('reveal');
        revealOpacity.value = withTiming(1, {
          duration: reduceMotion ? 100 : 420,
          easing: Easing.out(Easing.cubic),
        });
      },
      reduceMotion ? 120 : 510,
    );
  }, [
    burst,
    clearScheduledWork,
    flashOpacity,
    reduceMotion,
    revealOpacity,
  ]);

  const startConvergence = useCallback(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: convergeDuration,
      easing: Easing.bezier(0.25, 0.1, 0.2, 1),
    });
    timeoutRef.current = setTimeout(goToFlash, convergeDuration);
  }, [convergeDuration, goToFlash, progress]);

  useEffect(() => {
    if (!visible) {
      clearScheduledWork();
      return;
    }

    phaseRef.current = 'converge';
    setPhase('converge');
    progress.value = 0;
    flashOpacity.value = 0;
    burst.value = 0;
    revealOpacity.value = 0;
    frameRef.current = requestAnimationFrame(startConvergence);

    return clearScheduledWork;
  }, [
    burst,
    clearScheduledWork,
    flashOpacity,
    progress,
    revealOpacity,
    startConvergence,
    visible,
  ]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
    transform: [{ scale: interpolate(revealOpacity.value, [0, 1], [0.975, 1]) }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.18, 1], [0, 0.65, 1]),
    transform: [
      { rotate: `${progress.value * 150}deg` },
      { scale: interpolate(progress.value, [0, 0.8, 1], [0.72, 1, 1.04]) },
    ],
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.25, 1], [0, 0.8, 1]),
    transform: [
      { rotate: `${progress.value * -220}deg` },
      { scale: interpolate(progress.value, [0, 0.75, 1], [0.6, 0.96, 1]) },
    ],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15, 0.9, 1], [0, 0.55, 0.8, 0]),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [-ritualSize * 0.34, ritualSize * 0.34],
        ),
      },
    ],
  }));

  if (!visible) return null;

  const handleRequestClose = () => {
    if (phaseRef.current === 'reveal') {
      onClose();
      return;
    }
    goToFlash();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType={reduceMotion ? 'none' : 'fade'}
      statusBarTranslucent
      presentationStyle="fullScreen"
      onRequestClose={handleRequestClose}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
        accessibilityViewIsModal
      >
        <LinearGradient
          colors={['#020409', '#07101b', '#020204']}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ChamberBackdrop color={bestConfig.color} />

        {phase === 'converge' && (
          <View style={StyleSheet.absoluteFill}>
            {!reduceMotion ? (
              <ConvergePhase rarity={bestRarity} progress={progress} />
            ) : (
              <View style={styles.reducedMotionCore}>
                <View
                  style={[
                    styles.reducedMotionOrb,
                    {
                      borderColor: bestConfig.color,
                      backgroundColor: bestConfig.glowColor,
                    },
                  ]}
                >
                  <Ionicons name="diamond" size={38} color={bestConfig.color} />
                </View>
              </View>
            )}

            <View style={styles.ceremonyHeader}>
              <View style={styles.systemIdentity}>
                <View style={[styles.systemMark, { borderColor: bestConfig.color }]}>
                  <Ionicons name="diamond-outline" size={15} color={bestConfig.color} />
                </View>
                <View>
                  <Text style={styles.systemEyebrow}>CÁMARA EINHERJAR</Text>
                  <Text style={styles.systemTitle}>SECUENCIA DE INVOCACIÓN</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={goToFlash}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel="Saltar animación de invocación"
              >
                <Text style={styles.skipText}>SALTAR</Text>
                <Ionicons name="play-forward" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.ritualLayer} pointerEvents="none">
              <View style={{ width: ritualSize, height: ritualSize }}>
                <Animated.View
                  style={[
                    styles.outerRing,
                    { borderColor: bestConfig.color },
                    outerRingStyle,
                  ]}
                >
                  {Array.from({ length: 8 }).map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.ringTick,
                        {
                          backgroundColor: bestConfig.color,
                          transform: [
                            { rotate: `${index * 45}deg` },
                            { translateY: -ritualSize / 2 + 5 },
                          ],
                        },
                      ]}
                    />
                  ))}
                </Animated.View>
                <Animated.View
                  style={[
                    styles.innerRing,
                    { borderColor: bestConfig.color },
                    innerRingStyle,
                  ]}
                />
                <View
                  style={[
                    styles.coreReticle,
                    {
                      width: ritualSize * 0.35,
                      height: ritualSize * 0.35,
                      borderColor: bestConfig.color,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      width: ritualSize * 0.78,
                      backgroundColor: bestConfig.color,
                    },
                    scanStyle,
                  ]}
                />
              </View>
            </View>

            <View
              style={[
                styles.chargePanel,
                {
                  bottom: Math.max(Spacing.lg, insets.bottom + Spacing.md),
                  left: (width - chargePanelWidth) / 2,
                  width: chargePanelWidth,
                },
              ]}
            >
              <View style={styles.chargeHeading}>
                <View style={styles.chargeLabelRow}>
                  <View style={[styles.liveDot, { backgroundColor: bestConfig.color }]} />
                  <Text style={styles.chargeLabel}>SINCRONIZANDO NÚCLEO</Text>
                </View>
                <Text style={styles.chargeCode}>EIN // {results.length === 1 ? '01' : '10'}</Text>
              </View>
              <View style={styles.chargeTrack}>
                {Array.from({ length: CHARGE_SEGMENTS }).map((_, index) => (
                  <ChargeSegment
                    key={index}
                    index={index}
                    total={CHARGE_SEGMENTS}
                    progress={progress}
                    color={bestConfig.color}
                  />
                ))}
              </View>
              <Text style={styles.chargeHint}>
                La frecuencia de la recompensa se está estabilizando
              </Text>
            </View>
          </View>
        )}

        {phase === 'flash' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.burstCenter}>
              {Array.from({ length: burstCount }).map((_, index) => (
                <BurstParticle
                  key={index}
                  trigger={burst}
                  index={index}
                  color={flashColor}
                  maxSize={6}
                />
              ))}
            </View>
            <Shockwave trigger={burst} color={flashColor} />
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: flashColor },
                flashStyle,
              ]}
            />
          </View>
        )}

        {phase === 'reveal' && (
          <Animated.View style={[styles.revealScreen, revealStyle]}>
            <LinearGradient
              colors={[
                bestConfig.glowColor,
                'rgba(6,10,17,0.92)',
                'rgba(2,3,6,0.99)',
              ]}
              locations={[0, 0.34, 1]}
              style={StyleSheet.absoluteFill}
            />
            {!reduceMotion && bestRarity !== 'common' && (
              <StarRays revealProgress={revealOpacity} color={bestConfig.color} />
            )}

            <View
              style={[
                styles.revealHeader,
                shortViewport && styles.revealHeaderShort,
                { paddingHorizontal: horizontalPadding },
              ]}
            >
              <View style={styles.revealHeadingRow}>
                <View style={styles.revealHeadingCopy}>
                  <Text style={[styles.revealEyebrow, { color: bestConfig.color }]}>
                    TRANSMISIÓN COMPLETA
                  </Text>
                  <Text
                    style={[
                      styles.revealTitle,
                      compactWidth && styles.revealTitleCompact,
                    ]}
                  >
                    Recompensas obtenidas
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.revealCloseButton}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar resultados"
                >
                  <Ionicons name="close" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryRow}>
                <View
                  style={[
                    styles.raritySummary,
                    {
                      borderColor: bestConfig.color,
                      backgroundColor: bestConfig.glowColor,
                    },
                  ]}
                >
                  <Ionicons name="star" size={13} color={bestConfig.color} />
                  <Text style={[styles.raritySummaryText, { color: bestConfig.color }]}>
                    {bestConfig.label}
                  </Text>
                </View>
                <View style={styles.resultCountPill}>
                  <Ionicons name="layers-outline" size={14} color={Colors.primaryGold} />
                  <Text style={styles.resultCountText}>
                    {results.length} {results.length === 1 ? 'RECOMPENSA' : 'RECOMPENSAS'}
                  </Text>
                </View>
                {bestResultCount > 1 && (
                  <Text style={styles.bestCountText}>×{bestResultCount} de máxima rareza</Text>
                )}
              </View>
            </View>

            <ScrollView
              style={styles.resultsViewport}
              contentContainerStyle={[
                styles.resultsGrid,
                {
                  width: resultContentWidth,
                  gap: resultGap,
                  paddingVertical: shortViewport ? Spacing.sm : Spacing.md,
                },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={results.length > resultColumns}
              accessibilityLabel="Resultados de la invocación"
            >
              {results.map((item, index) => (
                <FlipCard3D
                  key={`${item.name}-${index}`}
                  item={item}
                  index={index}
                  isBest={item.rarity === bestRarity}
                  delayMs={120 + index * 65}
                  cardWidth={cardWidth}
                  cardHeight={cardHeight}
                  reduceMotion={reduceMotion}
                />
              ))}
            </ScrollView>

            <View
              style={[
                styles.revealFooter,
                {
                  paddingHorizontal: horizontalPadding,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.continueButton, { borderColor: bestConfig.color }]}
                onPress={onClose}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Continuar después de la invocación"
              >
                <LinearGradient
                  colors={[bestConfig.color, Colors.primaryGold]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.continueText}>CONTINUAR</Text>
                <Ionicons name="chevron-forward" size={18} color="#08090b" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

function ChamberBackdrop({ color }: { color: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.verticalRail, styles.verticalRailLeft, { borderColor: color }]} />
      <View style={[styles.verticalRail, styles.verticalRailRight, { borderColor: color }]} />
      <View style={[styles.corner, styles.cornerTopLeft, { borderColor: color }]} />
      <View style={[styles.corner, styles.cornerTopRight, { borderColor: color }]} />
      <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: color }]} />
      <View style={[styles.corner, styles.cornerBottomRight, { borderColor: color }]} />
      <LinearGradient
        colors={['transparent', 'rgba(201,170,113,0.08)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.horizonGlow}
      />
    </View>
  );
}

function ChargeSegment({
  index,
  total,
  progress,
  color,
}: {
  index: number;
  total: number;
  progress: SharedValue<number>;
  color: string;
}) {
  const threshold = index / total;
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [threshold, Math.min(1, threshold + 0.14)],
      [0.16, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    ),
    transform: [
      {
        scaleX: interpolate(
          progress.value,
          [threshold, Math.min(1, threshold + 0.14)],
          [0.35, 1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          },
        ),
      },
    ],
  }));

  return (
    <Animated.View
      style={[styles.chargeSegment, { backgroundColor: color }, animatedStyle]}
    />
  );
}

function Shockwave({
  trigger,
  color,
}: {
  trigger: SharedValue<number>;
  color: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(trigger.value, [0, 0.2, 1], [0.8, 0.55, 0]),
    transform: [{ scale: interpolate(trigger.value, [0, 1], [0.2, 8]) }],
  }));

  return (
    <View style={styles.shockwaveCenter}>
      <Animated.View
        style={[styles.shockwave, { borderColor: color }, animatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020409',
    overflow: 'hidden',
  },
  verticalRail: {
    position: 'absolute',
    top: '12%',
    bottom: '10%',
    width: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    opacity: 0.2,
  },
  verticalRailLeft: {
    left: 10,
    borderLeftWidth: 1,
  },
  verticalRailRight: {
    right: 10,
    borderRightWidth: 1,
  },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    opacity: 0.38,
  },
  cornerTopLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  cornerTopRight: {
    top: 12,
    right: 12,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  cornerBottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  cornerBottomRight: {
    right: 12,
    bottom: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  horizonGlow: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
  },
  ceremonyHeader: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  systemIdentity: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  systemMark: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  systemEyebrow: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 1.5,
  },
  systemTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 12,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  skipButton: {
    minWidth: 82,
    minHeight: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(2,4,9,0.76)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  skipText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  ritualLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderRadius: Radius.full,
    borderStyle: 'dashed',
  },
  innerRing: {
    position: 'absolute',
    top: '12%',
    right: '12%',
    bottom: '12%',
    left: '12%',
    borderWidth: 1,
    borderRadius: Radius.full,
    borderStyle: 'dotted',
  },
  ringTick: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 2,
    height: 12,
    opacity: 0.75,
  },
  coreReticle: {
    position: 'absolute',
    top: '32.5%',
    left: '32.5%',
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
    opacity: 0.52,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: '11%',
    height: 1,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  reducedMotionCore: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reducedMotionOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargePanel: {
    position: 'absolute',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.18)',
    backgroundColor: 'rgba(2,5,10,0.82)',
  },
  chargeHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chargeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chargeLabel: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  chargeCode: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 1,
  },
  chargeTrack: {
    height: 6,
    flexDirection: 'row',
    gap: 4,
  },
  chargeSegment: {
    flex: 1,
    height: 6,
    transformOrigin: 'left center',
  },
  chargeHint: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 10,
    marginTop: 9,
  },
  burstCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  shockwaveCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shockwave: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  revealScreen: {
    flex: 1,
    width: '100%',
  },
  revealHeader: {
    width: '100%',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  revealHeaderShort: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  revealHeadingRow: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  revealHeadingCopy: {
    minWidth: 0,
    flex: 1,
  },
  revealEyebrow: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  revealTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 25,
    letterSpacing: 0.4,
    marginTop: 3,
  },
  revealTitleCompact: {
    fontSize: 20,
  },
  revealCloseButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  raritySummary: {
    minHeight: 30,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raritySummaryText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
  },
  resultCountPill: {
    minHeight: 30,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultCountText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  bestCountText: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
  },
  resultsViewport: {
    flex: 1,
    width: '100%',
  },
  resultsGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  revealFooter: {
    width: '100%',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(2,3,6,0.82)',
  },
  continueButton: {
    width: '100%',
    maxWidth: 440,
    minHeight: 50,
    alignSelf: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: {
    color: '#08090b',
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
  },
});
