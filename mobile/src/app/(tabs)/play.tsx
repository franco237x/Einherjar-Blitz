/**
 * PlayScreen — RPG game mode main screen.
 *
 * Replaces the old EmptyState placeholder with a full dungeon-crawling
 * JRPG experience. Manages game state, character selection, dungeon
 * progression, and battle flow.
 *
 * States:
 *   - No game:      show "start adventure" screen
 *   - Hub:          show dungeon map + character info + start battle
 *   - Battle:       show BattleScreen
 *   - Victory:      show VictoryScreen with rewards
 *   - Defeat:       show DefeatScreen
 *   - Rest:         show RestScreen between floors
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Background } from '@/components/Background';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { useGameState } from '@/hooks/useGameState';
import { useGameCharacters } from '@/hooks/useGameCharacters';
import {
  recordBattleResult,
  addCharacterXP,
  updateCharacterHPMP,
  unlockCharacter,
  setActiveCharacter,
  useItem as useItemService,
  getGameCharacter,
  type GameState,
} from '@/services/gameData';
import {
  DUNGEON_FLOORS,
  GAME_ENEMIES,
  CHARACTER_BY_ID,
  getStatsAtLevel,
  getUnlockedCharacters,
  getSkillsForLevel,
  getNewSkillAtLevel,
  xpToNextLevel,
} from '@/constants/gameData';
import { BattleScreen } from '@/components/game/BattleScreen';
import { VictoryScreen } from '@/components/game/VictoryScreen';
import { DefeatScreen } from '@/components/game/DefeatScreen';
import { RestScreen } from '@/components/game/RestScreen';
import { CharacterSelect } from '@/components/game/CharacterSelect';
import { DungeonMap } from '@/components/game/DungeonMap';
import type { GameCharacterDoc } from '@/services/gameData';

type ScreenMode = 'hub' | 'battle' | 'victory' | 'defeat' | 'rest';

interface BattleResult {
  victory: boolean;
  fled: boolean;
  finalHP: number;
  finalMP: number;
}

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, loading, startNewGame } = useGameState();
  const { characters } = useGameCharacters();
  const [mode, setMode] = useState<ScreenMode>('hub');
  const [showCharSelect, setShowCharSelect] = useState(false);
  const [lastBattleResult, setLastBattleResult] = useState<BattleResult | null>(null);
  const [battleRewards, setBattleRewards] = useState<{
    xp: number;
    spheres: number;
    leveledUp: boolean;
    newLevel: number;
    newSkill: string | null;
    isBoss: boolean;
  } | null>(null);

  const uid = auth.currentUser?.uid;

  // ─── Start a new battle ──────────────────────────────────────────
  const startBattle = useCallback(async () => {
    if (!uid || !gameState) return;
    setMode('battle');
  }, [uid, gameState]);

  // ─── Handle battle end ───────────────────────────────────────────
  const handleBattleEnd = useCallback(async (result: BattleResult) => {
    if (!uid || !gameState) return;
    setLastBattleResult(result);

    const floorDef = DUNGEON_FLOORS.find((f) => f.floor === gameState.currentFloor);
    const enemy = floorDef ? GAME_ENEMIES[floorDef.enemyId] : null;
    if (!enemy) { setMode('hub'); return; }

    if (result.fled) {
      // Fled — go back to hub without rewards
      setMode('hub');
      return;
    }

    if (result.victory) {
      // Save character HP/MP
      await updateCharacterHPMP(uid, gameState.activeCharacter, result.finalHP, result.finalMP);

      // Add XP to character
      const xpResult = await addCharacterXP(uid, gameState.activeCharacter, enemy.xpReward);

      // Record battle result (updates floor, wins/losses, spheres)
      await recordBattleResult(uid, {
        victory: true,
        floor: gameState.currentFloor,
        xpGained: enemy.xpReward,
        spheresGained: enemy.sphereReward,
      });

      // Check for newly unlocked characters
      const newMaxFloor = Math.max(gameState.maxFloorReached, gameState.currentFloor + 1);
      const newlyUnlocked = getUnlockedCharacters(newMaxFloor).filter(
        (c) => !gameState.unlockedCharacters.includes(c.id)
      );
      for (const char of newlyUnlocked) {
        await unlockCharacter(uid, char.id);
      }

      setBattleRewards({
        xp: enemy.xpReward,
        spheres: enemy.sphereReward,
        leveledUp: xpResult.leveledUp,
        newLevel: xpResult.newLevel,
        newSkill: xpResult.newSkill,
        isBoss: enemy.isBoss,
      });
      setMode('victory');
    } else {
      // Defeat — save HP as 0, record loss
      await updateCharacterHPMP(uid, gameState.activeCharacter, 0, result.finalMP);
      await recordBattleResult(uid, {
        victory: false,
        floor: gameState.currentFloor,
        xpGained: 0,
        spheresGained: 0,
      });

      // Restore character HP on retry (they get a fresh start)
      const charDef = CHARACTER_BY_ID.get(gameState.activeCharacter);
      if (charDef) {
        const activeChar = characters.find((c) => c.charId === gameState.activeCharacter);
        const level = activeChar?.level ?? 1;
        const stats = getStatsAtLevel(gameState.activeCharacter, level);
        await updateCharacterHPMP(uid, gameState.activeCharacter, stats.hp, stats.mp);
      }

      setMode('defeat');
    }
  }, [uid, gameState, characters]);

  // ─── Handle victory continue ─────────────────────────────────────
  const handleVictoryContinue = useCallback(() => {
    if (!gameState) return;
    if (gameState.currentFloor >= 10) {
      // Dungeon completed — back to hub
      setMode('hub');
    } else {
      // Show rest screen between floors
      setMode('rest');
    }
  }, [gameState]);

  // ─── Handle defeat retry ─────────────────────────────────────────
  const handleDefeatRetry = useCallback(() => {
    setMode('hub');
  }, []);

  // ─── Handle use item ─────────────────────────────────────────────
  const handleUseItem = useCallback(async (itemId: string) => {
    if (!uid) return;
    await useItemService(uid, itemId);
  }, [uid]);

  // ─── Handle character select ─────────────────────────────────────
  const handleSelectCharacter = useCallback(async (charId: string) => {
    if (!uid) return;
    await setActiveCharacter(uid, charId);
    setShowCharSelect(false);
  }, [uid]);

  // ─── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <Background>
        <ParticlesBackground />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primaryGold} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </View>
      </Background>
    );
  }

  // ─── No game state — start adventure ─────────────────────────────
  if (!gameState) {
    return (
      <Background>
        <ParticlesBackground />
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.startContent}>
            <View style={styles.startIconWrap}>
              <Ionicons name="game-controller" size={64} color={Colors.primaryGold} />
            </View>
            <Text style={styles.startTitle}>EINHERJAR RPG</Text>
            <Text style={styles.startDesc}>
              Embárcate en una aventura RPG por turnos. Derrota enemigos,
              sube de nivel, aprende habilidades y conquista la mazmorra.
            </Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={startNewGame}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={20} color={Colors.bgDarker} />
              <Text style={styles.startBtnText}>COMENZAR AVENTURA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    );
  }

  // ─── Battle mode ─────────────────────────────────────────────────
  if (mode === 'battle' && gameState) {
    const floorDef = DUNGEON_FLOORS.find((f) => f.floor === gameState.currentFloor);
    const enemy = floorDef ? GAME_ENEMIES[floorDef.enemyId] : null;
    const activeChar = characters.find((c) => c.charId === gameState.activeCharacter);

    if (!enemy || !activeChar) {
      setMode('hub');
      return null;
    }

    return (
      <BattleScreen
        charId={gameState.activeCharacter}
        charLevel={activeChar.level}
        charHP={activeChar.currentHP}
        charMP={activeChar.currentMP}
        enemyDef={enemy}
        items={gameState.items}
        onUseItem={handleUseItem}
        onBattleEnd={handleBattleEnd}
      />
    );
  }

  // ─── Victory mode ────────────────────────────────────────────────
  if (mode === 'victory' && battleRewards) {
    return (
      <VictoryScreen
        xpGained={battleRewards.xp}
        spheresGained={battleRewards.spheres}
        leveledUp={battleRewards.leveledUp}
        newLevel={battleRewards.newLevel}
        newSkillLearned={battleRewards.newSkill}
        isBoss={battleRewards.isBoss}
        onContinue={handleVictoryContinue}
      />
    );
  }

  // ─── Defeat mode ─────────────────────────────────────────────────
  if (mode === 'defeat') {
    return (
      <DefeatScreen
        onRetry={handleDefeatRetry}
        onExit={() => setMode('hub')}
      />
    );
  }

  // ─── Rest mode ───────────────────────────────────────────────────
  if (mode === 'rest' && gameState) {
    const activeChar = characters.find((c) => c.charId === gameState.activeCharacter);
    if (!activeChar) { setMode('hub'); return null; }

    return (
      <RestScreen
        character={activeChar}
        charId={gameState.activeCharacter}
        floor={gameState.currentFloor - 1}
        items={gameState.items}
        onUseItem={handleUseItem}
        onContinue={() => setMode('battle')}
      />
    );
  }

  // ─── Hub mode (default) ──────────────────────────────────────────
  const activeChar = characters.find((c) => c.charId === gameState.activeCharacter);
  const charDef = CHARACTER_BY_ID.get(gameState.activeCharacter);
  const activeCharStats = activeChar ? getStatsAtLevel(gameState.activeCharacter, activeChar.level) : null;
  const activeCharSkills = activeChar ? getSkillsForLevel(gameState.activeCharacter, activeChar.level) : [];
  const xpNeeded = activeChar ? xpToNextLevel(activeChar.level) : 100;
  const xpPercent = activeChar ? (activeChar.xp / xpNeeded) * 100 : 0;

  const floorDef = DUNGEON_FLOORS.find((f) => f.floor === gameState.currentFloor);
  const nextEnemy = floorDef ? GAME_ENEMIES[floorDef.enemyId] : null;

  return (
    <Background>
      <ParticlesBackground />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>
        <ScreenHeader title="Aventura" />

        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
          {/* Active character card */}
          {activeChar && charDef && activeCharStats && (
            <View style={styles.charCard}>
              <View style={styles.charCardHeader}>
                <View style={[styles.charAvatar, { backgroundColor: `${charDef.accentColor}22`, borderColor: charDef.accentColor }]}>
                  <Ionicons name={charDef.fallbackIcon as any} size={28} color={charDef.accentColor} />
                </View>
                <View style={styles.charCardInfo}>
                  <Text style={[styles.charCardName, { color: charDef.accentColor }]}>{charDef.name}</Text>
                  <Text style={styles.charCardTitle}>{charDef.title}</Text>
                </View>
                <TouchableOpacity
                  style={styles.switchBtn}
                  onPress={() => setShowCharSelect(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="swap-horizontal" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Level + XP */}
              <View style={styles.charCardStats}>
                <Text style={styles.charLevel}>Nivel {activeChar.level}</Text>
                <View style={styles.xpBar}>
                  <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
                  <Text style={styles.xpText}>{activeChar.xp}/{xpNeeded} XP</Text>
                </View>
              </View>

              {/* HP/MP */}
              <View style={styles.hpMpRow}>
                <View style={styles.hpMpItem}>
                  <Text style={styles.hpMpLabel}>HP</Text>
                  <Text style={styles.hpMpValue}>{Math.ceil(activeChar.currentHP)}/{activeCharStats.hp}</Text>
                </View>
                <View style={styles.hpMpItem}>
                  <Text style={styles.hpMpLabel}>MP</Text>
                  <Text style={styles.hpMpValue}>{Math.ceil(activeChar.currentMP)}/{activeCharStats.mp}</Text>
                </View>
                <View style={styles.hpMpItem}>
                  <Text style={styles.hpMpLabel}>Hab.</Text>
                  <Text style={styles.hpMpValue}>{activeCharSkills.length}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Dungeon map */}
          <DungeonMap
            currentFloor={gameState.currentFloor}
            maxFloorReached={gameState.maxFloorReached}
            playthroughs={gameState.playthroughs}
            onFloorPress={() => {}}
          />

          {/* Next battle info */}
          {nextEnemy && (
            <View style={styles.nextBattleCard}>
              <Text style={styles.nextBattleTitle}>Próxima batalla</Text>
              <View style={styles.nextBattleInfo}>
                <View style={[styles.enemyIcon, { backgroundColor: `${nextEnemy.accentColor}22`, borderColor: nextEnemy.accentColor }]}>
                  <Ionicons name={nextEnemy.fallbackIcon as any} size={24} color={nextEnemy.accentColor} />
                </View>
                <View style={styles.enemyInfo}>
                  <Text style={styles.enemyName}>{nextEnemy.name}</Text>
                  <Text style={styles.enemyStats}>HP: {nextEnemy.stats.hp} · Piso {gameState.currentFloor}</Text>
                  {nextEnemy.isBoss && (
                    <View style={styles.bossTag}>
                      <Ionicons name="skull" size={10} color="#ef4444" />
                      <Text style={styles.bossTagText}>JEFE FINAL</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity style={styles.battleBtn} onPress={startBattle} activeOpacity={0.8}>
                <Ionicons name="cut" size={18} color={Colors.bgDarker} />
                <Text style={styles.battleBtnText}>COMENZAR BATALLA</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Stats summary */}
          <View style={styles.statsSummary}>
            <StatBox label="Victorias" value={gameState.totalWins} icon="trophy" color="#22c55e" />
            <StatBox label="Derrotas" value={gameState.totalLosses} icon="close-circle" color="#ef4444" />
            <StatBox label="Piso Max" value={gameState.maxFloorReached} icon="flag" color={Colors.primaryGold} />
          </View>
        </ScrollView>

      </View>

      {/* Character select modal */}
      <CharacterSelect
        visible={showCharSelect}
        characters={characters}
        activeCharId={gameState.activeCharacter}
        onSelect={handleSelectCharacter}
        onClose={() => setShowCharSelect(false)}
      />
    </Background>
  );
}

// ─── Helper component ──────────────────────────────────────────────
const StatBox = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon as any} size={18} color={color} />
    <Text style={styles.statBoxValue}>{value}</Text>
    <Text style={styles.statBoxLabel}>{label}</Text>
  </View>
);

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  // Start screen
  startContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  startIconWrap: {
    marginBottom: Spacing.lg,
  },
  startTitle: {
    fontFamily: Fonts.title,
    fontSize: 28,
    color: Colors.primaryGold,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  startDesc: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryGold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.sm,
  },
  startBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.bgDarker,
    letterSpacing: 2,
  },
  // Character card
  charCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.15)',
  },
  charCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  charAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  charCardInfo: {
    flex: 1,
  },
  charCardName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  charCardTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  switchBtn: {
    padding: 6,
  },
  charCardStats: {
    marginBottom: Spacing.sm,
  },
  charLevel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.primaryGold,
    marginBottom: 4,
  },
  xpBar: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  xpFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primaryGold,
    borderRadius: 4,
  },
  xpText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  hpMpRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  hpMpItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 6,
    borderRadius: 6,
  },
  hpMpLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.textMuted,
  },
  hpMpValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  // Next battle card
  nextBattleCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.15)',
    marginTop: Spacing.md,
  },
  nextBattleTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  nextBattleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  enemyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  enemyInfo: {
    flex: 1,
  },
  enemyName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  enemyStats: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bossTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  bossTagText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: '#ef4444',
    letterSpacing: 1,
  },
  battleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryGold,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  battleBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.bgDarker,
    letterSpacing: 2,
  },
  // Stats summary
  statsSummary: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 2,
  },
  statBoxValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  statBoxLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.textMuted,
  },
});
