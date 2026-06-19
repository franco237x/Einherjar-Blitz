/**
 * ProbabilitiesPanel — Shows the drop-rate breakdown per rarity for the
 * active banner. Probabilities are computed from the banner's reward weights
 * (see getRarityOdds), so they stay accurate if the data changes.
 *
 * Fills the space below the banner card. Scrollable in case more rarities are
 * added later.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { RARITIES, getRarityOdds, type RewardItem } from '@/constants/gachaData';

interface ProbabilitiesPanelProps {
  rewards: RewardItem[];
}

function formatPercent(p: number): string {
  if (p >= 10) return `${p.toFixed(0)}%`;
  if (p >= 1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(2)}%`;
}

export const ProbabilitiesPanel = ({ rewards }: ProbabilitiesPanelProps) => {
  const odds = getRarityOdds(rewards);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={14} color={Colors.textSecondary} />
        <Text style={styles.headerText}>Probabilidades</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {odds.map(({ rarity, percent }) => {
          const cfg = RARITIES[rarity];
          return (
            <View key={rarity} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.stars}>
                  {Array.from({ length: cfg.stars }).map((_, i) => (
                    <Ionicons key={i} name="star" size={9} color={cfg.color} />
                  ))}
                </View>
                <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      // Boost very small values so they remain visible.
                      width: `${Math.max(percent, 1.5)}%`,
                      backgroundColor: cfg.color,
                    },
                  ]}
                />
              </View>

              <Text style={styles.percent}>{formatPercent(percent)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  headerText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  list: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowLeft: {
    width: 110,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
    marginBottom: 2,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  percent: {
    width: 52,
    textAlign: 'right',
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
});
