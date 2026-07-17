/**
 * CharacterSelect — Lets the player choose their active character.
 *
 * Shows all unlocked characters with their level, stats, and passives.
 * The selected character is the one used in the next battle.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import {
  GAME_CHARACTERS,
  CHARACTER_BY_ID,
  getStatsAtLevel,
  getSkillsForLevel,
} from '@/constants/gameData';
import type { GameCharacterDoc } from '@/services/gameData';

interface CharacterSelectProps {
  visible: boolean;
  characters: GameCharacterDoc[];
  activeCharId: string;
  onSelect: (charId: string) => void;
  onClose: () => void;
}

export const CharacterSelect = ({
  visible,
  characters,
  activeCharId,
  onSelect,
  onClose,
}: CharacterSelectProps) => {
  const insets = useSafeAreaInsets();

  const charDocs = characters.filter((c) => c.unlocked);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Seleccionar Personaje</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
          {charDocs.map((charDoc) => {
            const def = CHARACTER_BY_ID.get(charDoc.charId);
            if (!def) return null;

            const stats = getStatsAtLevel(charDoc.charId, charDoc.level);
            const skills = getSkillsForLevel(charDoc.charId, charDoc.level);
            const isActive = charDoc.charId === activeCharId;

            return (
              <TouchableOpacity
                key={charDoc.charId}
                style={[
                  styles.charCard,
                  { borderColor: isActive ? def.accentColor : 'rgba(255,255,255,0.08)' },
                  isActive && styles.charCardActive,
                ]}
                onPress={() => onSelect(charDoc.charId)}
                activeOpacity={0.8}
              >
                {/* Name + level */}
                <View style={styles.charHeader}>
                  <View style={[styles.charIcon, { backgroundColor: `${def.accentColor}22`, borderColor: def.accentColor }]}>
                    <Ionicons name={def.fallbackIcon as any} size={24} color={def.accentColor} />
                  </View>
                  <View style={styles.charInfo}>
                    <Text style={[styles.charName, { color: def.accentColor }]}>{def.name}</Text>
                    <Text style={styles.charTitle}>{def.title}</Text>
                  </View>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Nv {charDoc.level}</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.charDesc}>{def.description}</Text>

                {/* Stats */}
                <View style={styles.statsGrid}>
                  <Stat label="HP" value={stats.hp} color="#22c55e" />
                  <Stat label="MP" value={stats.mp} color="#3b82f6" />
                  <Stat label="ATK" value={stats.attack} color="#ef4444" />
                  <Stat label="DEF" value={stats.defense} color="#3b82f6" />
                  <Stat label="MAG" value={stats.magic} color="#a855f7" />
                  <Stat label="SPD" value={stats.speed} color="#f59e0b" />
                </View>

                {/* Passives */}
                <Text style={styles.sectionLabel}>Pasivas:</Text>
                {def.passives.map((p) => (
                  <View key={p.id} style={styles.passiveRow}>
                    <Ionicons name="flash" size={12} color="#60a5fa" />
                    <Text style={styles.passiveName}>{p.name}:</Text>
                    <Text style={styles.passiveDesc}>{p.description}</Text>
                  </View>
                ))}

                {/* Skills count */}
                <Text style={styles.sectionLabel}>
                  Habilidades: {skills.length}
                </Text>

                {isActive && (
                  <View style={styles.activeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={def.accentColor} />
                    <Text style={[styles.activeText, { color: def.accentColor }]}>EQUIPADO</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const Stat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 170, 113, 0.15)',
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 18,
    color: Colors.primaryGold,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    flex: 1,
    padding: Spacing.md,
  },
  charCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
  },
  charCardActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  charHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  charIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  charInfo: {
    flex: 1,
  },
  charName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  charTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  levelBadge: {
    backgroundColor: 'rgba(201, 170, 113, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.primaryGold,
  },
  charDesc: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
  },
  statValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  sectionLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    marginBottom: 4,
  },
  passiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  passiveName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: '#60a5fa',
  },
  passiveDesc: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    alignSelf: 'flex-end',
  },
  activeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
  },
});
