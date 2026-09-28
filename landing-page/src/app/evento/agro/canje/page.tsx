import type { Metadata } from 'next';
import { AgroCanje } from '@/components/agro/AgroCanje';
export const metadata: Metadata = {
  title: 'Consultar vale | Huerto de Yggdrasil',
  robots: { index: false, follow: false },
};
export default async function CanjePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const query = await searchParams;
  return (
    <AgroCanje
      initialId={typeof query.id === 'string' ? query.id.slice(0, 50) : ''}
    />
  );
}
