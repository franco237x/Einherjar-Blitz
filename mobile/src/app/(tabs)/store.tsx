/**
 * Store Screen — Einherjar Blitz Mobile
 *
 * Mirrors the web tienda design:
 * - Header with title + currency badge (Esferas)
 * - Stats cards (Productos, Categorías)
 * - Category filter
 * - Product grid (available + sold-out sections)
 * - Purchase history modal
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Background } from '@/components/Background';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { StoreCard } from '@/components/store/StoreCard';
import { PurchaseModal, type PurchaseState } from '@/components/store/PurchaseModal';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import type { StoreProduct, PurchaseRecord } from '@/constants/storeData';
import { fetchProducts, purchaseProduct, streamPurchases, deletePurchase, deleteAllPurchases } from '@/services/store';
import { claimPurchasePDF, claimAllPurchasesPDF } from '@/services/purchaseClaim';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export default function StoreScreen() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [spheres, setSpheres] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>(null);
  const [purchaseInfo, setPurchaseInfo] = useState<{
    productName?: string;
    productImage?: string;
    price?: number;
    errorMessage?: string;
  }>({});
  const [filter, setFilter] = useState<string>(''); // '' = all
  const [showHistory, setShowHistory] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);

  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  // Global sync — reload products when the sync indicator is tapped
  const { refreshTick } = useSyncStatus();

  // ─── Load products ──────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    try {
      const items = await fetchProducts();
      setProducts(items);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reload when global refresh is triggered (sync indicator tap)
  useEffect(() => {
    if (refreshTick > 0) {
      loadProducts();
    }
  }, [refreshTick, loadProducts]);

  // ─── Real-time spheres balance ──────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        setSpheres(snap.data().spheres || 0);
      }
    });
    return () => unsub();
  }, [uid]);

  // ─── Real-time purchase history ─────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = streamPurchases(uid, setPurchases, (err) =>
      console.error('Purchase stream error:', err)
    );
    return () => unsub();
  }, [uid]);

  // ─── Categories ─────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      const key = (p.category || 'General').toLowerCase();
      map.set(key, p.category || 'General');
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  // ─── Filtered products ──────────────────────────────────────────────
  const { available, soldOut } = useMemo(() => {
    const filtered = filter
      ? products.filter((p) => (p.category || 'General').toLowerCase() === filter)
      : products;
    return {
      available: filtered.filter((p) => p.stock > 0),
      soldOut: filtered.filter((p) => p.stock <= 0),
    };
  }, [products, filter]);

  // ─── Buy handler ────────────────────────────────────────────────────
  const handleBuy = useCallback(
    async (product: StoreProduct) => {
      if (!uid) {
        setPurchaseInfo({ errorMessage: 'Debes iniciar sesión.' });
        setPurchaseState('error');
        return;
      }
      setBuyingId(product.id);
      setPurchaseInfo({ productName: product.name, productImage: product.imageUrl, price: product.price });
      setPurchaseState('loading');
      try {
        const result = await purchaseProduct(uid, product.id);
        setPurchaseInfo({
          productName: result.productName,
          productImage: product.imageUrl,
          price: result.price,
        });
        setPurchaseState('success');
        // Refresh products to update stock
        loadProducts();
      } catch (err: any) {
        setPurchaseInfo({ errorMessage: err?.message || 'No se pudo completar la compra.' });
        setPurchaseState('error');
      } finally {
        setBuyingId(null);
      }
    },
    [uid, loadProducts]
  );

  const closePurchaseModal = useCallback(() => {
    setPurchaseState(null);
    setPurchaseInfo({});
  }, []);

  // ─── Claim single purchase as PDF, then delete from Firestore ───────
  const handleClaimOne = useCallback(async (purchase: PurchaseRecord) => {
    if (!uid) return;
    setClaimingId(purchase.id);
    try {
      await claimPurchasePDF(purchase);
      // PDF generated & shared successfully → delete from Firestore
      await deletePurchase(uid, purchase.id);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo generar el certificado.');
    } finally {
      setClaimingId(null);
    }
  }, [uid]);

  // ─── Claim all purchases as PDF, then delete all from Firestore ─────
  const handleClaimAll = useCallback(async () => {
    if (!uid || purchases.length === 0) return;
    setClaimingAll(true);
    try {
      await claimAllPurchasesPDF(purchases);
      // PDF generated & shared successfully → delete all from Firestore
      await deleteAllPurchases(uid, purchases.map((p) => p.id));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo generar el certificado.');
    } finally {
      setClaimingAll(false);
    }
  }, [uid, purchases]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  if (loading) {
    return (
      <Background>
        <ParticlesBackground />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primaryGold} />
          <Text style={styles.loadingText}>Cargando tienda...</Text>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <ParticlesBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryGold} />}
      >
        {/* ═══ Header ═══ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.storeTitle}>Tienda Oficial</Text>
            <Text style={styles.storeSubtitle}>Artículos exclusivos para tu inventario</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.currencyBadge}>
              <Ionicons name="planet" size={20} color={Colors.primaryGold} />
              <View>
                <Text style={styles.currencyLabel}>Esferas</Text>
                <Text style={styles.currencyValue}>{spheres.toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => setShowHistory(true)}
            >
              <Ionicons name="receipt" size={16} color={Colors.textPrimary} />
              <Text style={styles.historyBtnText}>Historial</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ Toolbar: stats + filter ═══ */}
        <View style={styles.toolbar}>
          <View style={styles.statsGroup}>
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Productos</Text>
              <Text style={styles.statsValue}>{available.length}</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Categorías</Text>
              <Text style={styles.statsValue}>{categories.length}</Text>
            </View>
          </View>

          {categories.length > 0 && (
            <View style={styles.filterGroup}>
              <Ionicons name="filter" size={14} color={Colors.textMuted} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, !filter && styles.filterChipActive]}
                  onPress={() => setFilter('')}
                >
                  <Text style={[styles.filterChipText, !filter && styles.filterChipTextActive]}>
                    Todas
                  </Text>
                </TouchableOpacity>
                {categories.map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterChip, filter === key && styles.filterChipActive]}
                    onPress={() => setFilter(key)}
                  >
                    <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ═══ Available section ═══ */}
        {available.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibles</Text>
            <Text style={styles.sectionSubtitle}>Escoge el equipo que necesitas</Text>
            <View style={styles.grid}>
              {available.map((product) => (
                <StoreCard
                  key={product.id}
                  product={product}
                  spheres={spheres}
                  onBuy={handleBuy}
                  buying={buyingId === product.id}
                />
              ))}
            </View>
          </View>
        )}

        {/* ═══ Sold-out section ═══ */}
        {soldOut.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agotados</Text>
            <Text style={styles.sectionSubtitle}>Vuelve más tarde para su reposición</Text>
            <View style={styles.grid}>
              {soldOut.map((product) => (
                <StoreCard
                  key={product.id}
                  product={product}
                  spheres={spheres}
                  onBuy={handleBuy}
                  buying={buyingId === product.id}
                />
              ))}
            </View>
          </View>
        )}

        {/* ═══ Empty state ═══ */}
        {products.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="storefront" size={64} color="rgba(201,170,113,0.35)" />
            <Text style={styles.emptyTitle}>La tienda está en mantenimiento</Text>
            <Text style={styles.emptyText}>
              Pronto llegarán nuevos artículos. Mientras tanto, sigue acumulando Esferas.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ═══ Purchase Result Modal ═══ */}
      <PurchaseModal
        state={purchaseState}
        productName={purchaseInfo.productName}
        productImage={purchaseInfo.productImage}
        price={purchaseInfo.price}
        errorMessage={purchaseInfo.errorMessage}
        onClose={closePurchaseModal}
      />

      {/* ═══ Purchase History Modal ═══ */}
      <Modal visible={showHistory} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Historial de Compras</Text>
                {purchases.length > 0 && (
                  <TouchableOpacity
                    style={styles.claimAllBtn}
                    onPress={handleClaimAll}
                    disabled={claimingAll}
                    activeOpacity={0.7}
                  >
                    {claimingAll ? (
                      <ActivityIndicator size="small" color={Colors.primaryGold} />
                    ) : (
                      <>
                        <Ionicons name="document-text" size={14} color={Colors.primaryGold} />
                        <Text style={styles.claimAllText}>Reclamar Todo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={purchases}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              ListEmptyComponent={
                <View style={styles.emptyHistory}>
                  <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyHistoryText}>Aún no has comprado nada.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyItemName}>{item.productName}</Text>
                    <Text style={styles.historyItemDate}>
                      {item.purchasedAt
                        ? item.purchasedAt.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </Text>
                    <View style={styles.historyItemBottom}>
                      <View style={styles.historyItemRight}>
                        <Ionicons name="planet" size={12} color={Colors.primaryGold} />
                        <Text style={styles.historyItemPrice}>{item.price.toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => handleClaimOne(item)}
                        disabled={claimingId === item.id}
                        activeOpacity={0.7}
                      >
                        {claimingId === item.id ? (
                          <ActivityIndicator size="small" color={Colors.primaryGold} />
                        ) : (
                          <>
                            <Ionicons name="download" size={12} color={Colors.primaryGold} />
                            <Text style={styles.claimBtnText}>RECLAMAR</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </Background>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  /* Loading */
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 14,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  storeTitle: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 24,
    letterSpacing: 2,
    textShadowColor: Colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  storeSubtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  currencyLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currencyValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 16,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.sm,
  },
  historyBtnText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 12,
  },

  /* Toolbar */
  toolbar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  statsGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statsLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 18,
    marginTop: 2,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.full,
    marginRight: 8,
  },
  filterChipActive: {
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(201,170,113,0.15)',
  },
  filterChipText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
  },

  /* Section */
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 18,
    textAlign: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* History modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0d0d0d',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  modalHeaderLeft: {
    flexDirection: 'column',
    gap: 8,
  },
  claimAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(201,170,113,0.12)',
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  claimAllText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  historyItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(201,170,113,0.1)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.sm,
  },
  claimBtnText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  modalTitle: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 2,
  },
  modalList: {
    padding: Spacing.md,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyHistoryText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(8,8,8,0.9)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
  },
  historyItemLeft: {
    flex: 1,
    gap: 2,
  },
  historyItemName: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 14,
  },
  historyItemDate: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyItemPrice: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 14,
  },
});
