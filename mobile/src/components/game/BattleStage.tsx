import React from 'react';
import { Image, type ImageSourcePropType, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Bot, Cpu, Crown, Flame, Moon, Radiation, Shield, Sword, Wand2, Zap } from 'lucide-react-native';
import type { BossCombatantState, LogEntry, PlayerCombatantState } from '@/services/battleEngine';
import { Colors, Fonts, Radius } from '@/constants/theme';
import '@/constants/characterAssets';

const ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = { Bot, Cpu, Crown, Flame, Moon, Sword, Wand2, Zap, Flash: Zap };
interface Props { player: PlayerCombatantState; boss: BossCombatantState; log: LogEntry[]; }

export const BattleStage = ({ player, boss, log }: Props) => {
  const { height, width } = useWindowDimensions();
  const compact = height < 400 || width < 740;
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
    <View style={styles.platform} />
    {boss.isPhase2 && <View style={styles.phaseVeil} />}
    <Combatant side="left" compact={compact} image={source} fallback={<PlayerIcon size={compact ? 82 : 116} color={Colors.primaryGold} />} defending={player.isDefending} spriteState={player.spriteState} />
    <View style={styles.versus}><View style={styles.rune}><Text style={styles.vs}>VS</Text></View></View>
    <Combatant side="right" compact={compact} image={boss.def.imageUri ? { uri: boss.isPhase2 && boss.def.phase2ImageUri ? boss.def.phase2ImageUri : boss.def.imageUri } : null} fallback={<BossIcon size={compact ? 86 : 120} color={Colors.strengthWeak} />} danger spriteState={boss.spriteState} />

    <View style={styles.narrative} pointerEvents="none"><Text style={[styles.eventText, latest?.type === 'boss_attack' && styles.dangerText]} numberOfLines={2}>{latest?.message ?? 'Los campeones entran en la arena.'}</Text></View>
    <View style={styles.playerStates}>
      {player.isDefending && <Status icon={<Shield size={13} color={Colors.primaryGold} />} label="GUARDIA" />}
      {player.radiationFieldTurns > 0 && <Status icon={<Radiation size={13} color={Colors.primaryGold} />} label={`CAMPO · ${player.radiationFieldTurns}T`} />}
    </View>
    {boss.isPhase2 && <View style={styles.bossStates}><Status icon={<Flame size={13} color={Colors.strengthWeak} />} label="TRONO ESCARLATA" danger /></View>}
  </View>;
};

function Combatant({ side, compact, image, fallback, defending, danger, spriteState }: { side: 'left' | 'right'; compact: boolean; image: ImageSourcePropType | null; fallback: React.ReactNode; defending?: boolean; danger?: boolean; spriteState: string }) {
  const isHit = spriteState === 'hit';
  return <View style={[styles.combatant, side === 'left' ? styles.left : styles.right]}>
    <View style={[styles.aura, danger && styles.auraDanger, defending && styles.auraGuard, isHit && styles.hit]} />
    <View style={[styles.actor, isHit && styles.hit]}>{image ? <Image source={image} style={[styles.sprite, compact && styles.spriteCompact, side === 'right' && styles.mirror]} resizeMode="contain" /> : fallback}</View>
    <View style={[styles.shadow, danger && styles.shadowDanger]} />
  </View>;
}

function Status({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) { return <View style={[styles.status, danger && styles.statusDanger]}>{icon}<Text style={[styles.statusText, danger && styles.dangerText]}>{label}</Text></View>; }

const styles = StyleSheet.create({
  stage: { flex: 1, minHeight: 0, overflow: 'hidden' },
  platform: { position: 'absolute', left: '8%', right: '8%', bottom: 62, height: 62, borderRadius: 120, backgroundColor: 'rgba(5,5,5,0.42)', borderTopWidth: 2, borderColor: Colors.borderGold, transform: [{ scaleY: 0.45 }] },
  phaseVeil: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(95, 12, 12, 0.2)' },
  combatant: { position: 'absolute', top: 60, bottom: 73, width: '43%', alignItems: 'center', justifyContent: 'flex-end' }, left: { left: '2%' }, right: { right: '2%' },
  actor: { zIndex: 3, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'flex-end' }, sprite: { width: '100%', height: '100%', maxHeight: 295 }, spriteCompact: { maxHeight: 210 }, mirror: { transform: [{ scaleX: -1 }] },
  aura: { position: 'absolute', bottom: 22, width: '66%', height: '68%', borderRadius: 160, backgroundColor: 'rgba(201,170,113,0.08)', borderWidth: 1, borderColor: 'rgba(201,170,113,0.18)' }, auraDanger: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }, auraGuard: { borderWidth: 3, borderColor: Colors.primaryGold }, hit: { opacity: 0.68, transform: [{ translateX: -5 }] },
  shadow: { position: 'absolute', zIndex: 2, bottom: 3, width: '70%', height: 24, borderRadius: 80, backgroundColor: 'rgba(0,0,0,0.65)', transform: [{ scaleY: 0.36 }] }, shadowDanger: { backgroundColor: 'rgba(70,0,0,0.7)' },
  versus: { position: 'absolute', left: '45%', right: '45%', top: '38%', alignItems: 'center' }, rune: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5,5,5,0.68)', borderWidth: 1, borderColor: Colors.borderGold }, vs: { fontFamily: Fonts.title, color: Colors.primaryGold, fontSize: 13 },
  narrative: { position: 'absolute', left: '21%', right: '21%', bottom: 92, minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: 'rgba(5,5,5,0.78)', borderWidth: 1, borderColor: Colors.glassBorder }, eventText: { fontFamily: Fonts.bodyMedium, color: Colors.textPrimary, fontSize: 12, lineHeight: 15, textAlign: 'center' }, dangerText: { color: Colors.strengthWeak },
  playerStates: { position: 'absolute', left: 14, top: 72, gap: 5 }, bossStates: { position: 'absolute', right: 14, top: 72 }, status: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, minHeight: 26, borderRadius: Radius.full, backgroundColor: 'rgba(5,5,5,0.78)', borderWidth: 1, borderColor: Colors.borderGold }, statusDanger: { borderColor: 'rgba(239,68,68,0.5)' }, statusText: { fontFamily: Fonts.bodyBold, color: Colors.primaryGold, fontSize: 9, letterSpacing: 0.6 },
});
