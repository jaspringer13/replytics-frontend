"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, 
  Voicemail, Search, Filter, Download, Play, FileText,
  Calendar, Clock, User, ChevronDown
} from 'lucide-react'

// Demo call data
const demoCalls = [
  { 
    id: 1, 
    caller: 'Sarah Johnson', 
    number: '+1 (555) 123-4567', 
    date: new Date(2025, 0, 10, 14, 30), 
    duration: 245, 
    status: 'answered', 
    type: 'incoming',
    hasRecording: true,
    hasTranscript: true
  },
  { 
    id: 2, 
    caller: 'Mike Chen', 
    number: '+1 (555) 234-5678', 
    date: new Date(2025, 0, 10, 13, 15), 
    duration: 0, 
    status: 'missed', 
    type: 'incoming',
    hasRecording: false,
    hasTranscript: false
  },
  { 
    id: 3, 
    caller: 'Emma Rodriguez', 
    number: '+1 (555) 345-6789', 
    date: new Date(2025, 0, 10, 11, 45), 
    duration: 180, 
    status: 'answered', 
    type: 'incoming',
    hasRecording: true,
    hasTranscript: true
  },
  { 
    id: 4, 
    caller: 'David Kim', 
    number: '+1 (555) 456-7890', 
    date: new Date(2025, 0, 10, 10, 20), 
    duration: 90, 
    status: 'voicemail', 
    type: 'incoming',
    hasRecording: true,
    hasTranscript: true
  },
  { 
    id: 5, 
    caller: 'Lisa Wang', 
    number: '+1 (555) 567-8901', 
    date: new Date(2025, 0, 9, 16, 45), 
    duration: 320, 
    status: 'answered', 
    type: 'incoming',
    hasRecording: true,
    hasTranscript: true
  },
]

type CallStatus = 'all' | 'answered' | 'missed' | 'voicemail'

function CallsContent() {
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<CallStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Check for filter in URL params
  useEffect(() => {
    const urlFilter = searchParams.get('filter')
    if (urlFilter && ['answered', 'missed', 'voicemail'].includes(urlFilter)) {
      setFilter(urlFilter as CallStatus)
    }
  }, [searchParams])

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }
  }

  const getStatusIcon = (call: typeof demoCalls[0]) => {
    if (call.status === 'missed') return <PhoneMissed className="w-4 h-4 text-red-400" />
    if (call.status === 'voicemail') return <Voicemail className="w-4 h-4 text-yellow-400" />
    if (call.type === 'incoming') return <PhoneIncoming className="w-4 h-4 text-green-400" />
    return <PhoneOutgoing className="w-4 h-4 text-blue-400" />
  }

  const filteredCalls = demoCalls.filter(call => {
    if (filter !== 'all' && call.status !== filter) return false
    if (searchQuery && !call.caller.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !call.number.includes(searchQuery)) return false
    return true
  })

  const stats = {
    total: demoCalls.length,
    answered: demoCalls.filter(c => c.status === 'answered').length,
    missed: demoCalls.filter(c => c.status === 'missed').length,
    voicemail: demoCalls.filter(c => c.status === 'voicemail').length,
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Call History</h1>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-all">
            <Download className="w-4 h-4" />
            Export Calls
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total Calls</p>
              </div>
              <Phone className="w-8 h-8 text-brand-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.answered}</p>
                <p className="text-sm text-gray-400">Answered</p>
              </div>
              <PhoneIncoming className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.missed}</p>
                <p className="text-sm text-gray-400">Missed</p>
              </div>
              <PhoneMissed className="w-8 h-8 text-red-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.voicemail}</p>
                <p className="text-sm text-gray-400">Voicemail</p>
              </div>
              <Voicemail className="w-8 h-8 text-yellow-400" />
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto">
              {(['all', 'answered', 'missed', 'voicemail'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap transition-all ${
                    filter === status 
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {status} {status !== 'all' && `(${stats[status]})`}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calls Table */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl overflow-hidden">
          {filteredCalls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Caller</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date & Time</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Duration</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map((call, index) => (
                    <motion.tr
                      key={call.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(call)}
                          <span className="text-sm text-gray-300 capitalize">{call.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{call.caller}</p>
                          <p className="text-sm text-gray-400">{call.number}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {formatDate(call.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          {formatDuration(call.duration)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {call.hasRecording && (
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all" title="Play Recording">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {call.hasTranscript && (
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all" title="View Transcript">
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all" title="Call Back">
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No calls found</h3>
              <p className="text-gray-400">
                {searchQuery ? 'Try adjusting your search terms' : 'Your call history will appear here'}
              </p>
            </div>
          )}
        </div>
    </div>
  )
}

export default function CallsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="h-24 bg-gray-700 rounded-xl"></div>
              <div className="h-24 bg-gray-700 rounded-xl"></div>
              <div className="h-24 bg-gray-700 rounded-xl"></div>
              <div className="h-24 bg-gray-700 rounded-xl"></div>
            </div>
            <div className="h-20 bg-gray-700 rounded-xl mb-6"></div>
            <div className="h-96 bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      }>
        <CallsContent />
      </Suspense>
    </DashboardLayout>
  )
}