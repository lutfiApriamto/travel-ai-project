import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, User, Package, Receipt,
  Calendar, MapPin, Users, CreditCard, Clock, CheckCircle2,
} from 'lucide-react';
import { cn } from '../../../../../../lib/utils.js';
import { ROUTES } from '../../../../../../utils/consts/routes.js';
import { useOrder } from '../../api/useOrders.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.cls)}>
      {cfg.label}
    </span>
  );
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <span className={cn('text-sm text-foreground font-medium text-right', mono && 'font-mono')}>{value ?? '—'}</span>
  </div>
);

// ─── Card wrapper ─────────────────────────────────────────────────────────────

const Card = ({ icon: Icon, title, children, className }) => (
  <div className={cn('bg-card border border-border rounded-xl p-5', className)}>
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-travia-orange" />
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

// ─── OrderDetailPage ─────────────────────────────────────────────────────────

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-travia-orange animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Pesanan tidak ditemukan</p>
        <button
          onClick={() => navigate(ROUTES.ADMIN.ORDERS)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-travia-orange hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar
        </button>
      </div>
    );
  }

  const snap       = order.productSnapshot ?? {};
  const addOnTotal = (order.addOns ?? []).reduce((s, a) => s + a.price, 0);
  const baseTotal  = (snap.price ?? 0) * order.participants;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.ADMIN.ORDERS)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border
              text-muted-foreground hover:bg-accent transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-bold text-foreground text-xl font-mono">
                #{order.orderCode}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dibuat {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Link ke produk terkait */}
        {order.productId?._id && (
          <Link
            to={ROUTES.ADMIN.PRODUCT_DETAIL(order.productId._id)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border border-border
              text-muted-foreground hover:bg-accent transition-colors shrink-0"
          >
            <Package className="w-3.5 h-3.5" /> Lihat Produk
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Produk (snapshot) */}
          <Card icon={Package} title="Detail Produk">
            <div className="flex gap-4">
              {snap.thumbnail ? (
                <img
                  src={snap.thumbnail}
                  alt={snap.name}
                  className="w-24 h-20 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-24 h-20 rounded-lg bg-travia-orange/10 flex items-center
                  justify-center shrink-0 text-3xl font-serif italic text-travia-orange/30">T</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{snap.name ?? '—'}</p>
                {snap.duration && (
                  <p className="text-xs text-muted-foreground mt-0.5">{snap.duration}</p>
                )}
                {snap.destinations?.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-travia-orange shrink-0" />
                    <p className="text-sm text-foreground">{snap.destinations.join(' · ')}</p>
                  </div>
                )}
                {snap.departureDate && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {formatDate(snap.departureDate)}
                      {snap.returnDate && <> — {formatDate(snap.returnDate)}</>}
                    </p>
                  </div>
                )}
                {snap.meetingPoint && (
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">{snap.meetingPoint}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Snapshot price note */}
            <div className="mt-3 px-3 py-2 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Catatan:</span> Data produk di atas adalah
                snapshot saat order dibuat dan tidak akan berubah meski produk diedit.
              </p>
            </div>
          </Card>

          {/* Rincian pesanan */}
          <Card icon={Receipt} title="Rincian Pesanan">
            {/* Peserta + Add-on */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Harga paket × {order.participants} peserta
                </span>
                <span className="font-medium text-foreground">{formatIDR(baseTotal)}</span>
              </div>

              {(order.addOns ?? []).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Add-on: {a.name}</span>
                  <span className="text-foreground">{formatIDR(a.price)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">Total Pembayaran</span>
              <span className="text-lg font-bold text-travia-orange">{formatIDR(order.totalPrice)}</span>
            </div>

            {/* Catatan user */}
            {order.note && (
              <div className="mt-4 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200
                dark:border-amber-800 rounded-lg">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Catatan dari Pemesan</p>
                <p className="text-sm text-foreground">{order.note}</p>
              </div>
            )}
          </Card>

          {/* Pembayaran */}
          <Card icon={CreditCard} title="Informasi Pembayaran">
            <div className="divide-y divide-border">
              <InfoRow label="Status" value={<StatusBadge status={order.status} />} />
              <InfoRow
                label="Metode"
                value={order.paymentMethod ? (PAY_METHOD[order.paymentMethod] ?? order.paymentMethod) : 'Belum dibayar'}
              />
              {order.paidAt && (
                <InfoRow label="Waktu Bayar" value={formatDateTime(order.paidAt)} />
              )}
              {order.midtransOrderId && (
                <InfoRow label="ID Midtrans" value={order.midtransOrderId} mono />
              )}
            </div>
          </Card>
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Info pembeli */}
          <Card icon={User} title="Informasi Pembeli">
            <div className="divide-y divide-border">
              <InfoRow label="Nama"  value={order.userId?.name  ?? '—'} />
              <InfoRow label="Email" value={order.userId?.email ?? '—'} />
              {order.userId?.phone && (
                <InfoRow label="Telepon" value={order.userId.phone} />
              )}
            </div>
            {order.userId?._id && (
              <Link
                to={ROUTES.ADMIN.USER_DETAIL(order.userId._id)}
                className="mt-4 flex items-center justify-center gap-1.5 h-8 w-full rounded-lg
                  text-xs font-medium border border-border text-muted-foreground
                  hover:bg-accent hover:text-foreground transition-colors"
              >
                <User className="w-3.5 h-3.5" /> Lihat Profil User
              </Link>
            )}
          </Card>

          {/* Timeline */}
          <Card icon={Clock} title="Timeline">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-travia-orange mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Order Dibuat</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>

              {order.paidAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Pembayaran Diterima</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(order.paidAt)}</p>
                  </div>
                </div>
              )}

              {order.status === 'cancelled' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Dibatalkan</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}

              {order.status === 'refunded' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Refund Diproses</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(order.updatedAt)}</p>
                  </div>
                </div>
              )}

              {order.productSnapshot?.departureDate && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Tanggal Keberangkatan</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.productSnapshot.departureDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Peserta summary */}
          <Card icon={Users} title="Peserta">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Jumlah Peserta</span>
              <span className="text-2xl font-bold text-foreground">{order.participants}</span>
            </div>
            {order.addOns?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Add-on Dipilih
                </p>
                {order.addOns.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="flex-1 text-foreground">{a.name}</span>
                    <span className="text-muted-foreground">{formatIDR(a.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
