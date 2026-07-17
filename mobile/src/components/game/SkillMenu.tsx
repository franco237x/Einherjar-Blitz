/**
 * SkillMenu — Submenu showing the character's available skills.
 *
 * Lists skills with MP cost and description. Disabled if not enough MP.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import type { Skill } from '@/constants/gameData';

interface SkillMenuProps {
  skills: Skill[];
  currentMP: number;
  onUseSkill: (skillId: string) => void;
  onBack: () => void;
}

export const SkillMenu = ({ skills, currentMP, onUseSkill, onBack }: SkillMenuProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Habilidades</Text>
        <View style={styles.mpDisplay}>
          <Ionicons name="water" size={12} color="#3b82f6" />
          <Text style={styles.mpText}>{Math.ceil(currentMP)} MP</Text>
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: Spacing.sm }}>
        {skills.length === 0 ? (
          <Text style={styles.emptyText}>No tienes habilidades disponibles.</Text>
        ) : (
          skills.map((skill) => {
            const canAfford = currentMP >= skill.mpCost;
            return (
              <TouchableOpacity
                key={skill.id}
                style={[
                  styles.skillItem,
                  !canAfford && styles.skillItemDisabled,
                ]}
                onPress={() => canAfford && onUseSkill(skill.id)}
                disabled={!canAfford}
                activeOpacity={0.7}
              >
                <View style={styles.skillInfo}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text style={styles.skillDesc} numberOfLines={2}>{skill.description}</Text>
                </View>
                <View style={styles.skillCost}>
                  <Text style={[styles.costText, !canAfford && styles.costTextDisabled]}>
                    {skill.mpCost} MP
                  </Text>
                  <Ionicons
                    name={(skill.type === 'physical' ? 'cut' : skill.type === 'magical' ? 'sparkles' : skill.type === 'heal' ? 'heart' : 'shield') as any}
                    size={14}
                    color={canAfford ? Colors.primaryGold : Colors.textMuted}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 170, 113, 0.3)',
    maxHeight: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginLeft: -22,
  },
  mpDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mpText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: '#3b82f6',
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    gap: Spacing.sm,
  },
  skillItemDisabled: {
    opacity: 0.4,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  skillDesc: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  skillCost: {
    alignItems: 'center',
    gap: 2,
    minWidth: 50,
  },
  costText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: '#3b82f6',
  },
  costTextDisabled: {
    color: Colors.textMuted,
  },
  emptyText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
