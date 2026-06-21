import { useMutation } from '@tanstack/react-query';
import api             from '../../../lib/axios.js';

// ─── Response shape ───────────────────────────────────────────────────────────
// POST /ai/chat { message: string, conversationHistory?: Array<{role:'user'|'model', content:string}> }
//   → sendSuccess(res, data, 'Berhasil')
//   → r.data.data.data = { message: string, recommendedProductIds: string[], showAll: bool }
//
// Rate limit (backend): 20 req / 15 menit per IP
// Rate limit (client):  30 req / 1 jam per sesi (reset saat halaman ditinggalkan)
// ─────────────────────────────────────────────────────────────────────────────

export const useAiChat = () =>
  useMutation({
    mutationFn: ({ message, conversationHistory = [] }) =>
      api
        .post('/ai/chat', { message, conversationHistory })
        .then((r) => r.data.data.data),
    // onSuccess/onError ditangani di komponen untuk update state chat
  });
