import type { CSSProperties } from 'react';
import { Star } from 'lucide-react';
import { RARITIES, REWARDS_TABLE } from '@/constants/gachaData';

const ITEMS = REWARDS_TABLE.filter((r) => r.type !== 'otros' || r.rarity === 'mythic');

function Row({ reverse, duration }: { reverse?: boolean; duration: number }) {
  const list = reverse ? [...ITEMS].reverse() : ITEMS;
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <div
        className={`landing-marquee flex shrink-0 gap-3 pr-3 ${reverse ? 'landing-marquee-reverse' : ''}`}
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        {[...list, ...list].map((item, i) => {
          const rarity = RARITIES[item.rarity];
          return (
            <span
              key={`${item.name}-${i}`}
              className="flex shrink-0 items-center gap-2.5 rounded-full border bg-black/60 py-1.5 pl-1.5 pr-4"
              style={{ borderColor: rarity.color.startsWith('#') ? `${rarity.color}55` : 'rgba(255,255,255,0.18)' }}
            >
              {item.image ? (
                <img src={item.image} alt="" className="h-7 w-7 rounded-full object-cover" loading="lazy" />
              ) : null}
              <span className="text-sm font-bold text-white/85">{item.name}</span>
              <span className="flex gap-0.5">
                {Array.from({ length: rarity.stars }).map((_, s) => (
                  <Star key={s} className="h-2.5 w-2.5" fill={rarity.color} color={rarity.color} />
                ))}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Two opposing ribbons of gacha rewards. Purely decorative. */
export function RewardMarquee() {
  return (
    <div className="relative flex flex-col gap-3 border-y border-primary/10 bg-[#050505] py-6" aria-hidden="true">
      <Row duration={55} />
      <Row reverse duration={65} />
    </div>
  );
}
