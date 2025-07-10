"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Phone, Calendar, Users, Settings, BarChart3, Clock, 
  TrendingUp, PhoneCall, MessageSquare, Home
} from 'lucide-react'

import Link from 'next/link'
import { CheckCircle, FileText, Headphones, Brain } from 'lucide-react'

export function DashboardClient() {
  const stats = [
    { label: 'Calls Today', value: '47', change: '+12%', icon: PhoneCall },
    { label: 'Appointments Booked', value: '23', change: '+8%', icon: Calendar },
    { label: 'Active Clients', value: '342', change: '+23%', icon: Users },
    { label: 'Response Time', value: '1.2s', change: '-15%', icon: Clock }
  ]

  const quickActions = [
    { label: "View Today's Schedule", icon: Calendar, href: '/dashboard/calendar', color: 'bg-blue-500' },
    { label: 'Check Missed Calls', icon: PhoneCall, href: '/dashboard/calls?filter=missed', color: 'bg-red-500' },
    { label: 'Generate Report', icon: FileText, href: '/dashboard/analytics', color: 'bg-green-500' },
    { label: 'AI Training Status', icon: Brain, href: '/dashboard/settings?tab=ai', color: 'bg-purple-500' }
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-gray-400">Welcome back! Here's what's happening with your AI receptionist today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-brand-500/20 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-brand-400" />
                </div>
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <Link
                href={action.href}
                className="block p-6 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all group"
              >
                <div className={`w-12 h-12 ${action.color}/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-6 h-6 text-white`} />
                </div>
                <p className="text-white font-medium">{action.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            {[
              { type: 'call', name: 'Sarah Johnson', action: 'Booked appointment', time: '5 min ago' },
              { type: 'sms', name: 'Mike Chen', action: 'Rescheduled to Friday', time: '12 min ago' },
              { type: 'call', name: 'Emma Rodriguez', action: 'Called for pricing', time: '23 min ago' },
              { type: 'call', name: 'David Kim', action: 'Left voicemail', time: '45 min ago' }
            ].map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'call' ? 'bg-brand-500/20' : 'bg-purple-500/20'
                  }`}>
                    {activity.type === 'call' ? (
                      <Phone className="w-5 h-5 text-brand-400" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{activity.name}</p>
                    <p className="text-sm text-gray-400">{activity.action}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </motion.div>
            ))}
          </div>
          
          <Link
            href="/dashboard/calls"
            className="mt-4 block text-center text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            View all activity →
          </Link>
        </div>

        {/* AI Performance */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">AI Performance</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Call Success Rate</span>
                <span className="text-white font-medium">94%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Appointment Conversion</span>
                <span className="text-white font-medium">67%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Customer Satisfaction</span>
                <span className="text-white font-medium">89%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-white">AI is learning and improving</span>
            </div>
            <p className="text-xs text-gray-400">
              Your AI has handled 1,247 calls this month and continues to improve its responses based on successful interactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}