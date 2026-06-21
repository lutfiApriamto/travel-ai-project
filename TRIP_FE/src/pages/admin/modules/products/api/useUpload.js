import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../lib/axios.js';

export const useUploadSingle = () =>
  useMutation({
    mutationFn: ({ file, folder = 'products' }) => {
      const fd = new FormData();
      fd.append('image', file);
      return api.post(`/upload/single?folder=${folder}`, fd)
        .then(r => r.data.data.data.url);
    },
    onError: () => toast.error('Gagal upload gambar'),
  });

export const useUploadBulk = () =>
  useMutation({
    mutationFn: ({ files, folder = 'products' }) => {
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      return api.post(`/upload/bulk?folder=${folder}`, fd)
        .then(r => r.data.data.data.urls);
    },
    onError: () => toast.error('Gagal upload gambar'),
  });

export const useDeleteImage = () =>
  useMutation({
    mutationFn: (url) => api.delete('/upload/single', { data: { url } }),
  });
