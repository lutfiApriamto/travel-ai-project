import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link }            from 'react-router-dom';
import {
  ShoppingCart, Check, AlertTriangle, ChevronRight,
  Loader2, MapPin, Calendar, Users, X,
  User, Mail, Package,
} from 'lucide-react';
import { cn }              from '../../lib/utils.js';
import { ROUTES }          from '../../utils/consts/routes.js';
import { useAuthStore }    from '../../stores/useAuthStore.js';
import { useCartData }     from '../cart/api/useCart.js';
import { useCheckout }     from './api/useCheckout.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

const calcItemTotal = (item) => {
  const base   = item.product?.price ?? 0;
  const addOns = (item.addOns ?? []).reduce((s, a) => s + (a.price ?? 0), 0);
  return (base + addOns) * (item.participants ?? 1);
};

// ─── Konfirmasi Modal ─────────────────────────────────────────────────────────

const ConfirmModal = ({ isOpen, onClose, onConfirm, itemCount, grandTotal, isPending }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-card rounded-2xl shadow-2xl
        border border-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Konfirmasi Pesanan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {itemCount} item · Total {formatIDR(grandTotal)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg
              text-muted-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Dengan menekan <strong className="text-foreground">Buat Pesanan</strong>,
            kamu menyetujui untuk membuat {itemCount > 1 ? `${itemCount} pesanan` : 'pesanan'} dengan
            total pembayaran sebesar <strong className="text-travia-orange">{formatIDR(grandTotal)}</strong>.
          </p>
          <p className="text-xs text-muted-foreground">
            Setelah pesanan dibuat, kamu akan diarahkan ke halaman pembayaran.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
              text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-travia-orange text-white text-sm font-semibold
              hover:bg-travia-orange/90 transition-colors flex items-center justify-center gap-2
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
              : 'Buat Pesanan'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Item Card ─────────────────────────────────────────────────────────────────

const CheckoutItem = ({ item, selected, onToggle, disabled }) => {
  const product  = item.product ?? {};
  const total    = calcItemTotal(item);
  const isAvail  = item.isAvailable;

  return (
    <div
      className={cn(
        'bg-card border rounded-2xl p-4 transition-all duration-200',
        !isAvail
          ? 'border-red-300 dark:border-red-800/50 opacity-60'
          : selected
            ? 'border-travia-orange/50 bg-travia-orange/5'
            : 'border-border hover:border-border/80',
      )}
    >
      <div className="flex gap-4">
        {/* Checkbox */}
        <div className="shrink-0 pt-1">
          <button
            onClick={() => isAvail && onToggle(item.productId.toString())}
            disabled={!isAvail || disabled}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
              !isAvail
                ? 'border-muted-foreground/30 cursor-not-allowed'
                : selected
                  ? 'bg-travia-orange border-travia-orange'
                  : 'border-border hover:border-travia-orange',
            )}
          >
            {selected && isAvail && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </button>
        </div>

        {/* Thumbnail */}
        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif italic text-3xl text-travia-orange/20">T</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
            {product.name ?? '—'}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {product.departureDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(product.departureDate)}
              </span>
            )}
            {product.departureCity && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {product.departureCity}
              </span>
            )}
          </div>

          {/* Participants + addons */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {item.participants} peserta
            </span>
            {item.addOns?.length > 0 && (
              <span className="text-xs text-muted-foreground">
                + {item.addOns.map((a) => a.name).join(', ')}
              </span>
            )}
          </div>

          {/* Note */}
          {item.note && (
            <p className="text-[11px] text-muted-foreground italic mt-1 line-clamp-1">
              "{item.note}"
            </p>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {formatIDR(product.price)} × {item.participants} orang
              {item.addOns?.length > 0 && ' + add-on'}
            </p>
            <p className="font-bold text-travia-orange text-sm">{formatIDR(total)}</p>
          </div>

          {/* Unavail warning */}
          {!isAvail && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Tidak tersedia — tidak dapat di-checkout
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Order Summary ────────────────────────────────────────────────────────────

const OrderSummary = ({ selectedItems, onCheckout, isPending }) => {
  const grandTotal  = selectedItems.reduce((s, i) => s + calcItemTotal(i), 0);
  const canCheckout = selectedItems.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 sticky top-24">
      <h3 className="font-semibold text-foreground">Ringkasan Pesanan</h3>

      {/* Per-item breakdown */}
      {selectedItems.length > 0 ? (
        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {selectedItems.map((item) => (
            <div key={item.productId} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-travia-orange shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-medium truncate">
                  {item.product?.name ?? '—'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.participants} orang
                </p>
              </div>
              <p className="text-xs font-semibold text-foreground shrink-0">
                {formatIDR(calcItemTotal(item))}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3">
          Belum ada item dipilih
        </p>
      )}

      {/* Total */}
      <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-muted-foreground">
            {selectedItems.length} item dipilih
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">Total Pembayaran</span>
          <span className="font-bold text-travia-orange text-xl">{formatIDR(grandTotal)}</span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onCheckout}
        disabled={!canCheckout || isPending}
        className={cn(
          'w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2',
          'transition-colors',
          canCheckout
            ? 'bg-travia-orange text-white hover:bg-travia-orange/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed',
        )}
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
        ) : (
          <><ChevronRight className="w-4 h-4" /> Buat Pesanan</>
        )}
      </button>

      <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
        Kamu akan diarahkan ke halaman pembayaran setelah pesanan dibuat.
      </p>
    </div>
  );
};

// ─── Mobile Sticky Bar ────────────────────────────────────────────────────────

const MobileStickyBar = ({ selectedItems, onCheckout, isPending }) => {
  const grandTotal = selectedItems.reduce((s, i) => s + calcItemTotal(i), 0);

  if (selectedItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden
      bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div>
          <p className="text-[10px] text-muted-foreground">
            {selectedItems.length} item · Total
          </p>
          <p className="font-bold text-foreground text-base">{formatIDR(grandTotal)}</p>
        </div>
        <button
          onClick={onCheckout}
          disabled={isPending}
          className="h-10 px-6 rounded-full bg-travia-orange text-white text-sm font-semibold
            hover:bg-travia-orange/90 disabled:opacity-60 transition-colors
            flex items-center gap-2 shrink-0"
        >
          {isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ChevronRight className="w-4 h-4" />}
          Buat Pesanan
        </button>
      </div>
    </div>
  );
};

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const navigate        = useNavigate();
  const { user }        = useAuthStore();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showConfirm,  setShowConfirm]  = useState(false);

  const checkoutMut = useCheckout();

  // Ambil data cart (tanpa search / pagination — ambil semua)
  const { data, isLoading } = useCartData({ limit: 50 });
  const items = data?.items ?? [];

  const availItems   = items.filter((i) => i.isAvailable);
  const unavailItems = items.filter((i) => !i.isAvailable);

  // Redirect ke cart jika data sudah load tapi cart kosong
  useEffect(() => {
    if (!isLoading && items.length === 0) {
      navigate(ROUTES.CART, { replace: true });
    }
  }, [isLoading, items.length, navigate]);

  // Init selectedIds → semua item yang tersedia
  useEffect(() => {
    if (availItems.length > 0) {
      setSelectedIds(new Set(availItems.map((i) => i.productId.toString())));
    }
  }, [availItems.length]); // eslint-disable-line

  const toggleItem = (productId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === availItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availItems.map((i) => i.productId.toString())));
    }
  };

  const selectedItems = useMemo(
    () => availItems.filter((i) => selectedIds.has(i.productId.toString())),
    [availItems, selectedIds],
  );

  const grandTotal = selectedItems.reduce((s, i) => s + calcItemTotal(i), 0);

  const handleConfirm = () => {
    const productIds = [...selectedIds];
    checkoutMut.mutate(productIds, {
      onSuccess: (orders) => {
        setShowConfirm(false);
        if (orders.length === 0) return;

        if (orders.length === 1) {
          navigate(ROUTES.PAYMENT(orders[0]._id));
        } else {
          // Multiple orders — arahkan ke payment pertama
          import('react-hot-toast').then(({ default: toast }) =>
            toast.success(
              `${orders.length} pesanan berhasil dibuat! Lanjutkan pembayaran pertama.`,
              { duration: 4000 }
            )
          );
          navigate(ROUTES.PAYMENT(orders[0]._id));
        }
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-2xl" />
            ))}
          </div>
          <div className="h-72 bg-muted rounded-2xl hidden lg:block" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
          <Link to={ROUTES.HOME}     className="hover:text-foreground transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={ROUTES.CART}     className="hover:text-foreground transition-colors">Keranjang</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Checkout</span>
        </nav>

        <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground mb-6">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6">

          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="space-y-5 min-w-0">

            {/* Pemesan info */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-foreground mb-3 text-sm">Informasi Pemesan</h2>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-travia-orange/10 text-travia-orange
                    flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Nama</p>
                    <p className="text-sm font-medium text-foreground">{user?.name ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-travia-orange/10 text-travia-orange
                    flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-foreground">{user?.email ?? '—'}</p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Tiket dan konfirmasi pesanan akan dikirim ke email ini.
              </p>
            </div>

            {/* Pilih item */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground text-sm">
                  Pilih Item untuk Checkout
                </h2>
                {availItems.length > 1 && (
                  <button
                    onClick={toggleAll}
                    className="text-xs text-travia-orange hover:underline"
                  >
                    {selectedIds.size === availItems.length ? 'Batalkan semua' : 'Pilih semua'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {availItems.map((item) => (
                  <CheckoutItem
                    key={item.productId}
                    item={item}
                    selected={selectedIds.has(item.productId.toString())}
                    onToggle={toggleItem}
                    disabled={checkoutMut.isPending}
                  />
                ))}
              </div>
            </div>

            {/* Unavailable items */}
            {unavailItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h2 className="font-semibold text-sm text-muted-foreground">
                    Tidak Tersedia ({unavailItems.length} item)
                  </h2>
                </div>
                <div className="space-y-3">
                  {unavailItems.map((item) => (
                    <CheckoutItem
                      key={item.productId}
                      item={item}
                      selected={false}
                      onToggle={() => {}}
                      disabled
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Item di atas tidak bisa di-checkout karena produk tidak aktif atau slot tidak mencukupi.
                  <Link to={ROUTES.CART} className="text-travia-orange hover:underline ml-1">
                    Hapus dari keranjang
                  </Link>
                </p>
              </div>
            )}

            {/* Note about multiple orders */}
            {selectedItems.length > 1 && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50
                dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs
                text-blue-700 dark:text-blue-300">
                <Package className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Memilih <strong>{selectedItems.length} item</strong> akan membuat {selectedItems.length} pesanan terpisah.
                  Setiap pesanan dibayar secara individual melalui halaman pembayaran.
                </span>
              </div>
            )}
          </div>

          {/* ── Right: Order Summary (desktop) ─────────────────────────────── */}
          <div className="hidden lg:block">
            <OrderSummary
              selectedItems={selectedItems}
              onCheckout={() => selectedItems.length > 0 && setShowConfirm(true)}
              isPending={checkoutMut.isPending}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <MobileStickyBar
        selectedItems={selectedItems}
        onCheckout={() => setShowConfirm(true)}
        isPending={checkoutMut.isPending}
      />

      {/* Konfirmasi modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => !checkoutMut.isPending && setShowConfirm(false)}
        onConfirm={handleConfirm}
        itemCount={selectedItems.length}
        grandTotal={grandTotal}
        isPending={checkoutMut.isPending}
      />
    </>
  );
};

export default CheckoutPage;
