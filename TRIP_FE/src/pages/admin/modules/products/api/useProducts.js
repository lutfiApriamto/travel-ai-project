import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../lib/axios.js';

const KEY = ['admin', 'products'];

// ─── List ─────────────────────────────────────────────────────────────────────

export const useProducts = (params = {}) =>
  useQuery({
    queryKey:  [...KEY, params],
    queryFn:   () =>
      api.get('/products', { params: {
        ...params,
        search:  params.search  || undefined,
        status:  params.status  || undefined,
        page:    params.page    || 1,
        limit:   params.limit   || 12,
      }}).then(r => ({
        products: r.data.data.data ?? [],
        meta: {
          total:      r.data.data.totalData ?? 0,
          totalPages: r.data.data.totalPage ?? 1,
        },
      })),
    staleTime: 30_000,
    placeholderData: prev => prev,
  });

// ─── Single ───────────────────────────────────────────────────────────────────

export const useProduct = (id) =>
  useQuery({
    queryKey:  [...KEY, id],
    queryFn:   () => api.get(`/products/${id}`).then(r => r.data.data.data),
    enabled:   !!id,
    staleTime: 30_000,
  });

// ─── Create ───────────────────────────────────────────────────────────────────

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/products', data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Produk berhasil dibuat'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal membuat produk'),
  });
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/products/${id}`, data).then(r => r.data.data.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, vars.id] });
      toast.success('Produk berhasil diperbarui');
    },
    onError: e => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui produk'),
  });
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/products/${id}`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Produk berhasil dihapus'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menghapus produk'),
  });
};

// ─── Duplicate ────────────────────────────────────────────────────────────────

export const useDuplicateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.post(`/products/${id}/duplicate`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Produk berhasil diduplikasi sebagai draft'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menduplikasi produk'),
  });
};

// ─── Bulk Status ──────────────────────────────────────────────────────────────

export const useBulkStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => api.patch('/products/bulk-status', { ids, status }).then(r => r.data.data.data),
    onSuccess: (count) => { qc.invalidateQueries({ queryKey: KEY }); toast.success(`${count} produk berhasil diperbarui`); },
    onError:   e => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal update status'),
  });
};
