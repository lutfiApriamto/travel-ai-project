import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, ShieldOff, ShieldCheck, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../../../../lib/utils.js';
import { useDebounce } from '../../../../hooks/useDebounce.js';
import { ROUTES } from '../../../../utils/consts/routes.js';
import { useUsers, useToggleSuspend } from './api/useUsers.js';
import DeleteConfirmDialog from '../../../../components/shared/admin/DeleteConfirmDialog.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const Avatar = ({ user, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  return user.avatar ? (
    <img src={user.avatar} alt={user.name}
      className={cn(sz, 'rounded-full object-cover shrink-0')} />
  ) : (
    <div className={cn(sz, 'rounded-full bg-travia-orange/10 flex items-center justify-center shrink-0')}>
      <span className="font-bold text-travia-orange">{user.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
    </div>
  );
};

const StatusBadge = ({ isActive }) => (
  <span className={cn(
    'text-[11px] font-semibold px-2 py-0.5 rounded-full',
    isActive
      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
      : 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
  )}>
    {isActive ? 'Aktif' : 'Suspend'}
  </span>
);

const FILTER_OPTIONS = [
  { value: '',      label: 'Semua'   },
  { value: 'true',  label: 'Aktif'   },
  { value: 'false', label: 'Suspend' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRows = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-3 w-36 bg-muted rounded" />
            </div>
          </div>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-5 w-16 bg-muted rounded-full" /></td>
        <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-24 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 bg-muted rounded" /></td>
        <td className="px-4 py-3"><div className="h-7 w-20 bg-muted rounded-lg ml-auto" /></td>
      </tr>
    ))}
  </>
);

// ─── UsersPage ────────────────────────────────────────────────────────────────

const UsersPage = () => {
  const [search,       setSearch]       = useState('');
  const [isActive,     setIsActive]     = useState('');
  const [page,         setPage]         = useState(1);
  const [suspendModal, setSuspendModal] = useState({ open: false, user: null });

  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useUsers({
    search: debouncedSearch,
    isActive: isActive === '' ? undefined : isActive,
    page, limit: 15,
  });

  const users     = data?.users     ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPage = data?.totalPage ?? 1;

  const { mutate: toggleSuspend, isPending: suspending } = useToggleSuspend();

  const closeSuspendModal = () => setSuspendModal({ open: false, user: null });
  const confirmSuspend    = () =>
    toggleSuspend(suspendModal.user?._id, { onSuccess: closeSuspendModal });

  const hasFilters = search || isActive;
  const clearFilters = () => { setSearch(''); setIsActive(''); setPage(1); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-bold text-foreground text-xl">Pengguna</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola akun pengguna terdaftar{totalData ? ` · ${totalData} pengguna` : ''}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama atau email..."
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
                focus:ring-travia-orange focus:border-travia-orange transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setIsActive(opt.value); setPage(1); }}
                className={cn(
                  'px-3 py-2 font-medium transition-colors',
                  isActive === opt.value
                    ? 'bg-travia-orange text-white'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm border border-border
                text-muted-foreground hover:bg-accent transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengguna</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">No. Telpon</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Bergabung</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <SkeletonRows />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    {hasFilters ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna'}
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user._id} className="hover:bg-accent/30 transition-colors">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={user} />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge isActive={user.isActive} />
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {user.phone ?? <span className="text-border">—</span>}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={ROUTES.ADMIN.USER_DETAIL(user._id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setSuspendModal({ open: true, user })}
                        title={user.isActive ? 'Suspend user' : 'Aktifkan user'}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          user.isActive
                            ? 'text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500'
                            : 'text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-500',
                        )}
                      >
                        {user.isActive
                          ? <ShieldOff className="w-3.5 h-3.5" />
                          : <ShieldCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPage} · {totalData} pengguna
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPage }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPage || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === '…' ? (
                  <span key={`d${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n)}
                    className={cn(
                      'h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      page === n
                        ? 'bg-travia-orange text-white'
                        : 'border border-border text-muted-foreground hover:bg-accent',
                    )}>
                    {n}
                  </button>
                ))
              }
              <button
                onClick={() => setPage(p => Math.min(totalPage, p + 1))}
                disabled={page >= totalPage}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Suspend / Unsuspend confirmation */}
      <DeleteConfirmDialog
        isOpen={suspendModal.open}
        onClose={closeSuspendModal}
        onConfirm={confirmSuspend}
        isLoading={suspending}
        title={
          suspendModal.user?.isActive
            ? `Suspend "${suspendModal.user?.name}"?`
            : `Aktifkan kembali "${suspendModal.user?.name}"?`
        }
        description={
          suspendModal.user?.isActive
            ? 'Pengguna tidak akan bisa login setelah di-suspend. Anda bisa mengaktifkannya kembali kapan saja.'
            : 'Pengguna akan bisa login kembali ke aplikasi.'
        }
        confirmLabel={suspendModal.user?.isActive ? 'Ya, Suspend' : 'Ya, Aktifkan'}
        loadingLabel={suspendModal.user?.isActive ? 'Menyuspend...' : 'Mengaktifkan...'}
        confirmCls={
          suspendModal.user?.isActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
        }
        iconCls={
          suspendModal.user?.isActive
            ? 'bg-red-50 dark:bg-red-950/30'
            : 'bg-emerald-50 dark:bg-emerald-950/30'
        }
        iconColor={suspendModal.user?.isActive ? 'text-red-500' : 'text-emerald-500'}
      />
    </div>
  );
};

export default UsersPage;
