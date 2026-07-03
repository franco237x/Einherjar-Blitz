/**
 * ScreenHeader — Shared page header used across all tabs for a
 * consistent look: title + optional subtitle on the left, optional
 * currency badges and an action slot on the right.
 *
 * Handles the top safe-area inset internally so screens don't need
 * to compute padding themselves.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

export interface HeaderBadge {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  badges?: HeaderBadge[];
  /** Optional element rendered under the badges (e.g. a small action button). */
  action?: React.ReactNode;
}

export const ScreenHeader = ({ title, subtitle, badges, action }: ScreenHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {(badges?.length || action) ? (
        <View style={styles.right}>
          {badges?.map((badge) => (
            <View key={badge.label} style={styles.badge}>
              <Ionicons name={badge.icon} size={18} color={Colors.primaryGold} />
              <View>
                <Text style={styles.badgeLabel}>{badge.label}</Text>
                <Text style={styles.badgeValue}>{badge.value}</Text>
              </View>
            </View>
          ))}
          {action}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 24,
    letterSpacing: 2,
    textShadowColor: Colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  badgeLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgeValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 16,
  },
});
