"use client"

import { SessionProvider } from "next-auth/react"
import { SupabaseProvider } from "@/contexts/SupabaseAuthContext"
import { QueryProvider } from "./QueryProvider"
import { ToastContainer } from "@/components/ui/Toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SupabaseProvider>
        <QueryProvider>
          {children}
          <ToastContainer />
        </QueryProvider>
      </SupabaseProvider>
    </SessionProvider>
  )
}