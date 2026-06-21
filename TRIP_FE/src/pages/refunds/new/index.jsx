import { useState, useMemo }         from 'react';
import { useNavigate, Link }          from 'react-router-dom';
import {
  ChevronRight, Calendar, MapPin, Users,
  CheckCircle2, XCircle, AlertTriangle,
  Info, Loader2, X, ShieldCheck,
} from 'lucide-react';
import { cn }                         from '../../../lib/utils.js';
import { ROUTES }                     from '../../../utils/consts/routes.js';
import {
  useRefundPolicy, useMyPaidOrders, useSubmitRefund,
} from '../api/useRefunds.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

// Hitung sisa hari sebelum keberangkatan (sama persis dengan logika backend)
const getDaysLeft = (departureDate) => {
  if (!departureDate) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const dep = new Date(departureDate); dep.setHours(0, 0, 0, 0);
  return Math.ceil((dep - now) / (1000 * 60 * 60 * 24));
};

// Hitung estimasi refund berdasarkan policy rules
const calcEstimatedRefund = (departureDate, totalPrice, rules) => {
  if (!departureDate || !totalPrice || !Array.isArray(rules) || rules.length === 0) {
    return null;
  }

  const daysLeft = getDaysLeft(departureDate);
  if (daysLeft === null) return null;
  if (daysLeft < 0)      return { percentage: 0, amount: 0, daysLeft, expired: true, matchedRule: null };

  let percentage   = 0;
  let matchedRule  = null;

  for (const rule of rules) {
    const meetsMin = daysLeft >= rule.minDaysBeforeDeparture;
    const meetsMax =
      rule.maxDaysBeforeDeparture === null ||
      daysLeft <= rule.maxDaysBeforeDeparture;
    if (meetsMin && meetsMax) {
      percentage  = rule.refundPercentage;
      matchedRule = rule;
      break;
    }
  }

  return {
    percentage,
    amount:      Math.floor((totalPrice ?? 0) * percentage / 100),
    daysLeft,
    expired:     false,
    matchedRule,
  };
};

// ─── Policy Tiers (compact) ───────────────────────────────────────────────────

