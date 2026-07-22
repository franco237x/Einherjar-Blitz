import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBattle } from '@/hooks/useBattle';
import { BattleHUD } from './BattleHUD';
import { BattleStage } from './BattleStage';
import { BattleControls } from './BattleControls';
import { BattleModal } from './BattleModal';
import { Colors, Spacing } from '@/constants/theme';

interface BattleScreenProps { charId: string; onExit: () => void; }

export const BattleScreen = ({ charId, onExit }: BattleScreenProps) => {
  const insets = useSafeAreaInsets();
  const { battleState, isProcessing, rewards, savingFirebase, saveError, attack, defend, regen, special } = useBattle(charId);
  const { player, boss, turnCount, turnPhase, log } = battleState;
  const canUseSpecial = !player.specialUsed && player.currentHealth <= player.maxHealth * 0.5;
  const canRegen = player.currentHealth < player.maxHealth;
  const battleEnded = turnPhase === 'victory' || turnPhase === 'defeat';

  const confirmExit = () => {
    if (battleEnded) return onExit();
    Alert.alert('¿Abandonar combate?', 'Perderás el progreso de esta batalla.', [
      { text: 'Seguir luchando', style: 'cancel' },
      { text: 'Abandonar', style: 'destructive', onPress: onExit },
    ]);
  };

  return (
    <View style={[styles.container, { paddingLeft: Math.max(insets.left, 8), paddingRight: Math.max(insets.right, 8), paddingTop: Math.max(insets.top, 6), paddingBottom: Math.max(insets.bottom, 6) }]}>
      <BattleHUD player={player} boss={boss} turnCount={turnCount} turnPhase={turnPhase} isProcessing={isProcessing} />
      <BattleStage player={player} boss={boss} log={log} />
      <BattleControls
        isProcessing={isProcessing}
        isPlayerTurn={turnPhase === 'player_turn'}
        canUseSpecial={canUseSpecial}
        specialUsed={player.specialUsed}
        canRegen={canRegen}
        attackRange={`${player.currentMinDamage}–${player.currentMaxDamage}`}
        regenAmount={player.def.regenAmount}
        defenseAmount={player.currentDefenseReduction}
        onAttack={attack}
        onDefend={defend}
        onRegen={regen}
        onSpecial={special}
        onExit={confirmExit}
      />
      {battleEnded && <BattleModal phase={turnPhase} bossName={boss.def.name} savingFirebase={savingFirebase} saveError={saveError} rewards={rewards} onExit={onExit} />}
    </View>
  );
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: Colors.bgDarker, gap: Spacing.sm } });
