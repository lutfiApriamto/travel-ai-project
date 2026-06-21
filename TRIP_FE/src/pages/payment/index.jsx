import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link }             from 'react-router-dom';
import { useQueryClient }                            from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, Clock, Loader2, RefreshCw,
  CreditCard, ExternalLink, Ticket, ShoppingBag,
  ChevronRight, MapPin, Calendar, Users, AlertCircle,
} from 'lucide-react';
import toast            from 'react-hot-toast';
import { cn }           from '../../lib/utils.js';
import { ROUTES }       from '../../utils/consts/routes.js';
import { useOrderDetail, useCreatePayment, usePaymentStatus } from './api/usePayment.js';

// ─── Env ──────────────────────────────────────────────────────────────────────

const MIDTRANS_CLIENT_KEY  = import.meta.env.VITE_MIDTRANS_CLIENT_KEY  ?? '';
const MIDTRANS_IS_PROD     = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
const SNAP_SCRIPT_URL      = MIDTRANS_IS_PROD
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

// ─── Polling timeout ──────────────────────────────────────────────────────────

const POLL_TIMEOUT_MS = 45_000; // 45 detik sebelum tampilkan "timeout"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

// ─── Load Midtrans Snap.js ────────────────────────────────────────────────────

const loadSnapScript = () =>
  new Promise((resolve, reject) => {
    if (window.snap) { resolve(); return; }

    // Cek apakah script sudah ada di DOM
    if (document.querySelector(`script[src="${SNAP_SCRIPT_URL}"]`)) {
      // Script sedang loading — tunggu event load
      const existing = document.querySelector(`script[src="${SNAP_SCRIPT_URL}"]`);
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src   = SNAP_SCRIPT_URL;
    if (MIDTRANS_CLIENT_KEY) script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat script Midtrans'));
    document.head.appendChild(script);
  });

// ─── Order Summary Card ───────────────────────────────────────────────────────

const OrderSummaryCard = ({ order }) => {
  if (!order) return null;

  const snap = order.productSnapshot ?? {};

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Detail Pesanan
        </p>
        <p className="font-mono text-sm font-bold text-foreground mt-0.5">
          #{order.orderCode}
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Thumbnail + name */}
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
            {snap.thumbnail ? (
              <img src={snap.thumbnail} alt={snap.name}
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
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {snap.departureDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(snap.departureDate)}
                </span>
              )}
              {snap.departureCity && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {snap.departureCity}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              Peserta
            </span>
            <span className="font-medium text-foreground">{order.participants} orang</span>
          </div>

          {order.addOns?.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Add-on</span>
              <span className="font-medium text-foreground text-right max-w-[160px] text-xs">
                {order.addOns.map((a) => a.name).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-border pt-3 flex justify-between items-center">
          <span className="font-semibold text-foreground">Total Pembayaran</span>
          <span className="font-bold text-travia-orange text-xl">
            {formatIDR(order.totalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Phase screens ────────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="flex flex-col items-center py-14 gap-4">
    <Loader2 className="w-10 h-10 text-travia-orange animate-spin" />
    <p className="text-sm text-muted-foreground">Mempersiapkan pembayaran...</p>
  </div>
);

const SuccessScreen = ({ order, navigate }) => (
  <div className="flex flex-col items-center py-12 gap-5 text-center">
    <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40
      flex items-center justify-center">
      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
    </div>
    <div>
      <h2 className="font-serif italic text-2xl text-foreground mb-1">
        Pembayaran Berhasil!
      </h2>
      <p className="text-sm text-muted-foreground">
        Pesanan <span className="font-semibold text-foreground">#{order?.orderCode}</span> telah dikonfirmasi.
        E-tiket kamu sudah tersedia.
      </p>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
      <button
        onClick={() => navigate(ROUTES.TICKETS)}
        className="flex-1 h-11 rounded-xl bg-travia-orange text-white font-semibold text-sm
          hover:bg-travia-orange/90 transition-colors flex items-center justify-center gap-2"
      >
        <Ticket className="w-4 h-4" />
        Lihat Tiket
      </button>
      <button
        onClick={() => navigate(ROUTES.ORDERS)}
        className="flex-1 h-11 rounded-xl border border-border text-sm font-medium
          text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2"
      >
        Pesanan Saya
      </button>
    </div>
  </div>
);

const CancelledScreen = ({ navigate }) => (
  <div className="flex flex-col items-center py-12 gap-5 text-center">
    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/40
      flex items-center justify-center">
      <XCircle className="w-10 h-10 text-red-500" />
    </div>
    <div>
      <h2 className="font-serif italic text-2xl text-foreground mb-1">
        Pesanan Dibatalkan
      </h2>
      <p className="text-sm text-muted-foreground">
        Pesanan ini sudah kedaluwarsa atau dibatalkan. Silakan buat pesanan baru.
      </p>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
      <button
        onClick={() => navigate(ROUTES.PRODUCTS)}
        className="flex-1 h-11 rounded-xl bg-travia-orange text-white font-semibold text-sm
          hover:bg-travia-orange/90 transition-colors flex items-center justify-center gap-2"
      >
        <ShoppingBag className="w-4 h-4" />
        Cari Produk
      </button>
      <button
        onClick={() => navigate(ROUTES.ORDERS)}
        className="flex-1 h-11 rounded-xl border border-border text-sm font-medium
          text-foreground hover:bg-accent transition-colors"
      >
        Pesanan Saya
      </button>
    </div>
  </div>
);

const PollingScreen = () => (
  <div className="flex flex-col items-center py-14 gap-5 text-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-full bg-travia-orange/10 flex items-center justify-center">
        <CreditCard className="w-7 h-7 text-travia-orange" />
      </div>
      <Loader2 className="absolute -top-1 -right-1 w-6 h-6 text-travia-orange animate-spin" />
    </div>
    <div>
      <h2 className="font-semibold text-foreground mb-1">Mengonfirmasi Pembayaran</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Kami sedang memverifikasi pembayaranmu. Mohon tunggu sebentar...
      </p>
    </div>
    <div className="flex gap-1 mt-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-travia-orange animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  </div>
);

const TimeoutScreen = ({ onCheckStatus, onReopen, paymentUrl, isChecking }) => (
  <div className="flex flex-col items-center py-12 gap-5 text-center">
    <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/40
      flex items-center justify-center">
      <Clock className="w-10 h-10 text-amber-500" />
    </div>
    <div>
      <h2 className="font-serif italic text-xl text-foreground mb-1">
        Menunggu Konfirmasi
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Pembayaran mungkin masih diproses. Cek status atau lanjutkan pembayaran jika belum selesai.
      </p>
    </div>
    <div className="flex flex-col gap-2.5 w-full max-w-xs">
      <button
        onClick={onCheckStatus}
        disabled={isChecking}
        className="w-full h-10 rounded-xl bg-travia-orange text-white text-sm font-semibold
          hover:bg-travia-orange/90 transition-colors flex items-center justify-center gap-2
          disabled:opacity-60"
      >
        {isChecking
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <RefreshCw className="w-4 h-4" />}
        Cek Status Pembayaran
      </button>
      <button
        onClick={onReopen}
        className="w-full h-10 rounded-xl border border-border text-sm font-medium
          text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4" />
        Lanjutkan Pembayaran
      </button>
      {paymentUrl && (
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-10 rounded-xl border border-border text-sm text-muted-foreground
            hover:bg-accent transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Buka di Halaman Midtrans
        </a>
      )}
    </div>
  </div>
);

const ReadyScreen = ({ onOpenSnap, isCreating, order, paymentUrl }) => (
  <div className="flex flex-col items-center py-10 gap-5 text-center">
    <div className="w-16 h-16 rounded-full bg-travia-orange/10 flex items-center justify-center">
      <CreditCard className="w-8 h-8 text-travia-orange" />
    </div>
    <div>
      <h2 className="font-semibold text-foreground mb-1">Siap untuk Bayar</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Klik tombol di bawah untuk membuka jendela pembayaran.
      </p>
    </div>
    <div className="flex flex-col gap-2.5 w-full max-w-xs">
      <button
        onClick={onOpenSnap}
        disabled={isCreating}
        className="w-full h-11 rounded-xl bg-travia-orange text-white font-semibold text-sm
          hover:bg-travia-orange/90 transition-colors flex items-center justify-center gap-2
          disabled:opacity-60"
      >
        {isCreating
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <CreditCard className="w-4 h-4" />}
        Bayar Sekarang · {formatIDR(order?.totalPrice)}
      </button>
      {paymentUrl && (
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-10 rounded-xl border border-border text-sm text-muted-foreground
            hover:bg-accent transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Atau bayar via Midtrans
        </a>
      )}
    </div>
    <p className="text-[11px] text-muted-foreground">
      Didukung: Transfer Bank, GoPay, ShopeePay, QRIS, Kartu Kredit
    </p>
  </div>
);

const ErrorScreen = ({ message, onRetry }) => (
  <div className="flex flex-col items-center py-12 gap-4 text-center">
    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40
      flex items-center justify-center">
      <AlertCircle className="w-8 h-8 text-red-500" />
    </div>
    <div>
      <h2 className="font-semibold text-foreground mb-1">Terjadi Masalah</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        {message ?? 'Pembayaran tidak berhasil. Silakan coba lagi.'}
      </p>
    </div>
    <button
      onClick={onRetry}
      className="h-10 px-6 rounded-xl bg-travia-orange text-white text-sm font-semibold
        hover:bg-travia-orange/90 transition-colors flex items-center gap-2"
    >
      <RefreshCw className="w-4 h-4" />
      Coba Lagi
    </button>
  </div>
);

// ─── PaymentPage ──────────────────────────────────────────────────────────────

// Phase flow:
// 'initializing' → fetch order & load Snap.js
// 'creating'     → calling POST /payment/create/:orderId
// 'ready'        → token ready, waiting user interaction or auto-opening
// 'polling'      → user paid, waiting webhook confirmation
// 'success'      → order.status === 'paid'
// 'cancelled'    → order.status === 'cancelled'
// 'timeout'      → polling exceeded 45s with no result
// 'failed'       → Snap.js onError callback
// 'snap_error'   → failed to load Snap.js

const PaymentPage = () => {
  const { orderId }   = useParams();
  const navigate      = useNavigate();
  const qc            = useQueryClient();

  const [phase,       setPhase]       = useState('initializing');
  const [snapReady,   setSnapReady]   = useState(false);
  const [snapToken,   setSnapToken]   = useState(null);
  const [paymentUrl,  setPaymentUrl]  = useState(null);
  const [errorMsg,    setErrorMsg]    = useState(null);
  const [isPolling,   setIsPolling]   = useState(false);
  const [isChecking,  setIsChecking]  = useState(false);

  const pollTimeoutRef = useRef(null);

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { data: order, isLoading: orderLoading } = useOrderDetail(orderId);
  const createPayment = useCreatePayment();
  const { data: statusData } = usePaymentStatus(orderId, isPolling);

  // ── 1. Load Midtrans Snap.js ────────────────────────────────────────────────
  useEffect(() => {
    if (!MIDTRANS_CLIENT_KEY) {
      console.warn('[Payment] VITE_MIDTRANS_CLIENT_KEY tidak dikonfigurasi');
    }
    loadSnapScript()
      .then(() => setSnapReady(true))
      .catch((err) => {
        console.error('[Payment] Gagal load Snap.js:', err.message);
        setPhase('snap_error');
      });
  }, []);

  // ── 2. React ke order data ──────────────────────────────────────────────────
  useEffect(() => {
    if (orderLoading || !order) return;

    if (order.status === 'paid') {
      setPhase('success');
      return;
    }
    if (order.status === 'cancelled' || order.status === 'refunded') {
      setPhase('cancelled');
      return;
    }

    // Order masih pending_payment → butuh payment token
    if (order.status === 'pending_payment' && phase === 'initializing') {
      setPhase('creating');
    }
  }, [order, orderLoading]); // eslint-disable-line

  // ── 3. Buat payment token (jika phase === 'creating') ──────────────────────
  useEffect(() => {
    if (phase !== 'creating' || !orderId) return;

    createPayment.mutate(orderId, {
      onSuccess: ({ snapToken: token, paymentUrl: url }) => {
        setSnapToken(token);
        setPaymentUrl(url);
        setPhase('ready');
      },
      onError: (e) => {
        const msg = e.response?.data?.data?.message ?? 'Gagal membuat token pembayaran';
        setErrorMsg(msg);
        setPhase('failed');
      },
    });
  }, [phase]); // eslint-disable-line

  // ── 4. Auto-open Snap ketika ready ─────────────────────────────────────────
  useEffect(() => {
    if (phase === 'ready' && snapReady && snapToken) {
      openSnap(snapToken);
    }
  }, [phase, snapReady, snapToken]); // eslint-disable-line

  // ── 5. React ke status polling ─────────────────────────────────────────────
  useEffect(() => {
    if (!statusData) return;

    if (statusData.orderStatus === 'paid') {
      clearTimeout(pollTimeoutRef.current);
      setIsPolling(false);
      setPhase('success');
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      return;
    }

    if (statusData.orderStatus === 'cancelled') {
      clearTimeout(pollTimeoutRef.current);
      setIsPolling(false);
      setPhase('cancelled');
    }
  }, [statusData, orderId, qc]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => clearTimeout(pollTimeoutRef.current), []);

  // ── Open Snap popup ─────────────────────────────────────────────────────────
  const openSnap = useCallback((token) => {
    if (!window.snap || !token) return;

    window.snap.pay(token, {
      onSuccess: () => startPolling(),
      onPending: () => startPolling(),
      onError:   (result) => {
        const msg = result?.status_message ?? 'Pembayaran tidak berhasil';
        setErrorMsg(msg);
        setPhase('failed');
      },
      onClose: () => {
        // User menutup popup tanpa bayar → kembali ke ready
        setPhase('ready');
      },
    });
  }, []); // eslint-disable-line

  // ── Start polling ───────────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    setIsPolling(true);
    setPhase('polling');

    pollTimeoutRef.current = setTimeout(() => {
      setIsPolling(false);
      setPhase('timeout');
    }, POLL_TIMEOUT_MS);
  }, []);

  // ── Manual status check (timeout screen) ───────────────────────────────────
  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const { default: api } = await import('../../lib/axios.js');
      const r = await api.get(`/payment/status/${orderId}`);
      const d = r.data.data.data;

      if (d?.orderStatus === 'paid') {
        setPhase('success');
        qc.invalidateQueries({ queryKey: ['order', orderId] });
        qc.invalidateQueries({ queryKey: ['orders'] });
        qc.invalidateQueries({ queryKey: ['tickets'] });
        toast.success('Pembayaran dikonfirmasi!');
      } else {
        toast('Status pembayaran masih menunggu konfirmasi.', { icon: '⏳' });
      }
    } catch {
      toast.error('Gagal mengecek status pembayaran');
    } finally {
      setIsChecking(false);
    }
  };

  // ── Retry (failed screen) ────────────────────────────────────────────────
  const handleRetry = () => {
    setErrorMsg(null);
    setPhase('creating');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const renderPhaseContent = () => {
    switch (phase) {
      case 'initializing':
      case 'creating':
        return <LoadingScreen />;

      case 'ready':
        return (
          <ReadyScreen
            onOpenSnap={() => snapToken && openSnap(snapToken)}
            isCreating={createPayment.isPending}
            order={order}
            paymentUrl={paymentUrl}
          />
        );

      case 'polling':
        return <PollingScreen />;

      case 'success':
        return <SuccessScreen order={order} navigate={navigate} />;

      case 'cancelled':
        return <CancelledScreen navigate={navigate} />;

      case 'timeout':
        return (
          <TimeoutScreen
            onCheckStatus={handleManualCheck}
            onReopen={() => snapToken && openSnap(snapToken)}
            paymentUrl={paymentUrl}
            isChecking={isChecking}
          />
        );

      case 'failed':
        return <ErrorScreen message={errorMsg} onRetry={handleRetry} />;

      case 'snap_error':
        return (
          <ErrorScreen
            message="Gagal memuat sistem pembayaran Midtrans. Coba gunakan link pembayaran alternatif."
            onRetry={() => window.location.reload()}
          />
        );

      default:
        return <LoadingScreen />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
        <Link to={ROUTES.HOME}   className="hover:text-foreground transition-colors">Beranda</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={ROUTES.ORDERS} className="hover:text-foreground transition-colors">Pesanan</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">Pembayaran</span>
      </nav>

      <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground mb-6">Pembayaran</h1>

      {/* No client key warning (dev only) */}
      {!MIDTRANS_CLIENT_KEY && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-amber-50
          dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50
          text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Dev:</strong> VITE_MIDTRANS_CLIENT_KEY belum dikonfigurasi di <code>.env</code>.
            Tambahkan untuk mengaktifkan pembayaran.
          </span>
        </div>
      )}

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* Phase content */}
        <div className="bg-card border border-border rounded-2xl min-h-[340px]
          flex items-center justify-center">
          <div className="w-full px-4 py-2">
            {renderPhaseContent()}
          </div>
        </div>

        {/* Order summary */}
        <div>
          {orderLoading ? (
            <div className="bg-card border border-border rounded-2xl h-72 animate-pulse" />
          ) : (
            <div className="space-y-4">
              <OrderSummaryCard order={order} />

              {/* Other pending orders hint (if came from checkout with multiple) */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Pintasan
                </p>
                <div className="space-y-1">
                  <Link to={ROUTES.ORDERS}
                    className="flex items-center justify-between text-sm text-foreground
                      hover:text-travia-orange transition-colors py-1.5">
                    Pesanan Saya
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link to={ROUTES.TICKETS}
                    className="flex items-center justify-between text-sm text-foreground
                      hover:text-travia-orange transition-colors py-1.5">
                    Tiket Saya
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
