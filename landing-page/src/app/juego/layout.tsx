import type { Metadata } from 'next';
import { JuegoProviders } from '@/components/juego/JuegoProviders';
import './juego.css';

export const metadata: Metadata = {
  title: 'Einherjar Blitz | Portal del Guerrero',
  description:
    'Juega Einherjar Blitz desde el navegador: invocaciones gacha, tienda, perfil y economía de llaves y esferas.',
};

export default function JuegoLayout({ children }: { children: React.ReactNode }) {
  return <JuegoProviders>{children}</JuegoProviders>;
}
