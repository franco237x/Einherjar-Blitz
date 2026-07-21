import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swords, Shield, HeartPulse, Sparkles, LogOut } from 'lucide-react-native';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

interface BattleControlsProps {
  isProcessing: boolean;
  isPlayerTurn: boolean;
  canUseSpecial: boolean;
  onAttack: () => void;
  onDefend: () => void;
  onRegen: () => void;
  onSpecial: () => void;
  onExit: () => void;
}

export const BattleControls: React.FC<BattleControlsProps> = ({
  isProcessing,
  isPlayerTurn,
  canUseSpecial,
  onAttack,
  onDefend,
  onRegen,
  onSpecial,
  onExit,
}) => {
  const disabled = isProcessing || !isPlayerTurn;

  return (
    <View style={styles.commandBar}>
      <TouchableOpacity
        style={[styles.cmdButton, styles.attackBtn, disabled && styles.cmdDisabled]}
        disabled={disabled}
        activeOpacity={0.7}
        onPress={onAttack}
      >
        <Swords size={20} color="#fff" />
        <Text style={styles.cmdText}>ATACAR</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cmdButton, styles.defendBtn, disabled && styles.cmdDisabled]}
        disabled={disabled}
        activeOpacity={0.7}
        onPress={onDefend}
      >
        <Shield size={20} color="#fff" />
        <Text style={styles.cmdText}>DEFENDER</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cmdButton, styles.regenBtn, disabled && styles.cmdDisabled]}
        disabled={disabled}
        activeOpacity={0.7}
        onPress={onRegen}
      >
        <HeartPulse size={20} color="#fff" />
        <Text style={styles.cmdText}>CURAR</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cmdButton, styles.specialBtn, (!canUseSpecial || disabled) && styles.cmdDisabled]}
        disabled={!canUseSpecial || disabled}
        activeOpacity={0.7}
        onPress={onSpecial}
      >
        <Sparkles size={20} color="#fff" />
        <Text style={styles.cmdText}>ESPECIAL</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exitBtn} activeOpacity={0.7} onPress={onExit}>
        <LogOut size={18} color={Colors.primaryGold} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  commandBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(5, 5, 5, 0.85)',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 170, 113, 0.25)',
    padding: Spacing.sm,
  },
  cmdButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  attackBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: 'rgba(220, 38, 38, 0.6)',
  },
  defendBtn: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: 'rgba(37, 99, 235, 0.6)',
  },
  regenBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.6)',
  },
  specialBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: 'rgba(168, 85, 247, 0.6)',
  },
  cmdDisabled: {
    opacity: 0.3,
  },
  cmdText: {
    fontFamily: Fonts.title,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  exitBtn: {
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryGold,
  },
});
