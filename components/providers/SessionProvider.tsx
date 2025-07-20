"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryProvider } from "./QueryProvider"
import { ToastContainer } from "@/components/ui/Toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <QueryProvider>
          {children}
          <ToastContainer />
        </QueryProvider>
      </AuthProvider>
    </SessionProvider>
  )
}