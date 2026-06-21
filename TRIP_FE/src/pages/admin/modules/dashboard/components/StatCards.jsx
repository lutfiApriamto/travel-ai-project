import {
  ShoppingBag, Wallet, Users, Package, AlertCircle, CalendarClock,
} from 'lucide-react';
import { cn } from '../../../../../lib/utils.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', {
    style:                 'currency',
    currency:              'IDR',
    maximumFractionDigits: 0,
  }).format(v);

const formatNum = v => new Intl.NumberFormat('id-ID').format(v);

// ─── Config ───────────────────────────────────────────────────────────────────

const STATS = [
  {
    key:       'totalOrders',
    label:     'Total Pesanan',
    sub:       'semua status',
    icon:      ShoppingBag,
    format:    formatNum,
    iconBg:    'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-500',
  },
  {
    key:       'totalRevenue',
    label:     'Total Pendapatan',
    sub:       'dari pesanan lunas',
    icon:      Wallet,
    format:    formatIDR,
    iconBg:    'bg-emerald-50 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-500',
  },
  {
    key:       'totalUsers',
    label:     'Total Pengguna',
    sub:       'akun terdaftar',
    icon:      Users,
    format:    formatNum,
    iconBg:    'bg-violet-50 dark:bg-violet-950/40',
    iconColor: 'text-violet-500',
  },
  {
    key:       'activeProducts',
    label:     'Produk Aktif',
    sub:       'tersedia dipesan',
    icon:      Package,
    format:    formatNum,
    iconBg:    'bg-orange-50 dark:bg-orange-950/40',
    iconColor: 'text-travia-orange',
  },
  {
    key:       'pendingRefunds',
    label:     'Refund Pending',
    sub:       'menunggu proses',
    icon:      AlertCircle,
    format:    formatNum,
    iconBg:    'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-500',
    alert:     true,
  },
  {
    key:       'expiringSoon',
    label:     'Berangkat ≤ 7 Hari',
    sub:       'segera berangkat',
    icon:      CalendarClock,
    format:    formatNum,
    iconBg:    'bg-rose-50 dark:bg-rose-950/40',
    iconColor: 'text-rose-500',
  },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const StatCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
    <div className="flex items-start justify-between mb-4 gap-2">
      <div className="h-3 w-24 bg-muted rounded" />
      <div className="w-8 h-8 bg-muted rounded-lg shrink-0" />
    </div>
    <div className="h-7 w-28 bg-muted rounded mb-2" />
    <div className="h-3 w-20 bg-muted rounded" />
  </div>
);

// ─── StatCards ───────────────────────────────────────────────────────────────

const StatCards = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {STATS.map(({ key, label, sub, icon: Icon, format, iconBg, iconColor, alert }) => {
        const value   = stats?.[key] ?? 0;
        const isAlert = alert && value > 0;

        return (
          <div
            key={key}
            className={cn(
              'bg-card border rounded-xl p-5 transition-colors',
              isAlert ? 'border-amber-300 dark:border-amber-700' : 'border-border',
            )}
          >
            <div className="flex items-start justify-between mb-3 gap-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
                {label}
              </p>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
                <Icon className={cn('w-4 h-4', iconColor)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-none mb-1.5 break-all">
              {format(value)}
            </p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
