import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Crosshair, ShieldAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCharacterVisual } from '@/constants/characterAssets';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const ARENA = require('../../../assets/images/game/arena-nordica.png');
const ARGOS_SPLASH = require('../../../assets/images/game/argos/argos-splash.jpg');
const ARGOS_VIDEO = require('../../../assets/images/game/argos/argos-splash.mp4');
const MINIMUM_BRIEFING_MS = 2600;

interface MissionBriefingScreenProps {
  onComplete: () => void;
}

export function MissionBriefingScreen({
  onComplete,
}: MissionBriefingScreenProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 430;
  const progress = useRef(new Animated.Value(0)).current;
  const bossPortrait = getCharacterVisual('rey_escarlata')?.portrait;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    Animated.timing(progress, {
      toValue: 1,
      duration: MINIMUM_BRIEFING_MS,
      useNativeDriver: false,
    }).start();

    Asset.loadAsync([ARGOS_SPLASH, ARGOS_VIDEO, ARENA]).finally(() => {
      if (!active) return;
      const remaining = Math.max(
        0,
        MINIMUM_BRIEFING_MS - (Date.now() - startedAt)
      );
      timer = setTimeout(onComplete, remaining);
    });

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      progress.stopAnimation();
    };
  }, [onComplete, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['4%', '100%'],
  });

  return (
    <ImageBackground source={ARENA} style={styles.screen} resizeMode="cover">
      <LinearGradient
        colors={['rgba(2,4,8,0.72)', 'rgba(5,5,5,0.94)']}
        style={styles.overlay}
      />

      <View
        style={[
          styles.safe,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
            paddingLeft: Math.max(insets.left, 18),
            paddingRight: Math.max(insets.right, 18),
          },
        ]}
      >
        <View style={styles.topline}>
          <View style={styles.brand}>
            <Crown size={17} color={Colors.primaryGold} />
            <Text style={styles.brandText}>SENDA DEL EINHERJAR</Text>
          </View>
          <Text style={styles.chapter}>CAPÍTULO I · EL TRONO</Text>
        </View>

        <View style={[styles.content, compact && styles.contentCompact]}>
          <View style={styles.copy}>
            <View style={styles.kickerRow}>
              <View style={styles.alertIcon}>
                <ShieldAlert size={17} color={Colors.strengthWeak} />
              </View>
              <Text style={styles.kicker}>MISIÓN ACTUAL</Text>
            </View>

            <Text style={[styles.title, compact && styles.titleCompact]}>
              Matar al{'\n'}Rey Escarlata
            </Text>
            <Text
              style={[
                styles.description,
                compact && styles.descriptionCompact,
              ]}
            >
              El monarca ha levantado el Trono Escarlata. Atravesá su guardia
              y derrotalo antes de que su segunda fase consuma la arena.
            </Text>

            <View
              style={[styles.objective, compact && styles.objectiveCompact]}
            >
              <Crosshair size={17} color={Colors.primaryGold} />
              <View>
                <Text style={styles.objectiveLabel}>OBJETIVO PRINCIPAL</Text>
                <Text
                  style={[
                    styles.objectiveText,
                    compact && styles.objectiveTextCompact,
                  ]}
                >
                  Derrotar al Rey Escarlata · 0 / 1
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.bossCard, compact && styles.bossCardCompact]}>
            <View style={styles.bossGlow} />
            {bossPortrait ? (
              <Image
                source={bossPortrait}
                style={styles.boss}
                resizeMode="contain"
              />
            ) : (
              <Crown size={110} color={Colors.strengthWeak} />
            )}
            <Text style={styles.bossOverline}>OBJETIVO</Text>
            <Text style={styles.bossName}>REY ESCARLATA</Text>
          </View>
        </View>

        <View style={styles.loading}>
          <View style={styles.loadingLabels}>
            <Text style={styles.loadingText}>PREPARANDO CAMPO DE BATALLA</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Omitir briefing de misión"
              onPress={onComplete}
              hitSlop={10}
            >
              <Text style={styles.skip}>CONTINUAR</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.track}>
            <Animated.View
              style={[styles.fill, { width: progressWidth }]}
            />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgDarker,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  safe: {
    flex: 1,
  },
  topline: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGold,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandText: {
    fontFamily: Fonts.title,
    color: Colors.primaryGold,
    fontSize: 14,
    letterSpacing: 1.3,
  },
  chapter: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxl,
    paddingHorizontal: '8%',
  },
  contentCompact: {
    gap: Spacing.lg,
  },
  copy: {
    flex: 1,
    maxWidth: 560,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  alertIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
  },
  kicker: {
    fontFamily: Fonts.bodyBold,
    color: Colors.strengthWeak,
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.title,
    color: Colors.textPrimary,
    fontSize: 39,
    lineHeight: 42,
    letterSpacing: 0.8,
  },
  titleCompact: {
    marginTop: 4,
    fontSize: 30,
    lineHeight: 32,
  },
  description: {
    maxWidth: 520,
    marginTop: Spacing.md,
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionCompact: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
  },
  objective: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(5,5,5,0.62)',
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  objectiveCompact: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  objectiveLabel: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primaryGold,
    fontSize: 8,
    letterSpacing: 1.1,
  },
  objectiveText: {
    marginTop: 2,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  objectiveTextCompact: {
    fontSize: 10,
  },
  bossCard: {
    width: '29%',
    maxWidth: 280,
    minWidth: 180,
    height: '78%',
    maxHeight: 330,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.38)',
    backgroundColor: 'rgba(25,4,6,0.68)',
  },
  bossCardCompact: {
    maxHeight: 230,
  },
  bossGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: 44,
    backgroundColor: 'rgba(180,15,24,0.18)',
  },
  boss: {
    width: '94%',
    height: '84%',
  },
  bossOverline: {
    position: 'absolute',
    left: 14,
    bottom: 30,
    fontFamily: Fonts.bodyBold,
    color: Colors.strengthWeak,
    fontSize: 8,
    letterSpacing: 1.5,
  },
  bossName: {
    position: 'absolute',
    left: 14,
    bottom: 11,
    fontFamily: Fonts.title,
    color: Colors.textPrimary,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  loading: {
    paddingHorizontal: '8%',
  },
  loadingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  loadingText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  skip: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primaryGold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  track: {
    height: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primaryGold,
  },
});
