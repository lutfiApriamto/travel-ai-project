import { Link }            from 'react-router-dom';
import {
  ShieldCheck, Clock, AlertCircle,
  CheckCircle2, XCircle, ChevronRight,
  FileText, ClipboardList, Send, RefreshCcw,
} from 'lucide-react';
import { cn }               from '../../../lib/utils.js';
import { ROUTES }           from '../../../utils/consts/routes.js';
import { useRefundPolicy }  from '../api/useRefunds.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

// ─── Tier config ──────────────────────────────────────────────────────────────

const getTierStyle = (pct) => {
  const n = Number(pct);
  if (n === 100) return {
    bg:      'bg-emerald-50 dark:bg-emerald-950/30',
    border:  'border-emerald-200 dark:border-emerald-800/50',
    badge:   'bg-emerald-500',
    text:    'text-emerald-700 dark:text-emerald-300',
    pctCls:  'text-emerald-600 dark:text-emerald-400',
    Icon:    CheckCircle2,
    iconCls: 'text-emerald-500',
  };
  if (n >= 50) return {
    bg:      'bg-blue-50 dark:bg-blue-950/30',
    border:  'border-blue-200 dark:border-blue-800/50',
    badge:   'bg-blue-500',
    text:    'text-blue-700 dark:text-blue-300',
    pctCls:  'text-blue-600 dark:text-blue-400',
    Icon:    CheckCircle2,
    iconCls: 'text-blue-500',
  };
  if (n > 0) return {
    bg:      'bg-amber-50 dark:bg-amber-950/30',
    border:  'border-amber-200 dark:border-amber-800/50',
    badge:   'bg-amber-500',
    text:    'text-amber-700 dark:text-amber-300',
    pctCls:  'text-amber-600 dark:text-amber-400',
    Icon:    AlertCircle,
    iconCls: 'text-amber-500',
  };
  return {
    bg:      'bg-red-50 dark:bg-red-950/30',
    border:  'border-red-200 dark:border-red-800/50',
    badge:   'bg-red-500',
    text:    'text-red-700 dark:text-red-300',
    pctCls:  'text-red-600 dark:text-red-400',
    Icon:    XCircle,
    iconCls: 'text-red-500',
  };
};

