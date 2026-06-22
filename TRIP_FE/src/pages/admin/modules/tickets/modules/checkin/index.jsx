import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Keyboard, CheckCircle2, XCircle, AlertTriangle,
  RotateCcw, User, Phone, Mail, MapPin, Calendar, Clock,
  Users, ArrowLeft,
} from 'lucide-react';
import { cn } from '../../../../../../lib/utils.js';
import { ROUTES } from '../../../../../../utils/consts/routes.js';
import { useCheckIn } from '../../api/useTickets.js';
import QrScanner from './components/QrScanner.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDateTime = v =>
  new Date(v).toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

// ─── Result display ───────────────────────────────────────────────────────────

const CheckInResult = ({ result, onReset }) => {
  if (result.success) {
    const { data } = result;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="space-y-4"
      >
        {/* Success header */}
        <div className="flex flex-col items-center text-center py-5 bg-emerald-50
          dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40
            flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-emerald-700 dark:text-emerald-400">
            Check-in Berhasil!
          </h2>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-500 mt-1 font-mono">
            {data.ticketCode}
          </p>
          {data.checkedInAt && (
            <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">
              {formatDateTime(data.checkedInAt)}
            </p>
          )}
        </div>

        {/* Pemegang tiket */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pemegang Tiket
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <User className="w-3.5 h-3.5 text-travia-orange shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                {data.passenger?.name ?? '—'}
              </span>
            </div>
            {data.passenger?.nik && data.passenger.nik !== '-' && (
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 shrink-0 text-[9px] font-bold text-muted-foreground
                  flex items-center justify-center">ID</span>
                <span className="text-sm font-mono text-foreground">{data.passenger.nik}</span>
              </div>
            )}
            {data.passenger?.age != null && (
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{data.passenger.age} tahun</span>
              </div>
            )}
            {data.passenger?.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{data.passenger.email}</span>
              </div>
            )}
            {data.passenger?.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{data.passenger.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info perjalanan */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Informasi Perjalanan
          </h3>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {data.trip?.productName ?? '—'}
            </p>
            {data.trip?.departureDate && (
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">
                  {formatDate(data.trip.departureDate)}
                </span>
              </div>
            )}
            {data.trip?.duration && (
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{data.trip.duration}</span>
              </div>
            )}
            {data.trip?.destinations?.length > 0 && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-travia-orange shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  {data.trip.departureCity
                    ? `${data.trip.departureCity} → ${data.trip.destinations.join(', ')}`
                    : data.trip.destinations.join(', ')}
                </span>
              </div>
            )}
            {data.trip?.meetingPoint && (
              <div className="flex items-start gap-2.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{data.trip.meetingPoint}</span>
              </div>
            )}
            {data.participants && (
              <div className="flex items-center gap-2.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{data.participants} peserta</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold
            bg-travia-orange hover:bg-travia-orange-h text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Scan Tiket Lain
        </button>
      </motion.div>
    );
  }

  // Error state
  const isAlreadyUsed = result.message?.toLowerCase().includes('sudah digunakan');
  const isInvalid     = result.message?.toLowerCase().includes('tidak valid');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className={cn(
        'flex flex-col items-center text-center py-6 rounded-2xl border',
        isAlreadyUsed
          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
      )}>
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mb-3',
          isAlreadyUsed ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-red-100 dark:bg-red-900/40',
        )}>
          {isAlreadyUsed
            ? <AlertTriangle className="w-7 h-7 text-amber-600" />
            : <XCircle className="w-7 h-7 text-red-600" />}
        </div>
        <h2 className={cn(
          'text-base font-bold',
          isAlreadyUsed ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400',
        )}>
          {isAlreadyUsed ? 'Tiket Sudah Digunakan' : isInvalid ? 'Tiket Tidak Valid' : 'Check-in Gagal'}
        </h2>
        <p className={cn(
          'text-xs mt-2 max-w-xs px-3 leading-relaxed',
          isAlreadyUsed ? 'text-amber-600/80 dark:text-amber-500' : 'text-red-600/80 dark:text-red-500',
        )}>
          {result.message}
        </p>
      </div>

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold
          border border-border text-muted-foreground hover:bg-accent transition-colors"
      >
        <RotateCcw className="w-4 h-4" /> Coba Lagi
      </button>
    </motion.div>
  );
};

// ─── CheckinPage ──────────────────────────────────────────────────────────────

const CheckinPage = () => {
  const [mode,       setMode]       = useState('scan');  // 'scan' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [result,     setResult]     = useState(null);    // null = scanning/idle
  const [scannerKey, setScannerKey] = useState(0);       // remount scanner

  const { mutate: checkIn, isPending } = useCheckIn();

  const handleTicketCode = useCallback((rawCode) => {
    const code = rawCode.trim().toUpperCase();
    checkIn(code, {
      onSuccess: (data) => setResult({ success: true, data }),
      onError:   (err)  => setResult({
        success: false,
        message: err.response?.data?.errors?.[0]?.message
          ?? 'Gagal memproses check-in. Coba lagi.',
      }),
    });
  }, [checkIn]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim() || isPending) return;
    handleTicketCode(manualCode);
  };

  const reset = () => {
    setResult(null);
    setManualCode('');
    setScannerKey(k => k + 1);
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.ADMIN.TICKETS}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border
            text-muted-foreground hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-bold text-foreground text-xl">Check-in Tiket</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Scan QR atau masukkan kode tiket</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CheckInResult result={result} onReset={reset} />
            </motion.div>
          ) : (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Mode tabs */}
              <div className="flex rounded-xl border border-border overflow-hidden">
                {[
                  { val: 'scan',   icon: QrCode,   label: 'Scan QR' },
                  { val: 'manual', icon: Keyboard,  label: 'Input Manual' },
                ].map(tab => (
                  <button
                    key={tab.val}
                    onClick={() => setMode(tab.val)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
                      mode === tab.val
                        ? 'bg-travia-orange text-white'
                        : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* QR Scanner */}
              {mode === 'scan' && (
                <div>
                  <QrScanner key={scannerKey} onScan={handleTicketCode} />
                  {isPending && (
                    <div className="mt-3 text-center">
                      <p className="text-sm text-muted-foreground animate-pulse">
                        Memproses check-in...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Manual input */}
              {mode === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Kode Tiket
                    </label>
                    <input
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value.toUpperCase())}
                      placeholder="TRIP-XXXX-XXXX"
                      maxLength={14}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-white
                        dark:bg-travia-dark3 text-sm text-foreground font-mono tracking-widest
                        placeholder:text-muted-foreground placeholder:tracking-normal
                        focus:outline-none focus:ring-1 focus:ring-travia-orange
                        focus:border-travia-orange transition-colors"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: TRIP-XXXX-XXXX (huruf kapital otomatis)
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={!manualCode.trim() || isPending}
                    className="w-full h-11 rounded-xl text-sm font-semibold flex items-center
                      justify-center gap-2 bg-travia-orange hover:bg-travia-orange-h text-white
                      disabled:opacity-50 transition-colors"
                  >
                    {isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white
                          rounded-full animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Proses Check-in'
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tips */}
      {!result && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Panduan Check-in
          </p>
          <ul className="space-y-1.5">
            {[
              'Pastikan QR Code pada tiket terlihat jelas dan tidak rusak',
              'Gunakan mode manual jika QR Code tidak terbaca oleh kamera',
              'Setiap tiket hanya dapat digunakan satu kali check-in',
              'Tiket yang sudah di-refund atau dibatalkan tidak bisa check-in',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0 mt-1.5" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CheckinPage;
