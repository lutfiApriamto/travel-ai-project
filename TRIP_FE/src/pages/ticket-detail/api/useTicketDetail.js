import { useQuery } from '@tanstack/react-query';
import api          from '../../../lib/axios.js';

// ─── Response shape ───────────────────────────────────────────────────────────
// GET /tickets/my/:id → sendSuccess(res, data)
//   r.data.data.data = Ticket {
//     _id, ticketCode, isValid, checkedIn, checkedInAt, invalidatedAt,
//     participants, totalPrice, productSnapshot, canUse,
//     productId: { name, slug, thumbnail, status },  ← populated
//     orderId:   { orderCode, paymentMethod, paidAt } ← populated
//   }
// ─────────────────────────────────────────────────────────────────────────────

export const useTicketDetail = (ticketId) =>
  useQuery({
    queryKey:  ['ticket', ticketId],
    queryFn:   () =>
      api.get(`/tickets/my/${ticketId}`).then((r) => r.data.data.data),
    enabled:   !!ticketId,
    staleTime: 30_000,
  });

// downloadTicketPdf diambil langsung dari useTickets.js untuk hindari duplikasi
export { downloadTicketPdf } from '../../tickets/api/useTickets.js';
