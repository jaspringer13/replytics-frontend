"use client"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          Authentication Error
        </h1>
        <p className="text-gray-400 mb-6">
          {error === 'Configuration' 
            ? 'There was a problem with the authentication configuration.'
            : 'Something went wrong during sign in.'}
        </p>
        
        <Link
          href="/auth/signin"
          className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}