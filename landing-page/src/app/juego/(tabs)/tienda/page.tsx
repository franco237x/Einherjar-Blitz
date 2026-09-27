'use client';

/**
 * Store page — header with sphere balance and purchase history, category
 * filter, product grid (available + sold-out) and purchase history modal.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '@/config/firebase';
import { Background } from '@/components/juego/Background';
import { EmptyState } from '@/components/juego/EmptyState';
import { Icon } from '@/components/juego/Icon';
import { Modal } from '@/components/juego/Modal';
import { ParticlesBackground } from '@/components/juego/ParticlesBackground';
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
      <Background>
        <ParticlesBackground />
        <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-3">
          <Spinner size={36} className="text-gold" />
          <p className="text-sm text-white/60">Cargando tienda...</p>
        </div>
      </Background>
    );
  }

  const categoryTab = (active: boolean) =>
    cn(
      'flex min-h-[68px] min-w-[84px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border px-3 transition',
      active ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/10 bg-black/40 text-white/50 hover:text-white/80'
    );

  const grid = (list: StoreProduct[]) => (
    <div className="grid grid-cols-2 gap-3 min-[700px]:grid-cols-3 min-[1000px]:grid-cols-4">
      {list.map((product) => (
        <StoreCard
          key={product.id}
          product={product}
          spheres={spheres}
          onBuy={handleBuy}
          buying={buyingId === product.id}
        />
      ))}
    </div>
  );

  return (
    <Background>
      <img
        src="/juego/loading_screen/manhattan.jpg"
        alt=""
        className="pointer-events-none fixed inset-0 h-full w-full object-cover blur-[4px]"
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.78)_0%,rgba(5,5,5,0.92)_50%,#050505_100%)]" />
      <ParticlesBackground />

      <main className="juego-fade-in relative z-10 mx-auto w-full max-w-[1040px] px-4 pb-28 pt-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon name="storefront-outline" size={22} color="#c9aa71" />
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-gold">MERCADO EINHERJAR</p>
              <h1 className="font-title text-2xl text-white/95">Tienda</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="flex min-h-10 items-center gap-1.5 rounded-full border border-gold/20 bg-ink/90 px-3"
              aria-label={`${spheres} esferas`}
            >
              <Icon name="planet" size={18} color="#7ed9e7" />
              <span className="text-sm font-bold text-white/95">{spheres.toLocaleString()}</span>
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 transition hover:text-white disabled:opacity-60"
              aria-label="Actualizar catálogo"
            >
              <Icon name="refresh" size={18} className={refreshing ? 'juego-spin' : undefined} />
            </button>
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 transition hover:bg-gold/20"
              aria-label={`Abrir historial, ${activePurchases.length} compras pendientes`}
            >
              <Icon name="receipt-outline" size={21} color="#c9aa71" />
              {activePurchases.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {Math.min(activePurchases.length, 99)}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="juego-scroll -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Categorías">
          <button type="button" className={categoryTab(!filter)} onClick={() => setFilter('')} aria-pressed={!filter}>
            <Icon name="grid-outline" size={20} />
            <span className="text-[10px] font-bold tracking-[0.12em]">TODOS</span>
          </button>
          {categories.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={categoryTab(filter === key)}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
            >
              <Icon name="pricetag-outline" size={20} />
              <span className="max-w-[110px] truncate text-[10px] font-bold tracking-[0.12em]">{label.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {available.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-gold">CATÁLOGO</p>
                <h2 className="font-title text-lg text-white/95">
                  {filter ? categories.find(([key]) => key === filter)?.[1] : 'Todos los artículos'}
                </h2>
              </div>
              <span className="text-xs text-white/50">{available.length} disponibles</span>
            </div>
            {grid(available)}
          </section>
        )}

        {soldOut.length > 0 && (
          <section className="mb-8">
            <h2 className="font-title text-lg text-white/95">Agotados</h2>
            <p className="mb-3 mt-0.5 text-xs text-white/50">Vuelve más tarde para su reposición</p>
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
        className="max-w-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gold/20 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-title text-lg tracking-wide text-gold">Historial de Compras</h2>
            {activePurchases.length > 0 && (
              <button
                type="button"
                onClick={handleClaimAll}
                disabled={claimingAll}
                className="flex min-h-8 items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 text-xs font-bold text-gold transition hover:bg-gold/20 disabled:opacity-60"
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
            className="rounded-lg p-1 text-white/90 hover:bg-white/10"
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
                        'flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold tracking-[0.1em] transition',
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
    </Background>
  );
}
