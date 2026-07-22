import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HeartPulse, Shield, Sparkles, Swords } from 'lucide-react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface Props { isProcessing: boolean; isPlayerTurn: boolean; canUseSpecial: boolean; specialUsed: boolean; canRegen: boolean; attackRange: string; regenAmount: number; defenseAmount: number; specialName: string; healthPercent: number; onAttack: () => void; onDefend: () => void; onRegen: () => void; onSpecial: () => void; }

export const BattleControls = ({ isProcessing, isPlayerTurn, canUseSpecial, specialUsed, canRegen, attackRange, regenAmount, defenseAmount, specialName, healthPercent, onAttack, onDefend, onRegen, onSpecial }: Props) => {
  const waiting = isProcessing || !isPlayerTurn;
  const specialCharge = specialUsed ? 0 : Math.min(100, Math.max(0, (1 - healthPercent) * 200));
  return <View style={styles.dock}>
    <View style={styles.prompt}><Text style={styles.promptOverline}>{waiting ? 'EL RIVAL ESTÁ ACTUANDO' : 'ELIGE UNA TÉCNICA'}</Text><Text style={styles.promptTitle}>{waiting ? 'Mantén la guardia' : 'Tu turno'}</Text></View>
    <Skill featured icon={<Swords size={25} color={Colors.bgDarker} />} label="GOLPE" value={`${attackRange} DMG`} disabled={waiting} onPress={onAttack} />
    <Skill icon={<Shield size={22} color={Colors.primaryGold} />} label="GUARDIA" value={`-${defenseAmount} DMG`} disabled={waiting} onPress={onDefend} />
    <Skill icon={<HeartPulse size={22} color={Colors.primaryGold} />} label="REGENERAR" value={`+${regenAmount} HP`} disabled={waiting || !canRegen} blocked={!canRegen ? 'HP LLENO' : undefined} onPress={onRegen} />
    <Skill icon={<Sparkles size={22} color={canUseSpecial ? Colors.primaryGold : Colors.textMuted} />} label={specialName} value={specialUsed ? 'CONSUMIDA' : canUseSpecial ? 'LISTA' : `${Math.round(specialCharge)}% CARGA`} disabled={waiting || !canUseSpecial} progress={specialCharge} onPress={onSpecial} />
  </View>;
};

function Skill({ icon, label, value, disabled, blocked, featured, progress, onPress }: { icon: React.ReactNode; label: string; value: string; disabled: boolean; blocked?: string; featured?: boolean; progress?: number; onPress: () => void }) {
  return <TouchableOpacity style={[styles.skill, featured && styles.featured, disabled && styles.disabled]} disabled={disabled} onPress={onPress} activeOpacity={0.72} accessibilityRole="button" accessibilityLabel={`${label}. ${blocked ?? value}`} accessibilityState={{ disabled }}>
    <View style={[styles.icon, featured && styles.featuredIcon]}>{icon}</View>
    <Text style={[styles.label, featured && styles.featuredText]} numberOfLines={1}>{label}</Text>
    <Text style={[styles.value, featured && styles.featuredValue]} numberOfLines={1}>{blocked ?? value}</Text>
    {typeof progress === 'number' && <View style={styles.charge}><View style={[styles.chargeFill, { width: `${progress}%` }]} /></View>}
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', left: 14, right: 14, bottom: 8, minHeight: 78, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: Spacing.sm, padding: 7, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderGold, backgroundColor: 'rgba(5, 5, 5, 0.9)', zIndex: 15 },
  prompt: { width: 126, justifyContent: 'center', paddingHorizontal: Spacing.sm, borderRightWidth: 1, borderRightColor: Colors.glassBorder }, promptOverline: { fontFamily: Fonts.bodyBold, color: Colors.textMuted, fontSize: 8, letterSpacing: 0.8 }, promptTitle: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 15, marginTop: 3 },
  skill: { flex: 1, maxWidth: 178, minWidth: 92, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.glassBorder, backgroundColor: Colors.bgCard, overflow: 'hidden' }, featured: { flex: 1.15, borderColor: Colors.primaryGold, backgroundColor: Colors.primaryGold }, disabled: { opacity: 0.42 },
  icon: { height: 25, alignItems: 'center', justifyContent: 'center' }, featuredIcon: { transform: [{ scale: 1.08 }] }, label: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 10, letterSpacing: 0.45, marginTop: 3 }, featuredText: { color: Colors.bgDarker }, value: { fontFamily: Fonts.bodyBold, color: Colors.primaryGold, fontSize: 9, marginTop: 2 }, featuredValue: { color: Colors.bgDark },
  charge: { position: 'absolute', left: 6, right: 6, bottom: 4, height: 3, borderRadius: Radius.full, backgroundColor: Colors.bgDarker }, chargeFill: { height: '100%', borderRadius: Radius.full, backgroundColor: Colors.primaryGold },
});
