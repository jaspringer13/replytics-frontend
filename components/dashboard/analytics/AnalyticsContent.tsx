"use client"

import React from 'react';
import { formatCurrency } from '@/lib/utils/currency';
import { KPICard } from '@/components/dashboard/analytics/KPICard';
import { ChartWrapper } from '@/components/dashboard/charts/ChartWrapper';
import { RevenueTrendChart } from '@/components/dashboard/analytics/RevenueTrendChart';
import { ServicePerformanceChart } from '@/components/dashboard/analytics/ServicePerformanceChart';
import { CustomerSegmentsChart } from '@/components/dashboard/analytics/CustomerSegmentsChart';
import { PopularTimesChart } from '@/components/dashboard/analytics/PopularTimesChart';
import { AIInsights } from '@/components/dashboard/analytics/AIInsights';
import { DollarSign, Users, Calendar, Star } from 'lucide-react';
import { useAnalytics } from '@/contexts/AnalyticsContext';

export function AnalyticsContent() {
  const { data: analytics, loading, error, refetch, calculateRetentionRate } = useAnalytics();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenue"
          value={formatCurrency(analytics?.trends?.revenue?.current || 0)}
          previousValue={formatCurrency(analytics?.trends?.revenue?.previous || 0)}
          change={analytics?.trends?.revenue?.percentChange}
          changeType={(analytics?.trends?.revenue?.percentChange || 0) >= 0 ? 'positive' : 'negative'}
          icon={<DollarSign className="h-6 w-6" />}
          iconColor="text-green-400"
          loading={loading}
          delay={0}
        />
        
        <KPICard
          title="Appointments"
          value={analytics?.trends?.appointments?.current || 0}
          previousValue={analytics?.trends?.appointments?.previous || 0}
          change={analytics?.trends?.appointments?.percentChange}
          changeType={(analytics?.trends?.appointments?.percentChange || 0) >= 0 ? 'positive' : 'negative'}
          icon={<Calendar className="h-6 w-6" />}
          iconColor="text-blue-400"
          loading={loading}
          delay={0.1}
        />
        
        <KPICard
          title="New Customers"
          value={analytics?.trends?.newCustomers?.current || 0}
          previousValue={analytics?.trends?.newCustomers?.previous || 0}
          change={analytics?.trends?.newCustomers?.percentChange}
          changeType={(analytics?.trends?.newCustomers?.percentChange || 0) >= 0 ? 'positive' : 'negative'}
          icon={<Users className="h-6 w-6" />}
          iconColor="text-purple-400"
          loading={loading}
          delay={0.2}
        />
        
        <KPICard
          title="Retention Rate"
          value={`${(calculateRetentionRate() || 0).toFixed(1)}%`}
          previousValue={`${Object.values(analytics?.customerSegments || {}).reduce((sum, count) => sum + count, 0)} total customers`}
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
            <RevenueTrendChart 
              data={analytics?.trends?.revenue?.dataPoints?.map(d => ({ 
                date: d.date, 
                amount: d.value 
              })) || []} 
              height={350} 
            />
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
              data={analytics?.topServices || []} 
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
            <CustomerSegmentsChart data={[
              { segment: 'vip', count: analytics?.customerSegments?.vip || 0 },
              { segment: 'regular', count: analytics?.customerSegments?.regular || 0 },
              { segment: 'at_risk', count: analytics?.customerSegments?.atRisk || 0 },
              { segment: 'new', count: analytics?.customerSegments?.new || 0 },
              { segment: 'dormant', count: analytics?.customerSegments?.dormant || 0 }
            ]} />
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
            <PopularTimesChart data={analytics?.popularTimes || []} />
          )}
        </ChartWrapper>
      </div>
      
      {/* AI Insights */}
      {analytics && !loading && (
        <AIInsights analytics={analytics} />
      )}
    </div>
  );
}