'use client';

import type { ReactNode } from 'react';
import { spriteUrl } from '@/lib/jardin/sprites';

interface SeedPacketProps {
  kind: string;
  label: string;
  cost?: ReactNode;
  /** Cost shown in red: the player cannot afford it. */
  unaffordable?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  /** Recharge left, 0..1, drawn as a shade coming down. */
  cooldown?: number;
  className?: string;
  onClick?: () => void;
  title?: string;
  ariaPressed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/** PvZ-style seed packet: paper flap, green window, plant and price tag. */
export function SeedPacket({
  kind,
  label,
  cost,
  unaffordable,
  selected,
  dimmed,
  cooldown = 0,
  className = '',
  onClick,
  title,
  ariaPressed,
  size = 'md',
}: SeedPacketProps) {
  const tag = size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-base' : 'text-sm';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      aria-pressed={ariaPressed}
      className={`relative overflow-hidden rounded-[6px] border-2 border-[#2a1c0c] bg-gradient-to-b from-[#fbf3d6] to-[#dccb94] shadow-[0_3px_0_rgba(0,0,0,0.5)] transition active:translate-y-0.5 ${
        selected ? 'ring-2 ring-amber-300 shadow-[0_0_12px_rgba(255,214,90,0.8)]' : ''
      } ${dimmed ? '[filter:grayscale(0.55)_brightness(0.85)]' : ''} ${className}`}
    >
      <span className="pointer-events-none absolute inset-x-[5px] top-[3px] border-t-2 border-dashed border-[#a2824a]/70" />
      <span className="pointer-events-none absolute inset-x-[4px] bottom-[4px] top-[8px] rounded-[3px] border border-[#4f7a2e]/70 bg-[radial-gradient(circle_at_32%_38%,#effcdc_0%,#b5df8a_50%,#6fa84b_100%)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]" />
      <img
        src={spriteUrl(kind, 'portrait')}
        alt=""
        className="pointer-events-none absolute -bottom-[10%] left-0 h-[128%] w-auto object-contain drop-shadow-[0_2px_1px_rgba(0,0,0,0.55)]"
      />
      {cost !== undefined && (
        <span
          className={`absolute bottom-[3px] right-[3px] rounded-[3px] border border-[#2a1c0c] bg-[#fbf6e1] px-1 font-black leading-[1.15] tabular-nums shadow-[0_1px_0_rgba(0,0,0,0.4)] ${tag} ${
            unaffordable ? 'text-red-600' : 'text-[#2a1c0c]'
          }`}
        >
          {cost}
        </span>
      )}
      {cooldown > 0 && (
        <span className="pointer-events-none absolute inset-x-0 top-0 bg-[#1b130a]/60" style={{ height: `${cooldown * 100}%` }} />
      )}
    </button>
  );
}
