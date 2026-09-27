import type { ReactNode } from 'react';
import { HeartPulse, Shield, Sparkles, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  isProcessing: boolean;
  isPlayerTurn: boolean;
  canUseSpecial: boolean;
  specialUsed: boolean;
  canRegen: boolean;
  attackRange: string;
  regenAmount: number;
  defenseAmount: number;
  specialName: string;
  healthPercent: number;
  compact: boolean;
  narrow: boolean;
  onAttack: () => void;
  onDefend: () => void;
  onRegen: () => void;
  onSpecial: () => void;
}

export function BattleControls({
  isProcessing,
  isPlayerTurn,
  canUseSpecial,
  specialUsed,
  canRegen,
  attackRange,
  regenAmount,
  defenseAmount,
  specialName,
  healthPercent,
  compact,
  narrow,
  onAttack,
  onDefend,
  onRegen,
  onSpecial,
}: Props) {
  const waiting = isProcessing || !isPlayerTurn;
  const specialCharge = specialUsed ? 0 : Math.min(100, Math.max(0, (1 - healthPercent) * 200));

  return (
    <div
      className={cn(
        'absolute inset-x-3 bottom-1.5 flex items-stretch gap-1.5 border border-gold/25 bg-[linear-gradient(180deg,rgba(18,23,27,0.98),rgba(4,7,10,0.98))] p-1.5',
        compact ? 'h-[76px]' : 'h-[88px]'
      )}
      role="toolbar"
      aria-label="Comandos de combate"
    >
      <div className={cn('relative flex shrink-0 flex-col justify-center border-r border-white/10 pl-3 pr-2', narrow ? 'w-[64px]' : 'w-[110px]')}>
        <span className={cn('absolute left-0 top-2 bottom-2 w-1', waiting ? 'bg-red-500' : 'bg-gold')} />
        {!compact && (
          <span className="text-[8px] font-bold tracking-[0.2em] text-white/45">{waiting ? 'TURNO ENEMIGO' : 'COMANDOS'}</span>
        )}
        <span className={cn('truncate font-title text-sm font-bold tracking-wider', waiting ? 'text-red-400' : 'text-gold')}>
          {waiting ? 'ESPERA' : narrow ? 'TURNO' : 'TU TURNO'}
        </span>
      </div>

      <Skill
        featured
        compact={compact}
        icon={<Swords size={compact ? 20 : 24} color="#c9aa71" />}
        label="ATACAR"
        detail={`${attackRange} DMG`}
        value="GOLPE"
        disabled={waiting}
        onClick={onAttack}
        hotkey="1"
      />
      <Skill
        compact={compact}
        icon={<Shield size={compact ? 19 : 22} color="#6ddce8" />}
        label="DEFENDER"
        detail={`-${defenseAmount} DMG`}
        value="GUARDIA"
        disabled={waiting}
        onClick={onDefend}
        hotkey="2"
      />
      <Skill
        compact={compact}
        icon={<HeartPulse size={compact ? 19 : 22} color="#69dfae" />}
        label="REGENERAR"
        detail={canRegen ? `+${regenAmount} HP` : 'HP LLENO'}
        value="CURACIÓN"
        disabled={waiting || !canRegen}
        onClick={onRegen}
        hotkey="3"
      />
      <Skill
        compact={compact}
        icon={<Sparkles size={compact ? 19 : 22} color={canUseSpecial ? '#c9aa71' : 'rgba(255,255,255,0.5)'} />}
        label="ESPECIAL"
        detail={specialName}
        value={specialUsed ? 'CONSUMIDA' : canUseSpecial ? 'LISTA' : `${Math.round(specialCharge)}%`}
        disabled={waiting || !canUseSpecial}
        progress={specialCharge}
        onClick={onSpecial}
        hotkey="4"
      />
    </div>
  );
}

interface SkillProps {
  icon: ReactNode;
  label: string;
  detail: string;
  value: string;
  disabled: boolean;
  compact: boolean;
  featured?: boolean;
  progress?: number;
  hotkey: string;
  onClick: () => void;
}

function Skill({ icon, label, detail, value, disabled, compact, featured = false, progress, hotkey, onClick }: SkillProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`${label}. ${detail}. ${value}`}
      aria-keyshortcuts={hotkey}
      className={cn(
        'relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden border px-2 text-left transition active:scale-[0.98]',
        featured ? 'flex-[1.25] border-gold/50' : 'border-white/10',
        disabled ? 'cursor-not-allowed opacity-45' : 'hover:border-gold/70 hover:brightness-125'
      )}
      style={{
        background: featured
          ? 'linear-gradient(135deg, rgba(74,54,25,0.98), rgba(15,13,10,0.98))'
          : 'linear-gradient(135deg, rgba(24,30,34,0.98), rgba(8,11,14,0.98))',
      }}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rotate-45 border border-white/15 bg-black/40',
          compact ? 'h-8 w-8' : 'h-10 w-10'
        )}
      >
        <span className="-rotate-45">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate font-bold tracking-wider text-white/95', compact ? 'text-[11px]' : 'text-[13px]')}>
          {label}
        </span>
        <span className={cn('block truncate text-white/55', compact ? 'text-[9px]' : 'text-[11px]')}>{detail}</span>
      </span>
      <span className="absolute bottom-1 right-1.5 max-w-[45%] truncate text-[8px] font-bold tracking-[0.15em] text-gold/80">
        {value}
      </span>
      <span className="absolute right-1.5 top-1 hidden text-[9px] font-bold text-white/30 lg:block">{hotkey}</span>
      {typeof progress === 'number' && (
        <span className="absolute inset-x-1.5 bottom-0 h-[3px] bg-white/10">
          <span
            className="block h-full bg-[linear-gradient(90deg,#8d713d,#c9aa71)] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </span>
      )}
    </button>
  );
}
