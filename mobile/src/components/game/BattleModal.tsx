import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trophy, Skull, Crown, Award, Star } from 'lucide-react-native';
import { VictoryRewards } from '@/services/battleService';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

interface BattleModalProps {
  phase: 'victory' | 'defeat';
  bossName: string;
  savingFirebase: boolean;
  saveError: string | null;
  rewards: VictoryRewards | null;
  onExit: () => void;
}

export const BattleModal: React.FC<BattleModalProps> = ({
  phase,
  bossName,
  savingFirebase,
  saveError,
  rewards,
  onExit,
}) => {
  if (phase === 'victory') {
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconRow}>
            <Crown size={40} color={Colors.primaryGold} />
            <Trophy size={40} color="#f59e0b" />
          </View>
          <Text style={styles.modalTitle}>¡VICTORIA ÉPICA!</Text>
          <Text style={styles.modalSub}>Has derrotado a {bossName}</Text>

          {savingFirebase ? (
            <ActivityIndicator size="large" color={Colors.primaryGold} style={{ marginVertical: Spacing.md }} />
          ) : saveError ? (
            <View style={[styles.rewardsBox, { borderColor: '#ef4444' }]}>
              <Text style={[styles.rewardTitle, { color: '#ef4444' }]}>
                NO SE PUDIERON GUARDAR LAS RECOMPENSAS
              </Text>
              <Text style={styles.rewardItem}>{saveError}</Text>
            </View>
          ) : rewards ? (
            <View style={styles.rewardsBox}>
              <Text style={styles.rewardTitle}>RECOMPENSAS OBTENIDAS</Text>
              <View style={styles.rewardRow}>
                <Trophy size={18} color="#f59e0b" />
                <Text style={styles.rewardItem}>+{rewards.copasGained} Copas</Text>
              </View>
              <View style={styles.rewardRow}>
                <Star size={18} color={Colors.primaryGold} />
                <Text style={styles.rewardItem}>+{rewards.spheresGained} Esferas</Text>
              </View>
              <View style={styles.rewardRow}>
                <Award size={18} color="#38bdf8" />
                <Text style={styles.rewardItem}>+{rewards.xpGained} XP</Text>
              </View>
              <View style={styles.rankRow}>
                <Crown size={18} color="#a855f7" />
                <Text style={styles.rewardItem}>
                  Rango: <Text style={{ color: Colors.primaryGold, fontWeight: 'bold' }}>{rewards.newRank}</Text>
                </Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity style={styles.modalBtn} activeOpacity={0.8} onPress={onExit}>
            <Text style={styles.modalBtnText}>VOLVER AL HUB</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalCard, { borderColor: '#ef4444' }]}>
        <Skull size={48} color="#ef4444" />
        <Text style={[styles.modalTitle, { color: '#ef4444' }]}>DERROTA</Text>
        <Text style={styles.modalSub}>{bossName} ha reclamado tu espíritu.</Text>

        {saveError ? (
          <Text style={[styles.modalSub, { color: '#ef4444', marginTop: 4 }]}>
            {saveError}
          </Text>
        ) : null}

        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ef4444' }]} activeOpacity={0.8} onPress={onExit}>
          <Text style={[styles.modalBtnText, { color: '#fff' }]}>REGRESAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: 340,
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontFamily: Fonts.title,
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primaryGold,
    marginTop: Spacing.xs,
    letterSpacing: 1,
  },
  modalSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  rewardsBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  rewardTitle: {
    fontFamily: Fonts.title,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primaryGold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: 1,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 170, 113, 0.2)',
  },
  rewardItem: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  modalBtn: {
    backgroundColor: Colors.primaryGold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  modalBtnText: {
    fontFamily: Fonts.title,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
  },
});
