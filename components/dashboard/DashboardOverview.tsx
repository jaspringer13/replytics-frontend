"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, DollarSign, Users, Bot, Settings
} from 'lucide-react'
import Link from 'next/link'
import { useStats } from '@/hooks/api/useStats'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useVoiceAgentStatus } from '@/hooks/useVoiceAgentStatus'
import { markStatsLoaded } from '@/lib/performance/metrics'
import { cn } from '@/lib/utils'
import { InsightCards, type InsightCard } from './overview/InsightCards'
import { QuickActions } from './overview/QuickActions'
import { ServicePerformance } from './overview/ServicePerformance'
import { AIActivityFeed, type AIActivity } from './overview/AIActivityFeed'

const INSIGHT_THRESHOLDS = {
  REVENUE_GROWTH_STRONG: 20,
  REVENUE_DECLINE_WARNING: -10,
  AT_RISK_CUSTOMERS_WARNING: 20,
  PEAK_HOUR_APPOINTMENTS: 10
} as const

export function DashboardOverview() {
  const { data: dashboardStats, isLoading: statsLoading } = useStats()
  const { data: businessProfile, isLoading: profileLoading } = useDashboardData()
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics()
  const { isActive: voiceAgentActive } = useVoiceAgentStatus()
  const [aiActivities, setAiActivities] = useState<AIActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  // Mark performance metrics when stats are loaded
  useEffect(() => {
    if (dashboardStats && !statsLoading) {
      markStatsLoaded()
    }
  }, [dashboardStats, statsLoading])

  // Fetch AI activities
  useEffect(() => {
    const fetchAIActivity = async () => {
      if (!businessProfile?.id) return

      try {
        setActivitiesLoading(true)
        // Mock AI activities for now - replace with real API call
        const mockActivities: AIActivity[] = [
          {
            id: '1',
            type: 'call',
            customer: 'Sarah Johnson',
            action: 'Scheduled haircut appointment for tomorrow at 2 PM',
            timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            aiConfidence: 95,
            businessId: businessProfile.id
          },
          {
            id: '2',
            type: 'sms',
            customer: 'Mike Chen',
            action: 'Confirmed appointment reminder and answered pricing question',
            timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
            aiConfidence: 88,
            businessId: businessProfile.id
          },
          {
            id: '3',
            type: 'call',
            customer: 'Lisa Brown',
            action: 'Rescheduled appointment from Friday to Monday',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            aiConfidence: 92,
            businessId: businessProfile.id
          }
        ]
        setAiActivities(mockActivities)
      } catch (error) {
        console.error('Error fetching AI activities:', error)
        setAiActivities([])
      } finally {
        setActivitiesLoading(false)
      }
    }

    fetchAIActivity()
  }, [businessProfile?.id])
  
  // Generate insights based on analytics
  const insights: InsightCard[] = []
  
  if (analytics) {
    // Revenue insights
    if (analytics.trends.revenue.percentChange > INSIGHT_THRESHOLDS.REVENUE_GROWTH_STRONG) {
      insights.push({
        id: 'revenue-growth',
        type: 'success',
        title: 'Strong Revenue Growth',
        description: `Revenue is up ${analytics.trends.revenue.percentChange.toFixed(0)}% this period. Keep up the momentum!`,
        icon: <TrendingUp className="w-5 h-5" />,
        action: {
          label: 'View Analytics',
          href: '/dashboard/analytics'
        }
      })
    } else if (analytics.trends.revenue.percentChange < INSIGHT_THRESHOLDS.REVENUE_DECLINE_WARNING) {
      insights.push({
        id: 'revenue-decline',
        type: 'warning',
        title: 'Revenue Needs Attention',
        description: `Revenue is down ${Math.abs(analytics.trends.revenue.percentChange).toFixed(0)}%. Consider running a promotion.`,
        icon: <DollarSign className="w-5 h-5" />,
        action: {
          label: 'View Customers',
          href: '/dashboard/customers?segment=dormant'
        }
      })
    }
    
    // Customer insights
    const totalCustomers = Object.values(analytics.customerSegments).reduce((sum, count) => sum + count, 0)
    const atRiskCount = analytics.customerSegments.atRisk
    const atRiskPercentage = totalCustomers > 0 ? (atRiskCount / totalCustomers) * 100 : 0
    if (atRiskPercentage > INSIGHT_THRESHOLDS.AT_RISK_CUSTOMERS_WARNING) {
      insights.push({
        id: 'at-risk-customers',
        type: 'warning',
        title: 'Customers Need Attention',
        description: `${atRiskCount} customers are at risk of churning. Reach out today!`,
        icon: <Users className="w-5 h-5" />,
        action: {
          label: 'View At-Risk',
          href: '/dashboard/customers?segment=at_risk'
        }
      })
    }
  }
  
  // Voice agent insight
  if (!voiceAgentActive) {
    insights.unshift({
      id: 'voice-agent-offline',
      type: 'warning',
      title: 'Voice Agent Offline',
      description: 'Your AI receptionist is not active. Enable it to handle calls automatically.',
      icon: <Bot className="w-5 h-5" />,
      action: {
        label: 'Enable Agent',
        href: '/dashboard/settings?tab=voice'
      }
    })
  }
  
  const loading = statsLoading || profileLoading || analyticsLoading

  return (
    <div className="space-y-6">
      {/* Header with Voice Agent Status */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {businessProfile?.name || 'there'}!
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your AI-powered business today.
          </p>
        </div>
        
        {/* Voice Agent Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "px-4 py-3 rounded-xl border flex items-center gap-3",
            voiceAgentActive 
              ? "bg-green-500/10 border-green-500/30" 
              : "bg-gray-800 border-gray-700"
          )}
        >
          <div className="relative">
            <Bot className={cn(
              "w-6 h-6",
              voiceAgentActive ? "text-green-400" : "text-gray-400"
            )} />
            {voiceAgentActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <p className={cn(
              "font-medium text-sm",
              voiceAgentActive ? "text-green-100" : "text-gray-300"
            )}>
              AI Receptionist
            </p>
            <p className={cn(
              "text-xs",
              voiceAgentActive ? "text-green-300" : "text-gray-500"
            )}>
              {voiceAgentActive ? "Active" : "Offline"}
            </p>
          </div>
          <Link
            href="/dashboard/settings?tab=voice"
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
          </Link>
        </motion.div>
      </div>

      {/* AI Insights */}
      <InsightCards insights={insights.slice(0, 3)} loading={loading} />

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs text-gray-400">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            ${loading ? '...' : (dashboardStats?.revenueToday?.toLocaleString() || '0')}
          </h3>
          <p className="text-sm text-gray-400">Revenue Today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-gray-400">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {loading ? '...' : (dashboardStats?.bookingsToday || 0)}
          </h3>
          <p className="text-sm text-gray-400">Bookings Today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-gray-400">AI Handled</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {loading ? '...' : (dashboardStats?.callsToday || 0)}
          </h3>
          <p className="text-sm text-gray-400">Calls Today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-xs text-gray-400">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {loading ? '...' : (dashboardStats?.smsToday || 0)}
          </h3>
          <p className="text-sm text-gray-400">Messages Today</p>
        </motion.div>
      </div>

      {/* Service Performance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ServicePerformance 
          topServices={analytics?.topServices} 
          loading={analyticsLoading} 
        />
        <AIActivityFeed 
          activities={aiActivities} 
          loading={activitiesLoading} 
        />
      </div>

      {/* Quick Actions */}
      <QuickActions dashboardStats={dashboardStats} loading={statsLoading} />
    </div>
  )
}