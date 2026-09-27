import type { ReactNode } from 'react';
import { Award, Crown, Skull, Star, Trophy } from 'lucide-react';
import type { VictoryRewards } from '@/services/battleService';
import { cn } from '@/lib/utils';
import { Spinner } from '../Spinner';

interface BattleModalProps {
  phase: 'victory' | 'defeat';
  bossName: string;
  savingFirebase: boolean;
  saveError: string | null;
  rewards: VictoryRewards | null;
  onExit: () => void;
}

export function BattleModal({ phase, bossName, savingFirebase, saveError, rewards, onExit }: BattleModalProps) {
  const victory = phase === 'victory';
  return (
    <div className="juego-fade-in absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={victory ? 'Victoria' : 'Derrota'}>
      <div
        className={cn(
          'juego-pop-in flex w-full max-w-[640px] items-center gap-5 border-y-2 px-6 py-5',
          victory
            ? 'border-gold bg-[linear-gradient(90deg,rgba(40,30,12,0.96),rgba(10,10,10,0.96))]'
            : 'border-red-600 bg-[linear-gradient(90deg,rgba(40,8,10,0.96),rgba(10,10,10,0.96))]'
        )}
      >
        <span
          className={cn(
            'flex h-20 w-20 shrink-0 items-center justify-center rounded-full',
            victory ? 'bg-gold shadow-[0_0_30px_rgba(201,170,113,0.5)]' : 'border-2 border-red-600 bg-red-950'
          )}
        >
          {victory ? <Trophy size={36} color="#050505" /> : <Skull size={38} color="rgba(255,255,255,0.95)" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.25em] text-white/50">
            {victory ? 'GLORIA EN LA ARENA' : 'EL VALHALLA AÚN ESPERA'}
          </p>
          <h2 className={cn('font-title text-3xl tracking-[0.15em]', victory ? 'text-gold' : 'text-red-500')}>
            {victory ? 'VICTORIA' : 'DERROTA'}
          </h2>
          <p className="mt-1 text-sm text-white/70">
            {victory ? `${bossName} ha caído ante tu campeón.` : `${bossName} ha reclamado este duelo.`}
          </p>

          {savingFirebase && <Spinner className="mt-3 text-gold" />}
          {saveError && <p className="mt-2 text-xs text-red-400" role="alert">{saveError}</p>}
          {victory && rewards && !savingFirebase && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              <Reward icon={<Trophy size={16} color="#c9aa71" />} value={`+${rewards.copasGained}`} label="COPAS" />
              <Reward icon={<Star size={16} color="#c9aa71" />} value={`+${rewards.spheresGained}`} label="ESFERAS" />
              <Reward icon={<Award size={16} color="#c9aa71" />} value={`+${rewards.xpGained}`} label="XP" />
              <Reward icon={<Crown size={16} color="#c9aa71" />} value={rewards.newRank} label="RANGO" />
            </div>
          )}
          <button
            type="button"
            onClick={onExit}
            autoFocus
            className={cn(
              'mt-4 min-h-11 px-5 text-xs font-bold tracking-[0.2em] transition hover:brightness-110',
              victory ? 'bg-gold text-ink-deep' : 'border border-red-500/60 bg-red-950/60 text-red-200'
            )}
          >
            {victory ? 'RECLAMAR Y VOLVER' : 'REGRESAR AL SALÓN'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Reward({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 border border-gold/20 bg-black/40 px-1 py-1.5">
      {icon}
      <span className="max-w-full truncate text-xs font-bold text-white/95">{value}</span>
      <span className="text-[8px] font-bold tracking-[0.15em] text-white/50">{label}</span>
    </div>
  );
}
