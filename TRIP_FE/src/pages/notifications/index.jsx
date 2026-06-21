import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate }                           from 'react-router-dom';
import {
  Bell, CheckCircle2, XCircle, AlertTriangle,
  Ticket, Megaphone, Banknote, Check,
  Trash2, Loader2, RefreshCw,
} from 'lucide-react';
import { cn }                from '../../lib/utils.js';
import { ROUTES }            from '../../utils/consts/routes.js';
import {
  useInfiniteNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from './api/useNotifications.js';

// ─── Notification type config ─────────────────────────────────────────────────

const TYPE_CFG = {
  order_confirmed:   {
    Icon:     CheckCircle2,
    iconCls:  'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    label:    'Pesanan Dikonfirmasi',
  },
  ticket_generated:  {
    Icon:     Ticket,
    iconCls:  'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    label:    'Tiket Diterbitkan',
  },
  order_cancelled:   {
    Icon:     XCircle,
    iconCls:  'text-red-500    dark:text-red-400    bg-red-50    dark:bg-red-950/40',
    label:    'Pesanan Dibatalkan',
  },
  refund_approved:   {
    Icon:     Banknote,
    iconCls:  'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    label:    'Refund Disetujui',
  },
  refund_rejected:   {
    Icon:     XCircle,
    iconCls:  'text-red-500    dark:text-red-400    bg-red-50    dark:bg-red-950/40',
    label:    'Refund Ditolak',
  },
  product_cancelled: {
    Icon:     AlertTriangle,
    iconCls:  'text-amber-600  dark:text-amber-400  bg-amber-50  dark:bg-amber-950/40',
    label:    'Produk Dibatalkan',
  },
  broadcast:         {
    Icon:     Megaphone,
    iconCls:  'text-blue-600   dark:text-blue-400   bg-blue-50   dark:bg-blue-950/40',
    label:    'Pengumuman',
  },
};

const DEFAULT_CFG = {
  Icon:    Bell,
  iconCls: 'text-muted-foreground bg-accent',
  label:   'Notifikasi',
};

// ─── Route mapping (navigate on click) ───────────────────────────────────────

const getNavRoute = (type, relatedId) => {
  if (!relatedId) return null;
  switch (type) {
    case 'order_confirmed':
    case 'order_cancelled':
    case 'product_cancelled':
      return ROUTES.ORDER_DETAIL(relatedId);
    case 'refund_approved':
    case 'refund_rejected':
      return ROUTES.REFUNDS;
    case 'ticket_generated':
      return ROUTES.TICKETS;
    default:
      return null;
  }
};

// ─── Relative time ────────────────────────────────────────────────────────────

const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now  = new Date();
  const then = new Date(dateStr);
  const diff = now - then;

  const min  = Math.floor(diff / 60_000);
  const hour = Math.floor(diff / 3_600_000);
  const day  = Math.floor(diff / 86_400_000);

  if (min < 1)   return 'Baru saja';
  if (min < 60)  return `${min} mnt lalu`;
  if (hour < 24) return `${hour} jam lalu`;
  if (day < 7)   return `${day} hari lalu`;
  return then.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Category & filter tabs ───────────────────────────────────────────────────

const CATEGORY_TABS = [
  { key: '',             label: 'Semua'        },
  { key: 'activity',     label: 'Aktivitas'    },
  { key: 'announcement', label: 'Pengumuman'   },
];

// ─── Notification Item ────────────────────────────────────────────────────────

const NotificationItem = ({ notif, onRead, onDelete, isDeleting }) => {
  const navigate  = useNavigate();
  const cfg       = TYPE_CFG[notif.type] ?? DEFAULT_CFG;
  const { Icon }  = cfg;

  const navRoute  = getNavRoute(notif.type, notif.relatedId);
  const isUnread  = !notif.isRead;

  const handleClick = () => {
    if (isUnread) onRead(notif._id);
    if (navRoute) navigate(navRoute);
  };

  return (
    <div className={cn(
      'group relative flex gap-4 px-4 py-4 transition-colors',
      'border-b border-border last:border-b-0',
      isUnread ? 'bg-travia-orange/5 hover:bg-travia-orange/8' : 'hover:bg-accent/40',
      navRoute ? 'cursor-pointer' : '',
    )}
      onClick={handleClick}
      role={navRoute ? 'button' : undefined}
      tabIndex={navRoute ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2
          w-1.5 h-1.5 rounded-full bg-travia-orange shrink-0" />
      )}

      {/* Type icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
        cfg.iconCls,
      )}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm leading-snug',
            isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground',
          )}>
            {notif.title}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
            {getRelativeTime(notif.createdAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
          {notif.message}
        </p>
        {navRoute && (
          <p className="text-[10px] text-travia-orange mt-1.5 font-medium">
            Ketuk untuk lihat detail →
          </p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notif._id, isUnread);
        }}
        disabled={isDeleting}
        title="Hapus notifikasi"
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
          opacity-0 group-hover:opacity-100 focus:opacity-100
          text-muted-foreground hover:text-red-500 hover:bg-red-50
          dark:hover:bg-red-950/30 disabled:opacity-50
          transition-all duration-150"
      >
        {isDeleting
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const NotifSkeleton = () => (
  <div className="flex gap-4 px-4 py-4 border-b border-border animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex justify-between gap-2">
        <div className="h-3.5 w-40 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
      <div className="h-3 w-full bg-muted rounded" />
      <div className="h-3 w-2/3 bg-muted rounded" />
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ category, showUnreadOnly }) => {
  const msgs = {
    unread:       { title: 'Tidak ada yang belum dibaca',  sub: 'Semua notifikasi sudah kamu baca.' },
    activity:     { title: 'Belum ada aktivitas',          sub: 'Notifikasi transaksimu akan muncul di sini.' },
    announcement: { title: 'Belum ada pengumuman',         sub: 'Pengumuman dari Travia akan muncul di sini.' },
    all:          { title: 'Belum ada notifikasi',         sub: 'Kamu akan mendapat notifikasi setelah melakukan transaksi.' },
  };

  const key = showUnreadOnly ? 'unread' : category || 'all';
  const { title, sub } = msgs[key] ?? msgs.all;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <Bell className="w-12 h-12 text-muted-foreground/20 mb-4" />
      <p className="font-semibold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{sub}</p>
    </div>
  );
};

// ─── NotificationsPage ────────────────────────────────────────────────────────

const NotificationsPage = () => {
  const [category,      setCategory]      = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);

  const sentinelRef = useRef(null);

  // Hooks
  useUnreadCount(true);           // fetch + sync to Zustand
  const markAsRead    = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotif   = useDeleteNotification();

  const filters = useMemo(() => ({
    category:  category  || undefined,
    isRead:    showUnreadOnly ? false : undefined,
  }), [category, showUnreadOnly]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteNotifications(filters);

  const allNotifs = useMemo(
    () => data?.pages.flatMap((p) => p.notifications) ?? [],
    [data],
  );

  const hasUnread = allNotifs.some((n) => !n.isRead);

  // ── IntersectionObserver for infinite scroll ──────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRead = (id) => {
    if (markAsRead.isPending) return;
    markAsRead.mutate(id);
  };

  const handleDelete = (id, wasUnread) => {
    setDeletingId(id);
    deleteNotif.mutate(
      { notificationId: id, wasUnread },
      { onSettled: () => setDeletingId(null) },
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
            Notifikasi
          </h1>
          {!isLoading && allNotifs.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {allNotifs.length} notifikasi
            </p>
          )}
        </div>

        {/* Mark all as read */}
        {hasUnread && (
          <button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border
              text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground
              disabled:opacity-50 transition-colors shrink-0"
          >
            {markAllAsRead.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Check className="w-3.5 h-3.5" />}
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              className={cn(
                'h-8 px-4 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0',
                category === tab.key
                  ? 'bg-travia-orange text-white border-travia-orange'
                  : 'border-border text-muted-foreground hover:border-travia-orange/50 hover:text-travia-orange',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Unread filter toggle */}
        <button
          onClick={() => setShowUnreadOnly((v) => !v)}
          className={cn(
            'ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium',
            'transition-colors shrink-0',
            showUnreadOnly
              ? 'border-travia-orange text-travia-orange bg-travia-orange/10'
              : 'border-border text-muted-foreground hover:border-travia-orange/50 hover:text-travia-orange',
          )}
        >
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            showUnreadOnly ? 'bg-travia-orange' : 'bg-muted-foreground/50',
          )} />
          Belum Dibaca
        </button>
      </div>

      {/* Notification list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => <NotifSkeleton key={i} />)}
          </div>
        ) : allNotifs.length === 0 ? (
          <EmptyState category={category} showUnreadOnly={showUnreadOnly} />
        ) : (
          <>
            {allNotifs.map((notif) => (
              <NotificationItem
                key={notif._id}
                notif={notif}
                onRead={handleRead}
                onDelete={handleDelete}
                isDeleting={deletingId === notif._id}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />

            {/* Load more indicator */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-travia-orange" />
              </div>
            )}

            {/* End of list */}
            {!hasNextPage && allNotifs.length > 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                Semua notifikasi sudah ditampilkan
              </p>
            )}
          </>
        )}
      </div>

      {/* Refresh hint */}
      {!isLoading && allNotifs.length === 0 && !showUnreadOnly && !category && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground
              hover:text-travia-orange transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat ulang
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
