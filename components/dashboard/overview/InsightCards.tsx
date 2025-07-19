"use client"

import { motion } from 'framer-motion'
import { 
  TrendingUp, DollarSign, Users, Bot,
  ArrowRight, AlertCircle, CheckCircle, Info, Lightbulb, Brain
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface InsightCard {
  id: string
  type: 'opportunity' | 'warning' | 'success' | 'info'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  icon: React.ReactNode
}

interface InsightCardsProps {
  insights: InsightCard[]
  loading?: boolean
}

const typeStyles = {
  opportunity: "border-blue-500/30 bg-blue-500/10 text-blue-100",
  warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-100",
  success: "border-green-500/30 bg-green-500/10 text-green-100",
  info: "border-gray-500/30 bg-gray-500/10 text-gray-100"
}

const typeIcons = {
  opportunity: Lightbulb,
  warning: AlertCircle,
  success: CheckCircle,
  info: Info
}

export function InsightCards({ insights, loading }: InsightCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-8 text-center">
        <Brain className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Insights Available</h3>
        <p className="text-gray-400">
          AI insights will appear here once you have more data to analyze.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {insights.map((insight, index) => {
        const TypeIcon = typeIcons[insight.type]
        const typeIconElement = <TypeIcon className="w-5 h-5 mt-2 opacity-70" />
        
        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "rounded-xl border p-6 backdrop-blur-sm",
              typeStyles[insight.type]
            )}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/10">
                {insight.icon}
              </div>
              {typeIconElement}
            </div>
            
            <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
            <p className="text-sm opacity-90 mb-4">{insight.description}</p>
            
            {insight.action && (
              <Link
                href={insight.action.href}
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline transition-all group"
              >
                {insight.action.label}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}