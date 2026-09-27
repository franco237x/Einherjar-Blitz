'use client';

import type { ReactNode } from 'react';
import { Bot, Cpu, Crown, Flame, Radiation, Shield, Sword, WandSparkles, Zap, type LucideIcon } from 'lucide-react';
import type { BossCombatantState, LogEntry, PlayerCombatantState } from '@/services/battleEngine';
import {
  getCharacterAnimation,
  getCharacterVisual,
  type CharacterAnimationClip,
  type CharacterAnimationName,
} from '@/constants/characterAssets';
import { cn } from '@/lib/utils';
import { SpriteActor } from './SpriteActor';

const ICONS: Record<string, LucideIcon> = {
  Bot,
  Cpu,
  Crown,
  Flame,
  Sword,
  Wand2: WandSparkles,
  Zap,
  Flash: Zap,
};

interface Props {
  player: PlayerCombatantState;
  boss: BossCombatantState;
  log: LogEntry[];
  compact: boolean;
}

function animationForSpriteState(spriteState: string): CharacterAnimationName {
  if (spriteState === 'attack') return 'attack';
  if (spriteState === 'defend') return 'defend';
  if (spriteState === 'special') return 'special';
  if (spriteState === 'regen') return 'heal';
  return 'idle';
}

export function BattleStage({ player, boss, log, compact }: Props) {
  const playerIconKey =
    player.specialUsed && player.def.specialAbility.transformedIcon
      ? player.def.specialAbility.transformedIcon
      : player.def.lucideIcon;
  const PlayerIcon = ICONS[playerIconKey] || Bot;
  const BossIcon = ICONS[boss.isPhase2 ? boss.def.phase2LucideIcon : boss.def.lucideIcon] || Crown;

  const animationName = animationForSpriteState(player.spriteState);
  const animation = getCharacterAnimation(player.animationCharacterId, animationName);
  const playerVisual = getCharacterVisual(player.animationCharacterId);
  const bossAnimationName = animationForSpriteState(boss.spriteState);
  const bossAnimation = getCharacterAnimation('rey_escarlata', bossAnimationName);
  const bossVisual = getCharacterVisual('rey_escarlata');
  const latest = log.at(-1);

  return (
    <div className="absolute inset-0">
      {boss.isPhase2 && <div className="pointer-events-none absolute inset-0 bg-red-900/20 mix-blend-screen" />}

      <Combatant
        side="left"
        compact={compact}
        animationName={animationName}
        animation={animation}
        animationMirrored={playerVisual?.facing === 'left'}
        fallback={<PlayerIcon size={compact ? 82 : 116} color="#c9aa71" />}
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
            ? boss.isPhase2 && boss.def.phase2ImageUri
              ? boss.def.phase2ImageUri
              : boss.def.imageUri
            : null
        }
        fallback={<BossIcon size={compact ? 86 : 120} color="#ef4444" />}
        danger
        spriteState={boss.spriteState}
      />

      <div className="pointer-events-none absolute bottom-[100px] left-[23%] right-[23%] flex justify-center" aria-live="polite">
        <p
          key={latest?.id}
          className={cn(
            'juego-fade-in line-clamp-2 rounded-md bg-black/60 px-3 py-1.5 text-center text-xs font-medium leading-snug sm:text-sm',
            latest?.type === 'boss_attack' ? 'text-red-400' : 'text-white/90'
          )}
        >
          {latest?.message ?? 'Los campeones entran en la arena.'}
        </p>
      </div>

      <div className="absolute left-2 top-[78px] flex flex-col gap-1.5">
        {player.isDefending && <Status icon={<Shield size={13} color="#c9aa71" />} label="GUARDIA" />}
        {player.radiationFieldTurns > 0 && (
          <Status icon={<Radiation size={13} color="#c9aa71" />} label={`CAMPO · ${player.radiationFieldTurns}T`} />
        )}
      </div>

      {boss.isPhase2 && (
        <div className="absolute right-12 top-[78px]">
          <Status icon={<Flame size={13} color="#ef4444" />} label="TRONO ESCARLATA" danger />
        </div>
      )}
    </div>
  );
}

interface CombatantProps {
  side: 'left' | 'right';
  compact: boolean;
  image?: string | null;
  animationName?: CharacterAnimationName;
  animation?: CharacterAnimationClip;
  animationMirrored?: boolean;
  fallback: ReactNode;
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
    <div
      className={cn(
        'absolute bottom-[99px] top-[70px] flex w-[40%] flex-col items-center justify-end',
        side === 'left' ? 'left-[4%]' : 'right-[4%]'
      )}
    >
      <span
        className={cn(
          'absolute bottom-6 h-40 w-40 rounded-full blur-3xl',
          danger ? 'bg-red-600/25' : 'bg-cyan-400/15',
          defending && 'bg-gold/35',
          isHit && 'opacity-40'
        )}
      />
      <div key={isHit ? `hit-${spriteState}` : 'steady'} className={cn('relative', isHit && 'juego-shake')}>
        {animation && animationName ? (
          <SpriteActor animation={animationName} clip={animation} compact={compact} mirrored={animationMirrored} />
        ) : image ? (
          <img
            src={image}
            alt=""
            className={cn('object-contain', compact ? 'h-[190px] w-[190px]' : 'h-[280px] w-[280px]', side === 'right' && '-scale-x-100')}
          />
        ) : (
          fallback
        )}
      </div>
      <span className={cn('-mt-2 h-3 w-40 rounded-[50%] blur-sm', danger ? 'bg-red-950/70' : 'bg-black/60')} />
    </div>
  );
}

function Status({ icon, label, danger }: { icon: ReactNode; label: string; danger?: boolean }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-bold tracking-[0.12em]',
        danger ? 'border-red-500/40 bg-red-950/60 text-red-400' : 'border-gold/40 bg-black/60 text-gold'
      )}
    >
      {icon}
      {label}
    </span>
  );
}
