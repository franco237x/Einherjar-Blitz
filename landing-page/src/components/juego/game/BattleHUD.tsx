import { Crown, Shield } from 'lucide-react';
import type { BattleState, BossCombatantState, PlayerCombatantState } from '@/services/battleEngine';
import { getCharacterVisual } from '@/constants/characterAssets';
import { cn } from '@/lib/utils';

interface BattleHUDProps {
  player: PlayerCombatantState;
  boss: BossCombatantState;
  turnCount: number;
  turnPhase: BattleState['turnPhase'];
  isProcessing: boolean;
  compact: boolean;
  narrow: boolean;
}

export function BattleHUD({ player, boss, turnCount, turnPhase, isProcessing, compact, narrow }: BattleHUDProps) {
  const playerPercent = Math.max(0, (player.currentHealth / player.maxHealth) * 100);
  const bossPercent = Math.max(0, (boss.currentHealth / boss.maxHealth) * 100);
  const isPlayer = turnPhase === 'player_turn' && !isProcessing;
  const phaseLabel = isPlayer
    ? 'TU TURNO'
    : turnPhase === 'boss_turn' || isProcessing
      ? 'RIVAL'
      : turnPhase === 'victory'
        ? 'VICTORIA'
        : 'DERROTA';
  const playerPortrait = getCharacterVisual(player.animationCharacterId)?.portrait;
  const bossPortrait = getCharacterVisual('rey_escarlata')?.portrait;

  return (
    <div className="pointer-events-none absolute inset-x-0.5 top-0.5 flex items-start justify-between gap-2">
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
    </div>
  );
}

interface HealthPlateProps {
  name: string;
  role: string;
  portrait?: string;
  hp: number;
  max: number;
  percent: number;
  active: boolean;
  compact: boolean;
  narrow: boolean;
  danger?: boolean;
  reverse?: boolean;
}

function HealthPlate({ name, role, portrait, hp, max, percent, active, compact, narrow, danger = false, reverse = false }: HealthPlateProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border px-2.5 pb-2 pt-1.5',
        narrow ? 'w-[36%]' : compact ? 'w-[30%]' : 'w-[31%] max-w-[360px]',
        danger ? 'border-red-500/30' : 'border-cyan-300/25',
        active && (danger ? 'border-red-400/80 shadow-[0_0_16px_rgba(239,68,68,0.35)]' : 'border-cyan-300/80 shadow-[0_0_16px_rgba(103,217,231,0.35)]')
      )}
      style={{
        background: danger
          ? `linear-gradient(${reverse ? 225 : 135}deg, rgba(42,9,10,0.96), rgba(8,10,13,0.94))`
          : `linear-gradient(${reverse ? 225 : 135}deg, rgba(9,24,29,0.96), rgba(8,10,13,0.94))`,
      }}
    >
      <div className={cn('flex items-center gap-2', reverse && 'flex-row-reverse')}>
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border bg-black/50',
            danger ? 'border-red-500/50' : 'border-cyan-300/40'
          )}
        >
          {portrait ? (
            <img src={portrait} alt="" className="h-full w-full object-contain" />
          ) : danger ? (
            <Crown size={18} color="#ef4444" />
          ) : (
            <Shield size={18} color="#c9aa71" />
          )}
        </span>
        <div className={cn('min-w-0 flex-1', reverse && 'text-right')}>
          {!compact && <p className="text-[8px] font-bold tracking-[0.2em] text-white/45">{role}</p>}
          <p className="truncate text-xs font-bold tracking-wide text-white/95 sm:text-sm">{name}</p>
          <p className="text-[11px] text-white/60">
            <span className="font-bold text-white/95">{hp}</span> / {max} HP
          </p>
        </div>
      </div>
      <div className="relative mt-1.5 h-2 overflow-hidden bg-black/60">
        <div
          className={cn('h-full transition-[width] duration-500 ease-out', reverse && 'ml-auto')}
          style={{
            width: `${percent}%`,
            background: danger
              ? `linear-gradient(${reverse ? 270 : 90}deg, #ff725e, #a91421)`
              : `linear-gradient(${reverse ? 270 : 90}deg, #79f0ef, #18a9c5)`,
          }}
        />
        <span className="absolute inset-x-0 top-0 h-px bg-white/25" />
      </div>
    </div>
  );
}

interface TurnRailProps {
  playerPortrait?: string;
  bossPortrait?: string;
  turnCount: number;
  phaseLabel: string;
  playerActive: boolean;
  compact: boolean;
  narrow: boolean;
}

function TurnRail({ playerPortrait, bossPortrait, turnCount, phaseLabel, playerActive, compact, narrow }: TurnRailProps) {
  const tokenCount = narrow ? 3 : compact ? 5 : 7;
  const timeline = Array.from({ length: tokenCount }, (_, index) => {
    const playerToken = index % 2 === 0 ? playerActive : !playerActive;
    return { playerToken, portrait: playerToken ? playerPortrait : bossPortrait };
  });

  return (
    <div className="flex flex-1 flex-col items-center pt-1">
      <div className="text-center">
        <p className="text-[9px] font-bold tracking-[0.2em] text-white/50">RONDA {String(turnCount).padStart(2, '0')}</p>
        <p className={cn('text-xs font-bold tracking-[0.15em]', playerActive ? 'text-gold' : 'text-red-400')}>{phaseLabel}</p>
      </div>
      <div className="relative mt-1 flex items-center gap-1.5">
        <span className="absolute inset-x-0 top-1/2 h-px bg-white/15" />
        {timeline.map(({ playerToken, portrait }, index) => (
          <span
            key={`${playerToken ? 'player' : 'boss'}-${index}`}
            className={cn(
              'relative flex items-center justify-center overflow-hidden rounded-full border bg-black/70',
              compact ? 'h-6 w-6' : 'h-7 w-7',
              playerToken ? 'border-cyan-300/50' : 'border-red-500/50',
              index === 0 && 'scale-110 border-2 border-gold',
              index > 2 && 'opacity-45'
            )}
          >
            {portrait ? (
              <img src={portrait} alt="" className="h-full w-full object-contain" />
            ) : playerToken ? (
              <Shield size={14} color="#c9aa71" />
            ) : (
              <Crown size={14} color="#ef4444" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
