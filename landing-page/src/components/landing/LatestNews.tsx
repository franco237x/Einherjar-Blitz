import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { NEWS } from '@/constants/news';
import { Reveal, SectionHeading } from './primitives';

const LATEST = NEWS.slice(0, 3);

export function LatestNews() {
  return (
    <section id="novedades" className="border-t border-white/[0.06] py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow="Novedades" title="Lo último del salón." />

        <ul className="mt-16 grid gap-10 md:grid-cols-3 md:gap-0">
          {LATEST.map((item, i) => (
            <li
              key={item.id}
              className="border-t border-white/[0.08] pt-8 md:border-l md:border-t-0 md:px-8 md:pt-0 md:first:border-l-0 md:first:pl-0"
            >
              <Reveal delay={i * 0.08}>
                <p className="text-[11px] uppercase tracking-[0.2em] text-primary">
                  {item.type} · <span className="text-white/40">{item.date}</span>
                </p>
                <h3 className="mt-4 font-title text-xl leading-snug text-white/90">{item.title}</h3>
                <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-white/50">{item.content}</p>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal className="mt-14">
          <Link
            href="/noticias"
            className="group inline-flex items-center gap-2 text-[15px] text-primary underline-offset-8 hover:underline"
          >
            Ver todas las noticias
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
