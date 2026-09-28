import type { Metadata } from 'next';
import { AgroEvent } from '@/components/agro/AgroEvent';

export const metadata: Metadata = {
  title: 'El Huerto de Yggdrasil | Einherjar Blitz',
  description:
    'Invoca semillas, cultiva plantas, fusiona especies y cosecha monedas en el evento agropecuario de Einherjar Blitz.',
};

export default function AgroPage() {
  return <AgroEvent />;
}
