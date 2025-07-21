"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Check for error in URL params
        const urlParams = new URLSearchParams(window.location.search)
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        if (error) {
          console.error('OAuth error:', error, errorDescription)
          router.push(`/auth/signin?error=${encodeURIComponent(errorDescription || error)}`)
          return
        }

        // Get the session after OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push('/auth/signin?error=Failed to establish session')
          return
        }

        if (session) {
          // Check if this is a new user who needs onboarding
          const needsOnboarding = !session.user.user_metadata?.current_business_id
          
          if (needsOnboarding) {
            router.push('/onboarding')
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/auth/signin?error=Authentication failed')
      }
    }

    handleCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}