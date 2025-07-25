"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard/DashboardOverview"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { useSession } from "next-auth/react"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  )
}