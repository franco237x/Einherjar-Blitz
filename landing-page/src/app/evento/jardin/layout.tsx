import type { ReactNode } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';

export default function JardinLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
