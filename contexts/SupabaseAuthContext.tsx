"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { createClient } from '@supabase/supabase-js'

const SupabaseContext = createContext<any>(null)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false, // NextAuth handles sessions
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      ),
    []
  )

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const client = useContext(SupabaseContext)
  if (!client) {
    throw new Error("useSupabase must be used inside <SupabaseProvider>")
  }
  return client
}