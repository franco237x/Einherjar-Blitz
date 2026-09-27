'use client';

/**
 * TransferModal — Stepped modal for transferring keys to another user.
 *
 * Flow: 1) Search & pick recipient → 2) Choose amount → 3) Confirm → Result.
 * - Search users by username prefix (fires at 2+ chars, debounced)
 * - Amount step with stepper, quick chips and live validation
 * - Confirmation summary before executing the Firestore transaction
 * - Dedicated success / error result screen inside the modal
 * - State fully resets when the modal closes
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { buildOperationData, createOperationId } from '@/services/economy';
import { normalizeUsername } from '@/services/userDirectory';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { Spinner } from './Spinner';

interface UserResult {
  uid: string;
  username: string;
  transferCode: string;
  avatar: string | null;
}

type Step = 'recipient' | 'amount' | 'confirm' | 'result';

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
  myKeys: number;
}

const QUICK_AMOUNTS = [1, 5, 10];

const primaryBtn =
  'flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-bold tracking-[0.15em] text-ink-deep transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40';
const secondaryBtn =
  'flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-sm font-bold tracking-[0.15em] text-white/90 transition hover:bg-white/10 disabled:opacity-40';

function Avatar({ user, size }: { user: UserResult; size: number }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt=""
        className="shrink-0 rounded-full border border-gold object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10"
      style={{ width: size, height: size }}
    >
      <Icon name="person" size={size * 0.45} color="#c9aa71" />
    </span>
  );
}

/** State lives in the open modal, so closing it fully resets the flow. */
export function TransferModal(props: TransferModalProps) {
  if (!props.visible) return null;
  return <OpenTransferModal {...props} />;
}

