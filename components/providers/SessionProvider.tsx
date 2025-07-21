"use client"

import { SessionProvider } from "next-auth/react"
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext"
import { QueryProvider } from "./QueryProvider"
import { ToastContainer } from "@/components/ui/Toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SupabaseAuthProvider>
        <QueryProvider>
          {children}
          <ToastContainer />
        </QueryProvider>
      </SupabaseAuthProvider>
    </SessionProvider>
  )
}