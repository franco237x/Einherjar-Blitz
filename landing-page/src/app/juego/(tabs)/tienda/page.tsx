'use client';

/**
 * Store page — header with sphere balance and purchase history, category
 * filter, product grid (available + sold-out) and purchase history modal.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { auth } from '@/config/firebase';
import { EmptyState } from '@/components/juego/EmptyState';
import { Icon } from '@/components/juego/Icon';
import { Modal } from '@/components/juego/Modal';
import { LobbyPageHeader } from '@/components/juego/LobbyPageHeader';
import { Spinner } from '@/components/juego/Spinner';
import { PurchaseModal, type PurchaseState } from '@/components/juego/store/PurchaseModal';
import { StoreCard } from '@/components/juego/store/StoreCard';
import type { PurchaseRecord, StoreProduct } from '@/constants/storeData';
import { fetchProducts, markPurchasesClaimed, purchaseProduct, streamPurchases } from '@/services/store';
import { printAllPurchasesCertificate, printPurchaseCertificate } from '@/services/purchaseClaim';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useUserData } from '@/hooks/useUserData';
import { useDialog } from '@/providers/DialogProvider';
import { cn } from '@/lib/utils';

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

  if (loading) {
    return (
      <div className="relative z-10 flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-3">
        <Spinner size={36} className="text-gold" />
        <p className="text-sm text-white/60">Cargando tienda...</p>
      </div>
    );
  }

  const categoryTab = (active: boolean) =>
    cn(
      'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-bold tracking-[0.08em] transition active:scale-95',
      active
        ? 'border-gold/60 bg-gold text-[#0b0a09]'
        : 'border-white/10 bg-white/[0.03] text-white/60'
    );

  const grid = (list: StoreProduct[]) => (
    <div className="grid grid-cols-2 gap-3">
      {list.map((product) => (
        <StoreCard
          key={product.id}
          featured={list.length === 1}
          product={product}
          spheres={spheres}
          onBuy={handleBuy}
          buying={buyingId === product.id}
        />
      ))}
    </div>
  );

  return (
    <>
      <img
        src="/juego/loading_screen/manhattan.jpg"
        alt=""
        className="pointer-events-none fixed inset-x-0 top-0 h-[50vh] w-full object-cover opacity-20 blur-[3px] [mask-image:linear-gradient(180deg,#000_0%,transparent_100%)]"
      />

      <main className="relative z-10 mx-auto w-full max-w-[520px] px-4 pb-32 pt-5">
        <LobbyPageHeader
          eyebrow="Mercado Einherjar"
          title="Tienda"
          subtitle="Canjea tus esferas. Cada compra genera un certificado para reclamarla."
          action={
            <>
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition active:scale-95 disabled:opacity-60"
                aria-label="Actualizar catálogo"
              >
                <Icon name="refresh" size={17} className={refreshing ? 'juego-spin' : undefined} />
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-gold transition active:scale-95"
                aria-label={`Abrir historial, ${activePurchases.length} compras pendientes`}
              >
                <Icon name="receipt" size={18} />
                {activePurchases.length > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0b0a09] bg-red-500 px-1 text-[10px] font-bold text-white">
                    {Math.min(activePurchases.length, 99)}
                  </span>
                ) : null}
              </button>
            </>
          }
        />

        {categories.length > 1 ? (
        <div className="juego-rise -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Categorías" style={{ '--i': 1 } as CSSProperties}>
          <button type="button" className={categoryTab(!filter)} onClick={() => setFilter('')} aria-pressed={!filter}>
            <Icon name="grid" size={15} />
            Todos
          </button>
          {categories.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={categoryTab(filter === key)}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
            >
              <Icon name="pricetag" size={15} />
              <span className="max-w-[140px] truncate">{label}</span>
            </button>
          ))}
        </div>
        ) : null}

        {available.length > 0 && (
          <section className="juego-rise mb-10" style={{ '--i': 2 } as CSSProperties}>
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="font-title text-xl text-white/95">
                {filter
                  ? categories.find(([key]) => key === filter)?.[1]
                  : available.length === 1
                    ? 'Disponible ahora'
                    : 'Todos los artículos'}
              </h2>
              <span className="shrink-0 rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-white/55">
                {available.length} disponibles
              </span>
            </div>
            {grid(available)}
          </section>
        )}

        {soldOut.length > 0 && (
          <section className="juego-rise mb-8" style={{ '--i': 3 } as CSSProperties}>
            <h2 className="font-title text-xl text-white/70">Agotados</h2>
            <p className="mb-4 mt-1 text-xs text-white/45">Vuelve más tarde para su reposición</p>
            {grid(soldOut)}
          </section>
        )}

        {products.length === 0 && (
          <EmptyState
            icon="storefront"
            title="La tienda está en mantenimiento"
            description="Pronto llegarán nuevos artículos. Mientras tanto, sigue acumulando Esferas."
          />
        )}
      </main>

      <PurchaseModal
        state={purchaseState}
        productName={purchaseInfo.productName}
        productImage={purchaseInfo.productImage}
        price={purchaseInfo.price}
        errorMessage={purchaseInfo.errorMessage}
        onClose={() => {
          setPurchaseState(null);
          setPurchaseInfo({});
        }}
      />

      <Modal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        label="Historial de compras"
        variant="sheet"
        className="sm:max-w-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gold/20 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-title text-lg tracking-wide text-gold">Historial de Compras</h2>
            {activePurchases.length > 0 && (
              <button
                type="button"
                onClick={handleClaimAll}
                disabled={claimingAll}
                className="flex min-h-10 items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 text-xs font-bold text-gold transition active:scale-95 disabled:opacity-60"
              >
                {claimingAll ? (
                  <Spinner size={14} />
                ) : (
                  <>
                    <Icon name="document-text" size={14} />
                    Reclamar Todo
                  </>
                )}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/90 active:bg-white/10"
            aria-label="Cerrar historial"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        <div className="juego-scroll flex-1 overflow-y-auto p-5">
          {purchases.length === 0 ? (
            <EmptyState icon="receipt-outline" title="Aún no has comprado nada." compact />
          ) : (
            <ul className="flex flex-col gap-2">
              {purchases.map((item) => (
                <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm font-bold text-white/95">{item.productName}</p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {item.purchasedAt
                      ? item.purchasedAt.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-bold text-gold">
                      <Icon name="planet" size={12} />
                      {item.price.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleClaimOne(item)}
                      disabled={claimingId === item.id || item.status === 'claimed'}
                      className={cn(
                        'flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[11px] font-bold tracking-[0.1em] transition active:scale-95',
                        item.status === 'claimed'
                          ? 'border-white/10 text-white/50'
                          : 'border-gold/40 text-gold hover:bg-gold/10'
                      )}
                    >
                      {item.status === 'claimed' ? (
                        <>
                          <Icon name="checkmark-circle" size={12} />
                          RECLAMADA
                        </>
                      ) : claimingId === item.id ? (
                        <Spinner size={12} />
                      ) : (
                        <>
                          <Icon name="download" size={12} />
                          RECLAMAR
                        </>
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
