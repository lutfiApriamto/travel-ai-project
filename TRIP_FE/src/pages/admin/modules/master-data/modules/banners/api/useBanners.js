import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../../../lib/axios.js';

const KEY = ['admin', 'banners'];

export const useBanners = () =>
  useQuery({
    queryKey:  KEY,
    queryFn:   () => api.get('/banners').then(res => res.data.data.data),
    staleTime: 60_000,
  });

const toFormData = (data) => {
  const fd = new FormData();
  if (data.title)   fd.append('title',    data.title);
  if (data.link !== undefined) fd.append('link', data.link);
  if (data.order !== undefined && data.order !== '')
    fd.append('order', data.order);
  if (data.isActive !== undefined) fd.append('isActive', data.isActive);
  // image can be a File (legacy), a URL string (new flow), or null/'' (cleared)
  if (data.image instanceof File)          fd.append('image', data.image);
  else if (typeof data.image === 'string') fd.append('image', data.image);
  else if (data.image === null)            fd.append('image', '');
  return fd;
};

export const useCreateBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/banners', toFormData(data)).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Banner berhasil ditambahkan'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menambahkan banner'),
  });
};

export const useUpdateBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/banners/${id}`, toFormData(data)).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Banner berhasil diperbarui'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui banner'),
  });
};

export const useDeleteBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/banners/${id}`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Banner berhasil dihapus'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menghapus banner'),
  });
};
