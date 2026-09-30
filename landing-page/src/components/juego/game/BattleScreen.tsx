'use client';

import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useBattle } from '@/hooks/useBattle';
import { useViewport } from '@/hooks/useViewport';
import { useDialog } from '@/providers/DialogProvider';
import { BattleControls } from './BattleControls';
import { BattleHUD } from './BattleHUD';
import { BattleModal } from './BattleModal';
import { BattleStage } from './BattleStage';

interface BattleScreenProps {
  charId: string;
  onExit: () => void;
}

export function BattleScreen({ charId, onExit }: BattleScreenProps) {
  const dialog = useDialog();
  const { width, height } = useViewport();
  const compact = height < 400 || width < 740;
  const narrow = width < 620;
  const { battleState, isProcessing, rewards, savingFirebase, saveError, startError, attack, defend, regen, special } =
    useBattle(charId);
  const { player, boss, turnCount, turnPhase, log } = battleState;
  const canUseSpecial = !player.specialUsed && player.currentHealth <= player.maxHealth * 0.5;
  const canRegen = player.currentHealth < player.maxHealth;
  const battleEnded = turnPhase === 'victory' || turnPhase === 'defeat';

  // Keyboard shortcuts: 1 attack · 2 defend · 3 regen · 4 special.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '1') attack();
      else if (event.key === '2') defend();
      else if (event.key === '3' && canRegen) regen();
      else if (event.key === '4') special();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [attack, defend, regen, special, canRegen]);

  const confirmExit = async () => {
    if (battleEnded) return onExit();
    const leave = await dialog.confirm('¿Abandonar la arena?', 'Perderás el progreso de este duelo.', {
      confirmText: 'Abandonar',
      cancelText: 'Seguir luchando',
      destructive: true,
    });
    if (leave) onExit();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink-deep">
      <img src="/juego/game/arena-scarlet-forge.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,5,8,0.72)_0%,rgba(2,5,8,0.06)_20%,rgba(2,5,8,0.16)_66%,rgba(2,4,7,0.9)_100%)]" />

      <div className="absolute inset-0 px-2.5 py-2">
        <div className="relative mx-auto h-full max-w-[1400px]">
          <BattleStage player={player} boss={boss} log={log} compact={compact} />
          <BattleHUD
            player={player}
            boss={boss}
            turnCount={turnCount}
            turnPhase={turnPhase}
            isProcessing={isProcessing}
            compact={compact}
            narrow={narrow}
          />
          <button
            type="button"
            onClick={confirmExit}
            className="absolute right-0.5 top-[74px] flex h-9 w-9 items-center justify-center border border-white/20 bg-black/60 text-white/90 transition hover:border-white/40"
            aria-label="Abandonar combate"
          >
            <LogOut size={18} />
          </button>
          <BattleControls
            isProcessing={isProcessing}
            isPlayerTurn={turnPhase === 'player_turn'}
            canUseSpecial={canUseSpecial}
            specialUsed={player.specialUsed}
            canRegen={canRegen}
            attackRange={`${player.currentMinDamage}–${player.currentMaxDamage}`}
            regenAmount={player.def.regenAmount}
            defenseAmount={player.currentDefenseReduction}
            specialName={player.def.specialAbility.name}
            healthPercent={player.currentHealth / player.maxHealth}
            compact={compact}
            narrow={narrow}
            onAttack={attack}
            onDefend={defend}
            onRegen={regen}
            onSpecial={special}
          />
          {startError && (
            <p
              role="alert"
              className="absolute left-1/2 top-[74px] max-w-[min(90%,420px)] -translate-x-1/2 border border-red-400/40 bg-black/80 px-4 py-2 text-center text-xs text-red-300"
            >
              {startError}
            </p>
          )}
          {battleEnded && (
            <BattleModal
              phase={turnPhase}
              bossName={boss.def.name}
              savingFirebase={savingFirebase}
              saveError={saveError}
              rewards={rewards}
              onExit={onExit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
