import { useState }              from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, CheckCircle2, Clock, XCircle, RotateCcw,
  Calendar, MapPin, Users, Banknote, CreditCard,
  Ticket, FileText, AlertTriangle, Loader2,
  Check, X as XIcon, BedDouble, Coffee, Utensils,
  UtensilsCrossed, ChevronDown, Package,
} from 'lucide-react';
import { cn }                from '../../lib/utils.js';
import { ROUTES }            from '../../utils/consts/routes.js';
import {
  useOrderDetail, useCancelOrder, useSubmitRefund,
} from './api/useOrderDetail.js';

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
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : null;

const PAY_METHOD = {
  credit_card:   'Kartu Kredit',
  bank_transfer: 'Transfer Bank',
  gopay:         'GoPay',
  shopeepay:     'ShopeePay',
  qris:          'QRIS',
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  pending_payment: { label: 'Menunggu Pembayaran', cls: 'text-amber-600  bg-amber-50  dark:bg-amber-950/30  dark:text-amber-400  border-amber-200  dark:border-amber-800/50',  Icon: Clock        },
  paid:            { label: 'Lunas',               cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', Icon: CheckCircle2 },
  cancelled:       { label: 'Dibatalkan',          cls: 'text-red-600    bg-red-50    dark:bg-red-950/30    dark:text-red-400    border-red-200    dark:border-red-800/50',    Icon: XCircle      },
  refunded:        { label: 'Direfund',            cls: 'text-blue-600   bg-blue-50   dark:bg-blue-950/30   dark:text-blue-400   border-blue-200   dark:border-blue-800/50',   Icon: RotateCcw    },
};

// ─── Status Timeline ──────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { key: 'created',   label: 'Pesanan Dibuat'    },
  { key: 'payment',   label: 'Pembayaran'        },
  { key: 'paid',      label: 'Lunas'             },
  { key: 'ticket',    label: 'Tiket Diterbitkan' },
];

const getStepStatus = (stepKey, orderStatus) => {
  if (orderStatus === 'cancelled') {
    return stepKey === 'created' ? 'done' : 'skip';
  }
  const doneMap = {
    pending_payment: ['created'],
    paid:            ['created', 'payment', 'paid', 'ticket'],
    refunded:        ['created', 'payment', 'paid', 'ticket'],
  };
  const activeMap = {
    pending_payment: 'payment',
  };
  const done   = doneMap[orderStatus]  ?? [];
  const active = activeMap[orderStatus] ?? null;

  if (done.includes(stepKey))   return 'done';
  if (active === stepKey)       return 'active';
  return 'pending';
};

