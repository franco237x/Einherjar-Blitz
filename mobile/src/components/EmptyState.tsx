/**
 * EmptyState — Shared empty / placeholder state used across tabs
 * (empty store, empty history, empty inventory, etc.) for a
 * consistent look: icon + title + description.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '@/constants/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  /** Compact variant for use inside modals / small lists. */
  compact?: boolean;
}

export const EmptyState = ({ icon, title, description, compact }: EmptyStateProps) => (
  <View style={[styles.wrap, compact && styles.wrapCompact]}>
    <Ionicons
      name={icon}
      size={compact ? 40 : 64}
      color="rgba(201,170,113,0.35)"
    />
    <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  wrapCompact: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 17,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  titleCompact: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  description: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