function OpenTransferModal({ visible, onClose, myKeys }: TransferModalProps) {
  const [step, setStep] = useState<Step>('recipient');

  // Search state
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Selection state
  const [selected, setSelected] = useState<UserResult | null>(null);

  // Transfer state
  const [amount, setAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const amountNum = useMemo(() => {
    const n = parseInt(amount, 10);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const amountError = useMemo(() => {
    if (amount === '') return null;
    if (amountNum <= 0) return 'Ingresa una cantidad válida.';
    if (amountNum > myKeys) return `Solo tienes ${myKeys} llaves disponibles.`;
    return null;
  }, [amount, amountNum, myKeys]);

  const amountValid = amountNum > 0 && amountNum <= myKeys;

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  // ─── Search users by username prefix ────────────────────────────────

  const searchUsers = useCallback(async (text: string) => {
    const normalizedText = normalizeUsername(text);
    if (normalizedText.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const q = query(collection(db, 'publicUsers'), orderBy('username'), limit(100));
      const snapshot = await getDocs(q);
      const currentUid = auth.currentUser?.uid;

      const users: UserResult[] = [];
      snapshot.forEach((docSnap) => {
        // Exclude ourselves
        if (docSnap.id === currentUid) return;
        const data = docSnap.data();
        const username = data.username || 'Sin nombre';
        if (normalizeUsername(username).startsWith(normalizedText)) {
          users.push({
            uid: docSnap.id,
            username,
            transferCode: data.transferCode || docSnap.id.slice(0, 8),
            avatar: data.avatarUrl || null,
          });
        }
      });

      setResults(users.slice(0, 10));
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('User search error:', (err as Error)?.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search on text change
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setSelected(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (normalizeUsername(text).length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      void searchUsers(text);
    }, 350);
  };

  const changeAmount = (delta: number) => {
    const next = Math.min(Math.max(amountNum + delta, 0), myKeys);
    setAmount(next > 0 ? String(next) : '');
  };

  const setQuickAmount = (value: number) => {
    setAmount(String(Math.min(value, myKeys)));
  };

  // ─── Transfer ─────────────────────────────────────────────────────

  const handleTransfer = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selected || !amountValid || transferring) return;

    setTransferring(true);
    try {
      const senderRef = doc(db, 'users', uid);
      const recipientRef = doc(db, 'users', selected.uid);
      const transferId = createOperationId('transfer');
      const operationRef = doc(db, 'users', uid, 'operations', transferId);

      await runTransaction(db, async (transaction) => {
        const senderSnap = await transaction.get(senderRef);
        const operationSnap = await transaction.get(operationRef);

        if (!senderSnap.exists()) throw new Error('Usuario no encontrado.');
        if (operationSnap.exists()) return;

        const senderKeys = senderSnap.data().keys ?? 0;
        if (senderKeys < amountNum) {
          throw new Error('Saldo insuficiente en el momento de la transacción.');
        }

        transaction.update(senderRef, {
          keys: senderKeys - amountNum,
          lastOutgoingTransferId: transferId,
          lastOutgoingTransferTo: selected.uid,
          lastOutgoingTransferAmount: amountNum,
          lastOperationId: transferId,
          lastOperationType: 'transfer_sent',
          lastOperationAt: serverTimestamp(),
        });
        transaction.update(recipientRef, {
          keys: increment(amountNum),
          lastIncomingTransferId: transferId,
          lastIncomingTransferFrom: uid,
          lastIncomingTransferAmount: amountNum,
        });
        transaction.set(
          operationRef,
          buildOperationData({
            type: 'transfer_sent',
            currency: 'keys',
            delta: -amountNum,
            balanceBefore: senderKeys,
            balanceAfter: senderKeys - amountNum,
            relatedId: selected.uid,
          })
        );
      });

      setResult({
        type: 'success',
        text: `Transferiste ${amountNum} ${amountNum === 1 ? 'llave' : 'llaves'} a ${selected.username}.`,
      });
    } catch (error: unknown) {
      console.error('Transfer error:', error);
      setResult({ type: 'error', text: (error as Error)?.message || 'Error al transferir llaves.' });
    } finally {
      setTransferring(false);
      setStep('result');
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────

  const steps: Step[] = ['recipient', 'amount', 'confirm'];
  const currentIdx = step === 'result' ? 2 : steps.indexOf(step);

  const stepIndicator = (
    <ol className="mb-5 flex items-center" aria-label="Progreso de la transferencia">
      {steps.map((s, i) => (
        <li key={s} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
          <span
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold',
              i <= currentIdx ? 'border-gold bg-gold text-ink-deep' : 'border-white/20 text-white/50'
            )}
            aria-current={i === currentIdx ? 'step' : undefined}
          >
            {i < currentIdx ? <Icon name="checkmark" size={12} strokeWidth={3} /> : i + 1}
          </span>
          {i < steps.length - 1 && (
            <span className={cn('mx-2 h-0.5 flex-1 rounded', i < currentIdx ? 'bg-gold' : 'bg-white/10')} />
          )}
        </li>
      ))}
    </ol>
  );

  const stepTitle = (text: string) => (
    <h3 className="mb-4 text-base font-bold text-white/95">{text}</h3>
  );

  const renderRecipientStep = () => (
    <>
      {stepTitle('¿A quién le envías llaves?')}

      <label className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 focus-within:border-gold/60">
        <Icon name="search" size={16} color="rgba(255,255,255,0.5)" />
        <input
          className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-white/95 outline-none placeholder:text-white/50"
          placeholder="Buscar por nombre de usuario..."
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          autoFocus
          aria-label="Buscar usuario"
        />
        {searching && <Spinner size={16} className="text-gold" />}
      </label>

      <div className="juego-scroll my-3 h-[240px] overflow-y-auto">
        {searchText.length < 2 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <Icon name="people" size={36} color="rgba(255,255,255,0.5)" />
            <p className="text-[13px] text-white/50">Escribe al menos 2 letras para buscar usuarios.</p>
          </div>
        ) : searching && results.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Spinner className="text-gold" />
            <p className="text-[13px] text-white/50">Buscando usuarios...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <Icon name="alert-circle" size={36} color="rgba(255,255,255,0.5)" />
            <p className="text-[13px] text-white/50">
              No se encontraron usuarios. Los usuarios existentes deben abrir la versión nueva una vez
              para aparecer en el buscador.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2" role="listbox" aria-label="Resultados">
            {results.map((item) => {
              const isSelected = selected?.uid === item.uid;
              return (
                <li key={item.uid}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setSelected(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition',
                      isSelected ? 'border-gold bg-gold/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                    )}
                  >
                    <Avatar user={item} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white/95">{item.username}</span>
                      <span className="block text-xs text-white/50">#{item.transferCode}</span>
                    </span>
                    <Icon
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isSelected ? '#c9aa71' : 'rgba(255,255,255,0.5)'}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button type="button" className={cn(primaryBtn, 'w-full')} onClick={() => selected && setStep('amount')} disabled={!selected}>
        CONTINUAR
        <Icon name="arrow-forward" size={16} />
      </button>
    </>
  );

  const renderAmountStep = () => (
    <>
      {stepTitle('¿Cuántas llaves envías?')}

      {selected && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 py-1 pl-1 pr-3">
          <Avatar user={selected} size={24} />
          <span className="text-sm font-bold text-white/95">{selected.username}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-white/5 text-white/95 disabled:opacity-40"
          onClick={() => changeAmount(-1)}
          disabled={amountNum <= 0}
          aria-label="Restar una llave"
        >
          <Icon name="remove" size={22} />
        </button>
        <input
          className="h-12 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 text-center font-title text-2xl text-white/95 outline-none focus:border-gold/60"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          maxLength={6}
          aria-label="Cantidad de llaves"
          autoFocus
        />
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-white/5 text-white/95 disabled:opacity-40"
          onClick={() => changeAmount(1)}
          disabled={amountNum >= myKeys}
          aria-label="Sumar una llave"
        >
          <Icon name="add" size={22} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          ...QUICK_AMOUNTS.filter((v) => v <= myKeys).map((v) => ({ key: String(v), value: v, label: String(v) })),
          ...(myKeys > 0 ? [{ key: 'max', value: myKeys, label: `Max (${myKeys})` }] : []),
        ].map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setQuickAmount(chip.value)}
            className={cn(
              'min-h-9 rounded-full border px-4 text-sm font-bold transition',
              amountNum === chip.value
                ? 'border-gold bg-gold text-ink-deep'
                : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {amountError ? (
        <p className="mt-3 text-xs text-red-400" role="alert">{amountError}</p>
      ) : (
        <p className="mt-3 text-xs text-white/50">
          Saldo disponible: {myKeys} {myKeys === 1 ? 'llave' : 'llaves'}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <button type="button" className={secondaryBtn} onClick={() => setStep('recipient')}>
          <Icon name="arrow-back" size={16} />
          ATRÁS
        </button>
        <button type="button" className={cn(primaryBtn, 'flex-1')} onClick={() => amountValid && setStep('confirm')} disabled={!amountValid}>
          CONTINUAR
          <Icon name="arrow-forward" size={16} />
        </button>
      </div>
    </>
  );

  const renderConfirmStep = () => (
    <>
      {stepTitle('Confirma la transferencia')}

      <dl className="rounded-xl border border-gold/20 bg-white/[0.03] px-4">
        <div className="flex items-center justify-between py-3">
          <dt className="text-sm text-white/60">Destinatario</dt>
          <dd className="flex items-center gap-2">
            {selected && <Avatar user={selected} size={22} />}
            <span className="text-sm font-bold text-white/95">{selected?.username}</span>
          </dd>
        </div>
        <div className="h-px bg-white/10" />
        <div className="flex items-center justify-between py-3">
          <dt className="text-sm text-white/60">Cantidad</dt>
          <dd className="flex items-center gap-1.5 text-sm font-bold text-gold">
            <Icon name="key-outline" size={16} />
            {amountNum} {amountNum === 1 ? 'llave' : 'llaves'}
          </dd>
        </div>
        <div className="h-px bg-white/10" />
        <div className="flex items-center justify-between py-3">
          <dt className="text-sm text-white/60">Saldo restante</dt>
          <dd className="text-sm font-bold text-white/95">{myKeys - amountNum}</dd>
        </div>
      </dl>

      <p className="mt-3 text-center text-xs text-white/50">Esta acción no se puede deshacer.</p>

      <div className="mt-5 flex gap-2">
        <button type="button" className={secondaryBtn} onClick={() => setStep('amount')} disabled={transferring}>
          <Icon name="arrow-back" size={16} />
          ATRÁS
        </button>
        <button type="button" className={cn(primaryBtn, 'flex-1')} onClick={handleTransfer} disabled={transferring}>
          {transferring ? (
            <Spinner size={18} className="text-ink-deep" />
          ) : (
            <>
              <Icon name="paper-plane-outline" size={16} />
              TRANSFERIR
            </>
          )}
        </button>
      </div>
    </>
  );

  const renderResultStep = () => (
    <div className="flex flex-col items-center py-4 text-center" aria-live="polite">
      <Icon
        name={result?.type === 'success' ? 'checkmark-circle' : 'close-circle'}
        size={64}
        color={result?.type === 'success' ? '#22c55e' : '#ef4444'}
      />
      <h3 className="mt-3 font-title text-lg text-white/95">
        {result?.type === 'success' ? '¡Transferencia exitosa!' : 'Transferencia fallida'}
      </h3>
      <p className="mt-2 text-sm text-white/70">{result?.text}</p>

      {result?.type === 'error' && (
        <button
          type="button"
          className={cn(primaryBtn, 'mt-5 w-full')}
          onClick={() => {
            setResult(null);
            setStep('confirm');
          }}
        >
          <Icon name="refresh" size={16} />
          REINTENTAR
        </button>
      )}

      <button
        type="button"
        className={result?.type === 'success' ? cn(primaryBtn, 'mt-5 w-full') : 'mt-3 min-h-11 text-sm font-bold tracking-widest text-white/60 hover:text-white'}
        onClick={onClose}
      >
        CERRAR
      </button>
    </div>
  );

  return (
    <Modal visible={visible} onClose={onClose} label="Transferir llaves" locked={transferring} className="max-w-[440px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-title text-lg tracking-wide text-gold">Transferir Llaves</h2>
          <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-bold text-white/90">
            <Icon name="key-outline" size={12} color="#c9aa71" />
            {myKeys}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/90 hover:bg-white/10" aria-label="Cerrar">
          <Icon name="close" size={22} />
        </button>
      </div>

      {step !== 'result' && stepIndicator}

      {step === 'recipient' && renderRecipientStep()}
      {step === 'amount' && renderAmountStep()}
      {step === 'confirm' && renderConfirmStep()}
      {step === 'result' && renderResultStep()}
    </Modal>
  );
}
