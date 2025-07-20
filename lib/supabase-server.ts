import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/config';

// Singleton instance
let supabaseServer: ReturnType<typeof createClient> | null = null;

/**
 * Get Supabase client for server-side operations
 * Uses service role key for bypassing RLS
 */
export function getSupabaseServer() {
  if (!supabaseServer) {
    const url = env.get('SUPABASE_URL');
    const key = env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!url || !key) {
      throw new Error('Required environment variables are not set: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    supabaseServer = createClient(url, key);
  }
  
  return supabaseServer;
}