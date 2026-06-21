import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../../../lib/axios.js';

const KEY = ['admin', 'types'];

export const useTypes = (search = '') =>
  useQuery({
    queryKey:  [...KEY, search],
    queryFn:   () =>
      api.get('/types', { params: search ? { search } : undefined })
        .then(res => res.data.data.data),
    staleTime: 60_000,
  });

export const useCreateType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/types', data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Tipe berhasil ditambahkan'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menambahkan tipe'),
  });
};

export const useUpdateType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/types/${id}`, data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Tipe berhasil diperbarui'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui tipe'),
  });
};

export const useDeleteType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/types/${id}`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Tipe berhasil dihapus'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menghapus tipe'),
  });
};
