"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Phone, Calendar, Users, MessageSquare, TrendingUp, 
  DollarSign, Clock, Brain, AlertCircle, Sparkles,
  Bot, Mic, MicOff, Settings
} from 'lucide-react'
import Link from 'next/link'
import { useStats } from '@/hooks/api/useStats'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useVoiceAgentStatus } from '@/hooks/useVoiceAgentStatus'
import { markStatsLoaded } from '@/lib/performance/metrics'
import { cn } from '@/lib/utils'

interface InsightCard {
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

export function DashboardOverview() {
  const { data: dashboardStats, isLoading: statsLoading } = useStats()
  const { businessProfile, voiceSettings, loading: profileLoading } = useDashboardData()
  const { isActive: voiceAgentActive, isListening } = useVoiceAgentStatus()
  
  // Get analytics for the last 30 days
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = new Date().toISOString().split('T')[0]
  const { analytics, loading: analyticsLoading } = useAnalytics({ startDate, endDate })
  
  // Track when stats are loaded
  useEffect(() => {
    if (dashboardStats && !statsLoading) {
      markStatsLoaded()
    }
  }, [dashboardStats, statsLoading])
  
  // Generate insights based on analytics
  const insights: InsightCard[] = []
  
  if (analytics) {
    // Revenue insights
    if (analytics.revenue.change > 20) {
      insights.push({
        id: 'revenue-growth',
        type: 'success',
        title: 'Strong Revenue Growth',
        description: `Revenue is up ${analytics.revenue.change.toFixed(0)}% this period. Keep up the momentum!`,
        icon: <TrendingUp className="w-5 h-5" />,
        action: {
          label: 'View Analytics',
          href: '/dashboard/analytics'
        }
      })
    } else if (analytics.revenue.change < -10) {
      insights.push({
        id: 'revenue-decline',
        type: 'warning',
        title: 'Revenue Needs Attention',
        description: `Revenue is down ${Math.abs(analytics.revenue.change).toFixed(0)}%. Consider running a promotion.`,
        icon: <DollarSign className="w-5 h-5" />,
        action: {
          label: 'View Customers',
          href: '/dashboard/customers?segment=dormant'
        }
      })
    }
    
    // Customer insights
    const atRiskSegment = analytics.customerSegments.find(s => s.segment === 'at_risk')
    if (atRiskSegment && atRiskSegment.percentage > 20) {
      insights.push({
        id: 'at-risk-customers',
        type: 'warning',
        title: 'Customers Need Attention',
        description: `${atRiskSegment.count} customers are at risk of churning. Reach out today!`,
        icon: <Users className="w-5 h-5" />,
        action: {
          label: 'View At-Risk',
          href: '/dashboard/customers?segment=at_risk'
        }
      })
    }
    
    // Peak hours insight
    const peakHour = analytics.popularTimes.reduce((max, time) => 
      time.appointments > max.appointments ? time : max
    )
    if (peakHour.appointments > 10) {
      insights.push({
        id: 'peak-hours',
        type: 'info',
        title: 'Busy Hours Identified',
        description: `Your busiest time is ${peakHour.hour}:00. Consider adding staff during these hours.`,
        icon: <Clock className="w-5 h-5" />,
        action: {
          label: 'Manage Schedule',
          href: '/dashboard/calendar'
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
            Welcome back, {businessProfile?.businessName || 'there'}!
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
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              AI Receptionist
            </p>
            <p className="text-xs text-gray-400">
              {voiceAgentActive ? 'Active & Learning' : 'Offline'}
            </p>
          </div>
          {voiceAgentActive && isListening && (
            <Mic className="w-4 h-4 text-green-400 animate-pulse" />
          )}
          <Link
            href="/dashboard/settings?tab=voice"
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </Link>
        </motion.div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            AI Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border",
                  insight.type === 'warning' && "bg-orange-500/10 border-orange-500/30",
                  insight.type === 'success' && "bg-green-500/10 border-green-500/30",
                  insight.type === 'opportunity' && "bg-blue-500/10 border-blue-500/30",
                  insight.type === 'info' && "bg-purple-500/10 border-purple-500/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    insight.type === 'warning' && "bg-orange-500/20 text-orange-400",
                    insight.type === 'success' && "bg-green-500/20 text-green-400",
                    insight.type === 'opportunity' && "bg-blue-500/20 text-blue-400",
                    insight.type === 'info' && "bg-purple-500/20 text-purple-400"
                  )}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">{insight.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{insight.description}</p>
                    {insight.action && (
                      <Link
                        href={insight.action.href}
                        className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        {insight.action.label} →
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            {analytics && (
              <span className={cn(
                "text-sm font-medium",
                analytics.revenue.change >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {analytics.revenue.change >= 0 ? '+' : ''}{analytics.revenue.change.toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            ${((analytics?.revenue.current || 0) / 1000).toFixed(1)}k
          </p>
          <p className="text-sm text-gray-400">Revenue This Period</p>
        </motion.div>

        {/* Appointments Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-green-400">
              {dashboardStats ? `+${((dashboardStats.bookingsToday / dashboardStats.callsToday) * 100).toFixed(0)}%` : ''}
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {dashboardStats?.bookingsToday || 0}
          </p>
          <p className="text-sm text-gray-400">Appointments Today</p>
        </motion.div>

        {/* Active Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            {analytics && (
              <span className="text-sm font-medium text-green-400">
                {analytics.retention.rate.toFixed(0)}% retention
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {analytics?.retention.returningCustomers || 0}
          </p>
          <p className="text-sm text-gray-400">Active Customers</p>
        </motion.div>

        {/* AI Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-brand-500/20">
              <MessageSquare className="w-6 h-6 text-brand-400" />
            </div>
            <span className="text-sm font-medium text-green-400">
              AI: {dashboardStats ? Math.round(dashboardStats.answerRate) : 0}%
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {dashboardStats?.smsToday || 0}
          </p>
          <p className="text-sm text-gray-400">Messages Today</p>
        </motion.div>
      </div>

      {/* Service Performance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Top Services</h2>
          {analytics?.servicePerformance ? (
            <div className="space-y-3">
              {analytics.servicePerformance.slice(0, 5).map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium">{service.serviceName}</p>
                    <p className="text-sm text-gray-400">
                      {service.appointmentCount} bookings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      ${service.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      ${service.averagePrice} avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Loading service data...</p>
            </div>
          )}
        </motion.div>

        {/* AI Activity Feed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">AI Activity</h2>
          <div className="space-y-3">
            {/* Mock activity - in real app this would come from API */}
            {[
              { 
                type: 'call', 
                customer: 'Sarah Johnson', 
                action: 'AI booked appointment for tomorrow', 
                time: '2 min ago',
                aiConfidence: 95
              },
              { 
                type: 'sms', 
                customer: 'Mike Chen', 
                action: 'AI confirmed reschedule request', 
                time: '8 min ago',
                aiConfidence: 88
              },
              { 
                type: 'call', 
                customer: 'Emma Davis', 
                action: 'AI provided service information', 
                time: '15 min ago',
                aiConfidence: 92
              },
              { 
                type: 'sms', 
                customer: 'John Smith', 
                action: 'AI sent appointment reminder', 
                time: '23 min ago',
                aiConfidence: 100
              }
            ].map((activity, index) => (
              <motion.div
                key={index}
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
                    <span className="text-xs text-gray-500">{activity.time}</span>
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      {activity.aiConfidence}% confidence
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <Link
            href="/dashboard/calls"
            className="mt-4 block text-center text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            View all AI activity →
          </Link>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: "Today's Schedule", 
              icon: Calendar, 
              href: '/dashboard/calendar', 
              color: 'bg-blue-500',
              count: dashboardStats?.bookingsToday
            },
            { 
              label: 'Unread Messages', 
              icon: MessageSquare, 
              href: '/dashboard/messages', 
              color: 'bg-purple-500',
              count: dashboardStats?.smsToday
            },
            { 
              label: 'Voice Settings', 
              icon: Mic, 
              href: '/dashboard/settings?tab=voice', 
              color: 'bg-green-500' 
            },
            { 
              label: 'View Analytics', 
              icon: Brain, 
              href: '/dashboard/analytics', 
              color: 'bg-brand-500' 
            }
          ].map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <Link
                href={action.href}
                className="relative block p-6 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all group"
              >
                {action.count !== undefined && action.count > 0 && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
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
    </div>
  )
}