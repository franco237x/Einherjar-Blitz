'use client';

/**
 * BannerCard — Premium visual card for a Gacha banner.
 *
 * Layout: the character art fills the card, while the title stays on the
 * right/top and the buttons at the bottom with a strong gradient so they
 * remain readable. This mimics Genshin Impact's wish screen layout.
 */

import { useState } from 'react';
import { type BannerDef } from '@/constants/gachaData';
import { Icon } from '../Icon';

interface BannerCardProps {
  banner: BannerDef;
  onSummon: (amount: number) => void;
  disabled?: boolean;
}

export function BannerCard({ banner, onSummon, disabled = false }: BannerCardProps) {
  const [imageError, setImageError] = useState(false);
  const costIcon = banner.costType === 'keys' ? 'key' : 'planet';
  const currency = banner.costType === 'keys' ? 'llaves' : 'esferas';
  const accent = banner.accentColor;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a14]">
      {!imageError ? (
        <img
          src={banner.bannerImage}
          alt={`Ilustración del banner ${banner.title}`}
          className="absolute inset-0 h-full w-full object-cover object-left"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name={banner.iconName} size={100} color={accent} style={{ opacity: 0.15 }} />
        </div>
      )}

      <span className="relative z-[3] h-0.5 w-full opacity-70" style={{ backgroundColor: accent }} />

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,8,0.72)_0%,rgba(5,5,8,0.04)_46%,rgba(5,5,8,0.35)_100%)]" />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,8,0)_55%,rgba(5,5,8,0.98)_100%)]" />
      </div>

      <div className="relative z-[2] flex flex-1 flex-col justify-between px-6 pb-4 pt-6">
        <div className="ml-auto flex max-w-[72%] flex-col items-end text-right">
          <span
            className="mb-2 flex items-center gap-1.5 rounded-sm border px-3 py-1 text-[9px] font-bold tracking-[0.2em]"
            style={{ borderColor: accent, color: accent }}
          >
            <Icon name={banner.iconName} size={12} />
            BANNER
          </span>
          <h3
            className="font-title text-[28px] leading-[34px] text-white/95"
            style={{ textShadow: `0 0 25px ${accent}` }}
          >
            {banner.title}
          </h3>
          <p className="mt-1 text-[13px] tracking-wide text-white/70">{banner.subtitle}</p>
        </div>

        <div className="flex gap-2 border border-white/[0.12] bg-[rgba(5,5,8,0.72)] p-1">
          <button
            type="button"
            onClick={() => onSummon(1)}
            disabled={disabled}
            aria-busy={disabled || undefined}
            aria-label={`Invocar una vez por ${banner.costAmount} ${currency}`}
            className="flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-sm border bg-black/60 py-4 transition hover:bg-black/40 disabled:opacity-70"
            style={{ borderColor: accent, color: accent }}
          >
            <span className="text-[15px] font-bold uppercase tracking-wider">
              {disabled ? 'Procesando' : 'Invocar ×1'}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-xs font-bold">
              <Icon name={costIcon} size={12} />
              {banner.costAmount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSummon(10)}
            disabled={disabled}
            aria-busy={disabled || undefined}
            aria-label={`Invocar diez veces por ${banner.costAmount * 10} ${currency}`}
            className="flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-sm py-4 text-[#0a0a14] transition hover:brightness-110 disabled:opacity-70"
            style={{ backgroundColor: accent }}
          >
            <span className="text-[15px] font-bold uppercase tracking-wider">
              {disabled ? 'Procesando' : 'Invocar ×10'}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-xs font-bold">
              <Icon name={costIcon} size={12} />
              {banner.costAmount * 10}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
