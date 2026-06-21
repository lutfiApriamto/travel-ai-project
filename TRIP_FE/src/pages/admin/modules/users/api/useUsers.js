import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../lib/axios.js';

const KEY = ['admin', 'users'];

// ─── List ─────────────────────────────────────────────────────────────────────
// sendSuccess(res, users, '...', 200, meta) →
//   res.data.data.data   = users[]
//   res.data.data.totalData = total
//   res.data.data.totalPage = totalPages

export const useUsers = (params = {}) =>
  useQuery({
    queryKey:  [...KEY, params],
    queryFn:   () =>
      api.get('/admin/users', {
        params: {
          page:     params.page     || 1,
          limit:    params.limit    || 15,
          search:   params.search   || undefined,
          isActive: params.isActive ?? undefined,
        },
      }).then(r => ({
        users:     r.data.data.data,
        totalData: r.data.data.totalData,
        totalPage: r.data.data.totalPage,
      })),
    staleTime:       30_000,
    placeholderData: prev => prev,
  });

// ─── Detail ───────────────────────────────────────────────────────────────────

export const useUser = (id) =>
  useQuery({
    queryKey: [...KEY, id],
    queryFn:  () => api.get(`/admin/users/${id}`).then(r => r.data.data.data),
    enabled:  !!id,
    staleTime: 30_000,
  });

// ─── Suspend / Unsuspend ──────────────────────────────────────────────────────

export const useToggleSuspend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/suspend`).then(r => r.data.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(data.message ?? (data.isActive ? 'User diaktifkan kembali' : 'User di-suspend'));
    },
    onError: (e) => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal mengubah status user'),
  });
};
