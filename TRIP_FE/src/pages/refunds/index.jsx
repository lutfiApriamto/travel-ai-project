import { useSearchParams, Link }  from 'react-router-dom';
import {
  Clock, CheckCircle2, XCircle, RotateCcw,
  ChevronRight, AlertCircle, FileText,
  Calendar, Info,
} from 'lucide-react';
import { cn }           from '../../lib/utils.js';
import { ROUTES }       from '../../utils/consts/routes.js';
import { useMyRefunds } from './api/useRefunds.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : null;

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  pending: {
    label: 'Menunggu',
    cls:   'text-amber-600  bg-amber-50  dark:bg-amber-950/30  dark:text-amber-400  border-amber-200  dark:border-amber-800/50',
    Icon:  Clock,
  },
  approved: {
    label: 'Disetujui',
    cls:   'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    Icon:  CheckCircle2,
  },
  rejected: {
    label: 'Ditolak',
    cls:   'text-red-600    bg-red-50    dark:bg-red-950/30    dark:text-red-400    border-red-200    dark:border-red-800/50',
    Icon:  XCircle,
  },
};

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: '',         label: 'Semua'     },
  { key: 'pending',  label: 'Menunggu'  },
  { key: 'approved', label: 'Disetujui' },
  { key: 'rejected', label: 'Ditolak'   },
];

// ─── Refund Card ──────────────────────────────────────────────────────────────

