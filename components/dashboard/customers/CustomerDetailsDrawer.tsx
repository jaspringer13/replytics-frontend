"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Mail, Calendar, DollarSign, Clock, MessageSquare, Star, Flag } from 'lucide-react'
import { Customer } from '@/app/models/dashboard'
import { cn } from '@/lib/utils'

interface CustomerDetailsDrawerProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
}

export function CustomerDetailsDrawer({ customer, isOpen, onClose }: CustomerDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'notes'>('info')

  if (!customer) return null

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Unknown'

  // Format phone number
  const formatPhone = (phone: string) => {
    if (!phone) return 'No phone'
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 shadow-xl z-50 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-gray-800 p-6 border-b border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{fullName}</h2>
                    <p className="text-gray-400 mt-1">{formatPhone(customer.phone)}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{customer.totalAppointments}</p>
                    <p className="text-xs text-gray-400">Total Visits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatCurrency(customer.lifetimeValue)}</p>
                    <p className="text-xs text-gray-400">Lifetime Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {customer.totalAppointments > 0 
                        ? Math.round((customer.totalAppointments - customer.noShowCount) / customer.totalAppointments * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-400">Show Rate</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-700">
                {(['info', 'history', 'notes'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-3 px-4 text-sm font-medium transition-colors",
                      activeTab === tab
                        ? "text-white border-b-2 border-brand-500"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Contact Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-white">{formatPhone(customer.phone)}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-white">{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Customer Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Customer Since</span>
                          <span className="text-white">
                            {new Date(customer.firstInteraction).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Visit</span>
                          <span className="text-white">
                            {new Date(customer.lastInteraction).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average Service Value</span>
                          <span className="text-white">
                            {formatCurrency(customer.averageServiceValue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">No-Shows</span>
                          <span className={cn(
                            "font-medium",
                            customer.noShowCount > 2 ? "text-orange-400" : "text-white"
                          )}>
                            {customer.noShowCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    {customer.preferences && Object.keys(customer.preferences).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                          Preferences
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(customer.preferences).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="text-white">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flags */}
                    {customer.flags && customer.flags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                          Flags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {customer.flags.map((flag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs flex items-center gap-1"
                            >
                              <Flag className="w-3 h-3" />
                              {flag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-center py-8">
                      Appointment history will be displayed here
                    </p>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-center py-8">
                      Customer notes and communication history will be displayed here
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-700 bg-gray-800">
                <div className="grid grid-cols-2 gap-3">
                  <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </button>
                  <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}