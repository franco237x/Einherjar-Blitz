import type { Metadata, Viewport } from 'next';
import { JardinSandbox } from '@/components/jardin/JardinSandbox';

export const metadata: Metadata = {
  title: 'Jardín de Yggdrasil · Beta pre-evento | Einherjar Blitz',
  description:
    'Beta abierta del próximo evento: defiende el jardín de los zombis con las plantas vivas del jardín, en oleadas o en modo sandbox.',
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
  return <JardinSandbox />;
}
