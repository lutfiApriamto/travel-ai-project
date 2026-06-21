import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../../../../lib/utils.js';
import { ROUTES } from '../../../../../utils/consts/routes.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v);

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  pending_payment: {
    label: 'Menunggu Bayar',
    cls:   'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
  },
  paid: {
    label: 'Lunas',
    cls:   'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  cancelled: {
    label: 'Dibatalkan',
    cls:   'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
  },
  refunded: {
    label: 'Direfund',
    cls:   'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3.5 animate-pulse">
    <div className="flex-1 space-y-2 min-w-0">
      <div className="h-3 w-28 bg-muted rounded" />
      <div className="h-3 w-44 bg-muted rounded" />
    </div>
    <div className="h-5 w-20 bg-muted rounded-full shrink-0" />
    <div className="hidden sm:block space-y-1.5 text-right shrink-0">
      <div className="h-3 w-20 bg-muted rounded" />
      <div className="h-3 w-16 bg-muted rounded" />
    </div>
  </div>
);

// ─── RecentOrders ─────────────────────────────────────────────────────────────

const RecentOrders = ({ orders = [], isLoading }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-foreground text-sm">Pesanan Terbaru</h2>
      <Link
        to={ROUTES.ADMIN.ORDERS}
        className="text-xs text-travia-orange hover:underline flex items-center gap-1"
      >
        Lihat semua <ArrowRight className="w-3 h-3" />
      </Link>
    </div>

    {isLoading ? (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    ) : orders.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-8">Belum ada pesanan</p>
    ) : (
      <div className="divide-y divide-border">
        {orders.map(order => {
          const st = STATUS_MAP[order.status] ?? STATUS_MAP.pending_payment;
          return (
            <Link
              key={order._id}
              to={ROUTES.ADMIN.ORDER_DETAIL(order._id)}
              className="flex items-center gap-3 py-3.5 -mx-2 px-2 rounded-lg
                hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground font-mono truncate">
                  #{order.orderCode}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {order.productSnapshot?.name || order.productId?.name || '—'}
                  {order.userId?.name && (
                    <span className="text-border"> · {order.userId.name}</span>
                  )}
                </p>
              </div>

              <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0', st.cls)}>
                {st.label}
              </span>

              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs font-semibold text-foreground">{formatIDR(order.totalPrice)}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(order.createdAt)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    )}
  </div>
);

export default RecentOrders;
