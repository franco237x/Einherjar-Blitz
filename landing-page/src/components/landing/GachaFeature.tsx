import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BANNERS, RARITIES, getRarityOdds } from '@/constants/gachaData';
import { Reveal, SectionHeading } from './primitives';
import { RewardsGallery } from './RewardsGallery';

const banner = BANNERS[0];
const ODDS = getRarityOdds(banner.rewards);

function formatPercent(p: number) {
  if (p >= 10) return `${p.toFixed(0)}%`;
  if (p >= 1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(2)}%`;
}

export function GachaFeature() {
  return (
    <section id="invocaciones" className="border-t border-white/[0.06] bg-[#0e0d0c] pt-28 md:pt-40">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Invocaciones"
          title={banner.title}
          subtitle={`${banner.subtitle}. Cada invocación cuesta ${banner.costAmount} llave, y las probabilidades salen directamente de la tabla de recompensas del juego.`}
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <Reveal>
            <div className="group relative aspect-[16/10] overflow-hidden bg-black">
              <Image
                src={banner.bannerImage}
                alt={`Arte del banner ${banner.title}`}
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <table className="w-full text-left">
              <caption className="mb-6 text-left text-[11px] uppercase tracking-[0.25em] text-white/40">
                Probabilidad por rareza
              </caption>
              <tbody>
                {ODDS.map(({ rarity, percent }) => {
                  const cfg = RARITIES[rarity];
                  return (
                    <tr key={rarity} className="border-t border-white/[0.08] last:border-b">
                      <th scope="row" className="py-4 font-normal">
                        <span className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          <span className="text-[15px] capitalize text-white/80">{cfg.label.toLowerCase()}</span>
                        </span>
                      </th>
                      <td className="py-4 text-right font-title text-lg tabular-nums text-white/90">{formatPercent(percent)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Link
              href="/juego/gacha"
              className="group mt-10 inline-flex items-center gap-2 text-[15px] text-primary transition-colors hover:text-[#d8bd88]"
            >
              Ir al altar de invocación
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>

      <RewardsGallery />
    </section>
  );
}
