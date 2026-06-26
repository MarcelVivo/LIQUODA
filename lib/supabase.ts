import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // ws is required as WebSocket transport on Node.js < 22
      realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
    }
  );
}
