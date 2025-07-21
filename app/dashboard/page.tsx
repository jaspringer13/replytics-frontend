"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard/DashboardOverview"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { useSupabaseAuth as useAuth } from "@/contexts/SupabaseAuthContext"

export default function DashboardPage() {
  const router = useRouter()
  const { isLoading, isAuthenticated, token, user } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  )
}