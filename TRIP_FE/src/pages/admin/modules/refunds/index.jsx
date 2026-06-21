import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Eye, ChevronLeft, ChevronRight, X,
  RefreshCw, Clock, CheckCircle2, XCircle, Settings,
} from 'lucide-react';
import { cn } from '../../../../lib/utils.js';
import { useDebounce } from '../../../../hooks/useDebounce.js';
import { ROUTES } from '../../../../utils/consts/routes.js';
import { useRefunds } from './api/useRefunds.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v ?? 0);

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:  { label: 'Menunggu',   cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',     icon: Clock        },
  approved: { label: 'Disetujui',  cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Ditolak',    cls: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',            icon: XCircle      },
};

const StatusBadge = ({ status }) => {
  const cfg  = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit', cfg.cls)}>
      <Icon className="w-3 h-3 shrink-0" />
      {cfg.label}
    </span>
  );
};

const STATUS_FILTERS = [
  { key: 'all',      label: 'Semua'     },
  { key: 'pending',  label: 'Menunggu'  },
  { key: 'approved', label: 'Disetujui' },
  { key: 'rejected', label: 'Ditolak'   },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRows = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-3">
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-muted rounded font-mono" />
            <div className="h-3 w-36 bg-muted rounded" />
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-3 w-36 bg-muted rounded" />
          </div>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-48 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-5 w-20 bg-muted rounded-full" /></td>
        <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 w-24 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 w-20 bg-muted rounded" /></td>
        <td className="px-4 py-3"><div className="h-7 w-7 bg-muted rounded-lg ml-auto" /></td>
      </tr>
    ))}
  </>
);

// ─── RefundsPage ──────────────────────────────────────────────────────────────

const RefundsPage = () => {
  const [search,    setSearch]    = useState('');
  const [statusKey, setStatusKey] = useState('all');
  const [page,      setPage]      = useState(1);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useRefunds({
    search: debouncedSearch,
    status: statusKey === 'all' ? undefined : statusKey,
    page, limit: 15,
  });

  const refunds   = data?.refunds   ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPage = data?.totalPage ?? 1;

  const hasFilters = search || statusKey !== 'all';
  const clearFilters = () => { setSearch(''); setStatusKey('all'); setPage(1); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-foreground text-xl">Refund</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola pengajuan refund{totalData ? ` · ${totalData} pengajuan` : ''}
          </p>
        </div>
        <Link
          to={ROUTES.ADMIN.REFUND_POLICY}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
            border border-border text-muted-foreground hover:bg-accent hover:text-foreground
            transition-colors shrink-0 self-start sm:self-auto"
        >
          <Settings className="w-4 h-4" /> Kebijakan Refund
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari alasan refund..."
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
                focus:ring-travia-orange focus:border-travia-orange transition-colors"
            />
          </div>

          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => { setStatusKey(f.key); setPage(1); }}
                className={cn(
                  'px-3 py-2 font-medium whitespace-nowrap transition-colors',
                  statusKey === f.key
                    ? 'bg-travia-orange text-white'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm border border-border
                text-muted-foreground hover:bg-accent transition-colors">
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order / Produk</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Pemohon</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Alasan</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Jumlah Refund</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Diajukan</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <SkeletonRows />
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <RefreshCw className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {hasFilters ? 'Tidak ada refund yang cocok' : 'Belum ada pengajuan refund'}
                    </p>
                  </td>
                </tr>
              ) : refunds.map(refund => (
                <tr
                  key={refund._id}
                  className={cn(
                    'hover:bg-accent/30 transition-colors',
                    refund.status === 'pending' && 'bg-amber-50/30 dark:bg-amber-950/10',
                  )}
                >
                  {/* Order / Produk */}
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm font-semibold text-foreground">
                      #{refund.orderId?.orderCode ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">
                      {refund.orderId?.productSnapshot?.name ?? '—'}
                    </p>
                  </td>

                  {/* Pemohon */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="font-medium text-foreground">{refund.userId?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{refund.userId?.email ?? ''}</p>
                  </td>

                  {/* Alasan */}
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground max-w-xs">
                    <p className="truncate">{refund.reason}</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={refund.status} />
                  </td>

                  {/* Jumlah refund */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {refund.status === 'approved' && refund.refundAmount != null ? (
                      <div>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatIDR(refund.refundAmount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{refund.refundPercentage}%</p>
                      </div>
                    ) : (
                      <span className="text-border">—</span>
                    )}
                  </td>

                  {/* Tanggal */}
                  <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">
                    {formatDate(refund.createdAt)}
                  </td>

                  {/* Aksi */}
                  <td className="px-4 py-3">
                    <Link
                      to={ROUTES.ADMIN.REFUND_DETAIL(refund._id)}
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
        {totalPage > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPage} · {totalData} pengajuan
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPage }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPage || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === '…' ? (
                  <span key={`d${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n)}
                    className={cn(
                      'h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      page === n ? 'bg-travia-orange text-white' : 'border border-border text-muted-foreground hover:bg-accent',
                    )}>
                    {n}
                  </button>
                ))
              }
              <button onClick={() => setPage(p => Math.min(totalPage, p + 1))} disabled={page >= totalPage}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundsPage;
