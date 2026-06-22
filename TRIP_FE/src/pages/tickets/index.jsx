import { useState }                     from 'react';
import { Link, useSearchParams }         from 'react-router-dom';
import { QRCodeSVG }                     from 'qrcode.react';
import {
  CheckCircle2, Clock, XCircle, Ticket,
  Download, Calendar, MapPin, Users,
  ChevronRight, Loader2, QrCode,
  AlertTriangle, X,
} from 'lucide-react';
import toast                             from 'react-hot-toast';
import { cn }                            from '../../lib/utils.js';
import { ROUTES }                        from '../../utils/consts/routes.js';
import { useMyTickets, downloadTicketPdf } from './api/useTickets.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : null;

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now    = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

// ─── Status config ────────────────────────────────────────────────────────────

const getTicketStatus = (ticket) => {
  if (!ticket.isValid) {
    return {
      key:   'invalid',
      label: 'Tidak Valid',
      cls:   'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800/50',
      Icon:  XCircle,
    };
  }
  if (ticket.checkedIn) {
    return {
      key:   'used',
      label: 'Sudah Check-in',
      cls:   'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
      Icon:  CheckCircle2,
    };
  }
  return {
    key:   'valid',
    label: 'Valid',
    cls:   'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    Icon:  CheckCircle2,
  };
};

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: '',        label: 'Semua'          },
  { key: 'valid',   label: 'Valid'          },
  { key: 'used',    label: 'Sudah Check-in' },
  { key: 'invalid', label: 'Tidak Valid'    },
];

// ─── QR Modal ─────────────────────────────────────────────────────────────────

const QrModal = ({ ticket, onClose }) => {
  const snap = ticket.productSnapshot ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xs bg-card border border-border rounded-2xl
        shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground text-sm">Kode QR Tiket</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tunjukkan kepada petugas</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-muted-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center px-6 py-6 gap-4">
          <div className="p-4 bg-white rounded-2xl shadow-sm">
            <QRCodeSVG
              value={ticket.ticketCode}
              size={180}
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Ticket code */}
          <div className="text-center">
            <p className="font-mono font-bold text-foreground text-lg tracking-widest">
              {ticket.ticketCode}
            </p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {snap.name}
            </p>
          </div>

          {/* Departure info */}
          {snap.departureDate && (
            <div className="w-full flex items-center justify-between px-3 py-2.5
              rounded-xl bg-accent border border-border text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Keberangkatan
              </span>
              <span className="font-semibold text-foreground">
                {formatDate(snap.departureDate)}
              </span>
            </div>
          )}

          <p className="text-[11px] text-center text-muted-foreground px-2">
            Scan QR ini saat hari keberangkatan untuk proses check-in.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Ticket Card ──────────────────────────────────────────────────────────────

