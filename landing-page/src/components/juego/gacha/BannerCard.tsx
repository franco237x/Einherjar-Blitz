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
  onSummon: (amount: 1 | 10) => void;
  disabled?: boolean;
}

export function BannerCard({ banner, onSummon, disabled = false }: BannerCardProps) {
  const [imageError, setImageError] = useState(false);
  const costIcon = banner.costType === 'keys' ? 'key' : 'planet';
  const currency = banner.costType === 'keys' ? 'llaves' : 'esferas';
  const accent = banner.accentColor;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0a0a14]"
      style={{ boxShadow: `0 40px 80px -40px ${accent}66` }}
    >
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

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <span className="absolute inset-0 bg-[linear-gradient(200deg,rgba(5,5,8,0.85)_0%,rgba(5,5,8,0.1)_45%)]" />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,8,0)_50%,rgba(5,5,8,0.97)_100%)]" />
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
      </div>

      <div className="relative z-[2] flex flex-1 flex-col justify-between p-4">
        <div className="ml-auto flex max-w-[82%] flex-col items-end text-right">
          <span
            className="mb-3 flex items-center gap-1.5 rounded-full border bg-black/40 px-3 py-1 text-[10px] font-bold tracking-[0.2em] backdrop-blur-md"
            style={{ borderColor: `${accent}99`, color: '#c7c9ff' }}
          >
            <Icon name={banner.iconName} size={12} color={accent} />
            BANNER ACTIVO
          </span>
          <h3
            className="font-title text-[28px] leading-[1.1] text-white"
            style={{ textShadow: `0 0 32px ${accent}` }}
          >
            {banner.title}
          </h3>
          <p className="mt-2 text-[13px] tracking-wide text-white/75">{banner.subtitle}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-white/55">
            <Icon name={costIcon} size={13} color="#c9aa71" />
            {banner.costAmount} {banner.costAmount === 1 ? currency.slice(0, -1) : currency} por invocación
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/55 p-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onSummon(1)}
            disabled={disabled}
            aria-busy={disabled || undefined}
            aria-label={`Invocar una vez por ${banner.costAmount} ${currency}`}
            className="flex min-h-[62px] flex-col items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-white transition active:scale-[0.97] active:bg-white/[0.1] disabled:opacity-60"
          >
            <span className="text-sm font-bold uppercase tracking-[0.14em]">{disabled ? 'Procesando' : 'Invocar ×1'}</span>
            <span className="mt-1 flex items-center gap-1 text-xs font-bold text-white/65">
              <Icon name={costIcon} size={12} color="#c9aa71" />
              {banner.costAmount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSummon(10)}
            disabled={disabled}
            aria-busy={disabled || undefined}
            aria-label={`Invocar diez veces por ${banner.costAmount * 10} ${currency}`}
            className="flex min-h-[62px] flex-col items-center justify-center rounded-xl text-white transition active:scale-[0.97] active:brightness-90 disabled:opacity-60"
            style={{
              background: `linear-gradient(135deg, ${accent}, #8b5cf6)`,
              boxShadow: `0 10px 30px -10px ${accent}`,
            }}
          >
            <span className="text-sm font-bold uppercase tracking-[0.14em]">{disabled ? 'Procesando' : 'Invocar ×10'}</span>
            <span className="mt-1 flex items-center gap-1 text-xs font-bold text-white/85">
              <Icon name={costIcon} size={12} />
              {banner.costAmount * 10}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
