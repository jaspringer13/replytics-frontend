"use client"

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ChartWrapperProps {
  title: string
  children: ReactNode
  loading?: boolean
  error?: Error | null
  onRefresh?: () => void
  className?: string
  subtitle?: string
}

export function ChartWrapper({
  title,
  children,
  loading = false,
  error = null,
  onRefresh,
  className = '',
  subtitle
}: ChartWrapperProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <AlertCircle className="w-12 h-12 mb-2" />
          <p className="text-sm">Failed to load chart data</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-2 text-sm text-brand-400 hover:text-brand-300"
            >
              Try again
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="w-full">{children}</div>
    </motion.div>
  )
}