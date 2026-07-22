import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Crown, Shield } from 'lucide-react-native';
import type { BattleState, BossCombatantState, PlayerCombatantState } from '@/services/battleEngine';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface BattleHUDProps { player: PlayerCombatantState; boss: BossCombatantState; turnCount: number; turnPhase: BattleState['turnPhase']; isProcessing: boolean; }

export const BattleHUD = ({ player, boss, turnCount, turnPhase, isProcessing }: BattleHUDProps) => {
  const playerPercent = Math.max(0, player.currentHealth / player.maxHealth * 100);
  const bossPercent = Math.max(0, boss.currentHealth / boss.maxHealth * 100);
  const isPlayer = turnPhase === 'player_turn' && !isProcessing;
  const phaseLabel = isPlayer ? 'TU TURNO' : turnPhase === 'boss_turn' || isProcessing ? 'RIVAL' : turnPhase === 'victory' ? 'VICTORIA' : 'DERROTA';

  return <View style={styles.hud} pointerEvents="none">
    <HealthPlate name={player.def.name} hp={player.currentHealth} max={player.maxHealth} percent={playerPercent} active={isPlayer} />
    <View style={[styles.round, !isPlayer && styles.roundDanger]}>
      <Text style={styles.roundNumber}>{turnCount}</Text>
      <Text style={styles.roundLabel}>RONDA</Text>
      <Text style={[styles.turnLabel, !isPlayer && styles.dangerText]}>{phaseLabel}</Text>
    </View>
    <HealthPlate name={boss.isPhase2 ? 'REY ESCARLATA · FASE II' : boss.def.name} hp={boss.currentHealth} max={boss.maxHealth} percent={bossPercent} active={!isPlayer} danger reverse />
  </View>;
};

function HealthPlate({ name, hp, max, percent, active, danger = false, reverse = false }: { name: string; hp: number; max: number; percent: number; active: boolean; danger?: boolean; reverse?: boolean }) {
  return <View style={[styles.plate, reverse && styles.plateReverse, active && (danger ? styles.activeDanger : styles.active)]}>
    <View style={[styles.identity, reverse && styles.reverse]}>
      <View style={[styles.portrait, danger && styles.portraitDanger]}>{danger ? <Crown size={18} color={Colors.strengthWeak} /> : <Shield size={18} color={Colors.primaryGold} />}</View>
      <View style={styles.copy}>
        <Text style={[styles.name, reverse && styles.right]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.hp, reverse && styles.right]}>{hp} / {max} HP</Text>
      </View>
    </View>
    <View style={styles.track}><View style={[styles.fill, danger && styles.fillDanger, { width: `${percent}%`, alignSelf: reverse ? 'flex-end' : 'flex-start' }]} /></View>
  </View>;
}

const styles = StyleSheet.create({
  hud: { position: 'absolute', top: 8, left: 10, right: 10, minHeight: 58, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 10 },
  plate: { width: '39%', maxWidth: 360, minHeight: 54, padding: 7, backgroundColor: 'rgba(5, 5, 5, 0.82)', borderLeftWidth: 3, borderColor: Colors.darkGold, borderTopRightRadius: Radius.md, borderBottomRightRadius: Radius.md },
  plateReverse: { borderLeftWidth: 0, borderRightWidth: 3, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: Radius.md, borderBottomLeftRadius: Radius.md },
  active: { borderColor: Colors.primaryGold, backgroundColor: 'rgba(21, 21, 21, 0.94)' }, activeDanger: { borderColor: Colors.strengthWeak, backgroundColor: 'rgba(28, 10, 10, 0.94)' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 7 }, reverse: { flexDirection: 'row-reverse' }, portrait: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderGold, backgroundColor: Colors.bgDark }, portraitDanger: { borderColor: 'rgba(239,68,68,0.45)' },
  copy: { flex: 1, minWidth: 0 }, name: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 12, letterSpacing: 0.5 }, hp: { fontFamily: Fonts.bodyBold, color: Colors.textSecondary, fontSize: 10, marginTop: 1 }, right: { textAlign: 'right' },
  track: { height: 7, marginTop: 5, borderRadius: Radius.full, backgroundColor: Colors.bgDarker, overflow: 'hidden' }, fill: { height: '100%', borderRadius: Radius.full, backgroundColor: Colors.primaryGold }, fillDanger: { backgroundColor: Colors.strengthWeak },
  round: { width: 72, minHeight: 61, alignItems: 'center', justifyContent: 'center', borderRadius: 36, backgroundColor: 'rgba(5,5,5,0.9)', borderWidth: 2, borderColor: Colors.primaryGold }, roundDanger: { borderColor: Colors.strengthWeak }, roundNumber: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 18, lineHeight: 19 }, roundLabel: { fontFamily: Fonts.bodyBold, color: Colors.textMuted, fontSize: 8, letterSpacing: 1 }, turnLabel: { fontFamily: Fonts.bodyBold, color: Colors.primaryGold, fontSize: 8, marginTop: 2, letterSpacing: 0.6 }, dangerText: { color: Colors.strengthWeak },
});
