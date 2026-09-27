import { RotateCw } from 'lucide-react';

/**
 * Game module layout. The mobile app locked the device to landscape; the
 * browser can't, so portrait phones get a hint to rotate instead.
 */
export default function CombateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="fixed inset-0 z-[90] hidden flex-col items-center justify-center gap-4 bg-ink-deep px-8 text-center [@media(orientation:portrait)_and_(max-width:767px)]:flex">
        <RotateCw size={48} color="#c9aa71" className="juego-float" />
        <p className="font-title text-lg tracking-[0.12em] text-gold">GIRA TU DISPOSITIVO</p>
        <p className="text-sm text-white/60">El modo combate se juega en horizontal.</p>
      </div>
    </>
  );
}
