"use client"

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { chartTheme, formatCurrency } from '@/lib/chart-config'
import { ServicePerformance } from '@/app/models/dashboard'

interface ServicePerformanceChartProps {
  data: ServicePerformance[]
  height?: number
  maxItems?: number
}

export function ServicePerformanceChart({ 
  data, 
  height = 300,
  maxItems = 5 
}: ServicePerformanceChartProps) {
  // Get top services and truncate long names
  const topServices = useMemo(() => {
    return data
      .slice(0, maxItems)
      .map(service => ({
        ...service,
        displayName: service.serviceName.length > 20 
          ? service.serviceName.substring(0, 17) + '...' 
          : service.serviceName
      }))
  }, [data, maxItems])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const service = payload[0].payload
      return (
        <div 
          style={chartTheme.tooltip.contentStyle}
          className="rounded-lg shadow-lg"
        >
          <p style={chartTheme.tooltip.labelStyle} className="font-medium mb-2">
            {service.serviceName}
          </p>
          <div style={chartTheme.tooltip.itemStyle} className="space-y-1">
            <p>Revenue: <span className="font-semibold">{formatCurrency(service.revenue)}</span></p>
            <p>Appointments: <span className="font-semibold">{service.appointmentCount}</span></p>
            <p>Avg Price: <span className="font-semibold">{formatCurrency(service.averagePrice)}</span></p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart 
        data={topServices}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid 
          strokeDasharray={chartTheme.grid.strokeDasharray} 
          stroke={chartTheme.grid.stroke} 
        />
        <XAxis 
          dataKey="displayName" 
          stroke={chartTheme.axis.stroke}
          fontSize={chartTheme.axis.fontSize}
          tickMargin={8}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke={chartTheme.axis.stroke}
          fontSize={chartTheme.axis.fontSize}
          tickFormatter={formatCurrency}
          tickMargin={8}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="revenue" 
          fill={chartTheme.colors.secondary}
          radius={[8, 8, 0, 0]}
          animationDuration={1000}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}