/**
 * BattleHUD — HP/MP bars + name + level for a combatant.
 *
 * Compact display shown above/below each sprite during battle.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import type { Combatant } from '@/services/battleEngine';

interface BattleHUDProps {
  combatant: Combatant;
  align: 'left' | 'right';
  showLevel?: boolean;
}

export const BattleHUD = ({ combatant, align, showLevel = true }: BattleHUDProps) => {
  const hpPercent = Math.max(0, (combatant.currentHP / combatant.maxHP) * 100);
  const mpPercent = Math.max(0, (combatant.currentMP / combatant.maxMP) * 100);

  const hpColor = hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444';
  const mpColor = '#3b82f6';

  const hasStatuses = combatant.statuses.length > 0;

  return (
    <View style={[styles.container, align === 'right' && styles.containerRight]}>
      <View style={[styles.header, align === 'right' && styles.headerRight]}>
        <Text style={styles.name} numberOfLines={1}>{combatant.name}</Text>
        {showLevel && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Nv {combatant.level}</Text>
          </View>
        )}
      </View>

      {/* HP Bar */}
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>HP</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${hpPercent}%`, backgroundColor: hpColor }]} />
          <Text style={styles.barText}>
            {Math.ceil(combatant.currentHP)}/{combatant.maxHP}
          </Text>
        </View>
      </View>

      {/* MP Bar */}
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>MP</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${mpPercent}%`, backgroundColor: mpColor }]} />
          <Text style={styles.barText}>
            {Math.ceil(combatant.currentMP)}/{combatant.maxMP}
          </Text>
        </View>
      </View>

      {/* Status effects */}
      {hasStatuses && (
        <View style={[styles.statusRow, align === 'right' && styles.statusRowRight]}>
          {combatant.statuses.map((s, i) => (
            <View key={i} style={styles.statusBadge}>
              <Text style={styles.statusText}>{s.effect}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 180,
    padding: Spacing.sm,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.2)',
  },
  containerRight: {
    alignSelf: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row-reverse',
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: 'rgba(201, 170, 113, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.primaryGold,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  barLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.textMuted,
    width: 22,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  barText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    color: Colors.textPrimary,
    textAlign: 'center',
    zIndex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  statusRowRight: {
    justifyContent: 'flex-end',
  },
  statusBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 8,
    color: '#c4b5fd',
    textTransform: 'capitalize',
  },
});
