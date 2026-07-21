import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerCombatantState, BossCombatantState } from '@/services/battleEngine';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

interface BattleHUDProps {
  player: PlayerCombatantState;
  boss: BossCombatantState;
  turnCount: number;
}

export const BattleHUD: React.FC<BattleHUDProps> = ({
  player,
  boss,
  turnCount,
}) => {
  const playerHPPercent = Math.max(0, (player.currentHealth / player.maxHealth) * 100);
  const bossHPPercent = Math.max(0, (boss.currentHealth / boss.maxHealth) * 100);

  return (
    <View style={styles.headerRow}>
      {/* Player HP */}
      <View style={[styles.combatantHeader, { borderColor: player.def.accentColor }]}>
        <View style={styles.nameRow}>
          <Text style={[styles.combatantName, { color: player.def.accentColor }]}>
            {player.def.name}
          </Text>
          <Text style={styles.hpText}>
            {player.currentHealth} / {player.maxHealth}
          </Text>
        </View>
        <View style={styles.healthTrack}>
          <View
            style={[
              styles.healthFill,
              {
                width: `${playerHPPercent}%`,
                backgroundColor:
                  playerHPPercent > 50
                    ? '#10b981'
                    : playerHPPercent > 25
                    ? '#f59e0b'
                    : '#ef4444',
              },
            ]}
          />
        </View>
      </View>

      {/* Turn Badge */}
      <View style={styles.turnBadge}>
        <Text style={styles.turnText}>T{turnCount}</Text>
      </View>

      {/* Boss HP */}
      <View style={[styles.combatantHeader, { borderColor: boss.isPhase2 ? '#ef4444' : '#7f1d1d' }]}>
        <View style={styles.nameRow}>
          <Text style={styles.hpText}>
            {boss.currentHealth} / {boss.maxHealth}
          </Text>
          <Text style={[styles.combatantName, { color: boss.isPhase2 ? '#ef4444' : '#dc2626' }]}>
            {boss.isPhase2 ? `${boss.def.name} (Trono)` : boss.def.name}
          </Text>
        </View>
        <View style={styles.healthTrack}>
          <View
            style={[
              styles.healthFill,
              {
                width: `${bossHPPercent}%`,
                backgroundColor: boss.isPhase2 ? '#ef4444' : '#991b1b',
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  combatantHeader: {
    flex: 1,
    backgroundColor: 'rgba(8, 8, 8, 0.9)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderGold,
    shadowColor: Colors.primaryGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  combatantName: {
    fontFamily: Fonts.title,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  hpText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  healthTrack: {
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  healthFill: {
    height: '100%',
    borderRadius: 7,
  },
  turnBadge: {
    backgroundColor: 'rgba(201, 170, 113, 0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.primaryGold,
  },
  turnText: {
    fontFamily: Fonts.title,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primaryGold,
  },
});
