"use client"

import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, Home, WifiOff } from 'lucide-react'
import Link from 'next/link'

interface DashboardErrorProps {
  error: Error | string
  retry?: () => void
  fullPage?: boolean
}

export function DashboardError({ error, retry, fullPage = false }: DashboardErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                        errorMessage.toLowerCase().includes('fetch')

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center ${fullPage ? 'py-20' : 'py-12'}`}
    >
      <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        {isNetworkError ? (
          <WifiOff className="w-10 h-10 text-red-400" />
        ) : (
          <AlertCircle className="w-10 h-10 text-red-400" />
        )}
      </div>
      
      <h2 className="text-2xl font-semibold text-white mb-2">
        {isNetworkError ? 'Connection Error' : 'Something went wrong'}
      </h2>
      
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        {isNetworkError 
          ? 'Unable to connect to the server. Please check your internet connection and try again.'
          : errorMessage || 'An unexpected error occurred. Please try again later.'}
      </p>

      <div className="flex items-center justify-center gap-3">
        {retry && (
          <button
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        
        {fullPage && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        )}
      </div>
    </motion.div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {content}
      </div>
    )
  }

  return content
}

interface LoadingSkeletonProps {
  type?: 'stats' | 'table' | 'list' | 'card'
  count?: number
}

export function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'stats':
        return (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
              <div className="w-12 h-4 bg-gray-700 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-700 rounded mb-1"></div>
            <div className="w-24 h-4 bg-gray-700 rounded"></div>
          </div>
        )
      
      case 'table':
        return (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="w-32 h-4 bg-gray-700 rounded"></div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-700 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="w-40 h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="w-24 h-3 bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )
      
      case 'list':
        return (
          <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4 animate-pulse">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-32 h-4 bg-gray-700 rounded"></div>
                  <div className="w-16 h-4 bg-gray-700 rounded"></div>
                </div>
                <div className="w-full h-3 bg-gray-700 rounded mb-2"></div>
                <div className="w-3/4 h-3 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        )
      
      default:
        return (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 animate-pulse">
            <div className="w-32 h-6 bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="w-full h-4 bg-gray-700 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-700 rounded"></div>
              <div className="w-1/2 h-4 bg-gray-700 rounded"></div>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  // In a real implementation, this would be a proper React Error Boundary
  // For now, this is a placeholder
  return <>{children}</>
}