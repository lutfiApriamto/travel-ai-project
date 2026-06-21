import { useQuery } from '@tanstack/react-query';
import toast        from 'react-hot-toast';
import api          from '../../../lib/axios.js';

// ─── Response shapes ──────────────────────────────────────────────────────────
// GET /tickets/my → sendSuccess(res, tickets, '...', 200, meta)
//   r.data.data.data      = Ticket[] (with computed canUse)
//   r.data.data.totalData = meta.total
//   r.data.data.totalPage = meta.totalPages
//
// GET /tickets/my/:id → sendSuccess(res, data)
//   r.data.data.data = Ticket (single)
//
// GET /tickets/my/:id/download → raw PDF buffer (binary response)
// ─────────────────────────────────────────────────────────────────────────────

// Ticket status filter values accepted by backend:
// 'valid'   → isValid=true,  checkedIn=false
// 'used'    → checkedIn=true
// 'invalid' → isValid=false
// (no value) → all tickets

const TICKETS_KEY = ['tickets', 'my'];

export const useMyTickets = (params = {}) =>
  useQuery({
    queryKey:  [...TICKETS_KEY, params],
    queryFn:   () =>
      api
        .get('/tickets/my', {
          params: {
            page:   params.page   || 1,
            limit:  params.limit  || 10,
            status: params.status || undefined,
          },
        })
        .then((r) => ({
          tickets:   Array.isArray(r.data.data.data) ? r.data.data.data : [],
          totalData: r.data.data.totalData ?? 0,
          totalPage: r.data.data.totalPage ?? 1,
        })),
    placeholderData: (prev) => prev,
    staleTime:       30_000,
  });

// ─── Download PDF (plain async function — triggers browser download) ──────────

export const downloadTicketPdf = async (ticketId, ticketCode) => {
  try {
    const res = await api.get(`/tickets/my/${ticketId}/download`, {
      responseType: 'blob',
    });

    const url      = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const filename = `tiket-${ticketCode ?? ticketId}.pdf`;
    const a        = document.createElement('a');
    a.href         = url;
    a.download     = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    // responseType:'blob' → error body juga Blob, perlu dikonversi
    if (error.response?.data instanceof Blob) {
      const text    = await error.response.data.text();
      let   message = 'Gagal mengunduh tiket';
      try {
        const parsed = JSON.parse(text);
        message = parsed?.data?.message ?? message;
      } catch { /* gunakan pesan default */ }
      throw new Error(message);
    }
    throw error;
  }
};
