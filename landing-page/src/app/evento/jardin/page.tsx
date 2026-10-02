import type { Metadata, Viewport } from 'next';
import { JardinSandbox } from '@/components/jardin/JardinSandbox';

export const metadata: Metadata = {
  title: 'Jardín de Yggdrasil · Beta pre-evento | Einherjar Blitz',
  description:
    'Beta abierta del próximo evento: defiende el jardín de los zombis con diez plantas vivas, en oleadas o en modo sandbox.',
};

export const viewport: Viewport = {
  themeColor: '#0b130d',
  viewportFit: 'cover',
};

export default function JardinPage() {
  return <JardinSandbox />;
}
