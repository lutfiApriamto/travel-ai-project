import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios.js';

const KEY = ['passengers'];

export const usePassengers = () =>
  useQuery({
    queryKey: KEY,
    queryFn:  () => api.get('/passengers').then(r => r.data.data.data ?? []),
    staleTime: 5 * 60_000,
  });

export const useDeletePassenger = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/passengers/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEY }),
  });
};
