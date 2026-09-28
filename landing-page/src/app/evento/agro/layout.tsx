import type { ReactNode } from 'react';
import { AgroProvider } from '@/components/agro/AgroProvider';
import './agro.css';
export default function AgroLayout({ children }: { children: ReactNode }) {
  return <AgroProvider>{children}</AgroProvider>;
}
