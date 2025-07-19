"use client"

import { motion } from 'framer-motion'
import { Star, TrendingDown, Clock, AlertCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type SegmentId = 'all' | 'vip' | 'regular' | 'at_risk' | 'new' | 'dormant'

interface SegmentFilterProps {
  selectedSegment: string
  onSegmentChange: (segment: string) => void
  segmentCounts?: {
    [K in SegmentId]: number
  }
}

const segments: Array<{
  id: SegmentId
  label: string
  icon: any
  color: string
  bgColor: string
  borderColor: string
}> = [
  {
    id: 'all',
    label: 'All Customers',
    icon: Users,
    color: 'text-gray-400',
    bgColor: 'bg-gray-700/50',
    borderColor: 'border-gray-600'
  },
  {
    id: 'vip',
    label: 'VIP',
    icon: Star,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  {
    id: 'regular',
    label: 'Regular',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'at_risk',
    label: 'At Risk',
    icon: TrendingDown,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  },
  {
    id: 'new',
    label: 'New',
    icon: Clock,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  {
    id: 'dormant',
    label: 'Dormant',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  }
]

export function SegmentFilter({ 
  selectedSegment, 
  onSegmentChange, 
  segmentCounts 
}: SegmentFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {segments.map((segment, index) => {
        const Icon = segment.icon
        const isSelected = selectedSegment === segment.id
        const count = segmentCounts?.[segment.id] || 0
        
        return (
          <motion.button
            key={segment.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSegmentChange(segment.id)}
            className={cn(
              "px-4 py-2 rounded-lg border transition-all duration-200",
              "flex items-center gap-2 text-sm font-medium",
              isSelected
                ? `${segment.bgColor} ${segment.borderColor} ${segment.color}`
                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{segment.label}</span>
            {count > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-gray-700 text-gray-300"
              )}>
                {count}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}