import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Coins, Droplets, Sparkles } from 'lucide-react';
import { Eyebrow, Reveal } from './primitives';

export function AgroEventFeature() {
  return (
    <section id="evento" className="relative overflow-hidden border-t border-white/[0.06] bg-[#0d1812]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_50%,rgba(140,158,87,0.12),transparent_40%)]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 md:grid-cols-[0.93fr_1.07fr] md:py-32">
        <div className="relative flex min-h-[365px] items-center justify-center md:min-h-[510px]">
          <div className="absolute h-[76%] aspect-square rounded-full border border-primary/25 bg-[radial-gradient(circle,rgba(190,173,99,0.16),transparent_68%)]" aria-hidden="true" />
          <div className="absolute h-[94%] aspect-square rounded-full border border-dashed border-primary/10" aria-hidden="true" />
          <Image
            src="/evento-agro/arbol-alba.png"
            alt=""
            width={600}
            height={600}
            sizes="(max-width: 768px) 90vw, 520px"
            className="relative z-10 h-auto max-h-[475px] w-[96%] object-contain drop-shadow-[0_22px_28px_rgba(0,0,0,0.48)]"
          />
          <div className="absolute bottom-0 left-0 z-20 border border-primary/25 bg-[#101b14]/90 px-5 py-3 backdrop-blur-md">
            <span className="font-title text-sm tracking-[0.13em] text-primary">ÁRBOL DEL ALBA</span>
            <p className="mt-0.5 text-xs text-white/50">La última fusión</p>
          </div>
        </div>

        <Reveal className="relative">
          <Eyebrow>Nuevo evento agropecuario</Eyebrow>
          <h2 className="mt-6 font-title text-4xl leading-[1.12] text-white md:text-[3.3rem]">
            Cultiva lo <span className="text-primary">imposible.</span>
          </h2>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-white/60">
            Tres linajes y quince plantas para coleccionar. Invoca semillas con polen, riega tu huerto y fusiona especies para descubrir rarezas nuevas. Reserva tus monedas de cosecha en un vale PDF para presentarlo en tu grupo de Messenger.
          </p>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
            <li className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Invoca semillas</li>
            <li className="inline-flex items-center gap-2"><Droplets className="h-4 w-4 text-primary" aria-hidden="true" /> Riega y fusiona</li>
            <li className="inline-flex items-center gap-2"><Coins className="h-4 w-4 text-primary" aria-hidden="true" /> Cosecha monedas</li>
          </ul>
          <Link
            href="/evento/agro"
            className="group mt-10 inline-flex items-center gap-2.5 border border-primary bg-primary px-7 py-3.5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#d8bd88]"
          >
            Entrar al huerto
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <Link href="/evento/agro/album" className="ml-6 mt-5 inline-flex text-sm text-primary underline underline-offset-4">Explorar el herbario</Link>
        </Reveal>
      </div>
    </section>
  );
}
