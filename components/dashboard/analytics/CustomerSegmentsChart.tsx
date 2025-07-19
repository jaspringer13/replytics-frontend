"use client"

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { chartTheme } from '@/lib/chart-config'
import { CustomerSegmentData } from '@/app/models/dashboard'

interface CustomerSegmentsChartProps {
  data: CustomerSegmentData[]
  height?: number
}

// Define colors for each segment
const SEGMENT_COLORS = {
  vip: chartTheme.colors.primary,       // Purple
  regular: chartTheme.colors.secondary,  // Blue
  new: chartTheme.colors.success,       // Green
  at_risk: chartTheme.colors.warning,   // Yellow
  dormant: chartTheme.colors.danger     // Red
}

export function CustomerSegmentsChart({ data, height = 300 }: CustomerSegmentsChartProps) {
  // Calculate total and sort by count
  const enhancedData = useMemo(() => {
    const total = data.reduce((sum, segment) => sum + segment.count, 0)
    return data
      .map(segment => ({
        ...segment,
        percentage: total > 0 ? (segment.count / total) * 100 : 0,
        color: SEGMENT_COLORS[segment.segment as keyof typeof SEGMENT_COLORS] || chartTheme.colors.gray
      }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  // Custom label
  const renderLabel = (entry: any) => {
    if (entry.percentage < 5) return null // Don't show label for small segments
    return `${entry.percentage.toFixed(0)}%`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div 
          style={chartTheme.tooltip.contentStyle}
          className="rounded-lg shadow-lg"
        >
          <p style={chartTheme.tooltip.labelStyle} className="font-medium mb-2 capitalize">
            {data.segment.replace('_', ' ')}
          </p>
          <div style={chartTheme.tooltip.itemStyle} className="space-y-1">
            <p>Customers: <span className="font-semibold">{data.count.toLocaleString()}</span></p>
            <p>Percentage: <span className="font-semibold">{data.percentage.toFixed(1)}%</span></p>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <ul className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-300 capitalize">
              {entry.value.replace('_', ' ')}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={enhancedData}
          cx="50%"
          cy="45%"
          labelLine={false}
          label={renderLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
          animationBegin={0}
          animationDuration={1000}
        >
          {enhancedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          content={renderLegend}
          wrapperStyle={{
            paddingTop: '20px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}