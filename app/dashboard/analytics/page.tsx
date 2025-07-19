"use client"

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAnalytics } from '@/hooks/useAnalytics'
import { KPICard } from '@/components/dashboard/analytics/KPICard'
import { ChartWrapper } from '@/components/dashboard/charts/ChartWrapper'
import { RevenueTrendChart } from '@/components/dashboard/analytics/RevenueTrendChart'
import { ServicePerformanceChart } from '@/components/dashboard/analytics/ServicePerformanceChart'
import { CustomerSegmentsChart } from '@/components/dashboard/analytics/CustomerSegmentsChart'
import { PopularTimesChart } from '@/components/dashboard/analytics/PopularTimesChart'
import { AIInsights } from '@/components/dashboard/analytics/AIInsights'
import { 
  DollarSign, Users, Calendar, Star, 
  RefreshCw, Calendar as CalendarIcon 
} from 'lucide-react'

export default function AnalyticsPage() {
  // Date range state
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  
  // Fetch analytics data
  const { analytics, loading, error, refetch } = useAnalytics({
    startDate: dateRange.start,
    endDate: dateRange.end
  })
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with date filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-gray-400">Track performance metrics and gain insights</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent text-white text-sm outline-none"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent text-white text-sm outline-none"
              />
            </div>
          </div>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Revenue"
            value={formatCurrency(analytics?.revenue.current || 0)}
            previousValue={formatCurrency(analytics?.revenue.previous || 0)}
            change={analytics?.revenue.change}
            changeType={analytics?.revenue.change >= 0 ? 'positive' : 'negative'}
            icon={<DollarSign className="h-6 w-6" />}
            iconColor="text-green-400"
            loading={loading}
            delay={0}
          />
          
          <KPICard
            title="Appointments"
            value={analytics?.appointments.current || 0}
            previousValue={analytics?.appointments.previous || 0}
            change={analytics?.appointments.change}
            changeType={analytics?.appointments.change >= 0 ? 'positive' : 'negative'}
            icon={<Calendar className="h-6 w-6" />}
            iconColor="text-blue-400"
            loading={loading}
            delay={0.1}
          />
          
          <KPICard
            title="New Customers"
            value={analytics?.newCustomers.current || 0}
            previousValue={analytics?.newCustomers.previous || 0}
            change={analytics?.newCustomers.change}
            changeType={analytics?.newCustomers.change >= 0 ? 'positive' : 'negative'}
            icon={<Users className="h-6 w-6" />}
            iconColor="text-purple-400"
            loading={loading}
            delay={0.2}
          />
          
          <KPICard
            title="Retention Rate"
            value={`${analytics?.retention.rate.toFixed(1) || 0}%`}
            previousValue={`${analytics?.retention.returningCustomers || 0} returning`}
            changeType="neutral"
            icon={<Star className="h-6 w-6" />}
            iconColor="text-yellow-400"
            loading={loading}
            delay={0.3}
          />
        </div>
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <ChartWrapper
            title="Revenue Trend"
            subtitle="Daily revenue over selected period"
            loading={loading}
            error={error}
            onRefresh={refetch}
            className="lg:col-span-2"
          >
            {analytics && (
              <RevenueTrendChart data={analytics.revenue.trend} height={350} />
            )}
          </ChartWrapper>
          
          {/* Service Performance */}
          <ChartWrapper
            title="Top Services"
            subtitle="Revenue by service"
            loading={loading}
            error={error}
          >
            {analytics && (
              <ServicePerformanceChart 
                data={analytics.servicePerformance} 
                maxItems={5}
              />
            )}
          </ChartWrapper>
          
          {/* Customer Segments */}
          <ChartWrapper
            title="Customer Segments"
            subtitle="Distribution of customer types"
            loading={loading}
            error={error}
          >
            {analytics && (
              <CustomerSegmentsChart data={analytics.customerSegments} />
            )}
          </ChartWrapper>
          
          {/* Popular Times */}
          <ChartWrapper
            title="Popular Times"
            subtitle="Busiest hours of the day"
            loading={loading}
            error={error}
            className="lg:col-span-2"
          >
            {analytics && (
              <PopularTimesChart data={analytics.popularTimes} />
            )}
          </ChartWrapper>
        </div>
        
        {/* AI Insights */}
        {analytics && !loading && (
          <AIInsights analytics={analytics} />
        )}
      </div>
    </DashboardLayout>
  )
}