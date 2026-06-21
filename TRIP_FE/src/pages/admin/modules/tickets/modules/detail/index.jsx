import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, QrCode, CheckCircle2, XCircle,
  Clock, User, Mail, Phone, Package, ShoppingBag,
  Calendar, MapPin, Users, ExternalLink,
} from 'lucide-react';
import { cn } from '../../../../../../lib/utils.js';
import { ROUTES } from '../../../../../../utils/consts/routes.js';
import { useTicket } from '../../api/useTickets.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const formatDateTime = v =>
  new Date(v).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v ?? 0);

// ─── Ticket status ────────────────────────────────────────────────────────────

const getStatus = (ticket) => {
  if (!ticket.isValid)   return { key: 'invalid',  label: 'Tidak Valid',    cls: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400' };
  if (ticket.checkedIn)  return { key: 'used',     label: 'Sudah Check-in', cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400' };
  return                        { key: 'valid',    label: 'Aktif',          cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' };
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
    <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-medium text-foreground mt-0.5 break-all', mono && 'font-mono')}>{value ?? '—'}</p>
    </div>
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card = ({ icon: Icon, title, children }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-travia-orange" />
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

// ─── TicketDetailPage ─────────────────────────────────────────────────────────

const TicketDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const { data: ticket, isLoading } = useTicket(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-travia-orange animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">Tiket tidak ditemukan</p>
        <button onClick={() => navigate(ROUTES.ADMIN.TICKETS)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-travia-orange hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </button>
      </div>
    );
  }

  const status = getStatus(ticket);
  const snap   = ticket.productSnapshot ?? {};

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(ROUTES.ADMIN.TICKETS)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border
              text-muted-foreground hover:bg-accent transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-bold text-foreground text-xl font-mono">{ticket.ticketCode}</h1>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', status.cls)}>
                {status.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Dibuat {formatDateTime(ticket.createdAt)}</p>
          </div>
        </div>

        {/* Checkin action for valid tickets */}
        {ticket.canUse && (
          <Link
            to={ROUTES.ADMIN.TICKET_CHECKIN}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
              bg-travia-orange hover:bg-travia-orange-h text-white transition-colors shrink-0"
          >
            <QrCode className="w-4 h-4" /> Proses Check-in
          </Link>
        )}
      </div>

      {/* Status visual */}
      {ticket.checkedIn && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 dark:bg-blue-950/20
          border border-blue-200 dark:border-blue-800 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Tiket sudah digunakan untuk check-in
            </p>
            {ticket.checkedInAt && (
              <p className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-0.5">
                {formatDateTime(ticket.checkedInAt)}
              </p>
            )}
          </div>
        </div>
      )}

      {!ticket.isValid && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 dark:bg-red-950/20
          border border-red-200 dark:border-red-800 rounded-xl">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Tiket tidak valid
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-500/70 mt-0.5">
              Tiket ini telah dibatalkan atau di-refund
              {ticket.invalidatedAt && ` · ${formatDateTime(ticket.invalidatedAt)}`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Snapshot produk */}
          <Card icon={Package} title="Detail Produk">
            <div className="flex gap-4">
              {snap.thumbnail ? (
                <img src={snap.thumbnail} alt={snap.name}
                  className="w-20 h-16 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-20 h-16 rounded-lg bg-travia-orange/10 flex items-center
                  justify-center shrink-0 text-2xl font-serif italic text-travia-orange/30">T</div>
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="font-semibold text-foreground">{snap.name ?? '—'}</p>
                {snap.duration && <p className="text-xs text-muted-foreground">{snap.duration}</p>}
                {snap.destinations?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-travia-orange shrink-0" />
                    <p className="text-sm text-foreground">
                      {snap.departureCity
                        ? `${snap.departureCity} → ${snap.destinations.join(', ')}`
                        : snap.destinations.join(', ')}
                    </p>
                  </div>
                )}
                {snap.departureDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {formatDate(snap.departureDate)}
                      {snap.returnDate && <> — {formatDate(snap.returnDate)}</>}
                    </p>
                  </div>
                )}
                {snap.meetingPoint && (
                  <div className="flex items-start gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{snap.meetingPoint}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Peserta + total */}
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Peserta</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{ticket.participants ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Harga</p>
                <p className="text-lg font-bold text-travia-orange mt-0.5">{formatIDR(ticket.totalPrice)}</p>
              </div>
            </div>
          </Card>

          {/* Pemegang tiket */}
          <Card icon={User} title="Pemegang Tiket">
            <div>
              <InfoRow icon={User}  label="Nama"      value={ticket.userId?.name  ?? '—'} />
              <InfoRow icon={Mail}  label="Email"     value={ticket.userId?.email ?? '—'} />
              <InfoRow icon={Phone} label="Telepon"   value={ticket.userId?.phone ?? '—'} />
            </div>
            {ticket.userId?._id && (
              <Link
                to={ROUTES.ADMIN.USER_DETAIL(ticket.userId._id)}
                className="mt-4 flex items-center justify-center gap-1.5 h-8 w-full rounded-lg text-xs
                  font-medium border border-border text-muted-foreground hover:bg-accent transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Lihat Profil User
              </Link>
            )}
          </Card>
        </div>

        {/* ── Right (1/3) ── */}
        <div className="space-y-4">
          {/* Tiket info */}
          <Card icon={QrCode} title="Info Tiket">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Kode Tiket</p>
              <p className="font-mono text-sm font-bold text-foreground tracking-wide">{ticket.ticketCode}</p>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full inline-block', status.cls)}>
                {status.label}
              </span>
            </div>
          </Card>

          {/* Order terkait */}
          {ticket.orderId && (
            <Card icon={ShoppingBag} title="Order Terkait">
              <p className="font-mono text-sm font-bold text-foreground">
                #{ticket.orderId.orderCode ?? '—'}
              </p>
              {ticket.orderId.paymentMethod && (
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {ticket.orderId.paymentMethod.replace('_', ' ')}
                </p>
              )}
              {ticket.orderId.paidAt && (
                <p className="text-xs text-muted-foreground">
                  Lunas {formatDateTime(ticket.orderId.paidAt)}
                </p>
              )}
              {ticket.orderId._id && (
                <Link
                  to={ROUTES.ADMIN.ORDER_DETAIL(ticket.orderId._id)}
                  className="mt-3 flex items-center justify-center gap-1.5 h-8 w-full rounded-lg text-xs
                    font-medium border border-border text-muted-foreground hover:bg-accent transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Lihat Order
                </Link>
              )}
            </Card>
          )}

          {/* Timeline */}
          <Card icon={Clock} title="Timeline">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-travia-orange mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Tiket Diterbitkan</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(ticket.createdAt)}</p>
                </div>
              </div>

              {ticket.checkedIn && ticket.checkedInAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Check-in</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(ticket.checkedInAt)}</p>
                  </div>
                </div>
              )}

              {!ticket.isValid && ticket.invalidatedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Diinvalidasi</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(ticket.invalidatedAt)}</p>
                  </div>
                </div>
              )}

              {snap.departureDate && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Keberangkatan</p>
                    <p className="text-xs text-muted-foreground">{formatDate(snap.departureDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
