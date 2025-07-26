import { useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * React hook to get the Supabase client
 * Returns a memoized instance of the Supabase client for use in components
 */
export function useSupabase() {
  const supabase = useMemo(() => {
    try {
      return getSupabaseClient();
    } catch (error) {
      console.warn('Failed to initialize Supabase client:', error);
      return null;
    }
  }, []);

  return supabase;
}