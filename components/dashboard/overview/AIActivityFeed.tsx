"use client"

import { motion } from 'framer-motion'
import { Phone, MessageSquare, Brain, Bot, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface AIActivity {
  id: string
  type: 'call' | 'sms' | 'chat'
  customer: string
  action: string
  timestamp: Date
  aiConfidence: number
  businessId: string
}

interface AIActivityFeedProps {
  activities: AIActivity[]
  loading?: boolean
}

// Helper function to format relative time
function getRelativeTime(timestamp: Date): string {
  const now = new Date()
  
  // Handle future timestamps
  if (timestamp > now) return 'Just now'
  
  const diffMs = now.getTime() - timestamp.getTime()
  
  // Handle invalid dates
  if (isNaN(diffMs)) return 'Unknown'
  
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function AIActivityFeed({ activities, loading }: AIActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
    >
      <h2 className="text-xl font-semibold text-white mb-4">AI Activity</h2>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p>Loading AI activity...</p>
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg"
            >
              <div className={cn(
                "p-2 rounded-lg",
                activity.type === 'call' ? "bg-brand-500/20" : "bg-purple-500/20"
              )}>
                {activity.type === 'call' ? (
                  <Phone className="w-4 h-4 text-brand-400" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{activity.customer}</p>
                <p className="text-gray-400 text-sm">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</span>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    {activity.aiConfidence}% confidence
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No AI activity yet</p>
          </div>
        )}
      </div>
      <Link
        href="/dashboard/calls"
        className="mt-4 block text-center text-sm text-brand-400 hover:text-brand-300 transition-colors"
      >
        View all calls →
      </Link>
    </motion.div>
  )
}