"use client"

import { useMemo } from 'react'
import { PopularTime } from '@/app/models/dashboard'

interface PopularTimesChartProps {
  data: PopularTime[]
  maxItems?: number
}

export function PopularTimesChart({ data, maxItems = 12 }: PopularTimesChartProps) {
  // Get top times and calculate percentages
  const processedData = useMemo(() => {
    const maxAppointments = Math.max(...data.map(t => t.appointments))
    return data
      .slice(0, maxItems)
      .map(time => ({
        ...time,
        percentage: maxAppointments > 0 ? (time.appointments / maxAppointments) * 100 : 0,
        displayHour: `${time.hour.toString().padStart(2, '0')}:00`
      }))
  }, [data, maxItems])

  // Get color based on percentage
  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 60) return 'bg-orange-500'
    if (percentage >= 40) return 'bg-yellow-500'
    if (percentage >= 20) return 'bg-green-500'
    return 'bg-gray-600'
  }

  return (
    <div className="space-y-3">
      {processedData.map((time, index) => (
        <div key={index} className="group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400 font-medium">
              {time.displayHour}
            </span>
            <span className="text-sm text-white font-medium">
              {time.appointments} appointments
            </span>
          </div>
          <div className="relative h-6 bg-gray-700 rounded overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 ${getBarColor(time.percentage)} transition-all duration-500 ease-out`}
              style={{ width: `${time.percentage}%` }}
            />
            <div className="absolute inset-0 flex items-center px-2">
              <span className="text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {time.percentage.toFixed(0)}% of peak
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-2">Activity Level:</p>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-400">Peak (80%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-400">High (60%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-400">Medium (40%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-400">Low (20%+)</span>
          </div>
        </div>
      </div>
    </div>
  )
}