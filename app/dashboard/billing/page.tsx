"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  CreditCard, Check, X, TrendingUp, Download,
  Calendar, AlertCircle, Zap, Shield, Clock,
  ChevronRight, ArrowUpRight, Receipt, Phone
} from 'lucide-react'
import Link from 'next/link'

// Pricing tiers from pricing page
const plans = {
  starter: {
    name: 'Starter',
    price: 49,
    minutes: 100,
    features: [
      '100 minutes/month',
      'Basic AI receptionist',
      'Call forwarding',
      'Basic analytics',
      'Email support'
    ]
  },
  professional: {
    name: 'Professional',
    price: 149,
    minutes: 500,
    features: [
      '500 minutes/month',
      'Advanced AI features',
      'Appointment booking',
      'SMS notifications',
      'Priority support',
      'Custom greetings',
      'Call recordings'
    ],
    popular: true
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    minutes: 'Unlimited',
    features: [
      'Unlimited minutes',
      'Custom AI training',
      'Multi-location support',
      'API access',
      'Dedicated account manager',
      'SLA guarantee',
      'White-label options'
    ]
  }
}

// Demo billing data
const billingHistory = [
  { id: 1, date: new Date(2025, 0, 1), amount: 149, status: 'paid', invoice: 'INV-2025-001' },
  { id: 2, date: new Date(2024, 11, 1), amount: 149, status: 'paid', invoice: 'INV-2024-012' },
  { id: 3, date: new Date(2024, 10, 1), amount: 149, status: 'paid', invoice: 'INV-2024-011' },
  { id: 4, date: new Date(2024, 9, 1), amount: 149, status: 'paid', invoice: 'INV-2024-010' },
]

export default function BillingPage() {
  const currentPlan = 'professional'
  const minutesUsed = 287
  const minutesTotal = 500
  const percentageUsed = (minutesUsed / minutesTotal) * 100
  const daysLeft = 19

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-gray-400">Manage your subscription and view usage statistics</p>
        </div>

        {/* Current Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Current Plan</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-white">Professional</span>
                    <span className="px-3 py-1 bg-brand-500/20 text-brand-400 text-sm rounded-full">
                      Active
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Monthly billing</p>
                  <p className="text-2xl font-bold text-white">$149</p>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Minutes Used</span>
                    <span className="text-white font-medium">{minutesUsed} / {minutesTotal}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentageUsed}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-gradient-to-r from-brand-400 to-brand-600 h-3 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{daysLeft} days left in billing cycle</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-brand-400" />
                      <span className="text-sm text-gray-400">Total Calls</span>
                    </div>
                    <p className="text-2xl font-bold text-white">1,247</p>
                    <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +12% from last month
                    </p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-400">Avg Call Duration</span>
                    </div>
                    <p className="text-2xl font-bold text-white">2:34</p>
                    <p className="text-xs text-gray-400 mt-1">minutes per call</p>
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Your plan includes:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plans.professional.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Upgrade Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-brand-400" />
              <h3 className="text-lg font-semibold text-white">Need more?</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Upgrade to Enterprise for unlimited minutes and premium features.
            </p>
            <Link
              href="/dashboard/billing?upgrade=enterprise"
              className="block w-full text-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-all"
            >
              Upgrade Plan
            </Link>
            <Link
              href="/pricing"
              className="block w-full text-center px-4 py-2 mt-2 text-brand-400 hover:text-brand-300 transition-colors text-sm"
            >
              View all plans →
            </Link>
          </motion.div>
        </div>

        {/* Payment Method & Billing History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Payment Method</h2>
            
            <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                    <CreditCard className="w-6 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-gray-400">Expires 12/25</p>
                  </div>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Default</span>
              </div>
            </div>

            <button className="w-full px-4 py-2 text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all">
              Update Payment Method
            </button>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-400 font-medium">Next billing date</p>
                  <p className="text-sm text-gray-300">February 1, 2025 - $149.00</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Billing History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Billing History</h2>
              <button className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                View all →
              </button>
            </div>

            <div className="space-y-3">
              {billingHistory.map((invoice, idx) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-white font-medium">{invoice.invoice}</p>
                      <p className="text-xs text-gray-400">
                        {invoice.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">${invoice.amount}</span>
                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center p-6 bg-gray-800/30 rounded-xl"
        >
          <div>
            <p className="text-sm text-gray-400">Need to make changes to your subscription?</p>
            <p className="text-xs text-gray-500 mt-1">You can upgrade, downgrade, or cancel anytime.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all">
              Cancel Subscription
            </button>
            <Link
              href="/dashboard/support"
              className="px-4 py-2 text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all"
            >
              Contact Support
            </Link>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}