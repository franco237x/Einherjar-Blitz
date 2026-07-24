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

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAuth } from 'firebase/auth';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Background } from '@/components/Background';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { StoreCard } from '@/components/store/StoreCard';
import { EmptyState } from '@/components/EmptyState';
import { PurchaseModal, type PurchaseState } from '@/components/store/PurchaseModal';
import { Colors, Fonts, Layout, Spacing, Radius } from '@/constants/theme';
import type { StoreProduct, PurchaseRecord } from '@/constants/storeData';
import {
  fetchProducts,
  markPurchasesClaimed,
  purchaseProduct,
  streamPurchases,
} from '@/services/store';
import { claimPurchasePDF, claimAllPurchasesPDF } from '@/services/purchaseClaim';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useUserData } from '@/hooks/useUserData';

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const tablet = width >= 700;
  const desktop = width >= 1000;
  const [products, setProducts] = useState<StoreProduct[]>([]);
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
  const purchaseLockRef = useRef(false);

  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  // Real-time user data (spheres balance) via shared hook
  const { userData } = useUserData();
  const spheres = userData?.spheres || 0;

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

  const activePurchases = useMemo(
    () => purchases.filter((purchase) => purchase.status !== 'claimed'),
    [purchases]
  );

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
      if (purchaseLockRef.current) return;
      if (!uid) {
        setPurchaseInfo({ errorMessage: 'Debes iniciar sesión.' });
        setPurchaseState('error');
        return;
      }
      purchaseLockRef.current = true;
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
        purchaseLockRef.current = false;
        setBuyingId(null);
      }
    },
    [uid, loadProducts]
  );

  const closePurchaseModal = useCallback(() => {
    setPurchaseState(null);
    setPurchaseInfo({});
  }, []);

  // ─── Claim single purchase as PDF, save to device, then delete from Firestore ──
  const handleClaimOne = useCallback(async (purchase: PurchaseRecord) => {
    if (!uid) return;
    if (purchase.status === 'claimed') return;
    setClaimingId(purchase.id);
    try {
      const result = await claimPurchasePDF(purchase);
      if (!result.saved) {
        Alert.alert(
          'Impresión abierta',
          'En la web no podemos confirmar si guardaste el PDF. La compra seguirá disponible para reclamar.'
        );
        return;
      }
      await markPurchasesClaimed(uid, [purchase.id]);
      Alert.alert(
        '¡Certificado generado!',
        result.shared
          ? 'Tu certificado PDF está listo. Desde el menú de compartir puedes guardarlo en Descargas, Drive o donde prefieras.'
          : 'Tu certificado PDF se guardó en el almacenamiento de la app.'
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo generar el certificado.');
    } finally {
      setClaimingId(null);
    }
  }, [uid]);

  // ─── Claim all purchases as PDF, save to device, then delete all from Firestore ─
  const handleClaimAll = useCallback(async () => {
    if (!uid || activePurchases.length === 0) return;
    setClaimingAll(true);
    try {
      const result = await claimAllPurchasesPDF(activePurchases);
      if (!result.saved) {
        Alert.alert(
          'Impresión abierta',
          'En la web no podemos confirmar si guardaste el PDF. Las compras seguirán disponibles para reclamar.'
        );
        return;
      }
      await markPurchasesClaimed(
        uid,
        activePurchases.map((purchase) => purchase.id)
      );
      Alert.alert(
        '¡Certificado generado!',
        result.shared
          ? `Certificado de ${activePurchases.length} compras listo. Desde el menú de compartir puedes guardarlo en Descargas o Drive.`
          : `Certificado de ${activePurchases.length} compras guardado en el almacenamiento de la app.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo generar el certificado.');
    } finally {
      setClaimingAll(false);
    }
  }, [uid, activePurchases]);

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
      <Image
        source={require('../../../assets/images/loading_screen/manhattan.jpg')}
        style={styles.sceneBackground}
        contentFit="cover"
        contentPosition="center"
        blurRadius={4}
      />
      <LinearGradient
        colors={['rgba(5,5,5,0.78)', 'rgba(5,5,5,0.92)', '#050505']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ParticlesBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          compact && styles.scrollContentCompact,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + 88,
          }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryGold} />}
      >
        <View style={styles.storeTopBar}>
          <View style={styles.storeTitleRow}>
            <Ionicons name="storefront-outline" size={22} color={Colors.primaryGold} />
            <View>
              <Text style={styles.storeEyebrow}>MERCADO EINHERJAR</Text>
              <Text style={styles.storeTitle}>Tienda</Text>
            </View>
          </View>

          <View style={styles.storeTools}>
            <View style={styles.balancePill} accessibilityLabel={`${spheres} esferas`}>
              <Ionicons name="planet" size={18} color="#7ed9e7" />
              <Text style={styles.balanceValue}>{spheres.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => setShowHistory(true)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir historial, ${activePurchases.length} compras pendientes`}
            >
              <Ionicons name="receipt-outline" size={21} color={Colors.primaryGold} />
              {activePurchases.length > 0 ? (
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>
                    {Math.min(activePurchases.length, 99)}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.categoryRail, compact && styles.categoryRailCompact]}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[styles.categoryTab, !filter && styles.categoryTabActive]}
            onPress={() => setFilter('')}
            accessibilityRole="button"
            accessibilityState={{ selected: !filter }}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={!filter ? Colors.primaryGold : Colors.textMuted}
            />
            <Text style={[styles.categoryText, !filter && styles.categoryTextActive]}>
              TODOS
            </Text>
          </TouchableOpacity>
          {categories.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.categoryTab, filter === key && styles.categoryTabActive]}
              onPress={() => setFilter(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === key }}
            >
              <Ionicons
                name="pricetag-outline"
                size={20}
                color={filter === key ? Colors.primaryGold : Colors.textMuted}
              />
              <Text
                style={[styles.categoryText, filter === key && styles.categoryTextActive]}
                numberOfLines={1}
              >
                {label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ═══ Available section ═══ */}
        {available.length > 0 && (
          <View style={styles.section}>
            <View style={styles.catalogHeading}>
              <View>
                <Text style={styles.sectionEyebrow}>CATÁLOGO</Text>
                <Text style={styles.sectionTitle}>
                  {filter ? categories.find(([key]) => key === filter)?.[1] : 'Todos los artículos'}
                </Text>
              </View>
              <Text style={styles.catalogCount}>{available.length} disponibles</Text>
            </View>
            <View style={styles.grid}>
              {available.map((product) => (
                <StoreCard
                  key={product.id}
                  product={product}
                  spheres={spheres}
                  onBuy={handleBuy}
                  buying={buyingId === product.id}
                  imageHeight={desktop ? 150 : tablet ? 160 : compact ? 128 : 150}
                  style={[
                    styles.productCard,
                    tablet && styles.productCardTablet,
                    desktop && styles.productCardDesktop,
                  ]}
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
                  imageHeight={desktop ? 150 : tablet ? 160 : compact ? 128 : 150}
                  style={[
                    styles.productCard,
                    tablet && styles.productCardTablet,
                    desktop && styles.productCardDesktop,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* ═══ Empty state ═══ */}
        {products.length === 0 && (
          <EmptyState
            icon="storefront"
            title="La tienda está en mantenimiento"
            description="Pronto llegarán nuevos artículos. Mientras tanto, sigue acumulando Esferas."
          />
        )}

        <View style={{ height: 40 }} />
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
      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Historial de Compras</Text>
                {activePurchases.length > 0 && (
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
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Cerrar historial"
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={purchases}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              ListEmptyComponent={
                <EmptyState
                  icon="receipt-outline"
                  title="Aún no has comprado nada."
                  compact
                />
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
                        disabled={claimingId === item.id || item.status === 'claimed'}
                        activeOpacity={0.7}
                      >
                        {item.status === 'claimed' ? (
                          <>
                            <Ionicons name="checkmark-circle" size={12} color={Colors.textMuted} />
                            <Text style={styles.claimBtnText}>RECLAMADA</Text>
                          </>
                        ) : claimingId === item.id ? (
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
  scrollContent: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
  },
  scrollContentCompact: {
    paddingHorizontal: Spacing.md,
  },
  sceneBackground: {
    ...StyleSheet.absoluteFill,
    opacity: 0.16,
  },

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

  /* Game-client header */
  storeTopBar: {
    minHeight: 64,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,170,113,0.18)',
  },
  storeTitleRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  storeEyebrow: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  storeTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 21,
    letterSpacing: 0.8,
  },
  storeTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balancePill: {
    minHeight: 42,
    minWidth: 86,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(126,217,231,0.24)',
    backgroundColor: 'rgba(5,5,5,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  balanceValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  historyBtn: {
    width: 44,
    height: 44,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGold,
    backgroundColor: 'rgba(5,5,5,0.72)',
  },
  historyBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    paddingHorizontal: 4,
    backgroundColor: Colors.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadgeText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
  },
  categoryRail: {
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  categoryRailCompact: {
    marginHorizontal: -Spacing.md,
  },
  categoryContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  categoryTab: {
    width: 88,
    minHeight: 64,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  categoryTabActive: {
    borderBottomColor: Colors.primaryGold,
    backgroundColor: 'rgba(201,170,113,0.06)',
  },
  categoryText: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  categoryTextActive: {
    color: Colors.primaryGold,
  },

  /* Section */
  section: {
    paddingTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionEyebrow: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  catalogHeading: {
    minHeight: 50,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  catalogCount: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 11,
    marginBottom: 4,
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
  productCard: {
    width: '48.5%',
  },
  productCardTablet: {
    width: '31.8%',
  },
  productCardDesktop: {
    width: '23.5%',
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
    maxWidth: 720,
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
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimAllBtn: {
    minHeight: 40,
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
    minHeight: 40,
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
