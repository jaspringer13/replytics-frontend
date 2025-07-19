"use client"

import { Suspense } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Settings } from '@/components/dashboard/settings/Settings'
import { useAuth } from '@/contexts/AuthContext'

function SettingsContent() {
  const { user } = useAuth()
  const businessId = user?.tenantId || 'default'

  return <Settings businessId={businessId} />
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="h-12 bg-gray-700 rounded mb-6"></div>
            <div className="h-96 bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      }>
        <SettingsContent />
      </Suspense>
    </DashboardLayout>
  )
}