import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api  from '../../../../../../../lib/axios.js';

// ─── Provinces ────────────────────────────────────────────────────────────────

export const useProvinces = (search = '') =>
  useQuery({
    queryKey:  ['wilayah', 'provinces', search],
    queryFn:   () =>
      api.get('/wilayah/provinces', { params: search ? { search } : undefined })
        .then(r => r.data.data.data),
    staleTime: 5 * 60_000,
  });

export const useCreateProvince = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/wilayah/provinces', data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'provinces'] }); toast.success('Provinsi ditambahkan'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menambahkan provinsi'),
  });
};

export const useUpdateProvince = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/wilayah/provinces/${id}`, data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'provinces'] }); toast.success('Provinsi diperbarui'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui provinsi'),
  });
};

export const useDeleteProvince = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/wilayah/provinces/${id}`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah'] }); toast.success('Provinsi dihapus'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menghapus provinsi'),
  });
};

// ─── Regencies ────────────────────────────────────────────────────────────────

export const useRegencies = (province_id = '', search = '') =>
  useQuery({
    queryKey:  ['wilayah', 'regencies', province_id, search],
    queryFn:   () =>
      api.get('/wilayah/regencies', { params: { province_id: province_id || undefined, search: search || undefined } })
        .then(r => r.data.data.data),
    staleTime: 5 * 60_000,
    enabled:   !!province_id,
  });

export const useCreateRegency = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/wilayah/regencies', data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'regencies'] }); toast.success('Kabupaten/Kota ditambahkan'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menambahkan kabupaten/kota'),
  });
};

export const useUpdateRegency = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/wilayah/regencies/${id}`, data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'regencies'] }); toast.success('Kabupaten/Kota diperbarui'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui kabupaten/kota'),
  });
};

export const useDeleteRegency = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/wilayah/regencies/${id}`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'regencies'] }); toast.success('Kabupaten/Kota dihapus'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menghapus kabupaten/kota'),
  });
};

// ─── Districts ────────────────────────────────────────────────────────────────

export const useDistricts = (regency_id = '', search = '') =>
  useQuery({
    queryKey:  ['wilayah', 'districts', regency_id, search],
    queryFn:   () =>
      api.get('/wilayah/districts', { params: { regency_id: regency_id || undefined, search: search || undefined } })
        .then(r => r.data.data.data),
    staleTime: 5 * 60_000,
    enabled:   !!regency_id,
  });

export const useCreateDistrict = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/wilayah/districts', data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'districts'] }); toast.success('Kecamatan ditambahkan'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menambahkan kecamatan'),
  });
};

export const useUpdateDistrict = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/wilayah/districts/${id}`, data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'districts'] }); toast.success('Kecamatan diperbarui'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui kecamatan'),
  });
};

export const useDeleteDistrict = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/wilayah/districts/${id}`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'districts'] }); toast.success('Kecamatan dihapus'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menghapus kecamatan'),
  });
};

// ─── Villages ─────────────────────────────────────────────────────────────────

export const useVillages = (district_id = '', search = '') =>
  useQuery({
    queryKey:  ['wilayah', 'villages', district_id, search],
    queryFn:   () =>
      api.get('/wilayah/villages', { params: { district_id: district_id || undefined, search: search || undefined } })
        .then(r => r.data.data.data),
    staleTime: 5 * 60_000,
    enabled:   !!district_id,
  });

export const useCreateVillage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/wilayah/villages', data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'villages'] }); toast.success('Kelurahan ditambahkan'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menambahkan kelurahan'),
  });
};

export const useUpdateVillage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/wilayah/villages/${id}`, data).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'villages'] }); toast.success('Kelurahan diperbarui'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal memperbarui kelurahan'),
  });
};

export const useDeleteVillage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/wilayah/villages/${id}`).then(r => r.data.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['wilayah', 'villages'] }); toast.success('Kelurahan dihapus'); },
    onError:    e  => toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal menghapus kelurahan'),
  });
};
