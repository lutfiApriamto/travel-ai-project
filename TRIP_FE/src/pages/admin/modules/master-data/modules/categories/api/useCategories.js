import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../../../lib/axios.js';

const KEY = ['admin', 'categories'];

export const useCategories = (search = '') =>
  useQuery({
    queryKey:  [...KEY, search],
    queryFn:   () =>
      api.get('/categories', { params: search ? { search } : undefined })
        .then(res => res.data.data.data),
    staleTime: 60_000,
  });

const toFormData = (data) => {
  const fd = new FormData();
  if (data.name)        fd.append('name',        data.name);
  if (data.description) fd.append('description', data.description);
  if (data.sortOrder !== undefined && data.sortOrder !== '')
    fd.append('sortOrder', data.sortOrder);
  if (data.status)      fd.append('status',      data.status);
  if (data.image instanceof File) fd.append('image', data.image);
  return fd;
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/categories', toFormData(data)).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Kategori berhasil ditambahkan'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menambahkan kategori'),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/categories/${id}`, toFormData(data)).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Kategori berhasil diperbarui'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui kategori'),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/categories/${id}`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Kategori berhasil dihapus'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menghapus kategori'),
  });
};
