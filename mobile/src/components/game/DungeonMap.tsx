/**
 * DungeonMap — Visual representation of dungeon progress.
 *
 * Shows 10 floors as a vertical list. Completed floors are marked,
 * current floor is highlighted, and locked floors are dimmed.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { DUNGEON_FLOORS, GAME_ENEMIES, TOTAL_FLOORS } from '@/constants/gameData';

interface DungeonMapProps {
  currentFloor: number;
  maxFloorReached: number;
  playthroughs: number;
  onFloorPress: (floor: number) => void;
}

export const DungeonMap = ({
  currentFloor,
  maxFloorReached,
  playthroughs,
  onFloorPress,
}: DungeonMapProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mazmorra</Text>
        {playthroughs > 0 && (
          <View style={styles.playthroughBadge}>
            <Text style={styles.playthroughText}>Ciclo {playthroughs + 1}</Text>
          </View>
        )}
      </View>

      <View style={styles.floorList}>
        {DUNGEON_FLOORS.map((floorDef) => {
          const enemy = GAME_ENEMIES[floorDef.enemyId];
          const isCompleted = floorDef.floor < currentFloor;
          const isCurrent = floorDef.floor === currentFloor;
          const isLocked = floorDef.floor > maxFloorReached;

          return (
            <TouchableOpacity
              key={floorDef.floor}
              style={[
                styles.floorItem,
                isCurrent && styles.floorItemCurrent,
                isCompleted && styles.floorItemCompleted,
                isLocked && styles.floorItemLocked,
              ]}
              onPress={() => !isLocked && onFloorPress(floorDef.floor)}
              disabled={isLocked || isCompleted}
              activeOpacity={0.7}
            >
              {/* Floor number */}
              <View style={[
                styles.floorNumber,
                isCurrent && styles.floorNumberCurrent,
                isCompleted && styles.floorNumberCompleted,
              ]}>
                <Text style={[
                  styles.floorNumberText,
                  (isCurrent || isCompleted) && styles.floorNumberTextActive,
                ]}>
                  {floorDef.floor}
                </Text>
              </View>

              {/* Enemy info */}
              <View style={styles.floorInfo}>
                <View style={styles.floorHeader}>
                  <Ionicons
                    name={enemy?.fallbackIcon as any || 'cube'}
                    size={16}
                    color={isLocked ? Colors.textMuted : enemy?.accentColor || Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.enemyName,
                      isLocked && styles.enemyNameLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {enemy?.name || '???'}
                  </Text>
                </View>
                {floorDef.isBoss && (
                  <View style={styles.bossBadge}>
                    <Ionicons name="skull" size={10} color="#ef4444" />
                    <Text style={styles.bossText}>JEFE</Text>
                  </View>
                )}
              </View>

              {/* Status icon */}
              <View style={styles.statusIcon}>
                {isCompleted ? (
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                ) : isCurrent ? (
                  <Ionicons name="play-circle" size={20} color={Colors.primaryGold} />
                ) : isLocked ? (
                  <Ionicons name="lock-closed" size={16} color={Colors.textMuted} />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 16,
    color: Colors.primaryGold,
  },
  playthroughBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playthroughText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: '#c4b5fd',
  },
  floorList: {
    gap: 6,
  },
  floorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  floorItemCurrent: {
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(201, 170, 113, 0.1)',
  },
  floorItemCompleted: {
    opacity: 0.5,
  },
  floorItemLocked: {
    opacity: 0.3,
  },
  floorNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorNumberCurrent: {
    backgroundColor: Colors.primaryGold,
  },
  floorNumberCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  floorNumberText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  floorNumberTextActive: {
    color: Colors.bgDarker,
  },
  floorInfo: {
    flex: 1,
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  enemyName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  enemyNameLocked: {
    color: Colors.textMuted,
  },
  bossBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  bossText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: '#ef4444',
    letterSpacing: 1,
  },
  statusIcon: {
    width: 24,
    alignItems: 'center',
  },
});
