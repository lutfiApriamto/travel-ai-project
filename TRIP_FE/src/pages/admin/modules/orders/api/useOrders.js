import { useQuery } from '@tanstack/react-query';
import api from '../../../../../lib/axios.js';

const KEY = ['admin', 'orders'];

export const useOrders = (params = {}) =>
  useQuery({
    queryKey:  [...KEY, params],
    queryFn:   () =>
      api.get('/orders', {
        params: {
          page:       params.page      || 1,
          limit:      params.limit     || 15,
          search:     params.search    || undefined,
          status:     params.status    || undefined,
          startDate:  params.startDate || undefined,
          endDate:    params.endDate   || undefined,
        },
      }).then(r => ({
        orders: r.data.data.data ?? [],
        meta: {
          total:      r.data.data.totalData ?? 0,
          totalPages: r.data.data.totalPage ?? 1,
        },
      })),
    staleTime:       30_000,
    placeholderData: prev => prev,
  });

export const useOrder = (id) =>
  useQuery({
    queryKey: [...KEY, id],
    queryFn:  () => api.get(`/orders/${id}`).then(r => r.data.data.data),
    enabled:  !!id,
    staleTime: 30_000,
  });
