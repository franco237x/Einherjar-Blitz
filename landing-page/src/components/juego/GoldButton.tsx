import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  loading?: boolean;
}

export function GoldButton({ title, loading, className, disabled, type = 'button', ...props }: GoldButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'flex min-h-[52px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#c9aa71,#9e8b54)] px-8 py-4 text-base font-bold uppercase tracking-wider text-ink shadow-[0_4px_10px_rgba(201,170,113,0.3)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    >
      {loading ? <Spinner className="text-ink" /> : title}
    </button>
  );
}
