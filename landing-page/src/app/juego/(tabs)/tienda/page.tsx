'use client';

/**
 * Store page — data and handlers: loads the catalog, streams the purchase
 * history, buys and claims. The visuals live in components/juego/store
 * (StoreCatalog, StoreHeaderActions, PurchaseModal, PurchaseHistorySheet).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '@/config/firebase';
import { LobbyPageHeader } from '@/components/juego/LobbyPageHeader';
import { PurchaseHistorySheet } from '@/components/juego/store/PurchaseHistorySheet';
import { PurchaseModal, type PurchaseState } from '@/components/juego/store/PurchaseModal';
import { StoreBackdrop } from '@/components/juego/store/StoreBackdrop';
import { StoreCatalog } from '@/components/juego/store/StoreCatalog';
import { StoreHeaderActions } from '@/components/juego/store/StoreHeaderActions';
import type { PurchaseRecord, StoreProduct } from '@/constants/storeData';
import { fetchProducts, markPurchasesClaimed, purchaseProduct, streamPurchases } from '@/services/store';
import { printAllPurchasesCertificate, printPurchaseCertificate } from '@/services/purchaseClaim';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useUserData } from '@/hooks/useUserData';
import { useDialog } from '@/providers/DialogProvider';

export default function StorePage() {
  const dialog = useDialog();
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
  const [filter, setFilter] = useState(''); // '' = all
  const [showHistory, setShowHistory] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);
  // Bumped when a successful purchase sheet closes, so the history button can show where it went.
  const [landedKey, setLandedKey] = useState(0);
  const purchaseLockRef = useRef(false);

  const uid = auth.currentUser?.uid;

  // Real-time user data (spheres balance) via shared provider
  const { userData } = useUserData();
  const spheres = userData?.spheres || 0;

  // Bumping reloadKey (or a global refresh tick) refetches the catalog.
  const { refreshTick } = useSyncStatus();
  const [reloadKey, setReloadKey] = useState(0);
  const loadProducts = useCallback(() => setReloadKey((key) => key + 1), []);

  // ─── Load products ──────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((err) => console.error('Failed to load products:', err))
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey, refreshTick]);

  // ─── Real-time purchase history ─────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    return streamPurchases(uid, setPurchases, (err) => console.error('Purchase stream error:', err));
  }, [uid]);

  const activePurchases = useMemo(
    () => purchases.filter((purchase) => purchase.status !== 'claimed'),
    [purchases]
  );

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
        setPurchaseInfo({ productName: result.productName, productImage: product.imageUrl, price: result.price });
        setPurchaseState('success');
        loadProducts(); // refresh stock
      } catch (err: unknown) {
        setPurchaseInfo({ errorMessage: (err as Error)?.message || 'No se pudo completar la compra.' });
        setPurchaseState('error');
      } finally {
        purchaseLockRef.current = false;
        setBuyingId(null);
      }
    },
    [uid, loadProducts]
  );

  // Browsers don't report whether the printed PDF was saved, so we ask
  // before marking the purchases as claimed.
  const confirmSaved = (plural: boolean) =>
    dialog.confirm(
      '¿Guardaste el certificado?',
      `Confirma solo si guardaste el PDF. Si cancelaste la impresión, ${
        plural ? 'las compras seguirán disponibles' : 'la compra seguirá disponible'
      } para reclamar.`,
      { confirmText: 'Sí, lo guardé', cancelText: 'No' }
    );

  const handleClaimOne = async (purchase: PurchaseRecord) => {
    if (!uid || purchase.status === 'claimed') return;
    setClaimingId(purchase.id);
    try {
      await printPurchaseCertificate(purchase);
      if (!(await confirmSaved(false))) return;
      await markPurchasesClaimed(uid, [purchase.id]);
      void dialog.alert('¡Certificado generado!', 'La compra quedó marcada como reclamada.');
    } catch (err: unknown) {
      void dialog.alert('Error', (err as Error)?.message || 'No se pudo generar el certificado.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimAll = async () => {
    if (!uid || activePurchases.length === 0) return;
    setClaimingAll(true);
    try {
      await printAllPurchasesCertificate(activePurchases);
      if (!(await confirmSaved(true))) return;
      await markPurchasesClaimed(uid, activePurchases.map((purchase) => purchase.id));
      void dialog.alert(
        '¡Certificado generado!',
        `Certificado de ${activePurchases.length} compras listo. Quedaron marcadas como reclamadas.`
      );
    } catch (err: unknown) {
      void dialog.alert('Error', (err as Error)?.message || 'No se pudo generar el certificado.');
    } finally {
      setClaimingAll(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  return (
    <>
      <StoreBackdrop />

      <main className="relative z-10 mx-auto w-full max-w-[520px] px-4 pb-32 pt-5">
        <LobbyPageHeader
          eyebrow="Mercado Einherjar"
          title="Tienda"
          subtitle="Canjea tus esferas. Cada compra genera un certificado para reclamarla."
          action={
            <StoreHeaderActions
              refreshing={refreshing}
              refreshDisabled={loading}
              onRefresh={onRefresh}
              pendingCount={activePurchases.length}
              onOpenHistory={() => setShowHistory(true)}
              bumpKey={landedKey}
            />
          }
        />

        <StoreCatalog
          products={products}
          spheres={spheres}
          loading={loading}
          buyingId={buyingId}
          onBuy={handleBuy}
          filter={filter}
          onFilterChange={setFilter}
        />
      </main>

      <PurchaseModal
        state={purchaseState}
        productName={purchaseInfo.productName}
        productImage={purchaseInfo.productImage}
        price={purchaseInfo.price}
        errorMessage={purchaseInfo.errorMessage}
        onClose={() => {
          if (purchaseState === 'success') setLandedKey((key) => key + 1);
          setPurchaseState(null);
          setPurchaseInfo({});
        }}
      />

      <PurchaseHistorySheet
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        purchases={purchases}
        pendingCount={activePurchases.length}
        claimingId={claimingId}
        claimingAll={claimingAll}
        onClaimOne={handleClaimOne}
        onClaimAll={handleClaimAll}
      />
    </>
  );
}
