"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Users } from 'lucide-react'

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Clients</h1>
          <p className="text-gray-400">Manage your client database and contact information</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Client Management Coming Soon</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Soon you'll be able to view and manage all your clients, track their appointment history, and send automated reminders.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}