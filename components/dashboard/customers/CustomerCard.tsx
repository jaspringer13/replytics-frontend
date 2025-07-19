"use client"

import { motion } from 'framer-motion'
import { Phone, Calendar, DollarSign, Clock, AlertCircle, Star, TrendingDown } from 'lucide-react'
import { Customer } from '@/app/models/dashboard'
import { cn } from '@/lib/utils'

interface CustomerCardProps {
  customer: Customer
  onClick?: (customer: Customer) => void
  delay?: number
}

export function CustomerCard({ customer, onClick, delay = 0 }: CustomerCardProps) {
  // Get segment styling
  const getSegmentStyles = () => {
    switch (customer.segment) {
      case 'vip':
        return {
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: <Star className="w-3 h-3" />,
          label: 'VIP'
        }
      case 'at_risk':
        return {
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          icon: <TrendingDown className="w-3 h-3" />,
          label: 'At Risk'
        }
      case 'new':
        return {
          badge: 'bg-green-500/20 text-green-300 border-green-500/30',
          icon: <Clock className="w-3 h-3" />,
          label: 'New'
        }
      case 'dormant':
        return {
          badge: 'bg-red-500/20 text-red-300 border-red-500/30',
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Dormant'
        }
      default:
        return {
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: null,
          label: 'Regular'
        }
    }
  }

  const segmentStyle = getSegmentStyles()
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Unknown'
  
  // Format phone number with international support
  const formatPhone = (phone: string) => {
    if (!phone) return 'No phone'
    
    const cleaned = phone.replace(/\D/g, '')
    
    // Handle international numbers (starting with country code)
    if (cleaned.length > 10) {
      // International format: +X XXX XXX XXXX
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        // US number with country code
        const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/)
        if (match) {
          return `+1 (${match[1]}) ${match[2]}-${match[3]}`
        }
      }
      // Other international numbers
      return `+${cleaned.slice(0, -10)} ${cleaned.slice(-10)}`
    }
    
    // US domestic format
    if (cleaned.length === 10) {
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`
      }
    }
    
    // Fallback: return as-is if format doesn't match
    return phone
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Calculate days since last visit
  const daysSinceLastVisit = () => {
    if (!customer.lastInteraction) return null
    const days = Math.floor((Date.now() - new Date(customer.lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const lastVisitDays = daysSinceLastVisit()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={() => onClick?.(customer)}
      className={cn(
        "bg-gray-800 rounded-xl p-5 border border-gray-700",
        "hover:border-gray-600 hover:bg-gray-750 transition-all duration-200",
        "cursor-pointer group"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-lg group-hover:text-brand-400 transition-colors">
            {fullName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Phone className="w-3 h-3 text-gray-400" />
            <span className="text-sm text-gray-400">{formatPhone(customer.phone)}</span>
          </div>
        </div>
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium border",
          "flex items-center gap-1",
          segmentStyle.badge
        )}>
          {segmentStyle.icon}
          {segmentStyle.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1 text-gray-400 mb-1">
            <Calendar className="w-3 h-3" />
            <span className="text-xs">Visits</span>
          </div>
          <p className="text-white font-semibold">{customer.totalAppointments}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-gray-400 mb-1">
            <DollarSign className="w-3 h-3" />
            <span className="text-xs">Lifetime</span>
          </div>
          <p className="text-white font-semibold">{formatCurrency(customer.lifetimeValue)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-gray-400 mb-1">
            <DollarSign className="w-3 h-3" />
            <span className="text-xs">Avg</span>
          </div>
          <p className="text-white font-semibold">{formatCurrency(customer.averageServiceValue)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Customer since {customer.firstInteraction ? new Date(customer.firstInteraction).toLocaleDateString() : 'Unknown'}
        </span>
        {lastVisitDays !== null && (
          <span className={cn(
            lastVisitDays > 60 ? 'text-orange-400' : 'text-gray-500'
          )}>
            {lastVisitDays === 0 ? 'Today' : `${lastVisitDays}d ago`}
          </span>
        )}
      </div>

      {/* No-show indicator */}
      {customer.noShowCount > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-orange-400">
          <AlertCircle className="w-3 h-3" />
          <span>{customer.noShowCount} no-show{customer.noShowCount > 1 ? 's' : ''}</span>
        </div>
      )}
    </motion.div>
  )
}