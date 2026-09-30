import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Eyebrow, Reveal } from './primitives';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06]">
      <Image
        src="/juego/game/arena-scarlet-forge.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0a09] via-[#0b0a09]/60 to-[#0b0a09]" />

      <div className="relative mx-auto max-w-6xl px-6 py-32 text-center md:py-44">
        <Reveal className="flex flex-col items-center">
          <Eyebrow>El salón te espera</Eyebrow>
          <h2 className="mt-7 font-title text-4xl leading-[1.1] text-white md:text-6xl">
            Forja tu <span className="text-primary">destino</span>
          </h2>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/55">
            Entra con tu cuenta o crea una nueva. Es gratis y funciona en cualquier navegador.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <Link
              href="/juego"
              className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#d8bd88]"
            >
              Entrar al portal
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/juego/registro" className="text-[15px] text-white/70 underline-offset-8 transition-colors hover:text-white hover:underline">
              Crear una cuenta
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-white/40 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/assets/einherjer-logo.jpg" alt="" width={22} height={22} className="rounded opacity-70" />
          <span>© {new Date().getFullYear()} Einherjar Blitz</span>
        </div>
        <nav className="flex gap-7" aria-label="Pie de página">
          <Link href="/juego" className="transition-colors hover:text-white/80">Portal</Link>
          <Link href="/juego/registro" className="transition-colors hover:text-white/80">Crear cuenta</Link>
          <Link href="/noticias" className="transition-colors hover:text-white/80">Noticias</Link>
        </nav>
      </div>
    </footer>
  );
}
