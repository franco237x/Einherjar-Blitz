import { Combine, Dumbbell, Smartphone, Sparkles, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal, Rule, SectionHeading } from './primitives';

const PILLARS = [
  {
    icon: Sparkles,
    title: 'Invoca',
    text: 'Tiradas de una o diez en cada banner, con ceremonia según la rareza y probabilidades publicadas.',
    live: true,
  },
  {
    icon: Combine,
    title: 'Fusiona',
    text: 'Une a dos guerreros en la forja de almas para crear uno nuevo con lo mejor de sus linajes.',
    live: false,
  },
  {
    icon: Dumbbell,
    title: 'Entrena',
    text: 'Sube de nivel a tus campeones, gana estrellas y arma el equipo de tres que llevarás a la arena.',
    live: false,
  },
  {
    icon: Swords,
    title: 'Combate',
    text: 'Enfrenta a los jefes del Valhalla en la campaña y a los equipos de otros jugadores en la arena.',
    live: false,
  },
];

export function GamePillars() {
  return (
    <section id="juego" className="mx-auto max-w-6xl px-6 py-28 md:py-40">
      <SectionHeading
        eyebrow="El juego"
        title="Un RPG de colección en el Valhalla."
        subtitle="Einherjar Blitz crece de portal a juego completo. Estas son sus cuatro piezas: la primera ya está abierta y las demás están en la forja."
      />

      <div className="mt-20 grid gap-y-14 md:grid-cols-2 md:gap-x-12 lg:grid-cols-4 lg:gap-x-0">
        {PILLARS.map(({ icon: Icon, title, text, live }, i) => (
          <Reveal
            key={title}
            delay={i * 0.08}
            className="lg:border-l lg:border-white/[0.08] lg:px-8 lg:first:border-l-0 lg:first:pl-0"
          >
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em]',
                  live ? 'border-emerald-400/30 text-emerald-300' : 'border-white/15 text-white/45'
                )}
              >
                {live ? 'Disponible' : 'En desarrollo'}
              </span>
            </div>
            <Rule className="my-6 md:hidden" />
            <h3 className="mt-6 font-title text-xl text-white/90 md:mt-8">{title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-white/50">{text}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-20 flex flex-col gap-4 border-t border-white/[0.08] pt-8 text-[15px] text-white/55 sm:flex-row sm:items-center">
        <Smartphone className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <p>
          Una sola cuenta en la nube, en cualquier navegador. En el celular puedes instalar el portal desde el menú del
          navegador y abrirlo como una app.
        </p>
      </Reveal>
    </section>
  );
}
