import type { Metadata, Viewport } from 'next';
import { JardinSandbox } from '@/components/jardin/JardinSandbox';

export const metadata: Metadata = {
  title: 'Jardín de Yggdrasil · Sandbox | Einherjar Blitz',
  description: 'Prueba libre del nuevo evento: defiende el jardín de los zombis con Solmiel, Nabú, Cortezón y Granadín.',
};

export const viewport: Viewport = {
  themeColor: '#0b130d',
  viewportFit: 'cover',
};

export default function JardinPage() {
  return <JardinSandbox />;
}
