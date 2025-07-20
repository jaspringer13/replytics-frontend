"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AnalyticsProvider } from '@/contexts/AnalyticsContext'
import { AnalyticsHeader } from '@/components/dashboard/analytics/AnalyticsHeader'
import { AnalyticsContent } from '@/components/dashboard/analytics/AnalyticsContent'

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsProvider>
        <div className="max-w-7xl mx-auto space-y-6">
          <AnalyticsHeader />
          <AnalyticsContent />
        </div>
      </AnalyticsProvider>
    </DashboardLayout>
  )
}