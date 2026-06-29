import { useMutation } from '@tanstack/react-query';
import api             from '../../../lib/axios.js';

// ─── Response shape ───────────────────────────────────────────────────────────
// POST /ai/chat { message: string, conversationHistory?: Array<{role:'user'|'model', content:string}> }
//   → sendSuccess(res, data, 'Berhasil')
//   → r.data.data.data = { message: string, recommendedProductIds: string[], showAll: bool }
//
// Rate limit (backend): 20 req / 15 menit per IP
// Rate limit (client):  30 req / 1 jam per sesi (reset saat halaman ditinggalkan)
//
// Timeout: default axios global = 8 dtk, terlalu pendek untuk LLM. Saat user minta
// rekomendasi konkret, Gemini memproses seluruh katalog + generate JSON → bisa
// 15-40 dtk. Tanpa override, request ke-3+ (yang butuh rekomendasi) selalu di-abort
// client di detik ke-8 dan tampil "Asisten tidak tersedia". Override ke 60 dtk.
// ─────────────────────────────────────────────────────────────────────────────

const AI_CHAT_TIMEOUT = 60_000; // 60 detik — beri ruang untuk generate Gemini

export const useAiChat = () =>
  useMutation({
    mutationFn: ({ message, conversationHistory = [] }) =>
      api
        .post('/ai/chat', { message, conversationHistory }, { timeout: AI_CHAT_TIMEOUT })
        .then((r) => r.data.data.data),
    // onSuccess/onError ditangani di komponen untuk update state chat
  });
