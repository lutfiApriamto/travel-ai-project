import { useState, useEffect, useCallback }   from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clock, CheckCircle2, XCircle, RotateCcw,
  Package, Search, X, ChevronRight, CreditCard,
  Calendar, Users, Loader2, AlertTriangle,
  MapPin, Banknote,
} from 'lucide-react';
import { cn }            from '../../lib/utils.js';
import { ROUTES }        from '../../utils/consts/routes.js';
import { useDebounce }   from '../../hooks/useDebounce.js';
import { useOrders, useCancelOrder } from './api/useOrders.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : null;

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : null;

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  pending_payment: {
    label:   'Menunggu Pembayaran',
    short:   'Menunggu Bayar',
    cls:     'text-amber-600  bg-amber-50  dark:bg-amber-950/30  dark:text-amber-400  border-amber-200  dark:border-amber-800/50',
    Icon:    Clock,
  },
  paid: {
    label:   'Lunas',
    short:   'Lunas',
    cls:     'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    Icon:    CheckCircle2,
  },
  cancelled: {
    label:   'Dibatalkan',
    short:   'Dibatalkan',
    cls:     'text-red-600    bg-red-50    dark:bg-red-950/30    dark:text-red-400    border-red-200    dark:border-red-800/50',
    Icon:    XCircle,
  },
  refunded: {
    label:   'Direfund',
    short:   'Direfund',
    cls:     'text-blue-600   bg-blue-50   dark:bg-blue-950/30   dark:text-blue-400   border-blue-200   dark:border-blue-800/50',
    Icon:    RotateCcw,
  },
};

const PAY_METHOD = {
  credit_card:   'Kartu Kredit',
  bank_transfer: 'Transfer Bank',
  gopay:         'GoPay',
  shopeepay:     'ShopeePay',
  qris:          'QRIS',
};

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: '',                label: 'Semua'           },
  { key: 'pending_payment', label: 'Menunggu Bayar'  },
  { key: 'paid',            label: 'Lunas'           },
  { key: 'cancelled',       label: 'Dibatalkan'      },
  { key: 'refunded',        label: 'Direfund'        },
];

// ─── Cancel Confirmation Dialog ───────────────────────────────────────────────

