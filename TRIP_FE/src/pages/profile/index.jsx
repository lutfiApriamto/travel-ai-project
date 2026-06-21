import { Link }          from 'react-router-dom';
import {
  Mail, Phone, Calendar, Shield, Edit3,
  KeyRound, Package, Ticket, Heart, RotateCcw,
  ChevronRight, AlertTriangle, User,
} from 'lucide-react';
import { cn }            from '../../lib/utils.js';
import { ROUTES }        from '../../utils/consts/routes.js';
import { useAuthStore }  from '../../stores/useAuthStore.js';
import { useMyProfile }  from './api/useProfile.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

// Warna avatar berdasarkan huruf pertama nama
const AVATAR_COLORS = [
  'bg-blue-500',    'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500',   'bg-rose-500',   'bg-cyan-500',
  'bg-indigo-500',  'bg-pink-500',   'bg-teal-500',
];

const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  const idx = name.toUpperCase().charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar = ({ user, size = 'lg' }) => {
  const sizeMap = {
    lg:  'w-24 h-24 sm:w-28 sm:h-28 text-3xl',
    sm:  'w-10 h-10 text-base',
  };

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={cn('rounded-full object-cover ring-4 ring-card shadow-md', sizeMap[size])}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center ring-4 ring-card shadow-md',
      'font-bold text-white select-none',
      getAvatarColor(user?.name),
      sizeMap[size],
    )}>
      {getInitials(user?.name)}
    </div>
  );
};

// ─── Quick Nav Links ──────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'Pesanan Saya', Icon: Package,  to: ROUTES.ORDERS,   color: 'text-blue-600  dark:text-blue-400  bg-blue-50  dark:bg-blue-950/40'  },
  { label: 'Tiket Saya',   Icon: Ticket,   to: ROUTES.TICKETS,  color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
  { label: 'Wishlist',     Icon: Heart,    to: ROUTES.WISHLIST, color: 'text-rose-500  dark:text-rose-400   bg-rose-50  dark:bg-rose-950/40'   },
  { label: 'Riwayat Refund', Icon: RotateCcw, to: ROUTES.REFUNDS, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="space-y-5 animate-pulse">
    {/* Hero */}
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-24 h-24 rounded-full bg-muted shrink-0" />
        <div className="space-y-3 flex-1 w-full">
          <div className="h-6 w-40 bg-muted rounded mx-auto sm:mx-0" />
          <div className="h-4 w-28 bg-muted rounded mx-auto sm:mx-0" />
          <div className="h-8 w-24 bg-muted rounded-full mx-auto sm:mx-0" />
        </div>
      </div>
    </div>
    {/* Info */}
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-muted rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-4 w-40 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── ProfilePage ──────────────────────────────────────────────────────────────

const ProfilePage = () => {
  // Baca dari Zustand dulu (instan) → lalu background sync dari API
  const userFromStore = useAuthStore((s) => s.user);
  const { data: userFromApi, isLoading } = useMyProfile();

  // Gabungkan: API data lebih fresh, fallback ke store
  const user = userFromApi ?? userFromStore;

  if (isLoading && !user) return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8"><Skeleton /></div>
  );

  const isSuspended = user?.isActive === false;
  const memberSince = formatDate(user?.createdAt);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">

      {/* Suspended banner */}
      {isSuspended && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20
          border border-red-200 dark:border-red-800/50">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-300 text-sm">
              Akun Disuspend
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 leading-relaxed">
              Akun kamu sedang disuspend oleh admin. Hubungi support jika ada pertanyaan.
            </p>
          </div>
        </div>
      )}

      {/* ── Hero Card ──────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Top gradient banner */}
        <div className="h-20 bg-gradient-to-r from-travia-orange/20 to-amber-400/10" />

        {/* Avatar + name area */}
        <div className="px-5 pb-5 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

            {/* Avatar */}
            <div className="flex flex-col items-center sm:items-start gap-3">
              <Avatar user={user} size="lg" />
              <div className="text-center sm:text-left">
                <h1 className="font-bold text-foreground text-xl leading-tight">
                  {user?.name ?? '—'}
                </h1>
                <p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p>
              </div>
            </div>

            {/* Status badge + member since */}
            <div className="flex flex-col items-center sm:items-end gap-1.5 pb-1">
              <span className={cn(
                'flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border',
                !isSuspended
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50',
              )}>
                <Shield className="w-3 h-3 shrink-0" />
                {isSuspended ? 'Disuspend' : 'Aktif'}
              </span>
              {memberSince && (
                <p className="text-[10px] text-muted-foreground">
                  Bergabung {memberSince}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Account Info ───────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Informasi Akun
        </p>

        {[
          {
            Icon:  Mail,
            label: 'Email',
            value: user?.email ?? '—',
            note:  'Tidak dapat diubah',
          },
          {
            Icon:  Phone,
            label: 'No. Telepon',
            value: user?.phone ?? null,
            empty: 'Belum diisi',
          },
          {
            Icon:  Calendar,
            label: 'Bergabung Sejak',
            value: memberSince ?? '—',
          },
          {
            Icon:  User,
            label: 'Role',
            value: user?.role === 'admin' ? 'Administrator' : 'Member',
          },
        ].map(({ Icon, label, value, note, empty }) => (
          <div key={label} className="flex items-center gap-3 py-2.5
            border-b border-border last:border-b-0">
            <span className="w-9 h-9 rounded-xl bg-accent flex items-center
              justify-center shrink-0 text-muted-foreground">
              <Icon className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {label}
              </p>
              <p className={cn(
                'text-sm font-medium truncate mt-0.5',
                (!value && empty) ? 'text-muted-foreground italic' : 'text-foreground',
              )}>
                {value || empty || '—'}
              </p>
            </div>
            {note && (
              <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                {note}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to={ROUTES.PROFILE_EDIT}
          className="flex items-center justify-center gap-2 h-11 rounded-xl
            bg-travia-orange text-white text-sm font-semibold
            hover:bg-travia-orange/90 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profil
        </Link>
        <Link
          to={ROUTES.PROFILE_CHANGE_PASSWORD}
          className="flex items-center justify-center gap-2 h-11 rounded-xl
            border border-border text-sm font-medium text-foreground
            hover:bg-accent transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          Ganti Password
        </Link>
      </div>

      {/* ── Quick Navigation ───────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <p className="px-5 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Aktivitas Saya
        </p>
        <div className="divide-y divide-border">
          {QUICK_LINKS.map(({ label, Icon, to, color }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-5 py-3.5
                hover:bg-accent transition-colors"
            >
              <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', color)}>
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
