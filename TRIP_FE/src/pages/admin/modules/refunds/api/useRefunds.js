import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../lib/axios.js';

const KEY = ['admin', 'refunds'];

// ─── List ─────────────────────────────────────────────────────────────────────
// sendSuccess(res, refunds, '...', 200, meta)
// → res.data.data.data = refunds[], totalData, totalPage

export const useRefunds = (params = {}) =>
  useQuery({
    queryKey:  [...KEY, params],
    queryFn:   () =>
      api.get('/refunds', {
        params: {
          page:   params.page   || 1,
          limit:  params.limit  || 15,
          status: params.status || undefined,
          search: params.search || undefined,
        },
      }).then(r => ({
        refunds:   r.data.data.data,
        totalData: r.data.data.totalData,
        totalPage: r.data.data.totalPage,
      })),
    staleTime:       30_000,
    placeholderData: prev => prev,
  });

// ─── Detail ───────────────────────────────────────────────────────────────────

export const useRefund = (id) =>
  useQuery({
    queryKey: [...KEY, id],
    queryFn:  () => api.get(`/refunds/${id}`).then(r => r.data.data.data),
    enabled:  !!id,
    staleTime: 30_000,
  });

// ─── Approve ──────────────────────────────────────────────────────────────────

export const useApproveRefund = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/refunds/${id}/approve`).then(r => r.data.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, id] });
      toast.success('Refund berhasil disetujui — email notifikasi terkirim ke user');
    },
    onError: (e) => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menyetujui refund'),
  });
};

// ─── Reject ───────────────────────────────────────────────────────────────────

export const useRejectRefund = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }) =>
      api.patch(`/refunds/${id}/reject`, { rejectionReason }).then(r => r.data.data.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, vars.id] });
      toast.success('Pengajuan refund ditolak — email notifikasi terkirim ke user');
    },
    onError: (e) => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menolak refund'),
  });
};

// ─── Policy ───────────────────────────────────────────────────────────────────

const POLICY_KEY = ['admin', 'refund-policy'];

export const useRefundPolicy = () =>
  useQuery({
    queryKey: POLICY_KEY,
    queryFn:  () => api.get('/refunds/policy').then(r => r.data.data.data),
    staleTime: 5 * 60_000,
  });

export const useUpdatePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rules) => api.patch('/refunds/policy', { rules }).then(r => r.data.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: POLICY_KEY });
      toast.success('Kebijakan refund berhasil diperbarui');
    },
    onError: (e) => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui kebijakan'),
  });
};
