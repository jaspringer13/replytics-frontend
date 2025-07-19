import { createClient } from '@supabase/supabase-js';

// Singleton instance
let supabaseServer: ReturnType<typeof createClient> | null = null;

/**
 * Get Supabase client for server-side operations
 * Uses service role key for bypassing RLS
 */
export function getSupabaseServer() {
  if (!supabaseServer) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('Required environment variables are not set: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    supabaseServer = createClient(url, key);
  }
  
  return supabaseServer;
}