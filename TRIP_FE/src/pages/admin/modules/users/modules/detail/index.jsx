import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, ShieldOff, ShieldCheck,
  Mail, Phone, Calendar, ShoppingBag, Wallet, RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../../../../../lib/utils.js';
import { ROUTES } from '../../../../../../utils/consts/routes.js';
import { useUser, useToggleSuspend } from '../../api/useUsers.js';
import DeleteConfirmDialog from '../../../../../../components/shared/admin/DeleteConfirmDialog.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v ?? 0);

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ isActive }) => (
  <span className={cn(
    'text-xs font-semibold px-2.5 py-1 rounded-full',
    isActive
      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
      : 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
  )}>
    {isActive ? 'Aktif' : 'Suspend'}
  </span>
);

const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-3">
    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
      <Icon className={cn('w-4 h-4', iconColor)} />
    </div>
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-foreground mt-0.5 tabular-nums">{value}</p>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
    <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5 break-all">{value ?? '—'}</p>
    </div>
  </div>
);

// ─── UserDetailPage ───────────────────────────────────────────────────────────

const UserDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [suspendOpen, setSuspendOpen]        = useState(false);
  const { data: user, isLoading }            = useUser(id);
  const { mutate: toggleSuspend, isPending } = useToggleSuspend();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-travia-orange animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">Pengguna tidak ditemukan</p>
        <button
          onClick={() => navigate(ROUTES.ADMIN.USERS)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-travia-orange hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </button>
      </div>
    );
  }

  const summary = user.summary ?? {};

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.ADMIN.USERS)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border
              text-muted-foreground hover:bg-accent transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-bold text-foreground text-xl">Detail Pengguna</h1>
        </div>

        {/* Suspend / Aktifkan */}
        <button
          onClick={() => setSuspendOpen(true)}
          disabled={isPending}
          className={cn(
            'flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
            user.isActive
              ? 'border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
              : 'border border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
          )}
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : user.isActive ? (
            <ShieldOff className="w-3.5 h-3.5" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          {user.isActive ? 'Suspend User' : 'Aktifkan User'}
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-travia-orange/10 flex items-center
              justify-center shrink-0">
              <span className="text-3xl font-bold text-travia-orange">
                {user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
              <StatusBadge isActive={user.isActive} />
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ID: <span className="font-mono">{user._id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={ShoppingBag}
          label="Total Pesanan"
          value={summary.totalOrders ?? 0}
          iconBg="bg-blue-50 dark:bg-blue-950/30"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={Wallet}
          label="Total Pengeluaran"
          value={formatIDR(summary.totalSpent)}
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={RefreshCw}
          label="Total Refund"
          value={summary.totalRefunds ?? 0}
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-500"
        />
      </div>

      {/* Info + Orders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-1">Informasi Akun</h3>
          <div className="mt-2">
            <InfoRow icon={Mail}     label="Email"          value={user.email} />
            <InfoRow icon={Phone}    label="No. Telepon"    value={user.phone} />
            <InfoRow icon={Calendar} label="Tanggal Daftar" value={formatDate(user.createdAt)} />
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">Akses Cepat</h3>
          <div className="space-y-2">
            <Link
              to={`${ROUTES.ADMIN.ORDERS}?userId=${user._id}`}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl
                border border-border hover:bg-accent hover:border-travia-orange/30
                transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-muted-foreground group-hover:text-travia-orange transition-colors" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Riwayat Pesanan</p>
                  <p className="text-xs text-muted-foreground">{summary.totalOrders ?? 0} pesanan</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>

            <Link
              to={`${ROUTES.ADMIN.REFUNDS}?userId=${user._id}`}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl
                border border-border hover:bg-accent hover:border-travia-orange/30
                transition-colors group"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-travia-orange transition-colors" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Riwayat Refund</p>
                  <p className="text-xs text-muted-foreground">{summary.totalRefunds ?? 0} refund</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
      <DeleteConfirmDialog
        isOpen={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={() => toggleSuspend(id, { onSuccess: () => setSuspendOpen(false) })}
        isLoading={isPending}
        title={user.isActive ? `Suspend "${user.name}"?` : `Aktifkan kembali "${user.name}"?`}
        description={
          user.isActive
            ? 'Pengguna tidak akan bisa login setelah di-suspend. Anda bisa mengaktifkannya kembali kapan saja.'
            : 'Pengguna akan bisa login kembali ke aplikasi.'
        }
        confirmLabel={user.isActive ? 'Ya, Suspend' : 'Ya, Aktifkan'}
        loadingLabel={user.isActive ? 'Menyuspend...' : 'Mengaktifkan...'}
        confirmCls={user.isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
        iconCls={user.isActive ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}
        iconColor={user.isActive ? 'text-red-500' : 'text-emerald-500'}
      />
    </div>
  );
};

export default UserDetailPage;
