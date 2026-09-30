import Image from 'next/image';
import { Heart, Zap } from 'lucide-react';
import { GAME_CHARACTERS } from '@/constants/battleData';
import { CHAMPION_PORTRAITS } from './portraits';
import { Reveal, SectionHeading } from './primitives';

const CHAMPIONS = Object.values(GAME_CHARACTERS).filter((character) => character.isPlayableBase);

export function Champions() {
  return (
    <section id="campeones" className="border-t border-white/[0.06] py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Campeones"
          title="Los primeros guerreros del salón."
          subtitle="Cada campeón tiene su ataque, su defensa y un especial que cambia el combate. Argos, además, puede transformarse en el Androide Galileo."
        />
      </div>

      <ul className="mx-auto mt-16 flex max-w-6xl snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
        {CHAMPIONS.map((champion, i) => {
          // Champions without artwork yet show a placeholder.
          const portrait = CHAMPION_PORTRAITS[champion.id];
          return (
            <li key={champion.id} className="w-[68%] shrink-0 snap-start sm:w-[40%] md:w-auto">
              <Reveal delay={i * 0.06} className="flex h-full flex-col">
                <div className="relative aspect-[3/4] overflow-hidden border border-white/[0.08] bg-[#151311]">
                  {portrait ? (
                    <Image
                      src={portrait.src}
                      alt={`${champion.name}, ${champion.title}`}
                      fill
                      sizes="(min-width: 768px) 220px, 68vw"
                      className="object-cover"
                      style={{ objectPosition: portrait.focus }}
                    />
                  ) : (
                    <div
                      className="flex h-full flex-col items-center justify-center gap-3"
                      style={{
                        background: `radial-gradient(circle at 50% 40%, ${champion.accentColor}33, transparent 65%)`,
                      }}
                    >
                      <span className="font-title text-6xl" style={{ color: champion.accentColor }} aria-hidden="true">
                        {champion.name.charAt(0)}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">Arte en camino</span>
                    </div>
                  )}
                  <span
                    className="absolute inset-x-0 bottom-0 h-1"
                    style={{ backgroundColor: champion.accentColor }}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-5 font-title text-lg tracking-[0.08em] text-white/90">{champion.name}</h3>
                <p className="text-sm text-white/45">{champion.title}</p>
                <dl className="mt-4 space-y-2 text-[13px] text-white/60">
                  <div className="flex items-center gap-2">
                    <dt>
                      <Heart className="h-3.5 w-3.5 text-primary" aria-label="Vida" />
                    </dt>
                    <dd className="tabular-nums">{champion.maxHealth.toLocaleString('es')} de vida</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt>
                      <Zap className="mt-0.5 h-3.5 w-3.5 text-primary" aria-label="Especial" />
                    </dt>
                    <dd>{champion.specialAbility.name}</dd>
                  </div>
                </dl>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
