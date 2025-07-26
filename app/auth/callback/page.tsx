"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
// NextAuth handles callbacks internally

export default function AuthCallbackPage() {
  const router = useRouter()
  // NextAuth handles OAuth callbacks

  useEffect(() => {
    // This page is no longer needed with NextAuth
    // NextAuth handles callbacks internally
    // Redirect to dashboard or signin
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}