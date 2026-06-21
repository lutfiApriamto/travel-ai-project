import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/axios.js';

// ─── Response shape ───────────────────────────────────────────────────────────
// r.data.data.data      = products[]
// r.data.data.totalData = total count
// r.data.data.totalPage = total pages
// ─────────────────────────────────────────────────────────────────────────────

export const useProducts = (params = {}) =>
  useQuery({
    queryKey: ['products', 'list', params],
    queryFn: () =>
      api
        .get('/products', {
          params: {
            page:          params.page          || 1,
            limit:         params.limit         || 12,
            search:        params.search        || undefined,
            category:      params.category      || undefined,
            type:          params.type          || undefined,
            tag:           params.tag           || undefined,
            minPrice:      params.minPrice      || undefined,
            maxPrice:      params.maxPrice      || undefined,
            departureCity: params.departureCity || undefined,
            destination:   params.destination   || undefined,
          },
        })
        .then((r) => ({
          products:  Array.isArray(r.data.data.data) ? r.data.data.data : [],
          totalData: r.data.data.totalData ?? 0,
          totalPage: r.data.data.totalPage ?? 1,
        })),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
