import type { Metadata, Viewport } from 'next';
import { JardinEvent } from '@/components/jardin/JardinEvent';

export const metadata: Metadata = {
  title: 'Jardín de Yggdrasil | Einherjar Blitz',
  description:
    'Evento de Einherjar Blitz: defiende el jardín de los zombis, supera los niveles y gana monedas.',
  // Saved to the home screen it opens without browser bars (iOS has no
  // fullscreen API for web pages).
  manifest: '/jardin/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Jardín', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0b130d',
  viewportFit: 'cover',
};

export default function JardinPage() {
  return <JardinEvent />;
}
