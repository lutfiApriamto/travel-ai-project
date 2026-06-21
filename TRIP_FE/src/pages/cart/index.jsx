import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Package, AlertTriangle,
  Minus, Plus, ChevronRight, Loader2, X,
} from 'lucide-react';
import { cn }              from '../../lib/utils.js';
import { ROUTES }          from '../../utils/consts/routes.js';
import { useDebounce }     from '../../hooks/useDebounce.js';
import { useCartStore }    from '../../stores/useCartStore.js';
import {
  useCartData, useUpdateCartItem,
  useRemoveCartItem, useClearCart,
} from './api/useCart.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : null;

const itemTotal = (item) => {
  const base   = item.product?.price ?? 0;
  const addOns = (item.addOns ?? []).reduce((s, a) => s + (a.price ?? 0), 0);
  return (base + addOns) * (item.participants ?? 1);
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ isFiltered }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <ShoppingCart className="w-12 h-12 text-muted-foreground/20 mb-4" />
    <p className="font-semibold text-foreground mb-1">
      {isFiltered ? 'Tidak ada item yang sesuai' : 'Keranjang masih kosong'}
    </p>
    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
      {isFiltered
        ? 'Coba hapus kata kunci pencarian.'
        : 'Temukan dan pesan paket perjalanan impianmu.'}
    </p>
    {!isFiltered && (
      <Link
        to={ROUTES.PRODUCTS}
        className="inline-flex items-center gap-2 h-10 px-6 rounded-full
          bg-travia-orange text-white text-sm font-semibold
          hover:bg-travia-orange/90 transition-colors"
      >
        <Package className="w-4 h-4" />
        Lihat Produk
      </Link>
    )}
  </div>
);

// ─── CartItem Row ─────────────────────────────────────────────────────────────

