'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';

export const authInputClass =
  'w-full rounded-xl border-2 border-gold/30 bg-black/50 p-4 text-base text-white/95 placeholder:text-white/50 outline-none transition focus:border-gold/70';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function TextField({ label, ...props }: TextFieldProps) {
  return <input aria-label={label} placeholder={label} className={authInputClass} {...props} />;
}

export function PasswordField({ label, ...props }: TextFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex items-center rounded-xl border-2 border-gold/30 bg-black/50 transition focus-within:border-gold/70">
      <input
        aria-label={label}
        placeholder={label}
        type={visible ? 'text' : 'password'}
        className="min-w-0 flex-1 bg-transparent p-4 text-base text-white/95 placeholder:text-white/50 outline-none"
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="p-4 text-white/50 transition hover:text-white/80"
        aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={22} />
      </button>
    </div>
  );
}
