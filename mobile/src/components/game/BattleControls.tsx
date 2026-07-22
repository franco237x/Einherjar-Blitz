import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HeartPulse, LogOut, Shield, Sparkles, Swords } from 'lucide-react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface Props { isProcessing: boolean; isPlayerTurn: boolean; canUseSpecial: boolean; specialUsed: boolean; canRegen: boolean; attackRange: string; regenAmount: number; defenseAmount: number; onAttack: () => void; onDefend: () => void; onRegen: () => void; onSpecial: () => void; onExit: () => void; }

export const BattleControls = ({ isProcessing, isPlayerTurn, canUseSpecial, specialUsed, canRegen, attackRange, regenAmount, defenseAmount, onAttack, onDefend, onRegen, onSpecial, onExit }: Props) => {
  const waiting = isProcessing || !isPlayerTurn;
  const specialHint = specialUsed ? 'Ya utilizada' : canUseSpecial ? 'Lista' : 'Requiere ≤ 50% HP';
  return <View style={styles.bar}>
    <Command icon={<Swords size={20} color={Colors.primaryGold} />} label="ATACAR" hint={`${attackRange} daño`} disabled={waiting} onPress={onAttack} />
    <Command icon={<Shield size={20} color={Colors.primaryGold} />} label="DEFENDER" hint={`Reduce ${defenseAmount}`} disabled={waiting} onPress={onDefend} />
    <Command icon={<HeartPulse size={20} color={Colors.primaryGold} />} label="CURAR" hint={`+${regenAmount} HP`} disabled={waiting || !canRegen} reason={!canRegen ? 'Vida completa' : undefined} onPress={onRegen} />
    <Command icon={<Sparkles size={20} color={Colors.primaryGold} />} label="ESPECIAL" hint={specialHint} disabled={waiting || !canUseSpecial} onPress={onSpecial} />
    <TouchableOpacity style={styles.exit} onPress={onExit} accessibilityRole="button" accessibilityLabel="Abandonar combate"><LogOut size={18} color={Colors.textSecondary} /><Text style={styles.exitText}>SALIR</Text></TouchableOpacity>
  </View>;
};

function Command({ icon, label, hint, disabled, reason, onPress }: { icon: React.ReactNode; label: string; hint: string; disabled: boolean; reason?: string; onPress: () => void }) {
  const detail = reason ?? hint;
  return <TouchableOpacity style={[styles.command, disabled && styles.disabled]} disabled={disabled} onPress={onPress} activeOpacity={0.78} accessibilityRole="button" accessibilityLabel={`${label}. ${detail}`} accessibilityState={{ disabled }}>
    {icon}<View style={styles.copy}><Text style={styles.label}>{label}</Text><Text style={styles.hint} numberOfLines={1}>{detail}</Text></View>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  bar: { minHeight: 66, flexDirection: 'row', alignItems: 'stretch', gap: Spacing.sm, backgroundColor: Colors.bgDark, borderWidth: 1, borderColor: Colors.borderGold, borderRadius: Radius.lg, padding: Spacing.sm },
  command: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderGold, backgroundColor: Colors.bgCard, paddingHorizontal: Spacing.sm }, disabled: { opacity: 0.38 }, copy: { minWidth: 0 }, label: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 11, letterSpacing: 0.5 }, hint: { fontFamily: Fonts.body, color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  exit: { minWidth: 68, alignItems: 'center', justifyContent: 'center', gap: 3, borderLeftWidth: 1, borderLeftColor: Colors.glassBorder }, exitText: { fontFamily: Fonts.bodyBold, color: Colors.textSecondary, fontSize: 10, letterSpacing: 1 },
});
