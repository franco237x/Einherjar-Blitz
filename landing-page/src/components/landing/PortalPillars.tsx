import { ArrowLeftRight, RefreshCw, Sparkles } from 'lucide-react';
import { Reveal, Rule, SectionHeading } from './primitives';

const PILLARS = [
  {
    icon: RefreshCw,
    title: 'Una sola cuenta',
    text: 'Tu perfil, inventario y recursos son los mismos en la app y en la web, sincronizados en tiempo real.',
  },
  {
    icon: Sparkles,
    title: 'Invocaciones',
    text: 'Tiradas de una o diez invocaciones, con ceremonias según la rareza y probabilidades publicadas.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Economía y tienda',
    text: 'Convierte llaves en esferas, transfiere a otros jugadores y compra en la tienda oficial.',
  },
];

export function PortalPillars() {
  return (
    <section id="portal" className="mx-auto max-w-6xl px-6 py-28 md:py-40">
      <SectionHeading
        eyebrow="El portal"
        title="Todo tu reino, desde el navegador."
        subtitle="Einherjar Blitz llega a la web con las mismas mecánicas que la aplicación. Sin descargas y sin perder tu progreso."
      />

      <div className="mt-20 grid gap-y-14 md:grid-cols-3 md:gap-x-0">
        {PILLARS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.08} className="md:border-l md:border-white/[0.08] md:px-10 md:first:border-l-0 md:first:pl-0">
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <span className="font-title text-sm text-white/25">0{i + 1}</span>
            </div>
            <Rule className="my-6 md:hidden" />
            <h3 className="mt-6 font-title text-xl text-white/90 md:mt-8">{title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-white/50">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
