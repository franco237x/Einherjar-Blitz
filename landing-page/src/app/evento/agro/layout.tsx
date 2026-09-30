import type { ReactNode } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';
import './agro.css';
export default function AgroLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
