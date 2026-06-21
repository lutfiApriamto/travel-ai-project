import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect }               from 'react';
import toast                       from 'react-hot-toast';
import api                         from '../../../lib/axios.js';
import { useNotificationStore }    from '../../../stores/useNotificationStore.js';

// ─── Response shapes ──────────────────────────────────────────────────────────
//
// GET /notifications  → sendSuccess(res, { notifications, nextCursor, hasMore })
//   r.data.data.data = { notifications: Notification[], nextCursor: string|null, hasMore: bool }
//   (Cursor-based — bukan page-based)
//
// GET /notifications/unread-count
//   r.data.data.data = { unreadCount: number }
//
// PATCH /notifications/read-all → r.data.data.data = { updatedCount: number }
// PATCH /notifications/:id/read → r.data.data.data = Notification
// DELETE /notifications/:id    → r.data.data.data = null
//
// ─────────────────────────────────────────────────────────────────────────────

const NOTIF_KEY = ['notifications'];

// ─── Infinite scroll (cursor-based) ──────────────────────────────────────────

export const useInfiniteNotifications = (filters = {}) =>
  useInfiniteQuery({
    queryKey: [...NOTIF_KEY, 'infinite', filters],
    queryFn:  ({ pageParam }) =>
      api
        .get('/notifications', {
          params: {
            cursor:   pageParam  ?? undefined, // null → first page (no cursor sent)
            limit:    20,
            category: filters.category || undefined,
            isRead:   filters.isRead !== null && filters.isRead !== undefined
              ? String(filters.isRead)
              : undefined,
          },
        })
        .then((r) => {
          const d = r.data.data.data;
          return {
            notifications: Array.isArray(d.notifications) ? d.notifications : [],
            nextCursor:    d.nextCursor  ?? null,
            hasMore:       d.hasMore     ?? false,
          };
        }),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    staleTime: 30_000,
  });

// ─── Unread count ─────────────────────────────────────────────────────────────

const UNREAD_KEY = [...NOTIF_KEY, 'unread-count'];

// Hook dipakai di Navbar dan halaman notifikasi.
// Sinkronisasi ke Zustand agar badge bell selalu up-to-date.
export const useUnreadCount = (enabled = true) => {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const query = useQuery({
    queryKey:        UNREAD_KEY,
    queryFn:         () =>
      api.get('/notifications/unread-count')
        .then((r) => r.data.data.data?.unreadCount ?? 0),
    enabled,
    staleTime:       30_000,
    refetchInterval: 60_000, // polling setiap menit
  });

  // Sinkron ke Zustand saat data berubah
  useEffect(() => {
    if (query.data !== undefined) setUnreadCount(query.data);
  }, [query.data, setUnreadCount]);

  return query;
};

// ─── Mark single as read ──────────────────────────────────────────────────────

export const useMarkAsRead = () => {
  const qc        = useQueryClient();
  const decrement = useNotificationStore((s) => s.decrement);

  return useMutation({
    mutationFn: (notificationId) =>
      api.patch(`/notifications/${notificationId}/read`)
        .then((r) => r.data.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEY });
      qc.invalidateQueries({ queryKey: UNREAD_KEY });
      decrement();
    },
  });
};

// ─── Mark all as read ─────────────────────────────────────────────────────────

export const useMarkAllAsRead = () => {
  const qc             = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  return useMutation({
    mutationFn: () =>
      api.patch('/notifications/read-all')
        .then((r) => r.data.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEY });
      qc.invalidateQueries({ queryKey: UNREAD_KEY });
      setUnreadCount(0);
      toast.success('Semua notifikasi ditandai sudah dibaca');
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal menandai semua sebagai dibaca'),
  });
};

// ─── Delete notification ──────────────────────────────────────────────────────

export const useDeleteNotification = () => {
  const qc        = useQueryClient();
  const decrement = useNotificationStore((s) => s.decrement);

  return useMutation({
    mutationFn: ({ notificationId, wasUnread }) =>
      api.delete(`/notifications/${notificationId}`),
    onSuccess: (_, { wasUnread }) => {
      qc.invalidateQueries({ queryKey: NOTIF_KEY });
      qc.invalidateQueries({ queryKey: UNREAD_KEY });
      // Jika notifikasi yang dihapus belum dibaca → kurangi badge
      if (wasUnread) decrement();
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal menghapus notifikasi'),
  });
};
