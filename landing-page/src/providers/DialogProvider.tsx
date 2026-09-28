'use client';

/**
 * DialogProvider — web replacement for React Native's Alert.alert.
 *
 *   const dialog = useDialog();
 *   await dialog.alert('Título', 'Mensaje');
 *   const ok = await dialog.confirm('¿Seguro?', 'Mensaje', { confirmText: 'Sí' });
 *   const choice = await dialog.choose('Formato', 'Elige', [{ id: 'pdf', label: 'PDF' }]);
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Modal } from '@/components/juego/Modal';
import { cn } from '@/lib/utils';

interface DialogButton {
  id: string;
  label: string;
  style?: 'primary' | 'secondary' | 'destructive';
}

interface DialogState {
  title: string;
  message?: string;
  buttons: DialogButton[];
  cancelId: string;
}

interface DialogContextValue {
  alert: (title: string, message?: string) => Promise<void>;
  confirm: (
    title: string,
    message?: string,
    options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
  ) => Promise<boolean>;
  choose: (title: string, message: string, options: DialogButton[]) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: PropsWithChildren) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const resolverRef = useRef<((id: string) => void) | null>(null);
  const cancelIdRef = useRef('cancel');

  const open = useCallback((state: DialogState) => {
    return new Promise<string>((resolve) => {
      // Resolve any dialog still open so its caller doesn't hang.
      resolverRef.current?.(cancelIdRef.current);
      resolverRef.current = resolve;
      cancelIdRef.current = state.cancelId;
      setDialog(state);
    });
  }, []);

  const close = useCallback((id: string) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolve?.(id);
  }, []);

  const value = useMemo<DialogContextValue>(
    () => ({
      alert: async (title, message) => {
        await open({ title, message, buttons: [{ id: 'ok', label: 'Aceptar', style: 'primary' }], cancelId: 'ok' });
      },
      confirm: async (title, message, options) => {
        const id = await open({
          title,
          message,
          cancelId: 'cancel',
          buttons: [
            { id: 'cancel', label: options?.cancelText ?? 'Cancelar', style: 'secondary' },
            {
              id: 'ok',
              label: options?.confirmText ?? 'Aceptar',
              style: options?.destructive ? 'destructive' : 'primary',
            },
          ],
        });
        return id === 'ok';
      },
      choose: async (title, message, options) => {
        const id = await open({
          title,
          message,
          cancelId: 'cancel',
          buttons: [...options, { id: 'cancel', label: 'Cancelar', style: 'secondary' }],
        });
        return id === 'cancel' ? null : id;
      },
    }),
    [open]
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal
        visible={dialog !== null}
        onClose={() => dialog && close(dialog.cancelId)}
        label={dialog?.title ?? 'Aviso'}
        className="sm:max-w-[380px]"
      >
        {dialog ? (
          <div role="alertdialog" aria-live="assertive">
            <h2 className="font-title text-lg tracking-wide text-gold">{dialog.title}</h2>
            {dialog.message ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/70">{dialog.message}</p>
            ) : null}
            <div className={cn('mt-6 flex gap-2', dialog.buttons.length > 2 ? 'flex-col' : 'flex-row-reverse')}>
              {dialog.buttons.map((button) => (
                <button
                  key={button.id}
                  type="button"
                  onClick={() => close(button.id)}
                  className={cn(
                    'min-h-11 flex-1 rounded-full px-4 text-sm font-bold tracking-wider transition',
                    button.style === 'secondary' &&
                      'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10',
                    button.style === 'destructive' && 'bg-red-500 text-white hover:bg-red-400',
                    (!button.style || button.style === 'primary') &&
                      'bg-gold text-ink-deep hover:brightness-110'
                  )}
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const value = useContext(DialogContext);
  if (!value) {
    throw new Error('useDialog debe utilizarse dentro de DialogProvider.');
  }
  return value;
}
