import { useState }              from 'react';
import { useParams, Link }       from 'react-router-dom';
import { QRCodeSVG }             from 'qrcode.react';
import {
  CheckCircle2, XCircle, Clock, Download,
  Copy, ChevronRight, Loader2, Ticket,
  MapPin, Calendar, Users, Banknote,
  Navigation, ArrowRight, Package,
} from 'lucide-react';
import toast                     from 'react-hot-toast';
import { cn }                    from '../../lib/utils.js';
import { ROUTES }                from '../../utils/consts/routes.js';
import { useTicketDetail, downloadTicketPdf } from './api/useTicketDetail.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

const formatDateShort = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '—';

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : null;

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now    = new Date(); now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

const PAY_METHOD = {
  credit_card:   'Kartu Kredit',
  bank_transfer: 'Transfer Bank',
  gopay:         'GoPay',
  shopeepay:     'ShopeePay',
  qris:          'QRIS',
};

// ─── Ticket status ────────────────────────────────────────────────────────────

const getStatus = (ticket) => {
  if (!ticket.isValid)   return { key: 'invalid', label: 'Tidak Valid',     Icon: XCircle,      color: 'red'     };
  if (ticket.checkedIn)  return { key: 'used',    label: 'Sudah Check-in',  Icon: CheckCircle2, color: 'blue'    };
  return                        { key: 'valid',   label: 'Tiap Digunakan',  Icon: CheckCircle2, color: 'emerald' };
};

// ─── Status Banner ────────────────────────────────────────────────────────────

const StatusBanner = ({ ticket }) => {
  const status    = getStatus(ticket);
  const snap      = ticket.productSnapshot ?? {};
  const daysUntil = getDaysUntil(snap.departureDate);
  const isToday   = daysUntil === 0;
  const isPastDue = daysUntil !== null && daysUntil < 0;

  const bannerCls = {
    valid:   'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300',
    used:    'bg-blue-50   dark:bg-blue-950/30    border-blue-200   dark:border-blue-800/50    text-blue-700   dark:text-blue-300',
    invalid: 'bg-red-50    dark:bg-red-950/30     border-red-200    dark:border-red-800/50     text-red-700    dark:text-red-300',
  }[status.key];

  const { Icon } = status;

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', bannerCls)}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm">{status.label}</p>
        <p className="text-xs mt-0.5 opacity-80">
          {status.key === 'valid' && !isPastDue && daysUntil !== null && (
            isToday
              ? 'Keberangkatan hari ini! Tunjukkan QR ini kepada petugas.'
              : `${daysUntil} hari lagi · Tunjukkan QR ini kepada petugas saat keberangkatan.`
          )}
          {status.key === 'valid' && isPastDue &&
            'Tanggal keberangkatan sudah berlalu.'}
          {status.key === 'valid' && daysUntil === null &&
            'Tunjukkan QR ini kepada petugas saat keberangkatan.'}
          {status.key === 'used' && ticket.checkedInAt &&
            `Check-in dilakukan pada ${formatDateTime(ticket.checkedInAt)}`}
          {status.key === 'invalid' && ticket.invalidatedAt &&
            `Tiket dinonaktifkan pada ${formatDateTime(ticket.invalidatedAt)}`}
          {status.key === 'invalid' && !ticket.invalidatedAt &&
            'Tiket ini tidak valid karena pesanan dibatalkan atau direfund.'}
        </p>
      </div>
    </div>
  );
};

// ─── Info Field (boarding pass style) ────────────────────────────────────────

const InfoField = ({ label, value, mono = false, className }) => (
  <div className={className}>
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
      {label}
    </p>
    <p className={cn(
      'text-sm font-semibold text-foreground leading-snug',
      mono && 'font-mono',
    )}>
      {value || '—'}
    </p>
  </div>
);

// ─── Perforation Divider ──────────────────────────────────────────────────────

