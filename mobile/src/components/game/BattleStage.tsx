import React from 'react';
import { Image, type ImageSourcePropType, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Bot, Cpu, Crown, Flame, Moon, Radiation, Sword, Wand2, Zap } from 'lucide-react-native';
import type { BossCombatantState, LogEntry, PlayerCombatantState } from '@/services/battleEngine';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import '@/constants/characterAssets';

const ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = { Bot, Cpu, Crown, Flame, Moon, Sword, Wand2, Zap, Flash: Zap };

interface Props { player: PlayerCombatantState; boss: BossCombatantState; log: LogEntry[]; }

export const BattleStage = ({ player, boss, log }: Props) => {
  const { height } = useWindowDimensions();
  const compact = height < 430;
  const playerIconKey = player.specialUsed && player.def.specialAbility.transformedIcon ? player.def.specialAbility.transformedIcon : player.def.lucideIcon;
  const PlayerIcon = ICONS[playerIconKey] || Bot;
  const BossIcon = ICONS[boss.isPhase2 ? boss.def.phase2LucideIcon : boss.def.lucideIcon] || Crown;
  const sprites = player.def.sprites;
  let source: ImageSourcePropType | null = null;
  if (player.spriteState === 'attack' && sprites?.attackGif) source = sprites.attackGif as ImageSourcePropType;
  else if (player.spriteState === 'defend' && sprites?.defenseGif) source = sprites.defenseGif as ImageSourcePropType;
  else if (sprites?.battleSprite) source = sprites.battleSprite as ImageSourcePropType;
  const latest = log.at(-1);

  return <View style={styles.stage}>
    <Combatant side="left" name={player.def.name} compact={compact} image={source} fallback={<PlayerIcon size={compact ? 54 : 68} color={Colors.primaryGold} />} defending={player.isDefending} />
    <View style={styles.center}>
      <View style={styles.effects}>
        {boss.isPhase2 && <Effect icon={<Flame size={14} color={Colors.strengthWeak} />} label="TRONO ESCARLATA" danger />}
        {player.radiationFieldTurns > 0 && <Effect icon={<Radiation size={14} color={Colors.primaryGold} />} label={`CAMPO PRIMORDIAL · ${player.radiationFieldTurns}T`} />}
      </View>
      <View style={styles.event}><Text style={styles.eventLabel}>ÚLTIMO MOVIMIENTO</Text><Text style={[styles.eventText, latest?.type === 'boss_attack' && styles.dangerText]} numberOfLines={3}>{latest?.message ?? 'El duelo está por comenzar.'}</Text></View>
    </View>
    <Combatant side="right" name={boss.isPhase2 ? 'TRONO ESCARLATA' : boss.def.name} compact={compact} image={boss.def.imageUri ? { uri: boss.isPhase2 && boss.def.phase2ImageUri ? boss.def.phase2ImageUri : boss.def.imageUri } : null} fallback={<BossIcon size={compact ? 54 : 68} color={Colors.strengthWeak} />} danger />
  </View>;
};

function Combatant({ side, name, compact, image, fallback, defending, danger }: { side: 'left' | 'right'; name: string; compact: boolean; image: ImageSourcePropType | null; fallback: React.ReactNode; defending?: boolean; danger?: boolean }) {
  return <View style={styles.combatant}>
    <Text style={[styles.actorName, danger && styles.dangerText]} numberOfLines={1}>{name}</Text>
    <View style={[styles.actor, defending && styles.defending]}>{image ? <Image source={image} style={[styles.sprite, compact && styles.spriteCompact, side === 'right' && styles.mirror]} resizeMode="contain" /> : fallback}</View>
    {defending && <Text style={styles.status}>DEFENSA ACTIVA</Text>}
  </View>;
}
function Effect({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) { return <View style={styles.effect}>{icon}<Text style={[styles.effectText, danger && styles.dangerText]}>{label}</Text></View>; }

const styles = StyleSheet.create({
  stage: { flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'stretch', gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.glassBorder, backgroundColor: Colors.bgDark, overflow: 'hidden' },
  combatant: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-end', padding: Spacing.sm }, actorName: { fontFamily: Fonts.title, color: Colors.primaryGold, fontSize: 12, letterSpacing: 0.5 }, actor: { flex: 1, minHeight: 0, width: '100%', alignItems: 'center', justifyContent: 'center' }, sprite: { width: '100%', height: '100%', maxHeight: 205 }, spriteCompact: { maxHeight: 145 }, mirror: { transform: [{ scaleX: -1 }] }, defending: { opacity: 0.82 }, status: { fontFamily: Fonts.bodyBold, color: Colors.primaryGold, fontSize: 10, letterSpacing: 1 },
  center: { flex: 1.15, minWidth: 190, justifyContent: 'center', gap: Spacing.sm, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.glassBorder, padding: Spacing.sm }, effects: { gap: 5 }, effect: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: Colors.glassBorder, borderRadius: Radius.sm, backgroundColor: Colors.bgCard }, effectText: { fontFamily: Fonts.bodyBold, color: Colors.primaryGold, fontSize: 9, letterSpacing: 0.8 },
  event: { backgroundColor: Colors.bgDarker, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.glassBorder }, eventLabel: { fontFamily: Fonts.bodyBold, color: Colors.textMuted, fontSize: 9, letterSpacing: 1.1, textAlign: 'center' }, eventText: { fontFamily: Fonts.bodyMedium, color: Colors.textPrimary, fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 5 }, dangerText: { color: Colors.strengthWeak },
});
