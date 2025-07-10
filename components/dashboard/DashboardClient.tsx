"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Phone, Calendar, Users, Settings, BarChart3, Clock, 
  TrendingUp, PhoneCall, MessageSquare, Home
} from 'lucide-react'

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState('overview')

  const stats = [
    { label: 'Calls Today', value: '47', change: '+12%', icon: PhoneCall },
    { label: 'Appointments Booked', value: '23', change: '+8%', icon: Calendar },
    { label: 'Active Clients', value: '342', change: '+23%', icon: Users },
    { label: 'Response Time', value: '1.2s', change: '-15%', icon: Clock }
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-8">Replytics</h2>
          
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: Home },
              { id: 'calls', label: 'Call History', icon: Phone },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'clients', label: 'Clients', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id 
                    ? 'bg-brand-500/20 text-brand-400 border-l-4 border-brand-500' 
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
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

        {/* Recent activity */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            {[
              { type: 'call', name: 'Sarah Johnson', action: 'Booked appointment', time: '5 min ago' },
              { type: 'sms', name: 'Mike Chen', action: 'Rescheduled to Friday', time: '12 min ago' },
              { type: 'call', name: 'Emma Rodriguez', action: 'Called for pricing', time: '23 min ago' }
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
        </div>
      </main>
    </div>
  )
}