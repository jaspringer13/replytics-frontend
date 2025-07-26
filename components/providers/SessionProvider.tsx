"use client"

import { SessionProvider } from "next-auth/react"
import { SupabaseProvider } from "@/contexts/SupabaseAuthContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryProvider } from "./QueryProvider"
import { ToastContainer } from "@/components/ui/Toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <SupabaseProvider>
          <QueryProvider>
            {children}
            <ToastContainer />
          </QueryProvider>
        </SupabaseProvider>
      </AuthProvider>
    </SessionProvider>
  )
}