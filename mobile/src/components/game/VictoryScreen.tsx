/**
 * VictoryScreen — Shown after winning a battle.
 *
 * Displays XP and spheres gained, level-up notification, and new skill
 * learned if applicable.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

interface VictoryScreenProps {
  xpGained: number;
  spheresGained: number;
  leveledUp: boolean;
  newLevel?: number;
  newSkillLearned?: string | null;
  isBoss: boolean;
  onContinue: () => void;
}

export const VictoryScreen = ({
  xpGained,
  spheresGained,
  leveledUp,
  newLevel,
  newSkillLearned,
  isBoss,
  onContinue,
}: VictoryScreenProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={isBoss ? ['#1a1205', '#0a0a0a'] : ['#051a0a', '#0a0a0a']}
        style={styles.gradient}
      />

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconWrap, isBoss && styles.iconWrapBoss]}>
          <Ionicons
            name={isBoss ? 'trophy' : 'checkmark-circle'}
            size={64}
            color={isBoss ? '#fbbf24' : '#22c55e'}
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, isBoss && styles.titleBoss]}>
          {isBoss ? '¡DUNGEON COMPLETADO!' : 'VICTORIA'}
        </Text>

        {/* Rewards */}
        <View style={styles.rewardsBox}>
          <View style={styles.rewardRow}>
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text style={styles.rewardText}>+{xpGained} XP</Text>
          </View>
          <View style={styles.rewardRow}>
            <Ionicons name="diamond" size={20} color={Colors.primaryGold} />
            <Text style={styles.rewardText}>+{spheresGained} Esferas</Text>
          </View>
        </View>

        {/* Level up notification */}
        {leveledUp && (
          <View style={styles.levelUpBox}>
            <Ionicons name="arrow-up-circle" size={24} color="#22c55e" />
            <Text style={styles.levelUpText}>¡NIVEL {newLevel}!</Text>
          </View>
        )}

        {/* New skill notification */}
        {newSkillLearned && (
          <View style={styles.skillBox}>
            <Ionicons name="sparkles" size={20} color="#a855f7" />
            <Text style={styles.skillText}>Nueva habilidad: {newSkillLearned}</Text>
          </View>
        )}

        {/* Continue button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>CONTINUAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    alignItems: 'center',
    padding: Spacing.xl,
    zIndex: 1,
  },
  iconWrap: {
    marginBottom: Spacing.md,
  },
  iconWrapBoss: {
    // Boss victory gets extra glow
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 28,
    color: '#22c55e',
    letterSpacing: 3,
    marginBottom: Spacing.lg,
  },
  titleBoss: {
    color: '#fbbf24',
    fontSize: 24,
  },
  rewardsBox: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.2)',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rewardText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  levelUpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: Spacing.sm,
  },
  levelUpText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: '#22c55e',
  },
  skillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginBottom: Spacing.xl,
  },
  skillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: '#c4b5fd',
  },
  continueBtn: {
    backgroundColor: Colors.primaryGold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  continueText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.bgDarker,
    letterSpacing: 2,
  },
});
