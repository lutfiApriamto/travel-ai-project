import { createClient } from '@supabase/supabase-js';
import { WebSocket }    from 'ws';

// service_role key digunakan di backend — memiliki akses penuh ke storage (bypass RLS).
// JANGAN expose key ini ke frontend/client. Frontend cukup gunakan public anon key.
//
// WebSocket dari package 'ws' diperlukan karena Node.js < 22 tidak punya native WebSocket.
// Supabase Realtime membutuhkan WebSocket saat inisialisasi client, meski kita hanya pakai Storage.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: WebSocket,
    },
  }
);

export default supabase;
