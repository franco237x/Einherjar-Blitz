/**
 * RestScreen — Shown between dungeon floors.
 *
 * Lets the player use items to heal before the next battle.
 * Shows current HP/MP and available items.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { GAME_ITEMS, getStatsAtLevel } from '@/constants/gameData';
import type { GameCharacterDoc } from '@/services/gameData';

interface RestScreenProps {
  character: GameCharacterDoc;
  charId: string;
  floor: number;
  items: Record<string, number>;
  onUseItem: (itemId: string) => void;
  onContinue: () => void;
}

export const RestScreen = ({
  character,
  charId,
  floor,
  items,
  onUseItem,
  onContinue,
}: RestScreenProps) => {
  const insets = useSafeAreaInsets();
  const stats = getStatsAtLevel(charId, character.level);
  const hpPercent = (character.currentHP / stats.hp) * 100;
  const mpPercent = (character.currentMP / stats.mp) * 100;

  const availableItems = GAME_ITEMS.filter((item) => (items[item.id] || 0) > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="moon" size={48} color={Colors.primaryGold} />
        </View>

        <Text style={styles.title}>Descanso</Text>
        <Text style={styles.subtitle}>Piso {floor} completado</Text>

        {/* HP/MP display */}
        <View style={styles.statsBox}>
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>HP</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${hpPercent}%`, backgroundColor: '#22c55e' }]} />
              <Text style={styles.barText}>{Math.ceil(character.currentHP)}/{stats.hp}</Text>
            </View>
          </View>
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>MP</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${mpPercent}%`, backgroundColor: '#3b82f6' }]} />
              <Text style={styles.barText}>{Math.ceil(character.currentMP)}/{stats.mp}</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <Text style={styles.sectionTitle}>Items disponibles</Text>
        {availableItems.length === 0 ? (
          <Text style={styles.emptyText}>No tienes items para curarte.</Text>
        ) : (
          <View style={styles.itemList}>
            {availableItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => onUseItem(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon as any} size={18} color={Colors.primaryGold} />
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>x{items[item.id]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Continue button */}
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.continueText}>SIGUIENTE PISO →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.bgDark,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconWrap: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 24,
    color: Colors.primaryGold,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  statsBox: {
    width: '100%',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.15)',
    marginBottom: Spacing.lg,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.textMuted,
    width: 26,
  },
  barTrack: {
    flex: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  barText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  itemList: {
    width: '100%',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  itemDesc: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
  },
  qtyBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qtyText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: '#22c55e',
  },
  emptyText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  continueBtn: {
    backgroundColor: Colors.primaryGold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  continueText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.bgDarker,
    letterSpacing: 1,
  },
});
