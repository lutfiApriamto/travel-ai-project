import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { cn } from '../../../../lib/utils.js';
import { useDebounce } from '../../../../hooks/useDebounce.js';
import { ROUTES } from '../../../../utils/consts/routes.js';
import { useOrders } from './api/useOrders.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDateTime = v =>
  new Date(v).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const STATUS_MAP = {
  pending_payment: { label: 'Menunggu Bayar', cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400' },
  paid:            { label: 'Lunas',          cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' },
  cancelled:       { label: 'Dibatalkan',     cls: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400' },
  refunded:        { label: 'Direfund',       cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400' },
};

const PAY_METHOD = {
  credit_card:   'Kartu Kredit',
  bank_transfer: 'Transfer Bank',
  gopay:         'GoPay',
  shopeepay:     'ShopeePay',
  qris:          'QRIS',
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.pending_payment;
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', cfg.cls)}>
      {cfg.label}
    </span>
  );
};

const STATUSES = [
  { value: '',                label: 'Semua Status'   },
  { value: 'pending_payment', label: 'Menunggu Bayar' },
  { value: 'paid',            label: 'Lunas'          },
  { value: 'cancelled',       label: 'Dibatalkan'     },
  { value: 'refunded',        label: 'Direfund'       },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRows = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-3"><div className="h-4 w-28 bg-muted rounded font-mono" /></td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-muted shrink-0" />
            <div className="h-4 w-36 bg-muted rounded" />
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-3 w-36 bg-muted rounded" />
          </div>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-5 w-24 bg-muted rounded-full" /></td>
        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 w-20 bg-muted rounded" /></td>
        <td className="px-4 py-3"><div className="h-8 w-8 bg-muted rounded-lg ml-auto" /></td>
      </tr>
    ))}
  </>
);

// ─── OrdersPage ───────────────────────────────────────────────────────────────

const OrdersPage = () => {
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [page,      setPage]      = useState(1);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useOrders({
    search: debouncedSearch, status, startDate, endDate, page, limit: 15,
  });

  const orders = data?.orders ?? [];
  const meta   = data?.meta   ?? {};

  const hasFilters = search || status || startDate || endDate;

  const clearFilters = () => {
    setSearch(''); setStatus(''); setStartDate(''); setEndDate(''); setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-bold text-foreground text-xl">Pesanan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pantau semua transaksi{meta.total ? ` · ${meta.total} pesanan` : ''}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari kode order / produk..."
                className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                  text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
                  focus:ring-travia-orange focus:border-travia-orange transition-colors"
              />
            </div>

            {/* Status */}
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm border border-border
                  text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Dari</span>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                className="h-8 px-2 rounded-lg border border-border bg-white dark:bg-travia-dark3
                  text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sampai</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                className="h-8 px-2 rounded-lg border border-border bg-white dark:bg-travia-dark3
                  text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Hapus tanggal
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kode Order</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produk</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Pembeli</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Tanggal</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <SkeletonRows />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    {hasFilters ? 'Tidak ada pesanan yang cocok dengan filter' : 'Belum ada pesanan'}
                  </td>
                </tr>
              ) : orders.map(order => (
                <tr key={order._id} className="hover:bg-accent/30 transition-colors">
                  {/* Kode */}
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm font-semibold text-foreground">
                      #{order.orderCode}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 sm:hidden">
                      <StatusBadge status={order.status} />
                    </p>
                  </td>

                  {/* Produk */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {order.productSnapshot?.thumbnail ? (
                        <img
                          src={order.productSnapshot.thumbnail}
                          alt={order.productSnapshot.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-travia-orange/10 flex items-center
                          justify-center shrink-0 text-travia-orange font-serif italic text-sm">T</div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate max-w-[180px]">
                          {order.productSnapshot?.name || order.productId?.name || '—'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {order.participants} peserta
                          {order.productSnapshot?.departureDate && (
                            <> · {formatDate(order.productSnapshot.departureDate)}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Pembeli */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="font-medium text-foreground">{order.userId?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{order.userId?.email ?? ''}</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={order.status} />
                    {order.paymentMethod && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {PAY_METHOD[order.paymentMethod] ?? order.paymentMethod}
                      </p>
                    )}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 hidden lg:table-cell font-semibold text-foreground">
                    {formatIDR(order.totalPrice)}
                  </td>

                  {/* Tanggal */}
                  <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">
                    {formatDate(order.createdAt)}
                  </td>

                  {/* Aksi */}
                  <td className="px-4 py-3">
                    <Link
                      to={ROUTES.ADMIN.ORDER_DETAIL(order._id)}
                      className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg
                        text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Lihat detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Halaman {meta.page} dari {meta.totalPages} · {meta.total} pesanan
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === meta.totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === '…' ? (
                  <span key={`dot-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      'h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      page === n
                        ? 'bg-travia-orange text-white'
                        : 'border border-border text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {n}
                  </button>
                ))
              }

              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
