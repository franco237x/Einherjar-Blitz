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

  return createPortal(
    <div
      className={cn(
        'juego-fade-in fixed inset-0 z-[70] flex bg-black/75 backdrop-blur-sm',
        variant === 'center' && 'items-center justify-center p-6',
        variant === 'sheet' && 'items-end justify-center sm:items-center sm:p-6',
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
          variant === 'center' &&
            'juego-pop-in max-h-[calc(100dvh-3rem)] w-full max-w-[400px] overflow-y-auto rounded-3xl border border-white/[0.09] bg-[linear-gradient(180deg,#1a1714,#110f0d)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_40px_80px_-20px_rgba(0,0,0,0.9)]',
          variant === 'sheet' &&
            'juego-scroll flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[linear-gradient(180deg,#171411,#0e0c0a)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_40px_80px_-20px_rgba(0,0,0,0.9)] sm:rounded-3xl',
          variant === 'fullscreen' && 'relative h-dvh w-full overflow-hidden',
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
