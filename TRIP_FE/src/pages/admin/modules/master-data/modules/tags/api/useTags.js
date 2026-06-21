import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../../../lib/axios.js';

const KEY = ['admin', 'tags'];

export const useTags = (search = '') =>
  useQuery({
    queryKey:  [...KEY, search],
    queryFn:   () =>
      api.get('/tags', { params: search ? { search } : undefined })
        .then(res => res.data.data.data),
    staleTime: 60_000,
  });

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/tags', data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Tag berhasil ditambahkan'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menambahkan tag'),
  });
};

export const useUpdateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/tags/${id}`, data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Tag berhasil diperbarui'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui tag'),
  });
};

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/tags/${id}`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Tag berhasil dihapus'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menghapus tag'),
  });
};
