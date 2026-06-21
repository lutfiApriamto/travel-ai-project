import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios.js';

// ─── Response shapes ──────────────────────────────────────────────────────────
//
// GET /orders/:id
//   r.data.data.data = Order { _id, orderCode, status, totalPrice,
//                              productSnapshot, participants, addOns,
//                              paymentToken, paymentUrl, paidAt, ... }
//
// POST /payment/create/:orderId
//   r.data.data.data = { snapToken, paymentUrl }
//
// GET /payment/status/:orderId
//   r.data.data.data = { orderStatus, midtransStatus, paymentMethod, fraudStatus }
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Order detail (user-facing) ───────────────────────────────────────────────

export const useOrderDetail = (orderId) =>
  useQuery({
    queryKey:  ['order', orderId],
    queryFn:   () =>
      api.get(`/orders/${orderId}`).then((r) => r.data.data.data),
    enabled:   !!orderId,
    staleTime: 30_000,
  });

// ─── Create payment token ─────────────────────────────────────────────────────

export const useCreatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) =>
      api.post(`/payment/create/${orderId}`).then((r) => r.data.data.data),
    // Returns { snapToken, paymentUrl }
    onSuccess: (_, orderId) => {
      // Refresh order data so latest paymentToken is reflected
      qc.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
};

// ─── Payment status (polling) ─────────────────────────────────────────────────

export const usePaymentStatus = (orderId, enabled) =>
  useQuery({
    queryKey:  ['payment-status', orderId],
    queryFn:   () =>
      api.get(`/payment/status/${orderId}`).then((r) => r.data.data.data),
    enabled:   !!orderId && !!enabled,
    staleTime: 0,      // lunak — selalu anggap stale saat polling
    gcTime:    60_000, // simpan hasil sementara
    refetchInterval: (query) => {
      const data = query.state.data;
      // Hentikan polling jika sudah final
      if (data?.orderStatus === 'paid')      return false;
      if (data?.orderStatus === 'cancelled') return false;
      return 3_000; // poll setiap 3 detik
    },
  });
