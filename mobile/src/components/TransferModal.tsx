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

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { buildOperationData, createOperationId } from '@/services/economy';
import { normalizeUsername } from '@/services/userDirectory';

// ─── Types ────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────

export const TransferModal = ({ visible, onClose, myKeys }: TransferModalProps) => {
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

  // Reset everything when modal closes
  useEffect(() => {
    if (!visible) {
      setStep('recipient');
      setSearchText('');
      setResults([]);
      setSearching(false);
      setHasSearched(false);
      setSelected(null);
      setAmount('');
      setTransferring(false);
      setResult(null);
    }
  }, [visible]);

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
      const q = query(
        collection(db, 'publicUsers'),
        orderBy('username'),
        limit(100)
      );

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
      if (__DEV__) console.error('User search error:', (err as Error)?.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search on text change
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setSelected(null);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (normalizeUsername(text).length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      searchUsers(text);
    }, 350);
  };

  // ─── Step navigation ─────────────────────────────────────────────────

  const handleSelect = (user: UserResult) => {
    setSelected(user);
  };

  const goToAmount = () => {
    if (selected) setStep('amount');
  };

  const goToConfirm = () => {
    if (amountValid) setStep('confirm');
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
    if (!selected || !amountValid || transferring) return;

    setTransferring(true);
    try {
      const senderRef = doc(db, 'users', auth.currentUser!.uid);
      const recipientRef = doc(db, 'users', selected.uid);
      const transferId = createOperationId('transfer');
      const operationRef = doc(
        db,
        'users',
        auth.currentUser!.uid,
        'operations',
        transferId
      );

      await runTransaction(db, async (transaction) => {
        const senderSnap = await transaction.get(senderRef);
        const operationSnap = await transaction.get(operationRef);

        if (!senderSnap.exists()) {
          throw new Error('Usuario no encontrado.');
        }
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
          lastIncomingTransferFrom: auth.currentUser!.uid,
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
    } catch (error: any) {
      console.error('Transfer error:', error);
      setResult({ type: 'error', text: error?.message || 'Error al transferir llaves.' });
    } finally {
      setTransferring(false);
      setStep('result');
    }
  };

  const handleRetry = () => {
    setResult(null);
    setStep('confirm');
  };

  // ─── Render helpers ───────────────────────────────────────────────

  const renderStepIndicator = () => {
    const steps: Step[] = ['recipient', 'amount', 'confirm'];
    const currentIdx = step === 'result' ? 2 : steps.indexOf(step);
    return (
      <View style={styles.stepRow}>
        {steps.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                i <= currentIdx && styles.stepDotActive,
              ]}
            >
              {i < currentIdx ? (
                <Ionicons name="checkmark" size={12} color={Colors.bgDarker} />
              ) : (
                <Text style={[styles.stepDotText, i <= currentIdx && styles.stepDotTextActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, i < currentIdx && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderAvatar = (user: UserResult, size: number) => {
    const radius = size / 2;
    if (user.avatar) {
      return (
        <Image
          source={{ uri: user.avatar }}
          style={{ width: size, height: size, borderRadius: radius, borderWidth: 1, borderColor: Colors.primaryGold }}
        />
      );
    }
    return (
      <View
        style={[
          styles.avatarPlaceholder,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <Ionicons name="person" size={size * 0.45} color={Colors.primaryGold} />
      </View>
    );
  };

  // ─── Step 1: recipient ────────────────────────────────────────────

  const renderRecipientStep = () => (
    <>
      <Text style={styles.stepTitle}>¿A quién le envías llaves?</Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre de usuario..."
          placeholderTextColor={Colors.textMuted}
          value={searchText}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color={Colors.primaryGold} />}
      </View>

      <View style={styles.resultsArea}>
        {searchText.length < 2 ? (
          <View style={styles.hintWrap}>
            <Ionicons name="people-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.hintText}>
              Escribe al menos 2 letras para buscar usuarios.
            </Text>
          </View>
        ) : searching && results.length === 0 ? (
          <View style={styles.hintWrap}>
            <ActivityIndicator size="small" color={Colors.primaryGold} />
            <Text style={styles.hintText}>Buscando usuarios...</Text>
          </View>
        ) : hasSearched && results.length === 0 ? (
          <View style={styles.hintWrap}>
            <Ionicons name="alert-circle-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.hintText}>
              No se encontraron usuarios. Los usuarios existentes deben abrir
              la versión nueva una vez para aparecer en el buscador.
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.uid}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = selected?.uid === item.uid;
              return (
                <TouchableOpacity
                  style={[styles.resultItem, isSelected && styles.resultItemSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  {renderAvatar(item, 36)}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.username}</Text>
                    <Text style={styles.resultEmail}>#{item.transferCode}</Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isSelected ? Colors.primaryGold : Colors.textMuted}
                  />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, !selected && styles.primaryBtnDisabled]}
        onPress={goToAmount}
        disabled={!selected}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryBtnText}>CONTINUAR</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.bgDarker} />
      </TouchableOpacity>
    </>
  );

  // ─── Step 2: amount ───────────────────────────────────────────────

  const renderAmountStep = () => (
    <>
      <Text style={styles.stepTitle}>¿Cuántas llaves envías?</Text>

      {selected && (
        <View style={styles.recipientChip}>
          {renderAvatar(selected, 24)}
          <Text style={styles.recipientChipText}>{selected.username}</Text>
        </View>
      )}

      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepperBtn, amountNum <= 0 && styles.stepperBtnDisabled]}
          onPress={() => changeAmount(-1)}
          disabled={amountNum <= 0}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.stepperBtn, amountNum >= myKeys && styles.stepperBtnDisabled]}
          onPress={() => changeAmount(1)}
          disabled={amountNum >= myKeys}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.filter((v) => v <= myKeys).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.quickChip, amountNum === v && styles.quickChipActive]}
            onPress={() => setQuickAmount(v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.quickChipText, amountNum === v && styles.quickChipTextActive]}>
              {v}
            </Text>
          </TouchableOpacity>
        ))}
        {myKeys > 0 && (
          <TouchableOpacity
            style={[styles.quickChip, amountNum === myKeys && styles.quickChipActive]}
            onPress={() => setQuickAmount(myKeys)}
            activeOpacity={0.7}
          >
            <Text style={[styles.quickChipText, amountNum === myKeys && styles.quickChipTextActive]}>
              Max ({myKeys})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {amountError ? (
        <Text style={styles.amountErrorText}>{amountError}</Text>
      ) : (
        <Text style={styles.amountHelpText}>
          Saldo disponible: {myKeys} {myKeys === 1 ? 'llave' : 'llaves'}
        </Text>
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('recipient')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={16} color={Colors.textPrimary} />
          <Text style={styles.secondaryBtnText}>ATRÁS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, styles.primaryBtnFlex, !amountValid && styles.primaryBtnDisabled]}
          onPress={goToConfirm}
          disabled={!amountValid}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>CONTINUAR</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.bgDarker} />
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Step 3: confirm ──────────────────────────────────────────────

  const renderConfirmStep = () => (
    <>
      <Text style={styles.stepTitle}>Confirma la transferencia</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Destinatario</Text>
          <View style={styles.summaryRecipient}>
            {selected && renderAvatar(selected, 22)}
            <Text style={styles.summaryValue}>{selected?.username}</Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cantidad</Text>
          <View style={styles.summaryRecipient}>
            <Ionicons name="key-outline" size={16} color={Colors.primaryGold} />
            <Text style={styles.summaryValueGold}>
              {amountNum} {amountNum === 1 ? 'llave' : 'llaves'}
            </Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Saldo restante</Text>
          <Text style={styles.summaryValue}>{myKeys - amountNum}</Text>
        </View>
      </View>

      <Text style={styles.confirmNote}>
        Esta acción no se puede deshacer.
      </Text>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setStep('amount')}
          disabled={transferring}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color={Colors.textPrimary} />
          <Text style={styles.secondaryBtnText}>ATRÁS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, styles.primaryBtnFlex, transferring && styles.primaryBtnDisabled]}
          onPress={handleTransfer}
          disabled={transferring}
          activeOpacity={0.8}
        >
          {transferring ? (
            <ActivityIndicator size="small" color={Colors.bgDarker} />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={16} color={Colors.bgDarker} />
              <Text style={styles.primaryBtnText}>TRANSFERIR</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Result ───────────────────────────────────────────────────────

  const renderResultStep = () => (
    <View style={styles.resultWrap}>
      <Ionicons
        name={result?.type === 'success' ? 'checkmark-circle' : 'close-circle'}
        size={64}
        color={result?.type === 'success' ? '#22c55e' : '#ef4444'}
      />
      <Text style={styles.resultTitle}>
        {result?.type === 'success' ? '¡Transferencia exitosa!' : 'Transferencia fallida'}
      </Text>
      <Text style={styles.resultText}>{result?.text}</Text>

      {result?.type === 'error' && (
        <TouchableOpacity style={[styles.primaryBtn, styles.resultBtn]} onPress={handleRetry} activeOpacity={0.8}>
          <Ionicons name="refresh" size={16} color={Colors.bgDarker} />
          <Text style={styles.primaryBtnText}>REINTENTAR</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={result?.type === 'success' ? [styles.primaryBtn, styles.resultBtn] : styles.resultCloseBtn}
        onPress={onClose}
        activeOpacity={0.8}
      >
        <Text
          style={result?.type === 'success' ? styles.primaryBtnText : styles.resultCloseText}
        >
          CERRAR
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Transferir Llaves</Text>
              <View style={styles.balancePill}>
                <Ionicons name="key-outline" size={12} color={Colors.primaryGold} />
                <Text style={styles.balancePillText}>{myKeys}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {step !== 'result' && renderStepIndicator()}

          {step === 'recipient' && renderRecipientStep()}
          {step === 'amount' && renderAmountStep()}
          {step === 'confirm' && renderConfirmStep()}
          {step === 'result' && renderResultStep()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    padding: Spacing.lg,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  title: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 1.5,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(201,170,113,0.1)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.25)',
  },
  balancePillText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  /* Step indicator */
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primaryGold,
    borderColor: Colors.primaryGold,
  },
  stepDotText: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
  },
  stepDotTextActive: {
    color: Colors.bgDarker,
  },
  stepLine: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.primaryGold,
  },

  /* Shared step title */
  stepTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  /* Step 1: search */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    borderRadius: Radius.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  resultsArea: {
    height: 200,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  hintWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  hintText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  resultItemSelected: {
    backgroundColor: 'rgba(201,170,113,0.1)',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  resultEmail: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 1,
  },
  avatarPlaceholder: {
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Step 2: amount */
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(201,170,113,0.1)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.25)',
    marginBottom: Spacing.lg,
  },
  recipientChipText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  amountInput: {
    minWidth: 110,
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 36,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  quickChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  quickChipActive: {
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(201,170,113,0.15)',
  },
  quickChipText: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  quickChipTextActive: {
    color: Colors.primaryGold,
  },
  amountErrorText: {
    color: '#ef4444',
    fontFamily: Fonts.body,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  amountHelpText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  /* Step 3: confirm */
  summaryCard: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.2)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  summaryValueGold: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  confirmNote: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  /* Buttons */
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryGold,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    marginTop: Spacing.lg,
  },
  primaryBtnFlex: {
    flex: 1,
    marginTop: 0,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryBtnText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 2,
  },

  /* Result */
  resultWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  resultTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
  },
  resultText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultBtn: {
    alignSelf: 'stretch',
    marginTop: Spacing.md,
  },
  resultCloseBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: Spacing.sm,
  },
  resultCloseText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 2,
  },
});