const CartItemRow = ({ item }) => {
  const [participants, setParticipants] = useState(item.participants ?? 1);
  const debouncedParticipants           = useDebounce(participants, 600);
  const updateItem                      = useUpdateCartItem();
  const removeItem                      = useRemoveCartItem();

  const product      = item.product ?? {};
  const remaining    = Math.max(0, (product.quota ?? 0) - (product.bookedSlots ?? 0));
  const isAvailable  = item.isAvailable;

  // Push debounced participant change to API
  useEffect(() => {
    if (debouncedParticipants !== item.participants) {
      updateItem.mutate({ productId: item.productId, participants: debouncedParticipants });
    }
  }, [debouncedParticipants]); // eslint-disable-line

  const handleRemove = () => removeItem.mutate(item.productId);

  const changeParticipants = (delta) => {
    setParticipants((p) => Math.max(1, Math.min(remaining, p + delta)));
  };

  const addOnPrice = (item.addOns ?? []).reduce((s, a) => s + (a.price ?? 0), 0);
  const total      = (product.price ?? 0) * participants + addOnPrice * participants;

  return (
    <div className={cn(
      'bg-card border rounded-2xl p-4 sm:p-5 transition-colors',
      !isAvailable ? 'border-red-300 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/10' : 'border-border',
    )}>
      <div className="flex gap-4">
        {/* Thumbnail */}
        <Link
          to={ROUTES.PRODUCT_DETAIL(product.slug)}
          className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted"
        >
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif italic text-3xl text-travia-orange/20">T</span>
            </div>
          )}
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to={ROUTES.PRODUCT_DETAIL(product.slug)}>
                <p className="font-semibold text-foreground text-sm sm:text-base
                  line-clamp-2 hover:text-travia-orange transition-colors leading-snug">
                  {product.name}
                </p>
              </Link>

              {/* Meta info */}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                {product.departureDate && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(product.departureDate)}
                  </span>
                )}
                {product.duration && (
                  <span className="text-xs text-muted-foreground">{product.duration}</span>
                )}
                {product.departureCity && (
                  <span className="text-xs text-muted-foreground">dari {product.departureCity}</span>
                )}
              </div>

              {/* Price per person */}
              <p className="text-sm font-medium text-travia-orange mt-1">
                {formatIDR(product.price)}<span className="text-muted-foreground font-normal"> / orang</span>
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={handleRemove}
              disabled={removeItem.isPending}
              title="Hapus dari keranjang"
              className="shrink-0 w-8 h-8 rounded-lg border border-border text-muted-foreground
                hover:bg-red-50 hover:text-red-500 hover:border-red-200
                dark:hover:bg-red-950/30 dark:hover:border-red-800/50
                flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {removeItem.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <X className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Add-ons */}
          {item.addOns?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.addOns.map((a) => (
                <span key={a.name}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-accent border border-border
                    text-muted-foreground">
                  {a.name} +{formatIDR(a.price)}
                </span>
              ))}
            </div>
          )}

          {/* Participants + Total */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            {/* Counter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeParticipants(-1)}
                disabled={participants <= 1 || !isAvailable}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center
                  text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-foreground">
                {participants}
              </span>
              <button
                onClick={() => changeParticipants(1)}
                disabled={participants >= remaining || !isAvailable}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center
                  text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-muted-foreground ml-0.5">orang</span>

              {/* Updating indicator */}
              {updateItem.isPending && (
                <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin ml-1" />
              )}
            </div>

            {/* Item total */}
            <p className="font-bold text-foreground text-sm sm:text-base">
              {formatIDR(total)}
            </p>
          </div>

          {/* Unavailability warning */}
          {!isAvailable && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Produk tidak tersedia atau slot tidak mencukupi — tidak dapat di-checkout
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Cart Summary ─────────────────────────────────────────────────────────────

const CartSummary = ({ items, onCheckout, isClearPending, onClear }) => {
  const navigate    = useNavigate();
  const availItems  = items.filter((i) => i.isAvailable);
  const grandTotal  = availItems.reduce((s, i) => s + itemTotal(i), 0);
  const hasUnavail  = items.length > availItems.length;
  const canCheckout = availItems.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 sticky top-24">
      <h3 className="font-semibold text-foreground">Ringkasan Pesanan</h3>

      {/* Per-item breakdown */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {availItems.map((item) => (
          <div key={item.productId} className="flex justify-between gap-2 text-sm">
            <span className="text-muted-foreground truncate">{item.product?.name}</span>
            <span className="font-medium text-foreground shrink-0">
              {formatIDR(itemTotal(item))}
            </span>
          </div>
        ))}
      </div>

      {/* Warning for unavailable */}
      {hasUnavail && (
        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400
          bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800/50">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {items.length - availItems.length} item tidak tersedia dan tidak termasuk dalam total.
          </span>
        </div>
      )}

      <div className="border-t border-border pt-4 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Total ({availItems.reduce((s, i) => s + (i.participants ?? 1), 0)} peserta)
        </span>
        <span className="font-bold text-foreground text-lg">{formatIDR(grandTotal)}</span>
      </div>

      <button
        onClick={() => navigate(ROUTES.CHECKOUT)}
        disabled={!canCheckout}
        className={cn(
          'w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2',
          'transition-colors',
          canCheckout
            ? 'bg-travia-orange text-white hover:bg-travia-orange/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed',
        )}
      >
        <ChevronRight className="w-4 h-4" />
        Lanjut ke Checkout
      </button>

      <button
        onClick={onClear}
        disabled={isClearPending || items.length === 0}
        className="w-full h-9 rounded-xl border border-border text-sm text-muted-foreground
          hover:bg-red-50 hover:text-red-500 hover:border-red-200
          dark:hover:bg-red-950/30 dark:hover:border-red-800/50
          flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
      >
        {isClearPending
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Trash2 className="w-4 h-4" />}
        Kosongkan Keranjang
      </button>
    </div>
  );
};

// ─── Mobile Summary Bar ───────────────────────────────────────────────────────

const MobileSummaryBar = ({ items }) => {
  const navigate   = useNavigate();
  const availItems = items.filter((i) => i.isAvailable);
  const grandTotal = availItems.reduce((s, i) => s + itemTotal(i), 0);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden
      bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div>
          <p className="text-[10px] text-muted-foreground">Total pembayaran</p>
          <p className="font-bold text-foreground text-base">{formatIDR(grandTotal)}</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.CHECKOUT)}
          disabled={availItems.length === 0}
          className="h-10 px-6 rounded-full bg-travia-orange text-white text-sm font-semibold
            hover:bg-travia-orange/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <ChevronRight className="w-4 h-4" />
          Checkout
        </button>
      </div>
    </div>
  );
};

// ─── CartPage ─────────────────────────────────────────────────────────────────

const CartPage = () => {
  const [searchParams] = useSearchParams();
  const search         = searchParams.get('search') || '';
  const clearCartMut   = useClearCart();

  const { data, isLoading } = useCartData({ search, limit: 50 });

  const items     = data?.items     ?? [];
  const totalData = data?.totalData ?? 0;

  // Sync Zustand cart count with actual data
  useEffect(() => {
    if (data?.items) {
      useCartStore.getState().setItemCount(data.items.length);
    }
  }, [data?.items?.length]); // eslint-disable-line

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
          Keranjang Saya
        </h1>
        {!isLoading && (
          <p className="text-sm text-muted-foreground mt-1">
            {totalData > 0
              ? `${totalData} item${search ? ` · hasil pencarian "${search}"` : ''}`
              : search
                ? `Tidak ada hasil untuk "${search}"`
                : 'Keranjang masih kosong'}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="hidden lg:block h-72 bg-muted rounded-2xl animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState isFiltered={!!search} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-6">

          {/* Items list */}
          <div className="space-y-4">
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </div>

          {/* Sidebar summary — desktop only */}
          <div className="hidden lg:block">
            <CartSummary
              items={items}
              isClearPending={clearCartMut.isPending}
              onClear={() => clearCartMut.mutate()}
            />
          </div>
        </div>
      )}

      {/* Mobile: sticky bottom summary bar */}
      <MobileSummaryBar items={items} />
    </div>
  );
};

export default CartPage;
