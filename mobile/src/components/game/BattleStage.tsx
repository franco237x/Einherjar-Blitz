import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Bot,
  Cpu,
  Crown,
  Flame,
  Radiation,
  Shield,
  Sword,
  Wand2,
  Zap,
} from 'lucide-react-native';
import type {
  BossCombatantState,
  LogEntry,
  PlayerCombatantState,
} from '@/services/battleEngine';
import {
  getCharacterAnimation,
  getCharacterVisual,
  type CharacterAnimationClip,
  type CharacterAnimationName,
} from '@/constants/characterAssets';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { SpriteActor } from './SpriteActor';

const ICONS: Record<
  string,
  React.FC<{ size?: number; color?: string }>
> = {
  Bot,
  Cpu,
  Crown,
  Flame,
  Sword,
  Wand2,
  Zap,
  Flash: Zap,
};

interface Props {
  player: PlayerCombatantState;
  boss: BossCombatantState;
  log: LogEntry[];
}

export const BattleStage = ({ player, boss, log }: Props) => {
  const { height, width } = useWindowDimensions();
  const compact = height < 400 || width < 740;
  const playerIconKey =
    player.specialUsed && player.def.specialAbility.transformedIcon
      ? player.def.specialAbility.transformedIcon
      : player.def.lucideIcon;
  const PlayerIcon = ICONS[playerIconKey] || Bot;
  const BossIcon =
    ICONS[boss.isPhase2 ? boss.def.phase2LucideIcon : boss.def.lucideIcon] ||
    Crown;
  const animationName = animationForSpriteState(player.spriteState);
  const animation = getCharacterAnimation(
    player.animationCharacterId,
    animationName
  );
  const playerVisual = getCharacterVisual(player.animationCharacterId);
  const bossAnimationName = animationForSpriteState(boss.spriteState);
  const bossAnimation = getCharacterAnimation(
    'rey_escarlata',
    bossAnimationName
  );
  const bossVisual = getCharacterVisual('rey_escarlata');
  const latest = log.at(-1);

  return (
    <View style={styles.stage}>
      {boss.isPhase2 && <View style={styles.phaseVeil} />}

      <Combatant
        side="left"
        compact={compact}
        animationName={animationName}
        animation={animation}
        animationMirrored={playerVisual?.facing === 'left'}
        fallback={
          <PlayerIcon
            size={compact ? 82 : 116}
            color={Colors.primaryGold}
          />
        }
        defending={player.isDefending}
        spriteState={player.spriteState}
      />

      <Combatant
        side="right"
        compact={compact}
        animationName={bossAnimationName}
        animation={bossAnimation}
        animationMirrored={bossVisual?.facing === 'right'}
        image={
          boss.def.imageUri
            ? {
                uri:
                  boss.isPhase2 && boss.def.phase2ImageUri
                    ? boss.def.phase2ImageUri
                    : boss.def.imageUri,
              }
            : null
        }
        fallback={
          <BossIcon size={compact ? 86 : 120} color={Colors.strengthWeak} />
        }
        danger
        spriteState={boss.spriteState}
      />

      <View style={styles.narrative} pointerEvents="none">
        <Text
          style={[
            styles.eventText,
            latest?.type === 'boss_attack' && styles.dangerText,
          ]}
          numberOfLines={2}
        >
          {latest?.message ?? 'Los campeones entran en la arena.'}
        </Text>
      </View>

      <View style={styles.playerStates}>
        {player.isDefending && (
          <Status
            icon={<Shield size={13} color={Colors.primaryGold} />}
            label="GUARDIA"
          />
        )}
        {player.radiationFieldTurns > 0 && (
          <Status
            icon={<Radiation size={13} color={Colors.primaryGold} />}
            label={`CAMPO · ${player.radiationFieldTurns}T`}
          />
        )}
      </View>

      {boss.isPhase2 && (
        <View style={styles.bossStates}>
          <Status
            icon={<Flame size={13} color={Colors.strengthWeak} />}
            label="TRONO ESCARLATA"
            danger
          />
        </View>
      )}
    </View>
  );
};