const Perforation = () => (
  <div className="flex items-center -mx-6 sm:-mx-8 my-0">
    <div className="w-5 h-5 rounded-full bg-background shrink-0" />
    <div className="flex-1 border-t-2 border-dashed border-border" />
    <div className="w-5 h-5 rounded-full bg-background shrink-0" />
  </div>
);

// ─── Boarding Pass Card ───────────────────────────────────────────────────────

const BoardingPass = ({ ticket }) => {
  const [isCopied,       setIsCopied]       = useState(false);
  const [isDownloading,  setIsDownloading]  = useState(false);

  const snap   = ticket.productSnapshot ?? {};
  const status = getStatus(ticket);

  // Warna aksen per status
  const accentCls = {
    valid:   'from-emerald-500 to-emerald-600',
    used:    'from-blue-500    to-blue-600',
    invalid: 'from-red-400     to-red-500',
  }[status.key] ?? 'from-travia-orange to-amber-500';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticketCode);
      setIsCopied(true);
      toast.success('Kode tiket disalin!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin kode');
    }
  };

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
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">

      {/* ── Header gradient ──────────────────────────────────────────────── */}
      <div className={cn('bg-gradient-to-r px-6 sm:px-8 pt-6 pb-5', accentCls)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[11px] font-semibold uppercase tracking-widest mb-1">
              E-Tiket Perjalanan
            </p>
            <h2 className="font-serif italic text-white text-lg sm:text-xl leading-tight line-clamp-2">
              {snap.name ?? ticket.productId?.name ?? '—'}
            </h2>
          </div>

          {/* Thumbnail */}
          {snap.thumbnail && (
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 border-white/30">
              <img src={snap.thumbnail} alt={snap.name}
                className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Route pill (departure → destination) */}
        {(snap.departureCity || snap.destinations?.length) && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm
            rounded-full px-4 py-1.5 text-white text-xs font-medium">
            <Navigation className="w-3 h-3" />
            {snap.departureCity ?? '—'}
            <ArrowRight className="w-3 h-3 opacity-70" />
            {snap.destinations?.slice(0, 2).join(', ') ?? '—'}
          </div>
        )}
      </div>

      {/* ── Info grid ────────────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 pt-5 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
          <InfoField
            label="Tanggal Berangkat"
            value={formatDateShort(snap.departureDate)}
          />
          <InfoField
            label="Tanggal Kembali"
            value={formatDateShort(snap.returnDate)}
          />
          <InfoField label="Durasi"    value={snap.duration} />
          <InfoField label="Peserta"   value={`${ticket.participants ?? 0} orang`} />
          {snap.meetingPoint && (
            <InfoField
              label="Titik Kumpul"
              value={snap.meetingPoint}
              className="col-span-2"
            />
          )}
          {snap.destinations?.length > 0 && (
            <InfoField
              label="Destinasi"
              value={snap.destinations.join(' · ')}
              className="col-span-2"
            />
          )}
          <InfoField
            label="Total Harga"
            value={formatIDR(ticket.totalPrice)}
          />
          {ticket.orderId?.paymentMethod && (
            <InfoField
              label="Metode Bayar"
              value={PAY_METHOD[ticket.orderId.paymentMethod] ?? ticket.orderId.paymentMethod}
            />
          )}
        </div>
      </div>

      {/* ── Perforation ──────────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-4">
        <Perforation />
      </div>

      {/* ── QR code section ──────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 pb-6 flex flex-col sm:flex-row items-center
        gap-6 sm:gap-8">

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-border">
            <QRCodeSVG
              value={ticket.ticketCode}
              size={160}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center max-w-[180px] leading-relaxed">
            Scan QR ini saat keberangkatan untuk proses check-in
          </p>
        </div>

        {/* Ticket code + actions */}
        <div className="flex-1 w-full space-y-4">
          {/* Ticket code */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Kode Tiket
            </p>
            <p className="font-mono font-bold text-foreground text-xl sm:text-2xl
              tracking-widest break-all">
              {ticket.ticketCode}
            </p>
          </div>

          {/* Status badge */}
          <div>
            <span className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border',
              status.key === 'valid'   && 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 dark:text-emerald-400',
              status.key === 'used'    && 'text-blue-600   bg-blue-50   dark:bg-blue-950/30    border-blue-200   dark:border-blue-800/50   dark:text-blue-400',
              status.key === 'invalid' && 'text-red-600    bg-red-50    dark:bg-red-950/30     border-red-200    dark:border-red-800/50    dark:text-red-400',
            )}>
              <status.Icon className="w-3.5 h-3.5" />
              {status.label}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2.5">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold',
                'border transition-colors',
                isCopied
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'border-border text-foreground hover:bg-accent',
              )}
            >
              <Copy className="w-3.5 h-3.5" />
              {isCopied ? 'Tersalin!' : 'Salin Kode'}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold
                bg-travia-orange text-white hover:bg-travia-orange/90
                disabled:opacity-60 transition-colors"
            >
              {isDownloading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              Unduh PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Quick Links ──────────────────────────────────────────────────────────────

const QuickLinks = ({ ticket }) => {
  const snap = ticket.productSnapshot ?? {};

  const links = [
    ticket.orderId?._id && {
      label: `Lihat Pesanan #${ticket.orderId?.orderCode ?? ''}`,
      to:    ROUTES.ORDER_DETAIL(ticket.orderId._id ?? ''),
      Icon:  Package,
    },
    ticket.productId?.slug && {
      label: 'Lihat Halaman Produk',
      to:    ROUTES.PRODUCT_DETAIL(ticket.productId.slug),
      Icon:  MapPin,
    },
  ].filter(Boolean);

  if (links.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Tautan Cepat
        </p>
      </div>
      {links.map(({ label, to, Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex items-center justify-between gap-3 px-5 py-3.5
            hover:bg-accent transition-colors border-b border-border last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground">{label}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </Link>
      ))}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-5 w-40 bg-muted rounded" />
    <div className="h-14 bg-muted rounded-2xl" />
    <div className="bg-card border border-border rounded-3xl overflow-hidden">
      <div className="h-32 bg-muted" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2.5 w-16 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-border" />
        <div className="flex gap-6">
          <div className="w-40 h-40 bg-muted rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-7 w-48 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded-full" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-muted rounded-xl" />
              <div className="h-9 w-28 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Not Found ────────────────────────────────────────────────────────────────

const NotFound = () => (
  <div className="flex flex-col items-center py-20 text-center gap-4">
    <Ticket className="w-12 h-12 text-muted-foreground/20" />
    <div>
      <p className="font-semibold text-foreground mb-1">Tiket tidak ditemukan</p>
      <p className="text-sm text-muted-foreground">
        Tiket tidak ada atau kamu tidak memiliki akses.
      </p>
    </div>
    <Link to={ROUTES.TICKETS}
      className="h-10 px-6 rounded-full bg-travia-orange text-white text-sm font-semibold
        hover:bg-travia-orange/90 transition-colors">
      Tiket Saya
    </Link>
  </div>
);

// ─── TicketDetailPage ─────────────────────────────────────────────────────────

const TicketDetailPage = () => {
  const { id } = useParams();

  const { data: ticket, isLoading, isError } = useTicketDetail(id);

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8"><Skeleton /></div>
  );

  if (isError || !ticket) return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6"><NotFound /></div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to={ROUTES.HOME}    className="hover:text-foreground transition-colors">Beranda</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={ROUTES.TICKETS} className="hover:text-foreground transition-colors">Tiket</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-mono">{ticket.ticketCode}</span>
      </nav>

      {/* Status banner */}
      <StatusBanner ticket={ticket} />

      {/* Boarding pass */}
      <BoardingPass ticket={ticket} />

      {/* Quick links */}
      <QuickLinks ticket={ticket} />

    </div>
  );
};

export default TicketDetailPage;
