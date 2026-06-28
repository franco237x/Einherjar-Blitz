/**
 * TransferModal — Modal for transferring keys to another user.
 *
 * Features:
 * - Search users by username prefix (case-sensitive, fires at 2+ chars)
 * - Shows matching users with avatar + name
 * - Lets the user select a recipient, enter amount, and confirm
 * - Uses Firestore transactions for atomic balance updates
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  runTransaction,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────

interface UserResult {
  uid: string;
  username: string;
  avatar: string | null;
  email: string;
}

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
  myKeys: number;
}

// ─── Component ────────────────────────────────────────────────────────────

export const TransferModal = ({ visible, onClose, myKeys }: TransferModalProps) => {
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset everything when modal closes
  useEffect(() => {
    if (!visible) {
      setSearchText('');
      setResults([]);
      setSearching(false);
      setHasSearched(false);
      setSelected(null);
      setAmount('');
      setTransferring(false);
      setMessage(null);
    }
  }, [visible]);

  // ─── Search users by username prefix (case-sensitive) ──────────────

  const searchUsers = useCallback(async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', text),
        where('username', '<=', text + '\uf8ff'),
        orderBy('username'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const currentUid = auth.currentUser?.uid;

      const users: UserResult[] = [];
      snapshot.forEach((docSnap) => {
        // Exclude ourselves
        if (docSnap.id === currentUid) return;
        const data = docSnap.data();
        users.push({
          uid: docSnap.id,
          username: data.username || 'Sin nombre',
          avatar: data.avatar || null,
          email: data.email || '',
        });
      });

      setResults(users);
    } catch (err) {
      console.error('User search error:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search on text change
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setSelected(null);
    setMessage(null);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      searchUsers(text);
    }, 350);
  };

  // ─── Select a user ────────────────────────────────────────────────

  const handleSelect = (user: UserResult) => {
    setSelected(user);
    setSearchText(user.username);
    setResults([]); // Hide the dropdown
    setMessage(null);
  };

  // ─── Transfer ─────────────────────────────────────────────────────

  const handleTransfer = async () => {
    setMessage(null);

    if (!selected) {
      setMessage({ type: 'error', text: 'Selecciona un usuario de la lista.' });
      return;
    }

    const amountNum = parseInt(amount, 10);
    if (!amountNum || amountNum <= 0) {
      setMessage({ type: 'error', text: 'Ingresa una cantidad válida de llaves.' });
      return;
    }
    if (amountNum > myKeys) {
      setMessage({ type: 'error', text: `No tienes suficientes llaves. Tienes ${myKeys}.` });
      return;
    }

    setTransferring(true);
    try {
      const senderRef = doc(db, 'users', auth.currentUser!.uid);
      const recipientRef = doc(db, 'users', selected.uid);

      await runTransaction(db, async (transaction) => {
        const senderSnap = await transaction.get(senderRef);
        const recipientSnap = await transaction.get(recipientRef);

        if (!senderSnap.exists() || !recipientSnap.exists()) {
          throw new Error('Usuario no encontrado.');
        }

        const senderKeys = senderSnap.data().keys || 0;
        if (senderKeys < amountNum) {
          throw new Error('Saldo insuficiente en el momento de la transacción.');
        }

        transaction.update(senderRef, { keys: senderKeys - amountNum });
        transaction.update(recipientRef, {
          keys: (recipientSnap.data().keys || 0) + amountNum,
        });
      });

      setMessage({
        type: 'success',
        text: `¡Transferiste ${amountNum} llaves a ${selected.username}!`,
      });
      setAmount('');
      setSelected(null);
      setSearchText('');
    } catch (error: any) {
      console.error('Transfer error:', error);
      setMessage({ type: 'error', text: error?.message || 'Error al transferir llaves.' });
    } finally {
      setTransferring(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Transferir Llaves</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Balance */}
          <View style={styles.balanceRow}>
            <Ionicons name="key-outline" size={18} color={Colors.primaryGold} />
            <Text style={styles.balanceText}>Tienes {myKeys} llaves</Text>
          </View>

          {/* Search input */}
          <Text style={styles.inputLabel}>Buscar usuario</Text>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Escribe al menos 2 letras..."
              placeholderTextColor={Colors.textMuted}
              value={searchText}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && (
              <ActivityIndicator size="small" color={Colors.primaryGold} />
            )}
          </View>

          {/* Search results dropdown */}
          {results.length > 0 && (
            <View style={styles.resultsContainer}>
              <FlatList
                data={results}
                keyExtractor={(item) => item.uid}
                keyboardShouldPersistTaps="handled"
                style={styles.resultsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.resultAvatar} />
                    ) : (
                      <View style={styles.resultAvatarPlaceholder}>
                        <Ionicons name="person" size={16} color={Colors.primaryGold} />
                      </View>
                    )}
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{item.username}</Text>
                      <Text style={styles.resultEmail} numberOfLines={1}>
                        {item.email}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* No results message */}
          {hasSearched && !searching && results.length === 0 && searchText.length >= 2 && !selected && (
            <Text style={styles.noResults}>No se encontraron usuarios con ese nombre.</Text>
          )}

          {/* Selected user badge */}
          {selected && (
            <View style={styles.selectedBadge}>
              {selected.avatar ? (
                <Image source={{ uri: selected.avatar }} style={styles.selectedAvatar} />
              ) : (
                <View style={styles.selectedAvatarPlaceholder}>
                  <Ionicons name="person" size={14} color={Colors.primaryGold} />
                </View>
              )}
              <Text style={styles.selectedName}>{selected.username}</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelected(null);
                  setSearchText('');
                  setMessage(null);
                }}
              >
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Amount input */}
          <Text style={styles.inputLabel}>Cantidad de llaves</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            value={amount}
            onChangeText={(t) => {
              setAmount(t);
              setMessage(null);
            }}
            keyboardType="number-pad"
          />

          {/* Messages */}
          {message && (
            <Text
              style={[
                styles.message,
                message.type === 'error' ? styles.messageError : styles.messageSuccess,
              ]}
            >
              {message.text}
            </Text>
          )}

          {/* Transfer button */}
          <TouchableOpacity
            style={[styles.transferBtn, transferring && styles.transferBtnDisabled]}
            onPress={handleTransfer}
            disabled={transferring}
          >
            {transferring ? (
              <ActivityIndicator color={Colors.bgDarker} />
            ) : (
              <Text style={styles.transferBtnText}>TRANSFERIR</Text>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 20,
    letterSpacing: 2,
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
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(201,170,113,0.08)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.15)',
  },
  balanceText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  inputLabel: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
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
  resultsContainer: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    overflow: 'hidden',
  },
  resultsList: {
    flex: 1,
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
  resultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
  },
  resultAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  noResults: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(201,170,113,0.12)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    alignSelf: 'flex-start',
  },
  selectedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
  },
  selectedAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedName: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 16,
    borderRadius: Radius.sm,
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  messageError: {
    color: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  messageSuccess: {
    color: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  transferBtn: {
    backgroundColor: Colors.primaryGold,
    padding: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  transferBtnDisabled: {
    opacity: 0.6,
  },
  transferBtnText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 2,
  },
});
