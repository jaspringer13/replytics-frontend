"use client"

import { motion } from 'framer-motion'
import { Calendar, MessageSquare, Mic, Brain, LucideIcon } from 'lucide-react'
import Link from 'next/link'

export interface QuickAction {
  id: string
  label: string
  icon: LucideIcon
  href: string
  color: string
  count?: number
}

interface QuickActionsProps {
  dashboardStats?: {
    bookingsToday?: number
    smsToday?: number
  }
  loading?: boolean
}

const defaultActions: QuickAction[] = [
  { 
    id: 'schedule',
    label: "Today's Schedule", 
    icon: Calendar, 
    href: '/dashboard/calendar', 
    color: 'bg-blue-500'
  },
  { 
    id: 'messages',
    label: 'Unread Messages', 
    icon: MessageSquare, 
    href: '/dashboard/messages', 
    color: 'bg-purple-500'
  },
  { 
    id: 'voice',
    label: 'Voice Settings', 
    icon: Mic, 
    href: '/dashboard/settings?tab=voice', 
    color: 'bg-green-500' 
  },
  { 
    id: 'analytics',
    label: 'View Analytics', 
    icon: Brain, 
    href: '/dashboard/analytics', 
    color: 'bg-brand-500' 
  }
]

export function QuickActions({ dashboardStats, loading }: QuickActionsProps) {
  const actions = defaultActions.map(action => ({
    ...action,
    count: action.id === 'schedule' 
      ? dashboardStats?.bookingsToday 
      : action.id === 'messages' 
      ? dashboardStats?.smsToday 
      : undefined
  }))

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl animate-pulse">
              <div className="w-12 h-12 bg-gray-700 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
          >
            <Link
              href={action.href}
              role="button"
              aria-label={`${action.label}${action.count ? ` (${action.count} items)` : ''}`}
              className="relative block p-6 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all group"
            >
              {action.count !== undefined && action.count > 0 && (
                <div 
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  aria-label={`${action.count} items`}
                >
                  {action.count}
                </div>
              )}
              <div className={`w-12 h-12 ${action.color}/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-medium">{action.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}