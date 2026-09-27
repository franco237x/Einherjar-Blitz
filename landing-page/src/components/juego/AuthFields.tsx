'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

const fieldFrame =
  'flex items-center rounded-xl border border-white/10 bg-white/[0.03] transition focus-within:border-gold/60 focus-within:bg-white/[0.05]';
const inputClass =
  'min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base text-white/95 placeholder:text-white/25 outline-none';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode };

function FieldLabel({ htmlFor, label, hint }: { htmlFor: string; label: string; hint?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-4">
      <label htmlFor={htmlFor} className="text-[12px] font-medium uppercase tracking-[0.15em] text-white/55">
        {label}
      </label>
      {hint}
    </div>
  );
}

export function TextField({ label, hint, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div>
      <FieldLabel htmlFor={inputId} label={label} hint={hint} />
      <div className={fieldFrame}>
        <input id={inputId} className={inputClass} {...props} />
      </div>
    </div>
  );
}

export function PasswordField({ label, hint, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <FieldLabel htmlFor={inputId} label={label} hint={hint} />
      <div className={fieldFrame}>
        <input id={inputId} type={visible ? 'text' : 'password'} className={inputClass} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="px-4 text-white/40 transition hover:text-white/80"
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={20} />
        </button>
      </div>
    </div>
  );
}

export function FormMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  if (!children) return null;
  return tone === 'error' ? (
    <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
      {children}
    </p>
  ) : (
    <p aria-live="polite" className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 text-sm text-emerald-300">
      {children}
    </p>
  );
}

/** Secondary submit: deliberately quieter than the Google button. */
export function SubmitButton({ children, loading }: { children: string; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading || undefined}
      className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-gold/50 text-[15px] font-semibold tracking-wide text-gold transition hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
