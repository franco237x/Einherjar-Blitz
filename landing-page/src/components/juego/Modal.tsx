'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name for the dialog. */
  label: string;
  /** Classes for the panel. Defaults to a centered card. */
  className?: string;
  /** 'center' (default) or 'sheet' (full height panel on mobile). */
  variant?: 'center' | 'sheet' | 'fullscreen';
  /** Prevent closing with Escape / backdrop click (e.g. while busy). */
  locked?: boolean;
}

/**
 * Modal — web replacement for React Native's <Modal transparent>.
 * Renders in a portal, locks page scroll and closes on Escape or backdrop click.
 */
export function Modal({ visible, onClose, children, label, className, variant = 'center', locked }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(locked);

  useEffect(() => {
    onCloseRef.current = onClose;
    lockedRef.current = locked;
  });

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !lockedRef.current) onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
  }, [visible]);

  if (!visible || typeof document === 'undefined') return null;

  const isSheet = variant === 'center' || variant === 'sheet';

  return createPortal(
    <div
      className={cn(
        'juego-fade-in fixed inset-0 z-[70] flex bg-black/75 backdrop-blur-sm [-webkit-tap-highlight-color:transparent]',
        isSheet && 'items-end justify-center sm:items-center sm:p-6',
        variant === 'fullscreen' && 'items-stretch justify-stretch'
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !locked) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          'outline-none',
          // Phones: bottom sheet anchored to the thumb zone. `sm` and up: centered card.
          isSheet &&
            'juego-sheet relative w-full rounded-t-3xl border border-b-0 border-white/[0.09] bg-[linear-gradient(180deg,#1a1714,#110f0d)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_-20px_60px_-20px_rgba(0,0,0,0.9)] sm:rounded-3xl sm:border-b',
          variant === 'center' &&
            'max-h-[88dvh] overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 sm:max-h-[calc(100dvh-3rem)] sm:max-w-[400px] sm:pb-6 sm:pt-6',
          variant === 'sheet' &&
            'juego-scroll flex max-h-[92dvh] max-w-3xl flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] sm:pb-0',
          variant === 'fullscreen' && 'relative h-dvh w-full overflow-hidden',
          className
        )}
      >
        {isSheet ? (
          <span
            className="pointer-events-none absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/20 sm:hidden"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </div>
    </div>,
    document.body
  );
}
