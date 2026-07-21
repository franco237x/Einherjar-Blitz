import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBattle } from '@/hooks/useBattle';
import { BattleHUD } from './BattleHUD';
import { BattleStage } from './BattleStage';
import { BattleControls } from './BattleControls';
import { BattleModal } from './BattleModal';
import { Spacing } from '@/constants/theme';

interface BattleScreenProps {
  charId: string;
  onExit: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({ charId, onExit }) => {
  const {
    battleState,
    isProcessing,
    rewards,
    savingFirebase,
    saveError,
    attack,
    defend,
    regen,
    special,
  } = useBattle(charId);

  const { player, boss, turnCount, turnPhase, log } = battleState;

  const canUseSpecial =
    !player.specialUsed && player.currentHealth <= player.maxHealth * 0.5;

  return (
    <View style={styles.container}>
      {/* Atmospheric battle background — dark crimson RPG arena. */}
      <LinearGradient
        colors={['#050505', '#0a0506', '#050505']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(201, 170, 113, 0.03)' },
        ]}
        pointerEvents="none"
      />

      <View style={styles.inner}>
        {/* Top Header: Health Bars & Turn Counter */}
        <BattleHUD player={player} boss={boss} turnCount={turnCount} />

        {/* Center Stage: Sprites, Domain Banners & Battle Log */}
        <BattleStage player={player} boss={boss} log={log} />

        {/* Bottom Controls: Command Bar */}
        <BattleControls
          isProcessing={isProcessing}
          isPlayerTurn={turnPhase === 'player_turn'}
          canUseSpecial={canUseSpecial}
          onAttack={attack}
          onDefend={defend}
          onRegen={regen}
          onSpecial={special}
          onExit={onExit}
        />

        {/* End Battle Victory/Defeat Modals */}
        {(turnPhase === 'victory' || turnPhase === 'defeat') && (
          <BattleModal
            phase={turnPhase}
            bossName={boss.def.name}
            savingFirebase={savingFirebase}
            saveError={saveError}
            rewards={rewards}
            onExit={onExit}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
});