const CancelDialog = ({ order, onConfirm, onClose, isPending }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl
        shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        <div className="p-5">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40
            flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>

          <h3 className="font-semibold text-foreground text-center mb-1">
            Batalkan Pesanan?
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-1">
            {order.productSnapshot?.name}
          </p>
          <p className="text-center font-bold text-foreground mb-4">
            {formatIDR(order.totalPrice)}
          </p>
          <p className="text-xs text-muted-foreground text-center mb-5">
            Pesanan yang sudah dibatalkan tidak dapat dipulihkan.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              Kembali
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white
                text-sm font-semibold transition-colors flex items-center justify-center gap-2
                disabled:opacity-60"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Membatalkan...</>
                : 'Ya, Batalkan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Order Card ───────────────────────────────────────────────────────────────

const OrderCard = ({ order, onCancelClick }) => {
  const navigate  = useNavigate();
  const cfg       = STATUS[order.status] ?? STATUS.pending_payment;
  const snap      = order.productSnapshot ?? {};
  const StatusIcon = cfg.Icon;

  const isPending   = order.status === 'pending_payment';
  const isPaid      = order.status === 'paid';

  return (
    <div className={cn(
      'bg-card border rounded-2xl overflow-hidden transition-shadow hover:shadow-md',
      isPending ? 'border-amber-200 dark:border-amber-800/50' : 'border-border',
    )}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3
        border-b border-border bg-background">
        {/* Order code + date */}
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-mono text-sm font-bold text-foreground shrink-0">
            #{order.orderCode}
          </p>
          <span className="text-border hidden sm:inline">·</span>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {formatDateTime(order.createdAt)}
          </p>
        </div>

        {/* Status badge */}
        <span className={cn(
          'flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0',
          cfg.cls,
        )}>
          <StatusIcon className="w-3 h-3 shrink-0" />
          <span className="hidden sm:inline">{cfg.label}</span>
          <span className="sm:hidden">{cfg.short}</span>
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex gap-4">
        {/* Thumbnail */}
        <Link
          to={ROUTES.ORDER_DETAIL(order._id)}
          className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted"
        >
          {snap.thumbnail ? (
            <img
              src={snap.thumbnail}
              alt={snap.name}
              loading="lazy"
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
          <Link to={ROUTES.ORDER_DETAIL(order._id)}>
            <p className="font-semibold text-foreground text-sm sm:text-base leading-snug
              line-clamp-2 hover:text-travia-orange transition-colors">
              {snap.name ?? '—'}
            </p>
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {snap.departureDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 shrink-0" />
                {formatDate(snap.departureDate)}
              </span>
            )}
            {snap.departureCity && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                {snap.departureCity}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3 shrink-0" />
              {order.participants} peserta
            </span>
          </div>

          {/* Payment method (if paid) */}
          {isPaid && order.paymentMethod && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium
              text-emerald-600 dark:text-emerald-400 mt-1.5">
              <Banknote className="w-3 h-3" />
              {PAY_METHOD[order.paymentMethod] ?? order.paymentMethod}
              {order.paidAt && ` · ${formatDateTime(order.paidAt)}`}
            </span>
          )}
        </div>
      </div>

      {/* Footer: total + actions */}
      <div className="px-4 py-3 border-t border-border flex items-center
        justify-between gap-3 flex-wrap">
        {/* Total */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="font-bold text-foreground text-base">{formatIDR(order.totalPrice)}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isPending && (
            <>
              {/* Cancel */}
              <button
                onClick={() => onCancelClick(order)}
                className="h-8 px-3 rounded-lg border border-red-300 dark:border-red-800/50
                  text-red-500 text-xs font-medium
                  hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Batalkan
              </button>

              {/* Continue payment */}
              <button
                onClick={() => navigate(ROUTES.PAYMENT(order._id))}
                className="h-8 px-3 rounded-lg bg-travia-orange text-white text-xs font-semibold
                  hover:bg-travia-orange/90 transition-colors flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Bayar
              </button>
            </>
          )}

          {/* Detail button */}
          <Link
            to={ROUTES.ORDER_DETAIL(order._id)}
            className="h-8 px-3 rounded-lg border border-border text-xs font-medium
              text-muted-foreground hover:bg-accent hover:text-foreground transition-colors
              flex items-center gap-1"
          >
            Detail
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const OrderSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
    <div className="px-4 py-3 border-b border-border bg-background flex justify-between">
      <div className="h-4 w-36 bg-muted rounded" />
      <div className="h-5 w-24 bg-muted rounded-full" />
    </div>
    <div className="p-4 flex gap-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-3 w-1/2 bg-muted rounded" />
        <div className="h-3 w-1/3 bg-muted rounded" />
      </div>
    </div>
    <div className="px-4 py-3 border-t border-border flex justify-between">
      <div className="h-5 w-28 bg-muted rounded" />
      <div className="h-8 w-20 bg-muted rounded-lg" />
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ hasFilters }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <Package className="w-12 h-12 text-muted-foreground/20 mb-4" />
    <p className="font-semibold text-foreground mb-1">
      {hasFilters ? 'Tidak ada pesanan yang sesuai' : 'Belum ada pesanan'}
    </p>
    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
      {hasFilters
        ? 'Coba ubah filter atau kata kunci pencarian.'
        : 'Mulai pesan paket perjalanan impianmu sekarang.'}
    </p>
    {!hasFilters && (
      <Link
        to={ROUTES.PRODUCTS}
        className="inline-flex items-center gap-2 h-10 px-6 rounded-full
          bg-travia-orange text-white text-sm font-semibold
          hover:bg-travia-orange/90 transition-colors"
      >
        Jelajahi Produk
        <ChevronRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPage, onChange }) => {
  if (totalPage <= 1) return null;

  const pages = Array.from({ length: totalPage }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPage || Math.abs(n - page) <= 1)
    .reduce((acc, n, i, arr) => {
      if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border
          text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors text-sm">
        ‹
      </button>
      {pages.map((n, i) => n === '…' ? (
        <span key={`d${i}`} className="w-9 text-center text-sm text-muted-foreground">…</span>
      ) : (
        <button key={n} onClick={() => onChange(n)}
          className={cn(
            'h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
            page === n
              ? 'bg-travia-orange text-white'
              : 'border border-border text-muted-foreground hover:bg-accent',
          )}>
          {n}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPage}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border
          text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors text-sm">
        ›
      </button>
    </div>
  );
};

// ─── OrdersPage ───────────────────────────────────────────────────────────────

const OrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch,  setLocalSearch]  = useState(
    () => searchParams.get('search') || '',
  );
  const [cancelTarget, setCancelTarget] = useState(null);

  const debouncedSearch = useDebounce(localSearch, 400);

  const status    = searchParams.get('status') || '';
  const page      = Math.max(1, Number(searchParams.get('page')) || 1);

  const cancelOrder = useCancelOrder();

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setParam = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPage = useCallback((p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  // Push debounced search to URL
  // Sync debounced search ke URL param
  useEffect(() => {
    setParam('search', debouncedSearch.trim());
  }, [debouncedSearch]); // eslint-disable-line

  const { data, isLoading, isFetching } = useOrders({
    search: debouncedSearch,
    status,
    page,
    limit: 10,
  });

  const orders    = data?.orders    ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPage = data?.totalPage ?? 1;

  const hasFilters = !!(localSearch || status);

  // ── Cancel handlers ───────────────────────────────────────────────────────

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    cancelOrder.mutate(cancelTarget._id, {
      onSuccess: () => setCancelTarget(null),
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
          Pesanan Saya
        </h1>
        {!isLoading && (
          <p className="text-sm text-muted-foreground mt-1">
            {totalData > 0
              ? `${totalData} pesanan ditemukan`
              : hasFilters
                ? 'Tidak ada pesanan yang sesuai'
                : 'Belum ada pesanan'}
          </p>
        )}
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Cari kode pesanan atau nama produk..."
          className="w-full h-10 pl-11 pr-10 rounded-full border border-border bg-card
            text-sm text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange
            transition-all shadow-sm"
        />
        {localSearch && (
          <button
            onClick={() => { setLocalSearch(''); setParam('search', ''); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground
              hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setParam('status', tab.key)}
            className={cn(
              'h-8 px-4 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0',
              status === tab.key
                ? 'bg-travia-orange text-white border-travia-orange'
                : 'border-border text-muted-foreground hover:border-travia-orange/50 hover:text-travia-orange',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className={cn(
          'space-y-4 transition-opacity duration-200',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        )}>
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onCancelClick={(o) => setCancelTarget(o)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPage={totalPage} onChange={setPage} />

      {/* Cancel dialog */}
      {cancelTarget && (
        <CancelDialog
          order={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => !cancelOrder.isPending && setCancelTarget(null)}
          isPending={cancelOrder.isPending}
        />
      )}
    </div>
  );
};

export default OrdersPage;
