/**
 * CommandMenu — Main battle command menu.
 *
 * Shows 5 options: Attack, Skill, Item, Defend, Flee.
 * Styled as a glassmorphic panel at the bottom of the battle screen.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

export type CommandType = 'attack' | 'skill' | 'item' | 'defend' | 'flee';

interface CommandMenuProps {
  onCommand: (cmd: CommandType) => void;
  disabled: boolean;
  isBossBattle: boolean;
}

const COMMANDS: { type: CommandType; label: string; icon: string; color: string }[] = [
  { type: 'attack', label: 'Atacar', icon: 'cut', color: '#ef4444' },
  { type: 'skill', label: 'Habilidad', icon: 'sparkles', color: '#a855f7' },
  { type: 'item', label: 'Items', icon: 'flask', color: '#22c55e' },
  { type: 'defend', label: 'Defender', icon: 'shield', color: '#3b82f6' },
  { type: 'flee', label: 'Huir', icon: 'exit', color: '#f59e0b' },
];

export const CommandMenu = ({ onCommand, disabled, isBossBattle }: CommandMenuProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.buttonGrid}>
        {COMMANDS.map((cmd) => {
          const isFleeDisabled = cmd.type === 'flee' && isBossBattle;
          const isDisabled = disabled || isFleeDisabled;
          return (
            <TouchableOpacity
              key={cmd.type}
              style={[
                styles.button,
                { borderColor: `${cmd.color}40` },
                isDisabled && styles.buttonDisabled,
              ]}
              onPress={() => onCommand(cmd.type)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cmd.icon as any}
                size={18}
                color={isDisabled ? Colors.textMuted : cmd.color}
              />
              <Text
                style={[
                  styles.label,
                  { color: isDisabled ? Colors.textMuted : Colors.textPrimary },
                ]}
              >
                {cmd.label}
              </Text>
              {isFleeDisabled && (
                <Text style={styles.disabledHint}>Jefe</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 170, 113, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderWidth: 1,
    minWidth: 90,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  disabledHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    color: Colors.textMuted,
    marginLeft: 4,
  },
});
