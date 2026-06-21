import { useQuery } from '@tanstack/react-query';
import api from '../../../../../lib/axios.js';

export const useDashboard = (days = 30) =>
  useQuery({
    queryKey:  ['admin', 'dashboard', days],
    queryFn:   () =>
      api.get('/admin/dashboard', { params: { days } })
        .then(res => res.data.data.data),
    staleTime: 2 * 60 * 1000, // 2 menit sebelum refetch otomatis
  });
