import type { Metadata } from 'next';
import { AgroThanks } from '@/components/agro/AgroThanks';

export const metadata: Metadata = {
  title: 'Gracias por participar | El Huerto de Yggdrasil',
  description: 'El evento agropecuario de Einherjar Blitz terminó. Consulta los logros de tu huerto.',
};

export default function AgroPage() {
  return <AgroThanks />;
}
