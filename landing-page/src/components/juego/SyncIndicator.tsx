'use client';

/**
 * SyncIndicator — Logo + sync feedback, bottom-right above the tab bar.
 *
 * Only visible during/after a sync event:
 *   syncing → logo + gold spinner
 *   done    → logo + green checkmark, fades out after 1.2s
 *   offline → logo + red cloud (persistent)
 */

import { useEffect, useState } from 'react';
import { useSyncStatus, type SyncStatus } from '@/hooks/useSyncStatus';
import { Icon } from './Icon';

export function SyncIndicator() {
  const { status } = useSyncStatus();
  // Keyed by status so every change shows the badge again.
  return <SyncBadge key={status} status={status} />;
}

function SyncBadge({ status }: { status: SyncStatus }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status !== 'online') return;
    const timer = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timer);
  }, [status]);

  const badgeColor =
    status === 'offline' ? '#ef4444' : status === 'online' ? '#22c55e' : '#c9aa71';
  const badgeIcon =
    status === 'offline' ? 'cloud-offline' : status === 'online' ? 'checkmark' : 'sync';

  return (
    <div
      className={`pointer-events-none fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-[60] flex h-[30px] w-[30px] items-center justify-center transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      <img
        src="/juego/logo.jpg"
        alt=""
        className="h-[26px] w-[26px] rounded-full border border-gold/20 object-cover"
      />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-[13px] w-[13px] items-center justify-center rounded-full border border-gold/20 bg-ink">
        <Icon
          name={badgeIcon}
          size={8}
          color={badgeColor}
          strokeWidth={3}
          className={status === 'connecting' ? 'juego-spin' : undefined}
        />
      </span>
    </div>
  );
}
