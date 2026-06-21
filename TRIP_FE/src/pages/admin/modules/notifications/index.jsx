import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Bell, Send, Users, User, Search, X, Loader2, Plus,
  CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils.js';
import { useDebounce } from '../../../../hooks/useDebounce.js';
import { useBroadcast } from './api/useNotifications.js';
import { useUsers } from '../users/api/useUsers.js';
import DeleteConfirmDialog from '../../../../components/shared/admin/DeleteConfirmDialog.jsx';

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls = cn(
  'w-full h-9 px-3 rounded-lg border border-border text-sm text-foreground',
  'bg-white dark:bg-travia-dark3 placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange transition-colors',
);

// ─── Notification preview ─────────────────────────────────────────────────────

const NotifPreview = ({ title, message, target, selectedUsers, totalUsers }) => {
  const recipientText = target === 'all'
    ? `${totalUsers ?? '...'} pengguna`
    : selectedUsers.length > 0
      ? `${selectedUsers.length} pengguna dipilih`
      : '—';

  return (
    <div className="space-y-4">
      {/* Preview card */}
      <div className="bg-background border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-travia-orange/10 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-travia-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {title || <span className="text-muted-foreground italic">Judul notifikasi...</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {message || <span className="italic">Isi pesan...</span>}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-2">Baru saja</p>
          </div>
        </div>
      </div>

      {/* Recipients summary */}
      <div className="px-3 py-2.5 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Akan diterima oleh{' '}
            <span className="font-semibold text-foreground">{recipientText}</span>
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20
        border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Notifikasi yang sudah dikirim tidak dapat ditarik kembali.
        </p>
      </div>
    </div>
  );
};

// ─── User search & select (for specific target) ───────────────────────────────

