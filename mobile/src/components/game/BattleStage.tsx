import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import {
  Bot,
  Cpu,
  Sword,
  Zap,
  Wand2,
  Moon,
  Crown,
  Flame,
  Radiation,
  Swords,
} from 'lucide-react-native';
import { PlayerCombatantState, BossCombatantState, LogEntry } from '@/services/battleEngine';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
// Importing characterAssets triggers the runtime injection of sprite
// sources into GAME_CHARACTERS. This side-effect import must run before
// any component reads `player.def.sprites`.
import '@/constants/characterAssets';
import type { ImageSourcePropType } from 'react-native';

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Bot: Bot,
  Cpu: Cpu,
  Sword: Sword,
  Zap: Zap,
  Flash: Zap,
  Wand2: Wand2,
  Moon: Moon,
  Crown: Crown,
  Flame: Flame,
};

interface BattleStageProps {
  player: PlayerCombatantState;
  boss: BossCombatantState;
  log: LogEntry[];
}

export const BattleStage: React.FC<BattleStageProps> = ({
  player,
  boss,
  log,
}) => {
  const logScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    logScrollRef.current?.scrollToEnd({ animated: true });
  }, [log]);

  const playerIconKey =
    player.specialUsed && player.def.specialAbility.transformedIcon
      ? player.def.specialAbility.transformedIcon
      : player.def.lucideIcon;

  const PlayerIcon = ICON_MAP[playerIconKey] || Bot;

  const bossIconKey = boss.isPhase2
    ? boss.def.phase2LucideIcon
    : boss.def.lucideIcon;

  const BossIcon = ICON_MAP[bossIconKey] || Crown;

  // Resolve the player's active sprite source based on spriteState.
  const playerSprites = player.def.sprites;
  let playerImageSource: ImageSourcePropType | null = null;
  if (player.spriteState === 'attack' && playerSprites?.attackGif) {
    playerImageSource = playerSprites.attackGif;
  } else if (player.spriteState === 'defend' && playerSprites?.defenseGif) {
    playerImageSource = playerSprites.defenseGif;
  } else if (playerSprites?.battleSprite) {
    playerImageSource = playerSprites.battleSprite;
  }

  return (
    <View style={styles.stage}>
      {/* Battle floor line */}
      <View style={styles.floorLine} />

      {/* VS emblem centered top */}
      <View style={styles.vsBadge}>
        <Swords size={14} color="#050505" />
        <Text style={styles.vsText}>VS</Text>
      </View>

      {/* Left side: Player combatant */}
      <View style={styles.sideColumn}>
        <View style={styles.actorBox}>
          <View style={styles.actorNameRow}>
            <Text style={[styles.actorName, { color: player.def.accentColor }]}>
              {player.def.name}
            </Text>
          </View>

          {playerImageSource ? (
            <Image
              source={playerImageSource}
              style={[styles.spriteImage, player.isDefending && styles.defendingPulse]}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: `${player.def.accentColor}18` }]}>
              <PlayerIcon size={64} color={player.def.accentColor} />
            </View>
          )}

          <Text style={[styles.stateLabel, { color: player.def.accentColor }]}>
            {player.spriteState.toUpperCase().replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Center: Battle log + active effects */}
      <View style={styles.middleStage}>
        {boss.isPhase2 && (
          <View style={styles.domainBanner}>
            <Flame size={16} color="#ef4444" />
            <Text style={styles.domainBannerText}>TRONO ESCARLATA ACTIVO</Text>
          </View>
        )}

        {player.radiationFieldTurns > 0 && (
          <View style={[styles.domainBanner, styles.radiationBanner]}>
            <Radiation size={16} color="#38bdf8" />
            <Text style={[styles.domainBannerText, { color: '#38bdf8' }]}>
              CAMPO PRIMORDIAL ({player.radiationFieldTurns}T)
            </Text>
          </View>
        )}

        <ScrollView
          ref={logScrollRef}
          style={styles.logScrollView}
          contentContainerStyle={styles.logContent}
          showsVerticalScrollIndicator={false}
        >
          {log.slice(-8).map((item) => (
            <Text
              key={item.id}
              style={[
                styles.logLine,
                item.type === 'crit' && styles.logCrit,
                item.type === 'special' && styles.logSpecial,
                item.type === 'boss_phase' && styles.logPhase,
                item.type === 'regen' && styles.logRegen,
                item.type === 'boss_attack' && styles.logBossAttack,
              ]}
            >
              {item.message}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* Right side: Boss combatant */}
      <View style={styles.sideColumn}>
        <View style={styles.actorBox}>
          <View style={styles.actorNameRow}>
            <Text style={[styles.actorName, { color: boss.isPhase2 ? '#ef4444' : '#dc2626' }]}>
              {boss.def.name}
            </Text>
          </View>

          {boss.def.imageUri ? (
            <Image
              source={{ uri: boss.isPhase2 && boss.def.phase2ImageUri ? boss.def.phase2ImageUri : boss.def.imageUri }}
              style={[styles.spriteImage, boss.isPhase2 && styles.bossPhase2Glow]}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: boss.isPhase2 ? 'rgba(220,38,38,0.2)' : 'rgba(127,29,29,0.2)' },
              ]}
            >
              <BossIcon size={64} color={boss.isPhase2 ? '#ef4444' : '#dc2626'} />
            </View>
          )}

          <Text style={[styles.stateLabel, { color: boss.isPhase2 ? '#ef4444' : '#dc2626' }]}>
            {boss.spriteState.toUpperCase().replace('_', ' ')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  floorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: 'rgba(201, 170, 113, 0.25)',
  },
  vsBadge: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    zIndex: 10,
  },
  vsText: {
    fontFamily: Fonts.title,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#050505',
    letterSpacing: 1,
  },
  sideColumn: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.md,
  },
  actorBox: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actorNameRow: {
    backgroundColor: 'rgba(5, 5, 5, 0.7)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.25)',
  },
  actorName: {
    fontFamily: Fonts.title,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  spriteImage: {
    width: 150,
    height: 180,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  defendingPulse: {
    opacity: 0.9,
  },
  bossPhase2Glow: {
    opacity: 0.95,
  },
  stateLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 1,
    textAlign: 'center',
  },
  middleStage: {
    flex: 1.4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.15)',
    padding: Spacing.sm,
    paddingTop: Spacing.lg,
    justifyContent: 'flex-start',
  },
  domainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    paddingVertical: 4,
    marginBottom: 6,
  },
  radiationBanner: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  domainBannerText: {
    fontFamily: Fonts.title,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: 1,
  },
  logScrollView: {
    flex: 1,
  },
  logContent: {
    gap: 4,
  },
  logLine: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  logCrit: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  logSpecial: {
    color: '#a855f7',
    fontWeight: 'bold',
  },
  logPhase: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  logRegen: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  logBossAttack: {
    color: '#f87171',
  },
});
