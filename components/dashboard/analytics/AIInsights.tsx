"use client"

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { TrendingUp, Users, DollarSign, Calendar, Clock, AlertCircle } from 'lucide-react'
import { AnalyticsOverview } from '@/app/models/dashboard'

interface AIInsightsProps {
  analytics: AnalyticsOverview
}

interface Insight {
  icon: React.ReactNode
  iconColor: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export function AIInsights({ analytics }: AIInsightsProps) {
  // Generate insights based on analytics data - memoized to prevent unnecessary recalculations
  const insights = useMemo((): Insight[] => {
    const insights: Insight[] = []
    
    // Revenue insights
    if (analytics.trends.revenue.percentChange < -10) {
      insights.push({
        icon: <DollarSign className="h-6 w-6" />,
        iconColor: 'text-red-300',
        title: 'Revenue Alert',
        description: `Revenue is down ${Math.abs(analytics.trends.revenue.percentChange).toFixed(0)}% compared to last period. Consider promotional offers or reaching out to dormant customers.`,
        priority: 'high'
      })
    } else if (analytics.trends.revenue.percentChange > 20) {
      insights.push({
        icon: <TrendingUp className="h-6 w-6" />,
        iconColor: 'text-green-300',
        title: 'Revenue Growth',
        description: `Excellent! Revenue is up ${analytics.trends.revenue.percentChange.toFixed(0)}%. Capitalize on this momentum by increasing capacity or introducing premium services.`,
        priority: 'medium'
      })
    }
    
    // Customer retention insights
    // Calculate actual retention rate based on active customer segments (VIP + Regular)
    const totalCustomers = Object.values(analytics.customerSegments).reduce((sum, count) => sum + count, 0)
    const retentionRate = totalCustomers > 0 ? 
      ((analytics.customerSegments.vip + analytics.customerSegments.regular) / totalCustomers) * 100 : 0
    if (retentionRate < 60) {
      insights.push({
        icon: <Users className="h-6 w-6" />,
        iconColor: 'text-orange-300',
        title: 'Retention Opportunity',
        description: `Only ${retentionRate.toFixed(0)}% of customers are returning. Implement a loyalty program or follow-up campaigns to improve retention.`,
        priority: 'high'
      })
    }
    
    // Popular times insights - removed as data not available in current model
    
    // New customer insights
    if (analytics.trends.newCustomers.percentChange > 15) {
      insights.push({
        icon: <Users className="h-6 w-6" />,
        iconColor: 'text-purple-300',
        title: 'New Customer Growth',
        description: `New customers increased by ${analytics.trends.newCustomers.percentChange.toFixed(0)}%. Ensure a great first experience to convert them to regulars.`,
        priority: 'medium'
      })
    }
    
    // Service performance insights
    const topService = analytics.topServices?.[0]
    if (topService) {
      insights.push({
        icon: <DollarSign className="h-6 w-6" />,
        iconColor: 'text-yellow-300',
        title: 'Top Service',
        description: `"${topService.serviceName}" generates the most revenue. Consider creating package deals or complementary services.`,
        priority: 'low'
      })
    }
    
    // At-risk customers
    const atRiskPercentage = totalCustomers > 0 ? (analytics.customerSegments.at_risk / totalCustomers) * 100 : 0
    if (atRiskPercentage > 20) {
      insights.push({
        icon: <AlertCircle className="h-6 w-6" />,
        iconColor: 'text-red-300',
        title: 'Customer Risk',
        description: `${atRiskPercentage.toFixed(0)}% of customers are at risk of churning. Launch a win-back campaign immediately.`,
        priority: 'high'
      })
    }
    
    // Return top 3 insights by priority
    return insights
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
      .slice(0, 3)
  }, [analytics])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl p-6 shadow-xl"
    >
      <h3 className="text-lg font-semibold text-white mb-4">AI-Powered Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            className="bg-white/10 backdrop-blur rounded-lg p-4 hover:bg-white/15 transition-colors"
          >
            <div className={`${insight.iconColor} mb-2`}>
              {insight.icon}
            </div>
            <h4 className="font-medium text-white mb-1">{insight.title}</h4>
            <p className="text-sm text-gray-200 leading-relaxed">
              {insight.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}