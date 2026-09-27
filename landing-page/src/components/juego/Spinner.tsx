import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

/** Web replacement for React Native's ActivityIndicator. */
export function Spinner({ size = 20, className, label = 'Cargando' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'juego-spin inline-block shrink-0 rounded-full border-2 border-current border-t-transparent',
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