const UserSelector = ({ selected, onSelect, onRemove }) => {
  const [search,   setSearch]   = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching } = useUsers({
    search:   debouncedSearch || undefined,
    limit:    10,
    isActive: 'true',
  });

  // Exclude already-selected users from results
  const results = (data?.users ?? []).filter(
    u => !selected.find(s => s._id === u._id),
  );

  const handleSelect = (u) => {
    onSelect(u);
    setSearch('');
    // Keep isFocused true so dropdown stays visible for adding more
  };

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(u => (
            <div key={u._id} className="flex items-center gap-1.5 pl-2 pr-1 py-1
              bg-travia-orange/10 border border-travia-orange/20 rounded-full">
              {u.avatar ? (
                <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-travia-orange/30 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-travia-orange">
                    {u.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs font-medium text-travia-orange max-w-[120px] truncate">
                {u.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(u._id)}
                className="text-travia-orange/60 hover:text-travia-orange transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input + dropdown */}
      <div className="relative">
        {isFetching
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-travia-orange animate-spin" />
          : <Search  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        }
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Cari pengguna berdasarkan nama / email..."
          className={cn(inputCls, 'pl-9')}
        />

        {/* Dropdown — tampil saat focus, apapun kondisinya */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              key="user-dropdown"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border
                rounded-xl shadow-lg overflow-hidden"
            >
              {isLoading ? (
                /* Skeleton saat pertama load */
                <div className="py-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                      <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-28 bg-muted rounded" />
                        <div className="h-3 w-40 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  {search ? (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada pengguna ditemukan untuk{' '}
                      <span className="font-semibold text-foreground">"{search}"</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selected.length > 0
                        ? 'Ketik nama/email untuk menambah penerima lain'
                        : 'Ketik nama atau email untuk mencari pengguna'}
                    </p>
                  )}
                </div>
              ) : (
                <ul className="max-h-52 overflow-y-auto py-1">
                  {results.map(u => (
                    <li key={u._id}>
                      <button
                        type="button"
                        onMouseDown={() => handleSelect(u)}
                        className="w-full flex items-center gap-3 px-4 py-2.5
                          hover:bg-accent transition-colors text-left"
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-travia-orange/10
                            flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-travia-orange">
                              {u.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </button>
                    </li>
                  ))}
                  {results.length === 10 && (
                    <p className="text-[10px] text-muted-foreground text-center py-2">
                      Menampilkan 10 hasil teratas — ketik untuk mempersempit pencarian
                    </p>
                  )}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selected.length} pengguna dipilih ·{' '}
          <button type="button" onClick={() => onRemove('__clear_all__')}
            className="text-red-500 hover:underline">
            Hapus semua
          </button>
        </p>
      )}
    </div>
  );
};

// ─── NotificationsPage ────────────────────────────────────────────────────────

const NotificationsPage = () => {
  const [target,        setTarget]        = useState('all');   // 'all' | 'specific'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [lastResult,    setLastResult]    = useState(null);

  // Fetch total user count for preview
  const { data: usersData } = useUsers({ limit: 1 });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: { title: '', message: '' },
  });

  const titleVal   = watch('title');
  const messageVal = watch('message');

  const { mutate: broadcast, isPending } = useBroadcast();

  const canSend = titleVal?.trim().length >= 3 &&
    messageVal?.trim().length >= 3 &&
    (target === 'all' || selectedUsers.length > 0);

  const handleSend = handleSubmit(() => {
    if (!canSend) return;
    setConfirmOpen(true);
  });

  const confirmSend = () => {
    broadcast(
      {
        title:         titleVal,
        message:       messageVal,
        targetUserIds: target === 'specific' ? selectedUsers.map(u => u._id) : undefined,
      },
      {
        onSuccess: (data) => {
          setLastResult(data);
          setConfirmOpen(false);
          reset();
          setSelectedUsers([]);
          setTarget('all');
        },
        onError: () => setConfirmOpen(false),
      },
    );
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-bold text-foreground text-xl">Notifikasi</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kirim pengumuman dan pesan broadcast kepada pengguna
        </p>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1,  y: 0  }}
            exit={{    opacity: 0,  y: -8 }}
            className="flex items-center gap-3 px-4 py-3.5 bg-emerald-50 dark:bg-emerald-950/20
              border border-emerald-200 dark:border-emerald-800 rounded-xl"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex-1">
              Notifikasi berhasil dikirim ke{' '}
              <span className="font-bold">{lastResult.sentTo}</span> pengguna.
            </p>
            <button onClick={() => setLastResult(null)}
              className="text-emerald-500 hover:text-emerald-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* ── Left: compose form ──────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-5">
          <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-travia-orange" />
            Buat Broadcast
          </h2>

          <form onSubmit={handleSend} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Judul <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title', {
                  required: 'Judul wajib diisi',
                  minLength: { value: 3, message: 'Min 3 karakter' },
                  maxLength: { value: 150, message: 'Maks 150 karakter' },
                })}
                placeholder="Contoh: Promo Akhir Tahun 🎉"
                className={inputCls}
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {titleVal?.length ?? 0}/150
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Pesan <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('message', {
                  required: 'Pesan wajib diisi',
                  minLength: { value: 3, message: 'Min 3 karakter' },
                  maxLength: { value: 1000, message: 'Maks 1000 karakter' },
                })}
                placeholder="Tulis isi pesan broadcast di sini..."
                rows={5}
                className={cn(inputCls, 'h-auto py-2 resize-none')}
              />
              {errors.message && (
                <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {messageVal?.length ?? 0}/1000
              </p>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Target Penerima</label>
              <div className="flex gap-3">
                {[
                  { val: 'all',      icon: Users, label: 'Semua Pengguna' },
                  { val: 'specific', icon: User,  label: 'Pengguna Tertentu' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => { setTarget(opt.val); setSelectedUsers([]); }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium',
                      'border transition-colors',
                      target === opt.val
                        ? 'bg-travia-orange/10 border-travia-orange text-travia-orange'
                        : 'border-border text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User selector (specific) */}
            <AnimatePresence>
              {target === 'specific' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Pilih Pengguna <span className="text-red-500">*</span>
                  </label>
                  <UserSelector
                    selected={selectedUsers}
                    onSelect={u => setSelectedUsers(p => [...p, u])}
                    onRemove={id =>
                      id === '__clear_all__'
                        ? setSelectedUsers([])
                        : setSelectedUsers(p => p.filter(u => u._id !== id))
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info note */}
            <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-950/20
              border border-blue-200 dark:border-blue-800 rounded-lg">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Notifikasi broadcast akan muncul di aplikasi pengguna dengan kategori{' '}
                <span className="font-semibold">Pengumuman</span>. Tidak ada email yang dikirim.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSend || isPending}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold
                bg-travia-orange hover:bg-travia-orange-h text-white
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              Kirim Broadcast
            </button>
          </form>
        </div>

        {/* ── Right: preview ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-muted-foreground" />
              Preview Notifikasi
            </h2>
            <NotifPreview
              title={titleVal}
              message={messageVal}
              target={target}
              selectedUsers={selectedUsers}
              totalUsers={usersData?.totalData}
            />
          </div>

          {/* Tips card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Tips Broadcast</h3>
            <ul className="space-y-2">
              {[
                'Gunakan judul yang singkat dan menarik perhatian',
                'Pesan yang jelas dan actionable lebih efektif',
                'Hindari broadcast terlalu sering agar tidak diabaikan',
                'Gunakan "Pengguna Tertentu" untuk notifikasi personal',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="w-4 h-4 rounded-full bg-travia-orange/10 text-travia-orange
                    flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <DeleteConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSend}
        isLoading={isPending}
        title="Kirim broadcast sekarang?"
        description={
          target === 'all'
            ? `Notifikasi akan dikirim ke semua ${usersData?.totalData ?? ''} pengguna aktif.`
            : `Notifikasi akan dikirim ke ${selectedUsers.length} pengguna yang dipilih.`
        }
        confirmLabel="Ya, Kirim"
        loadingLabel="Mengirim..."
        confirmCls="bg-travia-orange hover:bg-travia-orange-h text-white"
        iconCls="bg-travia-orange/10"
        iconColor="text-travia-orange"
      />
    </div>
  );
};

export default NotificationsPage;