const PolicyTiers = ({ rules = [], matchedRule }) => {
  if (rules.length === 0) return null;

  const getTierStyle = (pct, isActive) => {
    const n = Number(pct);
    const base = isActive ? 'ring-2 ring-travia-orange' : '';
    if (n === 100) return `${base} bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50`;
    if (n >= 50)   return `${base} bg-blue-50   dark:bg-blue-950/30   text-blue-700   dark:text-blue-300   border-blue-200   dark:border-blue-800/50`;
    if (n > 0)     return `${base} bg-amber-50  dark:bg-amber-950/30  text-amber-700  dark:text-amber-300  border-amber-200  dark:border-amber-800/50`;
    return               `${base} bg-red-50    dark:bg-red-950/30    text-red-700    dark:text-red-300    border-red-200    dark:border-red-800/50`;
  };

  const rangeLabel = (min, max) => {
    const minD = Number(min);
    const maxD = max === null ? null : Number(max);
    if (maxD === null) return `H-${minD}+`;
    if (minD === maxD) return `H-${minD}`;
    return `H-${minD} – H-${maxD}`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {rules.map((rule, i) => {
        const isActive = matchedRule &&
          rule.minDaysBeforeDeparture === matchedRule.minDaysBeforeDeparture &&
          rule.maxDaysBeforeDeparture === matchedRule.maxDaysBeforeDeparture;

        return (
          <div
            key={i}
            className={cn(
              'flex flex-col items-center p-3 rounded-xl border text-center transition-all',
              getTierStyle(rule.refundPercentage, isActive),
              isActive && 'scale-[1.02]',
            )}
          >
            <p className="text-xs font-semibold opacity-70 mb-0.5">
              {rangeLabel(rule.minDaysBeforeDeparture, rule.maxDaysBeforeDeparture)}
            </p>
            <p className="text-2xl font-bold">{rule.refundPercentage}%</p>
            {isActive && (
              <span className="mt-1 text-[9px] font-bold uppercase tracking-wider
                bg-travia-orange text-white px-2 py-0.5 rounded-full">
                Berlaku
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Order Card (selectable) ──────────────────────────────────────────────────

const OrderCard = ({ order, selected, onSelect }) => {
  const snap     = order.productSnapshot ?? {};
  const daysLeft = getDaysLeft(snap.departureDate);
  const isExpired = daysLeft !== null && daysLeft < 0;

  return (
    <button
      onClick={() => !isExpired && onSelect(order)}
      disabled={isExpired}
      className={cn(
        'w-full text-left rounded-2xl border p-4 transition-all duration-200',
        isExpired
          ? 'border-border opacity-50 cursor-not-allowed'
          : selected
            ? 'border-travia-orange ring-2 ring-travia-orange/20 bg-travia-orange/5'
            : 'border-border hover:border-travia-orange/50 hover:shadow-sm',
      )}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
          {snap.thumbnail ? (
            <img src={snap.thumbnail} alt={snap.name}
              className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif italic text-2xl text-travia-orange/20">T</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
              {snap.name ?? '—'}
            </p>
            {selected && (
              <CheckCircle2 className="w-5 h-5 text-travia-orange shrink-0 mt-0.5" />
            )}
          </div>

          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
            #{order.orderCode}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {snap.departureDate && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(snap.departureDate)}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="w-3 h-3" />
              {order.participants} peserta
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="font-bold text-travia-orange text-sm">
              {formatIDR(order.totalPrice)}
            </p>
            {isExpired ? (
              <span className="text-[10px] text-red-500 font-medium">
                Keberangkatan sudah lewat
              </span>
            ) : daysLeft !== null && (
              <span className={cn(
                'text-[10px] font-semibold',
                daysLeft === 0     ? 'text-travia-orange' :
                daysLeft <= 3      ? 'text-red-500'       :
                daysLeft <= 7      ? 'text-amber-500'     :
                                     'text-emerald-600 dark:text-emerald-400',
              )}>
                {daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── Estimasi Refund Card ─────────────────────────────────────────────────────

const EstimasiCard = ({ estimate, order }) => {
  if (!estimate) return null;

  const snap = order?.productSnapshot ?? {};

  if (estimate.expired) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20
        border border-red-200 dark:border-red-800/50">
        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-700 dark:text-red-300 text-sm mb-0.5">
            Tidak Dapat Mengajukan Refund
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
            Tanggal keberangkatan produk ini sudah lewat. Refund hanya bisa diajukan
            sebelum tanggal keberangkatan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-travia-orange shrink-0" />
        <p className="font-semibold text-foreground text-sm">Estimasi Refund</p>
        <span className="text-[10px] text-muted-foreground ml-auto">Berdasarkan kebijakan saat ini</span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Days left */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sisa hari sebelum keberangkatan</span>
          <span className={cn(
            'font-bold',
            estimate.daysLeft === 0     ? 'text-travia-orange' :
            estimate.daysLeft <= 3      ? 'text-red-500'       :
            estimate.daysLeft <= 7      ? 'text-amber-500'     :
                                          'text-foreground',
          )}>
            {estimate.daysLeft === 0 ? 'Hari ini' : `${estimate.daysLeft} hari`}
          </span>
        </div>

        {/* Applicable rule */}
        {estimate.matchedRule && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Aturan yang berlaku</span>
            <span className="font-medium text-foreground text-right max-w-[200px] text-xs leading-snug">
              {estimate.matchedRule.description}
            </span>
          </div>
        )}

        {/* Persentase + nominal */}
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Persentase refund</span>
            <span className={cn(
              'font-bold text-lg',
              estimate.percentage === 100 ? 'text-emerald-600 dark:text-emerald-400' :
              estimate.percentage >= 50   ? 'text-blue-600   dark:text-blue-400'    :
              estimate.percentage > 0     ? 'text-amber-600  dark:text-amber-400'   :
                                            'text-red-600    dark:text-red-400',
            )}>
              {estimate.percentage}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Estimasi dana kembali
            </span>
            <span className={cn(
              'font-bold text-xl',
              estimate.percentage > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground',
            )}>
              {estimate.percentage > 0 ? formatIDR(estimate.amount) : 'Rp 0'}
            </span>
          </div>
        </div>

        {estimate.percentage === 0 && (
          <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400
            bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2.5 border border-amber-200 dark:border-amber-800/50">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Berdasarkan kebijakan, pembatalan di waktu ini tidak mendapat pengembalian dana.
              Kamu tetap bisa mengajukan refund, tapi nominalnya 0.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

const ConfirmModal = ({ order, estimate, reason, onConfirm, onClose, isPending }) => {
  const snap = order?.productSnapshot ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative z-10 w-full sm:max-w-sm bg-card border border-border
        rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden
        animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

        {/* Handle bar mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pt-4 sm:pt-5 pb-5 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Konfirmasi Pengajuan Refund</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pastikan data sudah benar sebelum mengirim.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-accent/50 rounded-xl p-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Pesanan</span>
              <span className="font-mono font-semibold text-foreground">
                #{order?.orderCode}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Produk</span>
              <span className="font-medium text-foreground text-right max-w-[180px] text-xs leading-snug">
                {snap.name}
              </span>
            </div>
            {estimate && !estimate.expired && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Estimasi refund</span>
                <span className={cn(
                  'font-bold',
                  estimate.percentage > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground',
                )}>
                  {estimate.percentage > 0
                    ? `${formatIDR(estimate.amount)} (${estimate.percentage}%)`
                    : 'Rp 0 (0%)'}
                </span>
              </div>
            )}
            <div className="border-t border-border pt-2.5">
              <p className="text-[11px] text-muted-foreground mb-1">Alasan</p>
              <p className="text-xs text-foreground leading-relaxed line-clamp-3 italic">
                "{reason}"
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              Periksa Lagi
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 h-10 rounded-xl bg-travia-orange text-white text-sm font-semibold
                hover:bg-travia-orange/90 transition-colors flex items-center justify-center gap-2
                disabled:opacity-60"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                : 'Kirim Pengajuan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── RefundNewPage ────────────────────────────────────────────────────────────

const RefundNewPage = () => {
  const navigate = useNavigate();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reason,        setReason]        = useState('');
  const [showConfirm,   setShowConfirm]   = useState(false);

  const { data: policy,     isLoading: policyLoading }  = useRefundPolicy();
  const { data: paidOrders, isLoading: ordersLoading }  = useMyPaidOrders();
  const submitRefund = useSubmitRefund();

  const rules    = Array.isArray(policy?.rules) ? policy.rules : [];
  const orders   = paidOrders ?? [];

  const charCount = reason.length;
  const isReasonValid = charCount >= 10 && charCount <= 1000;

  // Estimasi refund (client-side, sama dengan logika backend)
  const estimate = useMemo(() => {
    if (!selectedOrder) return null;
    const snap = selectedOrder.productSnapshot ?? {};
    return calcEstimatedRefund(snap.departureDate, selectedOrder.totalPrice, rules);
  }, [selectedOrder, rules]);

  const canSubmit =
    !!selectedOrder &&
    isReasonValid &&
    estimate !== null &&
    !estimate.expired;

  const handleConfirm = () => {
    if (!selectedOrder || !isReasonValid) return;
    submitRefund.mutate(
      { orderId: selectedOrder._id, reason },
      {
        onSuccess: () => {
          setShowConfirm(false);
          navigate(ROUTES.REFUNDS);
        },
      },
    );
  };

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to={ROUTES.HOME}    className="hover:text-foreground transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={ROUTES.REFUNDS} className="hover:text-foreground transition-colors">Riwayat Refund</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Ajukan Refund</span>
        </nav>

        <div>
          <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
            Ajukan Refund Baru
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pilih pesanan yang ingin direfund, lalu isi alasanmu.
          </p>
        </div>

        {/* ── Section 1: Kebijakan Refund ─────────────────────────────────── */}
        <section className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-travia-orange" />
              <h2 className="font-semibold text-foreground text-sm">
                Kebijakan Refund
              </h2>
            </div>
            <Link
              to={ROUTES.REFUND_POLICY}
              className="text-xs text-travia-orange hover:underline shrink-0"
            >
              Lihat detail →
            </Link>
          </div>

          <div className="p-5">
            {policyLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-xl" />
                ))}
              </div>
            ) : rules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Kebijakan belum tersedia.
              </p>
            ) : (
              <>
                <PolicyTiers rules={rules} matchedRule={estimate?.matchedRule ?? null} />
                <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                  Persentase dihitung berdasarkan selisih hari antara tanggal pengajuan dan
                  tanggal keberangkatan. Pilih pesanan untuk melihat estimasi refundmu.
                </p>
              </>
            )}
          </div>
        </section>

        {/* ── Section 2: Pilih Pesanan ─────────────────────────────────────── */}
        <section>
          <h2 className="font-semibold text-foreground text-sm mb-3">
            Pilih Pesanan
          </h2>

          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center bg-card
              border border-border rounded-2xl">
              <Info className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="font-semibold text-foreground mb-1 text-sm">
                Tidak ada pesanan yang bisa direfund
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Refund hanya bisa diajukan untuk pesanan dengan status lunas.
              </p>
              <Link to={ROUTES.ORDERS}
                className="mt-4 text-xs text-travia-orange hover:underline">
                Lihat Pesanan Saya →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  selected={selectedOrder?._id === order._id}
                  onSelect={setSelectedOrder}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Section 3: Estimasi (setelah order dipilih) ──────────────────── */}
        {selectedOrder && estimate !== null && (
          <EstimasiCard estimate={estimate} order={selectedOrder} />
        )}

        {/* ── Section 4: Alasan Refund ─────────────────────────────────────── */}
        <section>
          <label className="block font-semibold text-foreground text-sm mb-2">
            Alasan Pengajuan Refund
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Ceritakan alasan kamu membatalkan perjalanan ini... (minimal 10 karakter)"
            className={cn(
              'w-full px-4 py-3 rounded-2xl border bg-card text-sm text-foreground',
              'placeholder:text-muted-foreground resize-none transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange',
              charCount > 0 && charCount < 10 ? 'border-red-400' : 'border-border',
            )}
          />
          <div className="flex justify-between mt-1.5">
            {charCount > 0 && charCount < 10 ? (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Minimal 10 karakter ({10 - charCount} lagi)
              </p>
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
        </section>

        {/* ── Submit button ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <Link
            to={ROUTES.REFUNDS}
            className="flex-1 sm:flex-none h-11 px-6 rounded-xl border border-border
              text-sm font-medium text-muted-foreground hover:bg-accent transition-colors
              flex items-center justify-center"
          >
            Batal
          </Link>
          <button
            onClick={() => canSubmit && setShowConfirm(true)}
            disabled={!canSubmit || submitRefund.isPending}
            className={cn(
              'flex-1 h-11 rounded-xl text-sm font-semibold transition-colors',
              'flex items-center justify-center gap-2',
              canSubmit
                ? 'bg-travia-orange text-white hover:bg-travia-orange/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            <ChevronRight className="w-4 h-4" />
            Lanjut ke Konfirmasi
          </button>
        </div>

        {/* Validation hints */}
        {!canSubmit && (orders.length > 0 || ordersLoading === false) && (
          <div className="space-y-1.5 -mt-3 pb-2">
            {!selectedOrder && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <X className="w-3 h-3 text-muted-foreground/50" />
                Pilih pesanan yang ingin direfund
              </p>
            )}
            {selectedOrder && estimate?.expired && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <X className="w-3 h-3" />
                Tanggal keberangkatan sudah lewat
              </p>
            )}
            {!isReasonValid && charCount === 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <X className="w-3 h-3 text-muted-foreground/50" />
                Isi alasan pengajuan refund
              </p>
            )}
          </div>
        )}

      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmModal
          order={selectedOrder}
          estimate={estimate}
          reason={reason}
          onConfirm={handleConfirm}
          onClose={() => !submitRefund.isPending && setShowConfirm(false)}
          isPending={submitRefund.isPending}
        />
      )}
    </>
  );
};

export default RefundNewPage;
