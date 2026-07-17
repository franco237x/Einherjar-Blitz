/**
 * BattleScreen — Full-screen battle orchestrator.
 *
 * Manages the battle state, renders sprites + HUD + menus, and handles
 * the turn flow (player → enemy → repeat until victory/defeat/flee).
 *
 * This component is pure UI — all combat logic is delegated to battleEngine.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { BattleBackground } from './BattleBackground';
import { BattleSprite, type SpriteState } from './BattleSprite';
import { BattleHUD } from './BattleHUD';
import { DamageNumber } from './DamageNumber';
import { CommandMenu, type CommandType } from './CommandMenu';
import { SkillMenu } from './SkillMenu';
import { ItemMenu } from './ItemMenu';
import {
  initBattle,
  playerAttack,
  playerUseSkill,
  playerUseItem,
  playerDefend,
  playerFlee,
  enemyTurn,
  advanceTurn,
  startPlayerTurn,
  type BattleState,
  type BattleLogEntry,
} from '@/services/battleEngine';
import type { EnemyDef } from '@/constants/gameData';
import { GAME_ITEMS, ITEM_BY_ID } from '@/constants/gameData';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type MenuMode = 'commands' | 'skills' | 'items';

interface FloatingNumber {
  id: number;
  value: number;
  type: 'damage' | 'heal' | 'crit';
  x: number;
  y: number;
}

interface BattleScreenProps {
  charId: string;
  charLevel: number;
  charHP: number;
  charMP: number;
  enemyDef: EnemyDef;
  items: Record<string, number>;
  onUseItem: (itemId: string) => void;
  onBattleEnd: (result: {
    victory: boolean;
    fled: boolean;
    finalHP: number;
    finalMP: number;
  }) => void;
}

export const BattleScreen = ({
  charId,
  charLevel,
  charHP,
  charMP,
  enemyDef,
  items,
  onUseItem,
  onBattleEnd,
}: BattleScreenProps) => {
  const insets = useSafeAreaInsets();
  const [battleState, setBattleState] = useState<BattleState>(() =>
    initBattle(charId, charLevel, charHP, charMP, enemyDef)
  );
  const [menuMode, setMenuMode] = useState<MenuMode>('commands');
  const [busy, setBusy] = useState(false); // true during animations/enemy turn
  const [playerSpriteState, setPlayerSpriteState] = useState<SpriteState>('idle');
  const [enemySpriteState, setEnemySpriteState] = useState<SpriteState>('idle');
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [visibleLogs, setVisibleLogs] = useState<BattleLogEntry[]>([]);
  const floatIdRef = useRef(0);
  const logEndRef = useRef<ScrollView>(null);

  // Show battle intro then start first turn
  useEffect(() => {
    const timer = setTimeout(() => {
      setBattleState((prev) => startPlayerTurn(prev));
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Process logs: show them and spawn floating numbers
  const processLogs = useCallback((logs: BattleLogEntry[], state: BattleState) => {
    if (logs.length === 0) return;

    // Add logs to visible log
    setVisibleLogs((prev) => [...prev, ...logs].slice(-8));

    // Spawn floating numbers for damage/heal
    for (const log of logs) {
      if (log.damage && log.damage > 0) {
        const isTargetPlayer = log.targetId === 'player';
        const x = isTargetPlayer ? SCREEN_W * 0.25 : SCREEN_W * 0.7;
        const y = isTargetPlayer ? SCREEN_H * 0.4 : SCREEN_H * 0.3;
        setFloatingNumbers((prev) => [
          ...prev,
          {
            id: floatIdRef.current++,
            value: log.damage!,
            type: log.type === 'crit' ? 'crit' : 'damage',
            x,
            y,
          },
        ]);
        // Trigger hit animation on target
        if (isTargetPlayer) {
          setPlayerSpriteState('hit');
          setTimeout(() => setPlayerSpriteState('idle'), 300);
        } else {
          setEnemySpriteState('hit');
          setTimeout(() => setEnemySpriteState('idle'), 300);
        }
      } else if (log.heal && log.heal > 0) {
        const isTargetPlayer = log.targetId === 'player';
        const x = isTargetPlayer ? SCREEN_W * 0.25 : SCREEN_W * 0.7;
        const y = isTargetPlayer ? SCREEN_H * 0.4 : SCREEN_H * 0.3;
        setFloatingNumbers((prev) => [
          ...prev,
          {
            id: floatIdRef.current++,
            value: log.heal!,
            type: 'heal',
            x,
            y,
          },
        ]);
      }
    }
  }, []);

  // Check for battle end
  useEffect(() => {
    if (battleState.phase === 'victory') {
      setEnemySpriteState('dead');
      setTimeout(() => {
        onBattleEnd({ victory: true, fled: false, finalHP: battleState.player.currentHP, finalMP: battleState.player.currentMP });
      }, 1500);
    } else if (battleState.phase === 'defeat') {
      setPlayerSpriteState('dead');
      setTimeout(() => {
        onBattleEnd({ victory: false, fled: false, finalHP: 0, finalMP: battleState.player.currentMP });
      }, 1500);
    } else if (battleState.phase === 'fled') {
      onBattleEnd({ victory: false, fled: true, finalHP: battleState.player.currentHP, finalMP: battleState.player.currentMP });
    }
  }, [battleState.phase]);

  // ─── Player actions ──────────────────────────────────────────────

  const handleCommand = useCallback(async (cmd: CommandType) => {
    if (busy || battleState.phase !== 'player_turn') return;
    setBusy(true);
    setMenuMode('commands');

    let result;

    switch (cmd) {
      case 'attack':
        setPlayerSpriteState('attack');
        await sleep(200);
        result = playerAttack({ ...battleState });
        processLogs(result.logs, result.state);
        setBattleState(result.state);
        setPlayerSpriteState('idle');
        break;

      case 'skill':
        setMenuMode('skills');
        setBusy(false);
        return;

      case 'item':
        setMenuMode('items');
        setBusy(false);
        return;

      case 'defend':
        result = playerDefend({ ...battleState });
        processLogs(result.logs, result.state);
        setBattleState(result.state);
        break;

      case 'flee':
        result = playerFlee({ ...battleState });
        processLogs(result.logs, result.state);
        setBattleState(result.state);
        if (!result.state.fled) {
          // Failed to flee — enemy gets a turn
          await sleep(500);
          await doEnemyTurn(result.state);
        }
        setBusy(false);
        return;
    }

    // Check if battle ended
    if (result.state.phase === 'victory' || result.state.phase === 'defeat') {
      setBusy(false);
      return;
    }

    // Advance to enemy turn
    await sleep(600);
    const advanced = advanceTurn(result.state);
    setBattleState(advanced);
    await doEnemyTurn(advanced);
    setBusy(false);
  }, [busy, battleState]);

  const handleUseSkill = useCallback(async (skillId: string) => {
    if (busy || battleState.phase !== 'player_turn') return;
    setBusy(true);
    setMenuMode('commands');

    setPlayerSpriteState('attack');
    await sleep(200);
    const result = playerUseSkill({ ...battleState }, skillId);
    processLogs(result.logs, result.state);
    setBattleState(result.state);
    setPlayerSpriteState('idle');

    if (result.state.phase === 'victory' || result.state.phase === 'defeat') {
      setBusy(false);
      return;
    }

    await sleep(600);
    const advanced = advanceTurn(result.state);
    setBattleState(advanced);
    await doEnemyTurn(advanced);
    setBusy(false);
  }, [busy, battleState]);

  const handleUseItem = useCallback(async (itemId: string) => {
    if (busy || battleState.phase !== 'player_turn') return;
    setBusy(true);
    setMenuMode('commands');

    const item = ITEM_BY_ID.get(itemId);
    if (!item) { setBusy(false); return; }

    const result = playerUseItem({ ...battleState }, itemId);
    processLogs(result.logs, result.state);
    setBattleState(result.state);
    onUseItem(itemId);

    // Using an item doesn't cost the turn in many JRPGs, but here it does
    await sleep(500);
    const advanced = advanceTurn(result.state);
    setBattleState(advanced);
    await doEnemyTurn(advanced);
    setBusy(false);
  }, [busy, battleState]);

  // ─── Enemy turn ──────────────────────────────────────────────────

  const doEnemyTurn = useCallback(async (state: BattleState) => {
    if (state.phase === 'victory' || state.phase === 'defeat') return;

    await sleep(300);
    setEnemySpriteState('attack');
    await sleep(200);
    const result = enemyTurn({ ...state });
    processLogs(result.logs, result.state);
    setBattleState(result.state);
    setEnemySpriteState('idle');

    if (result.state.phase === 'victory' || result.state.phase === 'defeat') return;

    // Back to player turn
    await sleep(600);
    const advanced = advanceTurn(result.state);
    const playerTurn = startPlayerTurn(advanced);
    setBattleState(playerTurn);
  }, []);

  const removeFloatingNumber = useCallback((id: number) => {
    setFloatingNumbers((prev) => prev.filter((fn) => fn.id !== id));
  }, []);

  const isBoss = enemyDef.isBoss;

  return (
    <View style={styles.container}>
      <BattleBackground isBoss={isBoss} />

      {/* ─── Battle field ─── */}
      <View style={[styles.field, { paddingTop: insets.top + 60 }]}>
        {/* Enemy (top right) */}
        <View style={styles.enemyArea}>
          <BattleHUD combatant={battleState.enemy} align="right" showLevel={false} />
          <BattleSprite
            sprite={battleState.enemy.enemyDef?.sprite ?? null}
            fallbackIcon={battleState.enemy.fallbackIcon}
            accentColor={battleState.enemy.accentColor}
            name=""
            isPlayer={false}
            state={enemySpriteState}
            size={isBoss ? 180 : 140}
          />
        </View>

        {/* Player (bottom left) */}
        <View style={styles.playerArea}>
          <BattleSprite
            sprite={null}
            fallbackIcon={battleState.player.fallbackIcon}
            accentColor={battleState.player.accentColor}
            name=""
            isPlayer={true}
            state={playerSpriteState}
            size={140}
          />
          <BattleHUD combatant={battleState.player} align="left" showLevel />
        </View>
      </View>

      {/* ─── Floating damage numbers ─── */}
      {floatingNumbers.map((fn) => (
        <DamageNumber
          key={fn.id}
          value={fn.value}
          type={fn.type}
          x={fn.x}
          y={fn.y}
          onDone={() => removeFloatingNumber(fn.id)}
        />
      ))}

      {/* ─── Battle log ─── */}
      <View style={[styles.logContainer, { bottom: isBoss ? 290 : 250 }]}>
        <ScrollView
          ref={logEndRef}
          style={styles.logScroll}
          onContentSizeChange={() => logEndRef.current?.scrollToEnd({ animated: true })}
        >
          {visibleLogs.map((log, i) => (
            <Text
              key={i}
              style={[
                styles.logText,
                log.type === 'crit' && styles.logCrit,
                log.type === 'passive' && styles.logPassive,
                log.type === 'status' && styles.logStatus,
              ]}
            >
              {log.message}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* ─── Menu area ─── */}
      <View style={[styles.menuArea, { paddingBottom: insets.bottom }]}>
        {menuMode === 'commands' && (
          <CommandMenu
            onCommand={handleCommand}
            disabled={busy || battleState.phase !== 'player_turn'}
            isBossBattle={isBoss}
          />
        )}
        {menuMode === 'skills' && (
          <SkillMenu
            skills={battleState.player.skills || []}
            currentMP={battleState.player.currentMP}
            onUseSkill={handleUseSkill}
            onBack={() => setMenuMode('commands')}
          />
        )}
        {menuMode === 'items' && (
          <ItemMenu
            items={items}
            onUseItem={handleUseItem}
            onBack={() => setMenuMode('commands')}
          />
        )}
      </View>
    </View>
  );
};

// Helper: promise-based delay
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.bgDarker,
  },
  field: {
    flex: 1,
    position: 'relative',
  },
  enemyArea: {
    position: 'absolute',
    top: 20,
    right: Spacing.md,
    alignItems: 'flex-end',
    gap: 8,
  },
  playerArea: {
    position: 'absolute',
    bottom: 280,
    left: Spacing.md,
    alignItems: 'flex-start',
    gap: 8,
  },
  logContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    height: 60,
    backgroundColor: 'rgba(5, 5, 5, 0.7)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.1)',
  },
  logScroll: {
    flex: 1,
  },
  logText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  logCrit: {
    color: '#fbbf24',
    fontFamily: Fonts.bodyBold,
  },
  logPassive: {
    color: '#60a5fa',
    fontStyle: 'italic',
  },
  logStatus: {
    color: '#c4b5fd',
  },
  menuArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
