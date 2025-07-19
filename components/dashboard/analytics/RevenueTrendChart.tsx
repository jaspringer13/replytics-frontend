"use client"

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { chartTheme, formatCurrency } from '@/lib/chart-config'

interface RevenueTrendData {
  date: string
  amount: number
}

interface RevenueTrendChartProps {
  data: RevenueTrendData[]
  height?: number
}

export function RevenueTrendChart({ data, height = 300 }: RevenueTrendChartProps) {
  // Format the data for display
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }))
  }, [data])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          style={chartTheme.tooltip.contentStyle}
          className="rounded-lg shadow-lg"
        >
          <p style={chartTheme.tooltip.labelStyle}>
            {label}
          </p>
          <p style={chartTheme.tooltip.itemStyle}>
            Revenue: <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Calculate Y-axis domain with some padding
  const yAxisDomain = useMemo(() => {
    const values = data.map(d => d.amount)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1
    return [Math.max(0, min - padding), max + padding]
  }, [data])

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart 
        data={formattedData}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid 
          strokeDasharray={chartTheme.grid.strokeDasharray} 
          stroke={chartTheme.grid.stroke} 
        />
        <XAxis 
          dataKey="displayDate" 
          stroke={chartTheme.axis.stroke}
          fontSize={chartTheme.axis.fontSize}
          tickMargin={8}
        />
        <YAxis 
          stroke={chartTheme.axis.stroke}
          fontSize={chartTheme.axis.fontSize}
          tickFormatter={formatCurrency}
          domain={yAxisDomain}
          tickMargin={8}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="amount" 
          stroke={chartTheme.colors.primary}
          strokeWidth={2}
          dot={{ fill: chartTheme.colors.primary, r: 4 }}
          activeDot={{ r: 6 }}
          animationDuration={1000}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}