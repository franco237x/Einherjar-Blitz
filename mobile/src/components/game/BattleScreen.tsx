import React from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBattle } from '@/hooks/useBattle';
import { BattleHUD } from './BattleHUD';
import { BattleStage } from './BattleStage';
import { BattleControls } from './BattleControls';
import { BattleModal } from './BattleModal';
import { Colors } from '@/constants/theme';

interface BattleScreenProps {
  charId: string;
  onExit: () => void;
}

const ARENA = require('../../../assets/images/game/arena-scarlet-forge.webp');

export const BattleScreen = ({ charId, onExit }: BattleScreenProps) => {
  const insets = useSafeAreaInsets();
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
  const canRegen = player.currentHealth < player.maxHealth;
  const battleEnded = turnPhase === 'victory' || turnPhase === 'defeat';

  const confirmExit = () => {
    if (battleEnded) return onExit();
    Alert.alert(
      '¿Abandonar la arena?',
      'Perderás el progreso de este duelo.',
      [
        { text: 'Seguir luchando', style: 'cancel' },
        { text: 'Abandonar', style: 'destructive', onPress: onExit },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Image
        source={ARENA}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={180}
      />
      <LinearGradient
        colors={[
          'rgba(2, 5, 8, 0.72)',
          'rgba(2, 5, 8, 0.06)',
          'rgba(2, 5, 8, 0.16)',
          'rgba(2, 4, 7, 0.9)',
        ]}
        locations={[0, 0.2, 0.66, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[
          styles.safe,
          {
            paddingLeft: Math.max(insets.left, 10),
            paddingRight: Math.max(insets.right, 10),
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <BattleStage player={player} boss={boss} log={log} />
        <BattleHUD
          player={player}
          boss={boss}
          turnCount={turnCount}
          turnPhase={turnPhase}
          isProcessing={isProcessing}
        />
        <TouchableOpacity
          style={styles.exit}
          onPress={confirmExit}
          accessibilityRole="button"
          accessibilityLabel="Abandonar combate"
        >
          <LogOut size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <BattleControls
          isProcessing={isProcessing}
          isPlayerTurn={turnPhase === 'player_turn'}
          canUseSpecial={canUseSpecial}
          specialUsed={player.specialUsed}
          canRegen={canRegen}
          attackRange={`${player.currentMinDamage}–${player.currentMaxDamage}`}
          regenAmount={player.def.regenAmount}
          defenseAmount={player.currentDefenseReduction}
          specialName={player.def.specialAbility.name}
          healthPercent={player.currentHealth / player.maxHealth}
          onAttack={attack}
          onDefend={defend}
          onRegen={regen}
          onSpecial={special}
        />
        {battleEnded && (
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
    backgroundColor: Colors.bgDarker,
  },
  safe: {
    flex: 1,
  },
  exit: {
    position: 'absolute',
    top: 76,
    right: 4,
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 8, 11, 0.86)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    zIndex: 20,
  },
});
