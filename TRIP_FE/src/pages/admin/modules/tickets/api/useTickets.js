import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../lib/axios.js';

const KEY = ['admin', 'tickets'];

// ─── List ─────────────────────────────────────────────────────────────────────
// sendSuccess(res, tickets, '...', 200, meta)
// → res.data.data.data = tickets[], res.data.data.totalData, res.data.data.totalPage

export const useTickets = (params = {}) =>
  useQuery({
    queryKey:  [...KEY, params],
    queryFn:   () =>
      api.get('/tickets', {
        params: {
          page:       params.page       || 1,
          limit:      params.limit      || 15,
          search:     params.search     || undefined,
          isValid:    params.isValid    ?? undefined,
          checkedIn:  params.checkedIn  ?? undefined,
          startDate:  params.startDate  || undefined,
          endDate:    params.endDate    || undefined,
        },
      }).then(r => ({
        tickets:   r.data.data.data,
        totalData: r.data.data.totalData,
        totalPage: r.data.data.totalPage,
      })),
    staleTime:       30_000,
    placeholderData: prev => prev,
  });

// ─── Single ───────────────────────────────────────────────────────────────────

export const useTicket = (id) =>
  useQuery({
    queryKey: [...KEY, id],
    queryFn:  () => api.get(`/tickets/${id}`).then(r => r.data.data.data),
    enabled:  !!id,
    staleTime: 30_000,
  });

// ─── Check-in ─────────────────────────────────────────────────────────────────

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketCode) =>
      api.post('/tickets/checkin', { ticketCode })
        .then(r => r.data.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    // Toast ditangani di komponen agar bisa kontrol result display
  });
};
