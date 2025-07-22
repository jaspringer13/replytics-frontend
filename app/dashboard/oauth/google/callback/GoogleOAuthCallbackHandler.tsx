"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export function GoogleOAuthCallbackHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useSupabaseAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let redirectTimeoutId: NodeJS.Timeout | null = null

    const handleOAuthCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        setStatus('error')
        setErrorMessage(error === 'access_denied' ? 'Authorization was denied' : 'OAuth error occurred')
        return
      }

      if (!code || !state) {
        setStatus('error')
        setErrorMessage('Missing authorization code or state')
        return
      }

      if (!user?.tenantId) {
        setStatus('error')
        setErrorMessage('User not authenticated')
        return
      }

      try {
        // Send authorization code to backend
        const response = await fetch('/api/v2/dashboard/oauth/google/callback?' + new URLSearchParams({
          code,
          state
        }), {
          method: 'POST',
          headers: {
            'X-Tenant-ID': user.tenantId
          }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to connect' }))
          throw new Error(errorData.message || 'Failed to connect Google Calendar')
        }

        const result = await response.json()
        
        setStatus('success')
        toast.success('Google Calendar connected successfully!')
        
        // Redirect back to integrations tab after 2 seconds
        redirectTimeoutId = setTimeout(() => {
          router.push('/dashboard/settings?tab=integrations')
        }, 2000)
      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to connect Google Calendar')
        toast.error('Failed to connect Google Calendar')
      }
    }

    handleOAuthCallback()

    // Cleanup function to prevent memory leaks
    return () => {
      if (redirectTimeoutId) {
        clearTimeout(redirectTimeoutId)
      }
    }
  }, [searchParams, router, toast, user])

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="text-center space-y-4">
            {status === 'processing' && (
              <>
                <Loader2 className="w-12 h-12 text-brand-400 mx-auto animate-spin" />
                <h2 className="text-xl font-semibold text-white">Connecting Google Calendar...</h2>
                <p className="text-gray-400">Please wait while we complete the connection.</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                <h2 className="text-xl font-semibold text-white">Successfully Connected!</h2>
                <p className="text-gray-400">Google Calendar has been connected to your account.</p>
                <p className="text-sm text-gray-500">Redirecting you back to settings...</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-red-400 mx-auto" />
                <h2 className="text-xl font-semibold text-white">Connection Failed</h2>
                <p className="text-gray-400">{errorMessage}</p>
                <button
                  onClick={() => router.push('/dashboard/settings?tab=integrations')}
                  className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  Back to Settings
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}