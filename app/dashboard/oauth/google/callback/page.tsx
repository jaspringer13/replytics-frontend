"use client"

import { Suspense } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Loader2 } from 'lucide-react'
import { GoogleOAuthCallbackHandler } from './GoogleOAuthCallbackHandler'

function LoadingFallback() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-brand-400 mx-auto animate-spin" />
            <h2 className="text-xl font-semibold text-white">Loading...</h2>
            <p className="text-gray-400">Processing OAuth callback...</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GoogleOAuthCallbackHandler />
    </Suspense>
  )
}