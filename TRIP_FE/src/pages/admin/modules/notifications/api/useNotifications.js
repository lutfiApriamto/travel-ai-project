import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../lib/axios.js';

export const useBroadcast = () =>
  useMutation({
    mutationFn: ({ title, message, targetUserIds }) =>
      api.post('/notifications/broadcast', {
        title,
        message,
        targetUserIds: targetUserIds?.length ? targetUserIds : undefined,
      }).then(r => r.data.data.data),
    onSuccess: (data) =>
      toast.success(`Notifikasi berhasil dikirim ke ${data.sentTo} pengguna`),
    onError: (e) =>
      toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal mengirim notifikasi'),
  });