const RefundCard = ({ refund }) => {
  const cfg   = STATUS[refund.status] ?? STATUS.pending;
  const snap  = refund.orderId?.productSnapshot ?? {};
  const order = refund.orderId ?? {};

  const isApproved = refund.status === 'approved';
  const isRejected = refund.status === 'rejected';
  const isPending  = refund.status === 'pending';

  return (
    <article className={cn(
      'bg-card border rounded-2xl overflow-hidden transition-shadow hover:shadow-md',
      isPending  ? 'border-amber-200  dark:border-amber-800/50'  :
      isApproved ? 'border-emerald-200 dark:border-emerald-800/50' :
      isRejected ? 'border-red-200    dark:border-red-800/50'    :
                   'border-border',
    )}>

      {/* Card header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3
        border-b border-border bg-background">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-bold text-foreground shrink-0">
            #{order.orderCode ?? '—'}
          </span>
          <span className="text-border hidden sm:inline text-xs">·</span>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Diajukan {formatDateTime(refund.createdAt)}
          </span>
        </div>

        <span className={cn(
          'flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0',
          cfg.cls,
        )}>
          <cfg.Icon className="w-3 h-3 shrink-0" />
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">

        {/* Product info */}
        <div className="flex gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
            {snap.thumbnail ? (
              <img src={snap.thumbnail} alt={snap.name}
                loading="lazy"
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif italic text-2xl text-travia-orange/20">T</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
              {snap.name ?? '—'}
            </p>
            {snap.departureDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Calendar className="w-3 h-3 shrink-0" />
                {formatDate(snap.departureDate)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              Total pesanan: <span className="font-semibold text-foreground">
                {formatIDR(order.totalPrice)}
              </span>
            </p>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-accent/50 border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
            Alasan Pengajuan
          </p>
          <p className="text-sm text-foreground leading-relaxed line-clamp-3">
            {refund.reason}
          </p>
        </div>

        {/* ── Status-specific info ───────────────────────────────────────── */}

        {/* APPROVED — nominal refund */}
        {isApproved && refund.refundAmount != null && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200
            dark:border-emerald-800/50 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400
                  uppercase tracking-wide">
                  Dana Dikembalikan
                </p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xl mt-0.5">
                  {formatIDR(refund.refundAmount)}
                </p>
              </div>
              {refund.refundPercentage != null && (
                <span className="text-2xl font-bold text-emerald-600/30 dark:text-emerald-400/30">
                  {refund.refundPercentage}%
                </span>
              )}
            </div>
            {refund.processedAt && (
              <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-2">
                Disetujui {formatDateTime(refund.processedAt)}
              </p>
            )}
            {refund.adminNote && (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 italic">
                "{refund.adminNote}"
              </p>
            )}
          </div>
        )}

        {/* REJECTED — admin note */}
        {isRejected && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200
            dark:border-red-800/50 rounded-xl px-4 py-3">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400
                  uppercase tracking-wide mb-1">
                  Alasan Penolakan
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                  {refund.adminNote ?? 'Tidak ada keterangan dari admin.'}
                </p>
                {refund.processedAt && (
                  <p className="text-[11px] text-red-500/70 mt-1.5">
                    Ditolak {formatDateTime(refund.processedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PENDING — info proses */}
        {isPending && (
          <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Admin akan memproses pengajuanmu dalam <strong>3×24 jam kerja</strong>.
              Kamu akan mendapat notifikasi & email saat status berubah.
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center
        justify-between gap-2">
        <p className="text-[11px] text-muted-foreground sm:hidden">
          {formatDateTime(refund.createdAt)}
        </p>

        <div className="flex items-center gap-2 sm:ml-auto">
          {order._id && (
            <Link
              to={ROUTES.ORDER_DETAIL(order._id)}
              className="text-xs text-muted-foreground hover:text-travia-orange transition-colors"
            >
              Lihat pesanan →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const RefundSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
    <div className="flex justify-between px-4 py-3 border-b border-border bg-background">
      <div className="h-3.5 w-28 bg-muted rounded" />
      <div className="h-5 w-20 bg-muted rounded-full" />
    </div>
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-14 h-14 bg-muted rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
      <div className="h-16 bg-muted rounded-xl" />
    </div>
    <div className="px-4 py-3 border-t border-border flex justify-end">
      <div className="h-3.5 w-24 bg-muted rounded" />
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ statusFilter }) => {
  const msgs = {
    '':        { title: 'Belum ada pengajuan refund',   sub: 'Pengajuan refundmu akan muncul di sini.' },
    pending:   { title: 'Tidak ada yang menunggu',      sub: 'Tidak ada pengajuan yang sedang diproses.' },
    approved:  { title: 'Belum ada yang disetujui',     sub: 'Pengajuan yang disetujui akan tampil di sini.' },
    rejected:  { title: 'Tidak ada yang ditolak',       sub: 'Pengajuan yang ditolak akan tampil di sini.' },
  };
  const { title, sub } = msgs[statusFilter] ?? msgs[''];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <RotateCcw className="w-12 h-12 text-muted-foreground/20 mb-4" />
      <p className="font-semibold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{sub}</p>
      {!statusFilter && (
        <Link to={ROUTES.ORDERS}
          className="inline-flex items-center gap-2 h-10 px-6 rounded-full
            bg-travia-orange text-white text-sm font-semibold
            hover:bg-travia-orange/90 transition-colors">
          <FileText className="w-4 h-4" />
          Lihat Pesanan Saya
        </Link>
      )}
    </div>
  );
};

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

// ─── RefundsPage ──────────────────────────────────────────────────────────────

const RefundsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || '';
  const page         = Math.max(1, Number(searchParams.get('page')) || 1);

  const setStatus = (key) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key) next.set('status', key);
      else next.delete('status');
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const setPage = (p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data, isLoading, isFetching } = useMyRefunds({
    status: statusFilter || undefined,
    page,
    limit: 10,
  });

  const refunds   = data?.refunds   ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPage = data?.totalPage ?? 1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
            Riwayat Refund
          </h1>
          {!isLoading && totalData > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {totalData} pengajuan ditemukan
            </p>
          )}
        </div>
        <Link
          to={ROUTES.REFUND_POLICY}
          className="flex items-center gap-1.5 text-xs text-muted-foreground
            hover:text-travia-orange transition-colors self-start shrink-0"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Lihat Kebijakan Refund
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={cn(
              'h-8 px-4 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0',
              statusFilter === tab.key
                ? 'bg-travia-orange text-white border-travia-orange'
                : 'border-border text-muted-foreground hover:border-travia-orange/50 hover:text-travia-orange',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Refund list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <RefundSkeleton key={i} />)}
        </div>
      ) : refunds.length === 0 ? (
        <EmptyState statusFilter={statusFilter} />
      ) : (
        <div className={cn(
          'space-y-4 transition-opacity duration-200',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        )}>
          {refunds.map((refund) => (
            <RefundCard key={refund._id} refund={refund} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPage={totalPage} onChange={setPage} />
    </div>
  );
};

export default RefundsPage;