const rangeLabel = (min, max) => {
  const minD = Number(min);
  const maxD = max === null ? null : Number(max);
  if (maxD === null) return `H-${minD} atau lebih sebelum keberangkatan`;
  if (minD === maxD)  return `Tepat H-${minD} sebelum keberangkatan`;
  return `H-${minD} hingga H-${maxD} sebelum keberangkatan`;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const TierSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-4 w-20 bg-muted rounded-full" />
        <div className="h-14 w-24 bg-muted rounded-xl" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Tier Card ────────────────────────────────────────────────────────────────

const TierCard = ({ rule, index }) => {
  const style = getTierStyle(rule.refundPercentage);
  const { Icon } = style;

  return (
    <div className={cn(
      'relative rounded-2xl border p-6 flex flex-col gap-4 transition-shadow hover:shadow-md',
      style.bg, style.border,
    )}>
      {/* Nomor urut */}
      <span className={cn(
        'absolute top-4 right-4 w-6 h-6 rounded-full text-[10px] font-bold text-white',
        'flex items-center justify-center', style.badge,
      )}>
        {index + 1}
      </span>

      {/* Icon */}
      <Icon className={cn('w-6 h-6', style.iconCls)} />

      {/* Persentase */}
      <div>
        <p className={cn('text-5xl font-bold tracking-tight leading-none', style.pctCls)}>
          {rule.refundPercentage}<span className="text-2xl">%</span>
        </p>
        <p className={cn('text-xs font-semibold mt-1 uppercase tracking-wide', style.text)}>
          {rule.refundPercentage === 0 ? 'Tidak ada refund' : 'Refund dikembalikan'}
        </p>
      </div>

      {/* Rentang waktu */}
      <p className={cn('text-sm font-medium leading-snug', style.text)}>
        {rangeLabel(rule.minDaysBeforeDeparture, rule.maxDaysBeforeDeparture)}
      </p>

      {/* Deskripsi */}
      {rule.description && (
        <p className={cn('text-xs leading-relaxed opacity-75', style.text)}>
          {rule.description}
        </p>
      )}
    </div>
  );
};

// ─── Syarat & Ketentuan ───────────────────────────────────────────────────────

const SYARAT = [
  'Hanya order dengan status lunas (paid) yang dapat diajukan refund.',
  'Refund tidak dapat diajukan apabila tanggal keberangkatan sudah terlewat.',
  'Setiap order hanya dapat diajukan satu kali pengajuan refund.',
  'Persentase refund dihitung berdasarkan selisih hari antara tanggal pengajuan dan tanggal keberangkatan.',
  'Proses persetujuan refund dilakukan oleh admin dalam waktu maksimal 3×24 jam kerja.',
  'Dana refund dikembalikan melalui metode pembayaran asal dalam 7–14 hari kerja setelah disetujui.',
];

// ─── Langkah Pengajuan ────────────────────────────────────────────────────────

const STEPS = [
  {
    Icon: ClipboardList,
    title: 'Cek Pesanan Anda',
    desc:  'Buka halaman Pesanan Saya dan pilih order yang ingin diajukan refund. Pastikan status order adalah "Lunas".',
  },
  {
    Icon: FileText,
    title: 'Isi Formulir Refund',
    desc:  'Klik tombol "Ajukan Refund" pada detail pesanan, lalu isi alasan pengajuan secara lengkap dan jelas.',
  },
  {
    Icon: Send,
    title: 'Kirim Pengajuan',
    desc:  'Sistem akan menghitung estimasi refund berdasarkan kebijakan di atas dan mengirimkan email konfirmasi.',
  },
  {
    Icon: RefreshCcw,
    title: 'Tunggu Proses Admin',
    desc:  'Admin akan meninjau pengajuan dalam 3×24 jam. Anda akan mendapat notifikasi & email saat status berubah.',
  },
];

// ─── RefundPolicyPage (User) ──────────────────────────────────────────────────

const RefundPolicyPage = () => {
  const { data: policy, isLoading } = useRefundPolicy();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-travia-orange/10 via-background to-background
        border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
            <Link to={ROUTES.HOME} className="hover:text-foreground transition-colors">Beranda</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Kebijakan Refund</span>
          </nav>

          <div className="flex items-start gap-5">
            <span className="w-14 h-14 rounded-2xl bg-travia-orange/10 flex items-center
              justify-center shrink-0 text-travia-orange mt-1">
              <ShieldCheck className="w-7 h-7" />
            </span>
            <div>
              <h1 className="font-serif italic text-3xl sm:text-4xl text-foreground leading-tight">
                Kebijakan Refund
              </h1>
              <p className="mt-3 text-muted-foreground text-base leading-relaxed max-w-2xl">
                Travia berkomitmen untuk memberikan pengalaman perjalanan terbaik.
                Apabila Anda perlu membatalkan perjalanan, kami memiliki kebijakan refund
                yang transparan berdasarkan jarak waktu pembatalan.
              </p>
              {policy?.updatedAt && (
                <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Terakhir diperbarui: {formatDate(policy.updatedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* ── Tabel Persentase Refund ─────────────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <h2 className="font-serif italic text-2xl text-foreground">Persentase Refund</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Refund dihitung berdasarkan jumlah hari sebelum tanggal keberangkatan saat pengajuan dilakukan.
            </p>
          </div>

          {isLoading ? (
            <TierSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {(policy?.rules ?? []).map((rule, i) => (
                <TierCard key={i} rule={rule} index={i} />
              ))}
            </div>
          )}

          {/* Info note */}
          <div className="mt-5 flex gap-3 p-4 rounded-xl bg-accent border border-border text-sm">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground leading-relaxed">
              Contoh: Jika keberangkatan pada tanggal 20 dan Anda mengajukan refund pada tanggal 5
              (selisih 15 hari), maka Anda berhak mendapat refund <strong className="text-foreground">100%</strong>.
            </p>
          </div>
        </section>

        {/* ── Syarat & Ketentuan ──────────────────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <h2 className="font-serif italic text-2xl text-foreground">Syarat & Ketentuan</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Pastikan pesanan Anda memenuhi persyaratan berikut sebelum mengajukan refund.
            </p>
          </div>

          <ul className="space-y-3">
            {SYARAT.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-travia-orange/10 text-travia-orange
                  flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Cara Pengajuan ──────────────────────────────────────────────────── */}
        <section>
          <div className="mb-8">
            <h2 className="font-serif italic text-2xl text-foreground">Cara Mengajukan Refund</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ikuti langkah-langkah berikut untuk mengajukan refund dengan mudah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ Icon, title, desc }, i) => (
              <div key={i} className="flex flex-col gap-4">
                {/* Icon + step number */}
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-travia-orange/10 text-travia-orange
                    flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                  {/* Connector line (except last) */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block flex-1 h-px bg-border" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-travia-orange uppercase tracking-wider mb-1">
                    Langkah {i + 1}
                  </p>
                  <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-travia-orange/10 to-amber-500/5
          border border-travia-orange/20 rounded-2xl p-8 text-center">
          <ShieldCheck className="w-10 h-10 text-travia-orange mx-auto mb-4" />
          <h3 className="font-serif italic text-xl text-foreground mb-2">
            Siap mengajukan refund?
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Buka halaman pesanan Anda, pilih order yang ingin dicancel, dan klik tombol "Ajukan Refund".
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={ROUTES.ORDERS}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl
                bg-travia-orange text-white text-sm font-semibold
                hover:bg-travia-orange/90 transition-colors"
            >
              Lihat Pesanan Saya
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to={ROUTES.REFUNDS}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl
                border border-border text-sm font-medium text-muted-foreground
                hover:bg-accent hover:text-foreground transition-colors"
            >
              Riwayat Refund Saya
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};

export default RefundPolicyPage;
