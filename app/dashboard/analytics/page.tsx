"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Track performance metrics and gain insights</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Advanced Analytics Coming Soon</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Detailed analytics with call trends, conversion rates, customer insights, and custom reports will be available soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}