import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Award, Crown, Skull, Star, Trophy } from 'lucide-react-native';
import { VictoryRewards } from '@/services/battleService';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface BattleModalProps { phase: 'victory' | 'defeat'; bossName: string; savingFirebase: boolean; saveError: string | null; rewards: VictoryRewards | null; onExit: () => void; }

export const BattleModal = ({ phase, bossName, savingFirebase, saveError, rewards, onExit }: BattleModalProps) => {
  const victory = phase === 'victory';
  return <View style={styles.overlay}>
    <View style={[styles.banner, !victory && styles.bannerDefeat]}>
      <View style={[styles.emblem, !victory && styles.emblemDefeat]}>{victory ? <Trophy size={36} color={Colors.bgDarker} /> : <Skull size={38} color={Colors.textPrimary} />}</View>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{victory ? 'GLORIA EN LA ARENA' : 'EL VALHALLA AÚN ESPERA'}</Text>
        <Text style={[styles.title, !victory && styles.danger] }>{victory ? 'VICTORIA' : 'DERROTA'}</Text>
        <Text style={styles.subtitle}>{victory ? `${bossName} ha caído ante tu campeón.` : `${bossName} ha reclamado este duelo.`}</Text>

        {savingFirebase && <ActivityIndicator color={Colors.primaryGold} style={styles.loader} />}
        {saveError && <Text style={styles.error}>{saveError}</Text>}
        {victory && rewards && !savingFirebase && <View style={styles.rewards}>
          <Reward icon={<Trophy size={16} color={Colors.primaryGold} />} value={`+${rewards.copasGained}`} label="COPAS" />
          <Reward icon={<Star size={16} color={Colors.primaryGold} />} value={`+${rewards.spheresGained}`} label="ESFERAS" />
          <Reward icon={<Award size={16} color={Colors.primaryGold} />} value={`+${rewards.xpGained}`} label="XP" />
          <Reward icon={<Crown size={16} color={Colors.primaryGold} />} value={rewards.newRank} label="RANGO" />
        </View>}
        <TouchableOpacity style={[styles.button, !victory && styles.buttonDefeat]} onPress={onExit} activeOpacity={0.78} accessibilityRole="button">
          <Text style={styles.buttonText}>{victory ? 'RECLAMAR Y VOLVER' : 'REGRESAR AL SALÓN'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>;
};

function Reward({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) { return <View style={styles.reward}>{icon}<Text style={styles.rewardValue}>{value}</Text><Text style={styles.rewardLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 50, alignItems: 'center', justifyContent: 'center', padding: Spacing.md, backgroundColor: 'rgba(5,5,5,0.78)' },
  banner: { width: '82%', maxWidth: 650, minHeight: 220, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: Colors.primaryGold, borderRadius: Radius.lg, backgroundColor: 'rgba(10,10,10,0.96)', overflow: 'hidden' }, bannerDefeat: { borderColor: Colors.strengthWeak },
  emblem: { width: 104, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryGold }, emblemDefeat: { backgroundColor: Colors.strengthWeak },
  content: { flex: 1, minWidth: 0, alignItems: 'center', padding: Spacing.md }, eyebrow: { fontFamily: Fonts.bodyBold, color: Colors.textMuted, fontSize: 9, letterSpacing: 1.5 }, title: { fontFamily: Fonts.title, color: Colors.primaryGold, fontSize: 28, letterSpacing: 1.5, marginTop: 2 }, danger: { color: Colors.strengthWeak }, subtitle: { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 2 }, loader: { marginVertical: Spacing.md }, error: { fontFamily: Fonts.bodyMedium, color: Colors.strengthWeak, fontSize: 11, marginTop: Spacing.sm },
  rewards: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'center', marginTop: Spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.glassBorder, paddingVertical: Spacing.sm }, reward: { flex: 1, alignItems: 'center', gap: 1, borderRightWidth: 1, borderRightColor: Colors.glassBorder }, rewardValue: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 12 }, rewardLabel: { fontFamily: Fonts.bodyBold, color: Colors.textMuted, fontSize: 8, letterSpacing: 0.6 },
  button: { minHeight: 42, justifyContent: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Radius.md, backgroundColor: Colors.primaryGold }, buttonDefeat: { backgroundColor: Colors.strengthWeak }, buttonText: { fontFamily: Fonts.title, color: Colors.bgDarker, fontSize: 12, letterSpacing: 0.8 },
});