const TicketCard = ({ ticket }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showQr,        setShowQr]        = useState(false);

  const snap      = ticket.productSnapshot ?? {};
  const status    = getTicketStatus(ticket);
  const StatusIcon = status.Icon;

  const daysUntil     = getDaysUntil(snap.departureDate);
  const isValid       = status.key === 'valid';
  const isPastDue     = isValid && daysUntil !== null && daysUntil < 0;
  const isToday       = isValid && daysUntil === 0;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadTicketPdf(ticket._id, ticket.ticketCode);
      toast.success('Tiket berhasil diunduh!');
    } catch (e) {
      toast.error(e.message || 'Gagal mengunduh tiket');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <article className={cn(
        'bg-card border rounded-2xl overflow-hidden transition-shadow hover:shadow-md',
        isValid && !isPastDue   ? 'border-emerald-200 dark:border-emerald-800/50' :
        status.key === 'used'   ? 'border-blue-200   dark:border-blue-800/50'    :
        status.key === 'invalid'? 'border-red-200    dark:border-red-800/50'     :
                                  'border-border',
      )}>

        {/* Card header bar */}
        <div className="flex items-center justify-between px-4 py-2.5
          border-b border-border bg-background">
          <p className="font-mono text-xs font-bold text-foreground tracking-wider">
            {ticket.ticketCode}
          </p>
          <span className={cn(
            'flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
            status.cls,
          )}>
            <StatusIcon className="w-3 h-3 shrink-0" />
            {status.label}
          </span>
        </div>

        {/* Body */}
        <div className="p-4 flex gap-4">
          {/* Thumbnail */}
          <Link
            to={ROUTES.TICKET_DETAIL(ticket._id)}
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
                <span className="font-serif italic text-4xl text-travia-orange/20">T</span>
              </div>
            )}
          </Link>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <Link to={ROUTES.TICKET_DETAIL(ticket._id)}>
              <p className="font-semibold text-foreground text-sm sm:text-base leading-snug
                line-clamp-2 hover:text-travia-orange transition-colors">
                {snap.name ?? ticket.productId?.name ?? '—'}
              </p>
            </Link>

            {/* Nama penumpang (jika ada) */}
            {ticket.passenger?.name && (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-xs font-semibold text-travia-orange
                  bg-travia-orange/10 px-2 py-0.5 rounded-full">
                  <Users className="w-3 h-3 shrink-0" />
                  {ticket.passenger.name}
                </span>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {snap.departureDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 shrink-0 text-travia-orange" />
                  {formatDate(snap.departureDate)}
                </span>
              )}
              {snap.departureCity && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0 text-travia-orange" />
                  {snap.departureCity}
                </span>
              )}
              {!ticket.passenger?.name && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3 shrink-0 text-travia-orange" />
                  {ticket.participants} peserta
                </span>
              )}
            </div>

            {/* Dynamic indicators */}
            {isValid && !isPastDue && daysUntil !== null && (
              <p className={cn(
                'text-xs font-semibold mt-1',
                isToday ? 'text-travia-orange' : 'text-emerald-600 dark:text-emerald-400',
              )}>
                {isToday
                  ? '🗓 Keberangkatan hari ini!'
                  : `${daysUntil} hari lagi`}
              </p>
            )}

            {isPastDue && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                Keberangkatan sudah berlalu
              </p>
            )}

            {status.key === 'used' && ticket.checkedInAt && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Check-in: {formatDateTime(ticket.checkedInAt)}
              </p>
            )}

            {status.key === 'invalid' && ticket.invalidatedAt && (
              <p className="text-xs text-red-500 mt-1">
                Dinonaktifkan: {formatDateTime(ticket.invalidatedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Order code ref */}
        {ticket.orderId?.orderCode && (
          <div className="px-4 py-2 border-t border-border bg-background flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Order: <span className="font-mono font-semibold text-foreground">
                #{ticket.orderId.orderCode}
              </span>
            </p>
            <Link
              to={ROUTES.ORDER_DETAIL(ticket.orderId._id ?? '')}
              className="text-[11px] text-travia-orange hover:underline"
            >
              Lihat pesanan →
            </Link>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-wrap">
          {/* QR button (valid only) */}
          {isValid && !isPastDue && (
            <button
              onClick={() => setShowQr(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-travia-orange
                text-white text-xs font-semibold hover:bg-travia-orange/90 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              Tampilkan QR
            </button>
          )}

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border
              text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground
              transition-colors disabled:opacity-50"
          >
            {isDownloading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Download className="w-3.5 h-3.5" />}
            Unduh PDF
          </button>

          {/* Detail button */}
          <Link
            to={ROUTES.TICKET_DETAIL(ticket._id)}
            className="ml-auto flex items-center gap-1 h-8 px-3 rounded-lg border border-border
              text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground
              transition-colors"
          >
            Detail <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>

      {/* QR Modal */}
      {showQr && <QrModal ticket={ticket} onClose={() => setShowQr(false)} />}
    </>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const TicketSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background">
      <div className="h-3.5 w-32 bg-muted rounded" />
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
    <div className="px-4 py-3 border-t border-border flex gap-2">
      <div className="h-8 w-28 bg-muted rounded-lg" />
      <div className="h-8 w-24 bg-muted rounded-lg" />
      <div className="h-8 w-16 bg-muted rounded-lg ml-auto" />
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ statusFilter }) => {
  const msgs = {
    '':        { title: 'Belum punya tiket',      sub: 'Tiketmu akan muncul di sini setelah pesanan lunas.' },
    valid:     { title: 'Tidak ada tiket valid',  sub: 'Semua tiket aktifmu akan tampil di sini.'           },
    used:      { title: 'Belum ada check-in',     sub: 'Tiket yang sudah digunakan akan muncul di sini.'    },
    invalid:   { title: 'Tidak ada tiket invalid',sub: 'Tidak ada tiket yang dibatalkan atau direfund.'     },
  };

  const { title, sub } = msgs[statusFilter] ?? msgs[''];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Ticket className="w-12 h-12 text-muted-foreground/20 mb-4" />
      <p className="font-semibold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{sub}</p>
      {!statusFilter && (
        <Link
          to={ROUTES.PRODUCTS}
          className="inline-flex items-center gap-2 h-10 px-6 rounded-full
            bg-travia-orange text-white text-sm font-semibold
            hover:bg-travia-orange/90 transition-colors"
        >
          Jelajahi Produk
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

// ─── TicketsPage ──────────────────────────────────────────────────────────────

const TicketsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || '';
  const page         = Math.max(1, Number(searchParams.get('page')) || 1);

  const setStatus = (key) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (key) next.set('status', key);
        else next.delete('status');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const setPage = (p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data, isLoading, isFetching } = useMyTickets({
    status: statusFilter || undefined,
    page,
    limit: 10,
  });

  const tickets   = data?.tickets   ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPage = data?.totalPage ?? 1;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
          Tiket Saya
        </h1>
        {!isLoading && totalData > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {totalData} tiket ditemukan
          </p>
        )}
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

      {/* Info banner — how to use */}
      {statusFilter === 'valid' || (!statusFilter && tickets.some((t) => t.canUse)) ? (
        <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl
          bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50
          text-xs text-emerald-700 dark:text-emerald-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
          <span>
            Klik <strong>Tampilkan QR</strong> pada tiket valid untuk membuka kode QR.
            Tunjukkan QR ini kepada petugas saat hari keberangkatan.
          </span>
        </div>
      ) : null}

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <TicketSkeleton key={i} />)}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState statusFilter={statusFilter} />
      ) : (
        <div className={cn(
          'space-y-4 transition-opacity duration-200',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        )}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPage={totalPage} onChange={setPage} />
    </div>
  );
};

export default TicketsPage;
