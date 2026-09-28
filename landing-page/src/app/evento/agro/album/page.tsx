import type { Metadata } from 'next';
import { AgroAlbum } from '@/components/agro/AgroAlbum';
import './album.css';

export const metadata: Metadata = {
  title: 'Mi Herbario de Yggdrasil | Einherjar Blitz',
  description:
    'Colecciona 15 especies, descubre tres linajes y recoge las recompensas de tu herbario.',
  robots: { index: false, follow: false },
};

export default function AgroAlbumPage() {
  return <AgroAlbum />;
}