const StatusTimeline = ({ order }) => {
  const isCancelled = order.status === 'cancelled';
  const isRefunded  = order.status === 'refunded';

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold text-foreground text-sm mb-4">Status Pesanan</h3>

      {/* Steps */}
      <div className="flex items-center gap-0">
        {TIMELINE_STEPS.map((step, i) => {
          const st = getStepStatus(step.key, order.status);
          const isLast = i === TIMELINE_STEPS.length - 1;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              {/* Circle */}
              <div className="flex flex-col items-center shrink-0">
                <div className={cn(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors',
                  st === 'done'    && 'bg-emerald-500 border-emerald-500',
                  st === 'active'  && 'bg-travia-orange border-travia-orange animate-pulse',
                  st === 'pending' && 'bg-background border-border',
                  st === 'skip'    && 'bg-background border-border',
                )}>
                  {st === 'done' && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  {st === 'active' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <p className={cn(
                  'text-[10px] text-center mt-1.5 leading-tight font-medium w-14',
                  st === 'done'   && 'text-emerald-600 dark:text-emerald-400',
                  st === 'active' && 'text-travia-orange',
                  (st === 'pending' || st === 'skip') && 'text-muted-foreground',
                )}>
                  {step.label}
                </p>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className={cn(
                  'h-0.5 flex-1 mx-1 transition-colors',
                  isCancelled ? 'bg-border' :
                  getStepStatus(TIMELINE_STEPS[i + 1].key, order.status) === 'done' ||
                  getStepStatus(TIMELINE_STEPS[i + 1].key, order.status) === 'active'
                    ? 'bg-emerald-400'
                    : 'bg-border',
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Cancelled / Refunded badges */}
      {(isCancelled || isRefunded) && (
        <div className={cn(
          'mt-4 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border',
          isCancelled ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'
                      : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
        )}>
          {isCancelled
            ? <><XCircle  className="w-3.5 h-3.5 shrink-0" /> Pesanan ini telah dibatalkan.</>
            : <><RotateCcw className="w-3.5 h-3.5 shrink-0" /> Pesanan ini telah direfund.</>}
        </div>
      )}
    </div>
  );
};

// ─── Itinerary ────────────────────────────────────────────────────────────────

const ItinerarySection = ({ itinerary = [] }) => {
  const [openDay, setOpenDay] = useState(null);

  if (!Array.isArray(itinerary) || itinerary.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Itinerary Perjalanan</h3>
      </div>
      <div className="divide-y divide-border">
        {itinerary.map((day, i) => {
          const isOpen = openDay === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpenDay(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-accent/30 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-travia-orange/10 text-travia-orange
                  text-[11px] font-bold flex items-center justify-center shrink-0">
                  {day.day}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{day.title}</span>
                <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-10">
                    {day.activities}
                  </p>
                  {day.hotel && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-10">
                      <BedDouble className="w-3.5 h-3.5 text-travia-orange shrink-0" />
                      Menginap: <strong className="text-foreground">{day.hotel}</strong>
                    </div>
                  )}
                  {(day.meals?.breakfast || day.meals?.lunch || day.meals?.dinner) && (
                    <div className="flex flex-wrap gap-1.5 pl-10">
                      {day.meals.breakfast && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full
                          bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                          <Coffee className="w-3 h-3" /> Sarapan
                        </span>
                      )}
                      {day.meals.lunch && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full
                          bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          <Utensils className="w-3 h-3" /> Makan Siang
                        </span>
                      )}
                      {day.meals.dinner && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full
                          bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                          <UtensilsCrossed className="w-3 h-3" /> Makan Malam
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Includes / Excludes ──────────────────────────────────────────────────────

const IncludesExcludes = ({ includes = [], excludes = [] }) => {
  if (!includes.length && !excludes.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold text-foreground text-sm mb-4">Sudah Termasuk & Tidak Termasuk</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {includes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
              Sudah Termasuk
            </p>
            <ul className="space-y-1.5">
              {includes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {excludes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-2">
              Tidak Termasuk
            </p>
            <ul className="space-y-1.5">
              {excludes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <XIcon className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Refund Modal ─────────────────────────────────────────────────────────────

const RefundModal = ({ orderId, onClose }) => {
  const [reason, setReason] = useState('');
  const submitRefund        = useSubmitRefund();

  const charCount   = reason.length;
  const isValid     = charCount >= 10 && charCount <= 1000;

  const handleSubmit = () => {
    if (!isValid) return;
    submitRefund.mutate(
      { orderId, reason },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-card border border-border
        rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pt-4 sm:pt-5 pb-5 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Ajukan Refund</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ceritakan alasan pembatalan perjalananmu dengan jelas.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Alasan Refund <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="Ceritakan alasan kamu mengajukan refund... (minimal 10 karakter)"
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-travia-dark3',
                'text-sm text-foreground placeholder:text-muted-foreground resize-none',
                'focus:outline-none focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange',
                'transition-colors',
                charCount > 0 && charCount < 10 ? 'border-red-400' : 'border-border',
              )}
            />
            <div className="flex justify-between mt-1">
              {charCount > 0 && charCount < 10 ? (
                <p className="text-xs text-red-500">Minimal 10 karakter ({10 - charCount} lagi)</p>
              ) : (
                <span />
              )}
              <p className={cn(
                'text-xs ml-auto',
                charCount > 900 ? 'text-amber-500' : 'text-muted-foreground',
              )}>
                {charCount}/1000
              </p>
            </div>
          </div>

          {/* Info kebijakan */}
          <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30
            border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Persentase refund dihitung berdasarkan kebijakan refund Travia.
              <Link to={ROUTES.REFUND_POLICY} onClick={onClose}
                className="underline ml-1 hover:text-amber-900 dark:hover:text-amber-100">
                Lihat kebijakan
              </Link>
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitRefund.isPending}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitRefund.isPending}
              className="flex-1 h-10 rounded-xl bg-travia-orange text-white text-sm font-semibold
                hover:bg-travia-orange/90 transition-colors flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitRefund.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                : 'Kirim Pengajuan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Cancel Dialog ────────────────────────────────────────────────────────────

const CancelDialog = ({ order, onConfirm, onClose, isPending }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
    <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl
      shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-5">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center
        justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="font-semibold text-foreground text-center mb-1">Batalkan Pesanan?</h3>
      <p className="text-sm text-muted-foreground text-center mb-1">
        {order.productSnapshot?.name}
      </p>
      <p className="font-bold text-foreground text-center mb-4">{formatIDR(order.totalPrice)}</p>
      <p className="text-xs text-muted-foreground text-center mb-5">
        Pesanan yang sudah dibatalkan tidak dapat dipulihkan.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} disabled={isPending}
          className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
            text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50">
          Kembali
        </button>
        <button onClick={onConfirm} disabled={isPending}
          className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white
            text-sm font-semibold transition-colors flex items-center justify-center gap-2
            disabled:opacity-60">
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Membatalkan...</> : 'Ya, Batalkan'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Summary Card ─────────────────────────────────────────────────────────────

const SummaryCard = ({ order, onCancel, onRefund, navigate }) => {
  const snap       = order.productSnapshot ?? {};
  const isPending  = order.status === 'pending_payment';
  const isPaid     = order.status === 'paid';

  const pricePerPerson = snap.price ?? 0;
  const addOnTotal     = (order.addOns ?? []).reduce((s, a) => s + (a.price ?? 0), 0);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Price breakdown */}
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm mb-3">Rincian Harga</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              {formatIDR(pricePerPerson)} × {order.participants} peserta
            </span>
            <span className="font-medium text-foreground">
              {formatIDR(pricePerPerson * order.participants)}
            </span>
          </div>
          {(order.addOns ?? []).map((addon, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{addon.name}</span>
              <span className="font-medium text-foreground">{formatIDR(addon.price)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold text-travia-orange text-xl">{formatIDR(order.totalPrice)}</span>
        </div>
      </div>

      {/* Payment info (if paid) */}
      {isPaid && (
        <div className="px-5 py-4 border-b border-border space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Info Pembayaran
          </p>
          {order.paymentMethod && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" /> Metode
              </span>
              <span className="font-medium text-foreground">
                {PAY_METHOD[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </div>
          )}
          {order.paidAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dibayar</span>
              <span className="font-medium text-foreground text-right text-xs">
                {formatDateTime(order.paidAt)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 py-4 space-y-2.5">
        {isPending && (
          <>
            <button
              onClick={() => navigate(ROUTES.PAYMENT(order._id))}
              className="w-full h-10 rounded-xl bg-travia-orange text-white text-sm font-semibold
                hover:bg-travia-orange/90 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Bayar Sekarang
            </button>
            <button
              onClick={onCancel}
              className="w-full h-10 rounded-xl border border-red-300 dark:border-red-800/50
                text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30
                transition-colors"
            >
              Batalkan Pesanan
            </button>
          </>
        )}

        {isPaid && (
          <>
            <Link
              to={ROUTES.TICKETS}
              className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white
                text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" /> Lihat Tiket Saya
            </Link>
            <button
              onClick={onRefund}
              className="w-full h-10 rounded-xl border border-border text-sm font-medium
                text-muted-foreground hover:bg-accent hover:text-foreground transition-colors
                flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> Ajukan Refund
            </button>
          </>
        )}

        <Link
          to={ROUTES.ORDERS}
          className="w-full h-9 rounded-xl text-sm text-muted-foreground hover:text-foreground
            transition-colors flex items-center justify-center gap-1.5"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Kembali ke Pesanan
        </Link>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-6 w-48 bg-muted rounded" />
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4">
        <div className="h-28 bg-muted rounded-2xl" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
      <div className="h-80 bg-muted rounded-2xl" />
    </div>
  </div>
);

// ─── Not Found ────────────────────────────────────────────────────────────────

const NotFound = () => (
  <div className="flex flex-col items-center py-20 text-center gap-4">
    <Package className="w-12 h-12 text-muted-foreground/20" />
    <div>
      <p className="font-semibold text-foreground mb-1">Pesanan tidak ditemukan</p>
      <p className="text-sm text-muted-foreground">Pesanan tidak ada atau kamu tidak memiliki akses.</p>
    </div>
    <Link to={ROUTES.ORDERS}
      className="h-10 px-6 rounded-full bg-travia-orange text-white text-sm font-semibold
        hover:bg-travia-orange/90 transition-colors inline-flex items-center gap-2">
      Pesanan Saya
    </Link>
  </div>
);

// ─── OrderDetailPage ──────────────────────────────────────────────────────────

const OrderDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [showCancel, setShowCancel] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  const { data: order, isLoading, isError } = useOrderDetail(id);
  const cancelOrder = useCancelOrder();

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8"><Skeleton /></div>
  );
  if (isError || !order) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6"><NotFound /></div>
  );

  const snap = order.productSnapshot ?? {};
  const cfg  = STATUS[order.status] ?? STATUS.pending_payment;
  const StatusIcon = cfg.Icon;

  const productData = order.productId ?? {};
  const itinerary   = Array.isArray(productData.itinerary) ? productData.itinerary : [];
  const includes    = Array.isArray(productData.includes)  ? productData.includes  : [];
  const excludes    = Array.isArray(productData.excludes)  ? productData.excludes  : [];

  const handleCancelConfirm = () => {
    cancelOrder.mutate(id, {
      onSuccess: () => {
        setShowCancel(false);
        navigate(ROUTES.ORDERS);
      },
    });
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
          <Link to={ROUTES.HOME}   className="hover:text-foreground transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={ROUTES.ORDERS} className="hover:text-foreground transition-colors">Pesanan</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-mono">#{order.orderCode}</span>
        </nav>

        {/* Title + status */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
            Detail Pesanan
          </h1>
          <span className={cn(
            'flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border',
            cfg.cls,
          )}>
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            {cfg.label}
          </span>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6">

          {/* ── Left: Info sections ───────────────────────────────────────── */}
          <div className="space-y-5 min-w-0">

            {/* Status timeline */}
            <StatusTimeline order={order} />

            {/* Product info */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex gap-4 p-5">
                {/* Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                  {snap.thumbnail ? (
                    <img src={snap.thumbnail} alt={snap.name}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif italic text-4xl text-travia-orange/20">T</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-base leading-snug mb-2">
                    {snap.name ?? '—'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {snap.departureDate && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-travia-orange" />
                        {formatDate(snap.departureDate)}
                        {snap.returnDate && ` – ${formatDate(snap.returnDate)}`}
                      </span>
                    )}
                    {snap.departureCity && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-travia-orange" />
                        {snap.departureCity}
                      </span>
                    )}
                    {snap.duration && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-travia-orange" />
                        {snap.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5 text-travia-orange" />
                      {order.participants} peserta
                    </span>
                  </div>
                  {snap.meetingPoint && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium text-foreground">Titik kumpul:</span> {snap.meetingPoint}
                    </p>
                  )}
                </div>
              </div>

              {/* Order code + date */}
              <div className="px-5 py-3 border-t border-border bg-background flex flex-wrap gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Kode Pesanan</p>
                  <p className="font-mono font-bold text-foreground text-sm">#{order.orderCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Dibuat</p>
                  <p className="text-sm font-medium text-foreground">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Note */}
            {order.note && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Catatan
                </p>
                <p className="text-sm text-foreground leading-relaxed italic">"{order.note}"</p>
              </div>
            )}

            {/* Itinerary */}
            <ItinerarySection itinerary={itinerary} />

            {/* Includes / Excludes */}
            <IncludesExcludes includes={includes} excludes={excludes} />

          </div>

          {/* ── Right: Summary + Actions (desktop) ────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <SummaryCard
                order={order}
                onCancel={() => setShowCancel(true)}
                onRefund={() => setShowRefund(true)}
                navigate={navigate}
              />
            </div>
          </div>
        </div>

        {/* ── Mobile action bar ────────────────────────────────────────────── */}
        <div className="lg:hidden mt-6">
          <SummaryCard
            order={order}
            onCancel={() => setShowCancel(true)}
            onRefund={() => setShowRefund(true)}
            navigate={navigate}
          />
        </div>

      </div>

      {/* Cancel dialog */}
      {showCancel && (
        <CancelDialog
          order={order}
          onConfirm={handleCancelConfirm}
          onClose={() => !cancelOrder.isPending && setShowCancel(false)}
          isPending={cancelOrder.isPending}
        />
      )}

      {/* Refund modal */}
      {showRefund && (
        <RefundModal
          orderId={order._id}
          onClose={() => setShowRefund(false)}
        />
      )}
    </>
  );
};

export default OrderDetailPage;
