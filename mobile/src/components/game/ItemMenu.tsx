/**
 * ItemMenu — Submenu showing consumable items.
 *
 * Lists items with quantity. Disabled if quantity is 0.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { GAME_ITEMS, ITEM_BY_ID } from '@/constants/gameData';

interface ItemMenuProps {
  items: Record<string, number>;
  onUseItem: (itemId: string) => void;
  onBack: () => void;
}

export const ItemMenu = ({ items, onUseItem, onBack }: ItemMenuProps) => {
  const availableItems = GAME_ITEMS.filter((item) => (items[item.id] || 0) > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Items</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: Spacing.sm }}>
        {availableItems.length === 0 ? (
          <Text style={styles.emptyText}>No tienes items.</Text>
        ) : (
          availableItems.map((item) => {
            const qty = items[item.id] || 0;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => onUseItem(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemIcon}>
                  <Ionicons name={item.icon as any} size={18} color={Colors.primaryGold} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                </View>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>x{qty}</Text>
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
  list: {
    paddingHorizontal: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    gap: Spacing.sm,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 170, 113, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
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
    marginTop: 2,
  },
  qtyBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qtyText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#22c55e',
  },
  emptyText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
