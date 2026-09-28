import type { Metadata, Viewport } from 'next';
import { JuegoProviders } from '@/components/juego/JuegoProviders';
import './juego.css';

export const metadata: Metadata = {
  title: 'Einherjar Blitz | Portal del Guerrero',
  description:
    'Juega Einherjar Blitz desde el navegador: invocaciones gacha, tienda, perfil y economía de llaves y esferas.',
};

// Mobile-first: paint the browser chrome with the lobby color and let the
// layout reach under the notch (safe-area insets are handled in the shell).
export const viewport: Viewport = {
  themeColor: '#0b0a09',
  viewportFit: 'cover',
};

export default function JuegoLayout({ children }: { children: React.ReactNode }) {
  return <JuegoProviders>{children}</JuegoProviders>;
}
