import { Reveal, SectionHeading } from './primitives';

// Thresholds mirror calculateRank() in src/constants/battleRewards.ts.
const RANKS = [
  { name: 'Iniciado', copas: 0 },
  { name: 'Recluta', copas: 50 },
  { name: 'Guerrero', copas: 150 },
  { name: 'Veterano', copas: 300 },
  { name: 'Elite', copas: 500 },
  { name: 'Einherjar', copas: 800 },
];

const ECONOMY = [
  { value: '1', unit: 'llave', text: 'La moneda base del reino. Se puede transferir a otros jugadores.' },
  { value: '50', unit: 'esferas', text: 'Lo que recibes por cada llave convertida, con una tasa fija.' },
  { value: '+10', unit: 'copas', text: 'Por cada victoria en la arena, además de esferas y experiencia.' },
];

export function Progression() {
  return (
    <section id="progresion" className="mx-auto max-w-6xl px-6 py-28 md:py-40">
      <SectionHeading
        eyebrow="Progresión"
        title="Una economía simple. Un camino claro."
        subtitle="Cada operación se registra en la nube con transacciones seguras, y tu rango se calcula a partir de las copas que ganas."
      />

      <div className="mt-20 grid gap-16 lg:grid-cols-2 lg:gap-24">
        <div className="space-y-10">
          {ECONOMY.map((item, i) => (
            <Reveal key={item.unit} delay={i * 0.08} className="flex gap-6 border-t border-white/[0.08] pt-8">
              <p className="w-28 shrink-0">
                <span className="block font-title text-4xl text-primary">{item.value}</span>
                <span className="text-[11px] uppercase tracking-[0.25em] text-white/40">{item.unit}</span>
              </p>
              <p className="pt-1 text-[15px] leading-relaxed text-white/55">{item.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-white/40">Rangos</p>
          <ol>
            {RANKS.map((rank, i) => {
              const last = i === RANKS.length - 1;
              return (
                <li key={rank.name} className="flex items-baseline justify-between border-t border-white/[0.08] py-4 last:border-b">
                  <span className="flex items-baseline gap-5">
                    <span className="w-5 font-title text-sm text-white/25">{i + 1}</span>
                    <span className={last ? 'font-title text-lg text-primary' : 'font-title text-lg text-white/85'}>{rank.name}</span>
                  </span>
                  <span className="text-sm tabular-nums text-white/40">{rank.copas === 0 ? 'Inicio' : `${rank.copas} copas`}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-sm text-white/40">La arena de combate llegará próximamente.</p>
        </Reveal>
      </div>
    </section>
  );
}
