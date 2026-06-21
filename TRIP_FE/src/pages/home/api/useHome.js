import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '../../../lib/axios.js';

// ─── Response shape (sendSuccess di backend) ──────────────────────────────────
//
// r.data = { errorStatus: false, data: { data: <actual>, message: "..." } }
//
// Non-paginated (banners, categories, types, tags):
//   r.data.data.data = array
//
// Paginated (products):
//   r.data.data.data      = items[]
//   r.data.data.totalData = total count
//   r.data.data.totalPage = total pages
//
// ─────────────────────────────────────────────────────────────────────────────

export const useBanners = () =>
  useQuery({
    queryKey:  ['banners'],
    queryFn:   () => api.get('/banners').then((r) => {
      const data = r.data.data.data;
      return Array.isArray(data) ? data : [];
    }),
    staleTime: 5 * 60_000,
  });

export const useCategories = () =>
  useQuery({
    queryKey:  ['categories'],
    queryFn:   () => api.get('/categories').then((r) => {
      const data = r.data.data.data;
      return Array.isArray(data) ? data : [];
    }),
    staleTime: 10 * 60_000,
  });

export const useTypes = () =>
  useQuery({
    queryKey:  ['types'],
    queryFn:   () => api.get('/types').then((r) => {
      const data = r.data.data.data;
      return Array.isArray(data) ? data : [];
    }),
    staleTime: 10 * 60_000,
  });

export const useTags = () =>
  useQuery({
    queryKey:  ['tags'],
    queryFn:   () => api.get('/tags').then((r) => {
      const data = r.data.data.data;
      return Array.isArray(data) ? data : [];
    }),
    staleTime: 10 * 60_000,
  });

export const useInfiniteProducts = (filters = {}) =>
  useInfiniteQuery({
    queryKey: ['products', 'home-feed', filters],
    queryFn: ({ pageParam }) =>
      api
        .get('/products', {
          params: {
            page:          pageParam,
            limit:         12,
            search:        filters.search        || undefined,
            category:      filters.category      || undefined,
            type:          filters.type          || undefined,
            tag:           filters.tag           || undefined,
            minPrice:      filters.minPrice      || undefined,
            maxPrice:      filters.maxPrice      || undefined,
            departureCity: filters.departureCity || undefined,
          },
        })
        .then((r) => ({
          products:    Array.isArray(r.data.data.data) ? r.data.data.data : [],
          totalData:   r.data.data.totalData  ?? 0,
          totalPage:   r.data.data.totalPage  ?? 1,
          currentPage: pageParam,
        })),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPage
        ? lastPage.currentPage + 1
        : undefined,
    staleTime: 30_000,
  });
