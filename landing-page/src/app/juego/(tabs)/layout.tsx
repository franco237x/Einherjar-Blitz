'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/juego/Icon';
import { SyncIndicator } from '@/components/juego/SyncIndicator';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/juego', label: 'Inicio', icon: 'home' },
  { href: '/juego/gacha', label: 'Gacha', icon: 'sparkles' },
  { href: '/juego/tienda', label: 'Tienda', icon: 'cart' },
  { href: '/juego/jugar', label: 'Jugar', icon: 'game-controller', hidden: !FEATURE_FLAGS.game },
  { href: '/juego/perfil', label: 'Perfil', icon: 'person' },
];

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <SyncIndicator />
      {children}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(212,175,55,0.3)] bg-ink-deep/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <ul className="mx-auto flex h-16 max-w-[1040px] items-center px-1 pt-1">
          {TABS.filter((tab) => !tab.hidden).map((tab) => {
            const active = tab.href === '/juego' ? pathname === '/juego' : pathname.startsWith(tab.href);
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[52px] flex-col items-center justify-center rounded-xl transition-colors',
                    active ? 'bg-gold/10 text-gold' : 'text-white/50 hover:text-white/80'
                  )}
                >
                  <Icon name={tab.icon} size={24} strokeWidth={active ? 2.25 : 1.75} />
                  <span className="mt-0.5 text-[11px] font-bold">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
