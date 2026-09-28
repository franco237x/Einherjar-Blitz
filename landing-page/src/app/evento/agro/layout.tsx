import type { ReactNode } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';
import { AgroProvider } from '@/components/agro/AgroProvider';
import './agro.css';
export default function AgroLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AgroProvider>{children}</AgroProvider>
    </AuthProvider>
  );
}
