import React from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { Crown, Shield } from 'lucide-react-native';
import type {
  BattleState,
  BossCombatantState,
  PlayerCombatantState,
} from '@/services/battleEngine';
import { getCharacterVisual } from '@/constants/characterAssets';
import { Colors, Fonts } from '@/constants/theme';

interface BattleHUDProps {
  player: PlayerCombatantState;
  boss: BossCombatantState;
  turnCount: number;
  turnPhase: BattleState['turnPhase'];
  isProcessing: boolean;
}

export const BattleHUD = ({
  player,
  boss,
  turnCount,
  turnPhase,
  isProcessing,
}: BattleHUDProps) => {
  const { height, width } = useWindowDimensions();
  const compact = height < 400 || width < 740;
  const narrow = width < 620;
  const playerPercent = Math.max(
    0,
    (player.currentHealth / player.maxHealth) * 100
  );
  const bossPercent = Math.max(
    0,
    (boss.currentHealth / boss.maxHealth) * 100
  );
  const isPlayer = turnPhase === 'player_turn' && !isProcessing;
  const phaseLabel = isPlayer
    ? 'TU TURNO'
    : turnPhase === 'boss_turn' || isProcessing
      ? 'RIVAL'
      : turnPhase === 'victory'
        ? 'VICTORIA'
        : 'DERROTA';
  const playerPortrait =
    getCharacterVisual(player.animationCharacterId)?.portrait;
  const bossPortrait = getCharacterVisual('rey_escarlata')?.portrait;

  return (
    <View
      style={[styles.hud, narrow && styles.hudNarrow]}
      pointerEvents="none"
    >
      <HealthPlate
        name={player.def.name}
        role="EINHERJAR"
        portrait={playerPortrait}
        hp={player.currentHealth}
        max={player.maxHealth}
        percent={playerPercent}
        active={isPlayer}
        compact={compact}
        narrow={narrow}
      />
      <TurnRail
        playerPortrait={playerPortrait}
        bossPortrait={bossPortrait}
        turnCount={turnCount}
        phaseLabel={phaseLabel}
        playerActive={isPlayer}
        compact={compact}
        narrow={narrow}
      />
      <HealthPlate
        name={boss.isPhase2 ? 'REY ESCARLATA · FASE II' : boss.def.name}
        role="JEFE DE MISIÓN"
        portrait={bossPortrait}
        hp={boss.currentHealth}
        max={boss.maxHealth}
        percent={bossPercent}
        active={!isPlayer}
        compact={compact}
        narrow={narrow}
        danger
        reverse
      />
    </View>
  );
};

interface HealthPlateProps {
  name: string;
  role: string;
  portrait?: ImageSourcePropType;
  hp: number;
  max: number;
  percent: number;
  active: boolean;
  compact: boolean;
  narrow: boolean;
  danger?: boolean;
  reverse?: boolean;
}