function animationForSpriteState(
  spriteState: string
): CharacterAnimationName {
  if (spriteState === 'attack') return 'attack';
  if (spriteState === 'defend') return 'defend';
  if (spriteState === 'special') return 'special';
  if (spriteState === 'regen') return 'heal';
  return 'idle';
}

interface CombatantProps {
  side: 'left' | 'right';
  compact: boolean;
  image?: ImageSourcePropType | null;
  animationName?: CharacterAnimationName;
  animation?: CharacterAnimationClip;
  animationMirrored?: boolean;
  fallback: React.ReactNode;
  defending?: boolean;
  danger?: boolean;
  spriteState: string;
}

function Combatant({
  side,
  compact,
  image,
  animationName,
  animation,
  animationMirrored,
  fallback,
  defending,
  danger,
  spriteState,
}: CombatantProps) {
  const isHit = spriteState === 'hit';

  return (
    <View
      style={[
        styles.combatant,
        side === 'left' ? styles.left : styles.right,
      ]}
    >
      <View
        style={[
          styles.aura,
          danger && styles.auraDanger,
          defending && styles.auraGuard,
          isHit && styles.hit,
        ]}
      />
      <View style={[styles.actor, isHit && styles.hit]}>
        {animation && animationName ? (
          <SpriteActor
            animation={animationName}
            clip={animation}
            compact={compact}
            mirrored={animationMirrored}
          />
        ) : image ? (
          <Image
            source={image}
            style={[
              styles.sprite,
              compact && styles.spriteCompact,
              side === 'right' && styles.mirror,
            ]}
            resizeMode="contain"
          />
        ) : (
          fallback
        )}
      </View>
      <View style={[styles.shadow, danger && styles.shadowDanger]} />
    </View>
  );
}

function Status({
  icon,
  label,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <View style={[styles.status, danger && styles.statusDanger]}>
      {icon}
      <Text style={[styles.statusText, danger && styles.dangerText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, minHeight: 0, overflow: 'hidden' },
  phaseVeil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(95, 12, 12, 0.2)',
  },
  combatant: {
    position: 'absolute',
    top: 70,
    bottom: 99,
    width: '40%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  left: { left: '4%' },
  right: { right: '4%' },
  actor: {
    zIndex: 3,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sprite: { width: '100%', height: '100%', maxHeight: 295 },
  spriteCompact: { maxHeight: 210 },
  mirror: { transform: [{ scaleX: -1 }] },
  aura: {
    position: 'absolute',
    bottom: 0,
    width: '76%',
    height: 58,
    borderRadius: 120,
    backgroundColor: 'rgba(58, 209, 223, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(89, 226, 236, 0.36)',
    transform: [{ scaleY: 0.32 }],
  },
  auraDanger: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderColor: 'rgba(239,68,68,0.36)',
  },
  auraGuard: {
    borderWidth: 4,
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(201,170,113,0.18)',
  },
  hit: { opacity: 0.68, transform: [{ translateX: -5 }] },
  shadow: {
    position: 'absolute',
    zIndex: 2,
    bottom: -2,
    width: '70%',
    height: 28,
    borderRadius: 80,
    backgroundColor: 'rgba(0,0,0,0.72)',
    transform: [{ scaleY: 0.36 }],
  },
  shadowDanger: { backgroundColor: 'rgba(70,0,0,0.7)' },
  narrative: {
    position: 'absolute',
    left: '23%',
    right: '23%',
    bottom: 100,
    minHeight: 31,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(4, 7, 10, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.34)',
  },
  eventText: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textPrimary,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  dangerText: { color: Colors.strengthWeak },
  playerStates: { position: 'absolute', left: 8, top: 78, gap: 5 },
  bossStates: { position: 'absolute', right: 46, top: 78 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    minHeight: 26,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(5,5,5,0.78)',
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  statusDanger: { borderColor: 'rgba(239,68,68,0.5)' },
  statusText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primaryGold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
});
