"use client"

import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { ServicePerformance } from '@/app/models/dashboard'

export type ServicePerformanceData = Pick<ServicePerformance, 'serviceName' | 'appointmentCount' | 'revenue' | 'averagePrice'>

interface ServicePerformanceProps {
  topServices?: ServicePerformanceData[]
  loading?: boolean
}

export function ServicePerformanceList({ topServices, loading }: ServicePerformanceProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Top Services</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
    >
      <h2 className="text-xl font-semibold text-white mb-4">Top Services</h2>
      {topServices && topServices.length > 0 ? (
        <div className="space-y-3">
          {topServices.slice(0, 5).map((service) => (
            <div key={service.serviceName} className="flex items-center justify-between">
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
  )
}