function HealthPlate({
  name,
  role,
  portrait,
  hp,
  max,
  percent,
  active,
  compact,
  narrow,
  danger = false,
  reverse = false,
}: HealthPlateProps) {
  return (
    <View
      style={[
        styles.plate,
        compact && styles.plateCompact,
        narrow && styles.plateNarrow,
        reverse && styles.plateReverse,
        active && (danger ? styles.activeDanger : styles.active),
      ]}
    >
      <LinearGradient
        colors={
          danger
            ? ['rgba(42, 9, 10, 0.96)', 'rgba(8, 10, 13, 0.94)']
            : ['rgba(9, 24, 29, 0.96)', 'rgba(8, 10, 13, 0.94)']
        }
        start={{ x: reverse ? 1 : 0, y: 0 }}
        end={{ x: reverse ? 0 : 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.identity, reverse && styles.reverse]}>
        <View style={[styles.portrait, danger && styles.portraitDanger]}>
          {portrait ? (
            <Image
              source={portrait}
              style={styles.portraitImage}
              contentFit="contain"
              transition={0}
            />
          ) : danger ? (
            <Crown size={18} color={Colors.strengthWeak} />
          ) : (
            <Shield size={18} color={Colors.primaryGold} />
          )}
        </View>
        <View style={styles.copy}>
          {!compact && (
            <Text style={[styles.role, reverse && styles.right]}>{role}</Text>
          )}
          <Text
            style={[styles.name, reverse && styles.right]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <View style={[styles.hpRow, reverse && styles.reverse]}>
            <Text style={styles.hp}>{hp}</Text>
            <Text style={styles.maxHp}> / {max} HP</Text>
          </View>
        </View>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fillShell,
            {
              width: `${percent}%`,
              alignSelf: reverse ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          <LinearGradient
            colors={
              danger
                ? ['#ff725e', '#a91421']
                : ['#79f0ef', '#18a9c5']
            }
            start={{ x: reverse ? 1 : 0, y: 0 }}
            end={{ x: reverse ? 0 : 1, y: 0 }}
            style={styles.fill}
          />
        </View>
        <View
          style={[styles.trackShine, reverse && styles.trackShineReverse]}
        />
      </View>
      <View style={[styles.edgeMark, reverse && styles.edgeMarkReverse]} />
    </View>
  );
}

interface TurnRailProps {
  playerPortrait?: ImageSourcePropType;
  bossPortrait?: ImageSourcePropType;
  turnCount: number;
  phaseLabel: string;
  playerActive: boolean;
  compact: boolean;
  narrow: boolean;
}

function TurnRail({
  playerPortrait,
  bossPortrait,
  turnCount,
  phaseLabel,
  playerActive,
  compact,
  narrow,
}: TurnRailProps) {
  const tokenCount = narrow ? 3 : compact ? 5 : 7;
  const timeline = Array.from({ length: tokenCount }, (_, index) => {
    const playerToken = index % 2 === 0 ? playerActive : !playerActive;
    return {
      playerToken,
      portrait: playerToken ? playerPortrait : bossPortrait,
    };
  });

  return (
    <View
      style={[
        styles.turnRail,
        compact && styles.turnRailCompact,
        narrow && styles.turnRailNarrow,
      ]}
    >
      <View style={styles.turnMeta}>
        <Text style={styles.roundLabel}>
          RONDA {String(turnCount).padStart(2, '0')}
        </Text>
        <Text
          style={[
            styles.turnLabel,
            !playerActive && styles.dangerText,
          ]}
        >
          {phaseLabel}
        </Text>
      </View>
      <View style={styles.timeline}>
        <View style={styles.timelineLine} />
        {timeline.map(({ playerToken, portrait }, index) => (
          <View
            key={`${playerToken ? 'player' : 'boss'}-${index}`}
            style={[
              styles.turnToken,
              compact && styles.turnTokenCompact,
              !playerToken && styles.turnTokenDanger,
              index === 0 && styles.turnTokenActive,
              index > 2 && styles.turnTokenFuture,
            ]}
          >
            {portrait ? (
              <Image
                source={portrait}
                style={styles.turnPortrait}
                contentFit="contain"
                transition={0}
              />
            ) : playerToken ? (
              <Shield size={14} color={Colors.primaryGold} />
            ) : (
              <Crown size={14} color={Colors.strengthWeak} />
            )}
            {index === 0 && <View style={styles.currentMarker} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: 'absolute',
    top: 3,
    left: 2,
    right: 2,
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 7,
    zIndex: 10,
  },
  hudNarrow: {
    gap: 3,
  },
  plate: {
    width: '34%',
    maxWidth: 350,
    minWidth: 0,
    height: 66,
    paddingHorizontal: 7,
    paddingTop: 6,
    paddingBottom: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(5, 8, 11, 0.94)',
    borderLeftWidth: 3,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(74, 215, 230, 0.5)',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  plateCompact: {
    height: 56,
    paddingTop: 4,
    paddingBottom: 4,
  },
  plateNarrow: {
    width: '35%',
  },
  plateReverse: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderColor: 'rgba(239, 68, 68, 0.52)',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  active: {
    borderColor: '#69e6ee',
    shadowColor: '#37cadc',
    shadowOpacity: 0.35,
    shadowRadius: 9,
  },
  activeDanger: {
    borderColor: '#ff675a',
    shadowColor: '#ef4444',
    shadowOpacity: 0.35,
    shadowRadius: 9,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reverse: {
    flexDirection: 'row-reverse',
  },
  portrait: {
    width: 39,
    height: 39,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74, 215, 230, 0.58)',
    backgroundColor: 'rgba(2, 5, 8, 0.92)',
  },
  portraitDanger: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  role: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    fontSize: 7,
    letterSpacing: 1,
    lineHeight: 8,
  },
  name: {
    fontFamily: Fonts.title,
    color: Colors.textPrimary,
    fontSize: 11,
    letterSpacing: 0.35,
    lineHeight: 14,
  },
  hpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hp: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textPrimary,
    fontSize: 10,
    lineHeight: 11,
  },
  maxHp: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted,
    fontSize: 8,
  },
  right: {
    textAlign: 'right',
  },
  track: {
    height: 7,
    marginTop: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    overflow: 'hidden',
  },
  fillShell: {
    height: '100%',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  trackShine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  trackShineReverse: {
    left: undefined,
    right: 0,
  },
  edgeMark: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 42,
    height: 2,
    backgroundColor: '#51d8e5',
  },
  edgeMarkReverse: {
    left: undefined,
    right: 0,
    backgroundColor: '#ef4444',
  },
  turnRail: {
    flex: 1,
    maxWidth: 292,
    minWidth: 200,
    minHeight: 64,
    paddingHorizontal: 7,
    paddingTop: 3,
    alignItems: 'stretch',
  },
  turnRailCompact: {
    minWidth: 160,
    paddingHorizontal: 3,
  },
  turnRailNarrow: {
    minWidth: 0,
    paddingHorizontal: 0,
  },
  turnMeta: {
    height: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  roundLabel: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textSecondary,
    fontSize: 7,
    letterSpacing: 1,
  },
  turnLabel: {
    fontFamily: Fonts.bodyBold,
    color: '#69e6ee',
    fontSize: 7,
    letterSpacing: 1,
  },
  dangerText: {
    color: Colors.strengthWeak,
  },
  timeline: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 20,
    height: 1,
    backgroundColor: 'rgba(201,170,113,0.3)',
  },
  turnToken: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(74, 215, 230, 0.48)',
    backgroundColor: 'rgba(4, 9, 13, 0.96)',
  },
  turnTokenCompact: {
    width: 27,
    height: 27,
  },
  turnTokenDanger: {
    borderColor: 'rgba(239,68,68,0.45)',
  },
  turnTokenActive: {
    width: 38,
    height: 38,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(23, 19, 13, 0.98)',
  },
  turnTokenFuture: {
    opacity: 0.62,
    transform: [{ scale: 0.9 }],
  },
  turnPortrait: {
    width: '100%',
    height: '100%',
  },
  currentMarker: {
    position: 'absolute',
    bottom: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primaryGold,
  },
});
