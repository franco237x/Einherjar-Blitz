import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BattleState, BossCombatantState, PlayerCombatantState } from '@/services/battleEngine';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface BattleHUDProps { player: PlayerCombatantState; boss: BossCombatantState; turnCount: number; turnPhase: BattleState['turnPhase']; isProcessing: boolean; }

export const BattleHUD = ({ player, boss, turnCount, turnPhase, isProcessing }: BattleHUDProps) => {
  const playerPercent = Math.max(0, player.currentHealth / player.maxHealth * 100);
  const bossPercent = Math.max(0, boss.currentHealth / boss.maxHealth * 100);
  const phaseLabel = turnPhase === 'player_turn' && !isProcessing ? 'TU TURNO' : turnPhase === 'boss_turn' || isProcessing ? 'TURNO ENEMIGO' : turnPhase === 'victory' ? 'VICTORIA' : 'DERROTA';
  return <View style={styles.row}>
    <HealthPanel name={player.def.name} hp={player.currentHealth} max={player.maxHealth} percent={playerPercent} align="left" />
    <View style={styles.turn}><Text style={styles.turnLabel}>{phaseLabel}</Text><Text style={styles.turnCount}>RONDA {turnCount}</Text></View>
    <HealthPanel name={boss.isPhase2 ? 'REY ESCARLATA · TRONO' : boss.def.name} hp={boss.currentHealth} max={boss.maxHealth} percent={bossPercent} align="right" danger />
  </View>;
};

function HealthPanel({ name, hp, max, percent, align, danger = false }: { name: string; hp: number; max: number; percent: number; align: 'left' | 'right'; danger?: boolean }) {
  return <View style={styles.panel}>
    <View style={[styles.nameRow, align === 'right' && styles.reverse]}><Text style={styles.name} numberOfLines={1}>{name}</Text><Text style={styles.hp}>{hp} / {max}</Text></View>
    <View style={styles.track}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: danger ? Colors.strengthWeak : percent <= 25 ? Colors.strengthWeak : Colors.primaryGold, alignSelf: align === 'right' ? 'flex-end' : 'flex-start' }]} /></View>
  </View>;
}

const styles = StyleSheet.create({
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, panel: { flex: 1, minWidth: 0, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.glassBorder, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }, reverse: { flexDirection: 'row-reverse' }, name: { flex: 1, fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 13 }, hp: { fontFamily: Fonts.bodyBold, color: Colors.textSecondary, fontSize: 12 },
  track: { height: 8, backgroundColor: Colors.bgDarker, borderRadius: Radius.full, overflow: 'hidden', marginTop: 6 }, fill: { height: '100%', borderRadius: Radius.full },
  turn: { minWidth: 112, alignItems: 'center' }, turnLabel: { fontFamily: Fonts.bodyBold, color: Colors.primaryGold, fontSize: 11, letterSpacing: 1.2 }, turnCount: { fontFamily: Fonts.body, color: Colors.textMuted, fontSize: 10, marginTop: 2 },
});
