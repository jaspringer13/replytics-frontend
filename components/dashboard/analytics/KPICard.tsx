"use client"

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  previousValue?: string | number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: ReactNode
  iconColor?: string
  loading?: boolean
  delay?: number
}

export function KPICard({
  title,
  value,
  previousValue,
  change,
  changeType = 'neutral',
  icon,
  iconColor = 'text-gray-400',
  loading = false,
  delay = 0
}: KPICardProps) {
  // Determine change color based on type
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-green-400'
    if (changeType === 'negative') return 'text-red-400'
    return 'text-gray-400'
  }

  // Format change percentage
  const formatChange = (value: number) => {
    const prefix = value > 0 ? '+' : ''
    return `${prefix}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-700 rounded"></div>
            <div className="w-16 h-4 bg-gray-700 rounded"></div>
          </div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg bg-gray-700/50", iconColor)}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", getChangeColor())}>
            {change > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : change < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            <span>{formatChange(change)}</span>
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      
      {previousValue !== undefined && (
        <p className="text-sm text-gray-500">
          vs {previousValue}
        </p>
      )}
    </motion.div>
  )
}