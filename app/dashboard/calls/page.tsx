"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, 
  Voicemail, Search, Filter, Download, Play, FileText,
  Calendar, Clock, User, ChevronDown, AlertCircle, Loader2
} from 'lucide-react'
import { useCallHistory } from '@/hooks/useBackendData'
import { apiClient, Call } from '@/lib/api-client'

type CallStatus = 'all' | 'completed' | 'missed' | 'in_progress' | 'failed'

function CallsContent() {
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<CallStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [playingRecording, setPlayingRecording] = useState<string | null>(null)
  
  const { data: calls, loading, error, hasMore, loadMore, total } = useCallHistory()

  // Check for filter in URL params
  useEffect(() => {
    const urlFilter = searchParams.get('filter')
    if (urlFilter && ['completed', 'missed', 'in_progress', 'failed'].includes(urlFilter)) {
      setFilter(urlFilter as CallStatus)
    }
  }, [searchParams])

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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

  const getStatusIcon = (call: Call) => {
    if (call.status === 'missed') return <PhoneMissed className="w-4 h-4 text-red-400" />
    if (call.status === 'failed') return <Phone className="w-4 h-4 text-red-400" />
    if (call.status === 'in_progress') return <Phone className="w-4 h-4 text-yellow-400 animate-pulse" />
    if (call.direction === 'inbound') return <PhoneIncoming className="w-4 h-4 text-green-400" />
    return <PhoneOutgoing className="w-4 h-4 text-blue-400" />
  }

  const filteredCalls = calls.filter(call => {
    if (filter !== 'all' && call.status !== filter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = call.customerName?.toLowerCase().includes(query)
      const matchesNumber = call.phoneNumber.includes(searchQuery)
      if (!matchesName && !matchesNumber) return false
    }
    return true
  })

  const stats = {
    total: total || 0,
    completed: calls.filter(c => c.status === 'completed').length,
    missed: calls.filter(c => c.status === 'missed').length,
    in_progress: calls.filter(c => c.status === 'in_progress').length,
  }
  
  const handlePlayRecording = async (callId: string) => {
    try {
      setPlayingRecording(callId)
      const { url } = await apiClient.fetchCallRecording(callId)
      // In a real implementation, you'd play the audio here
      console.log('Playing recording:', url)
      // Simulate playing
      setTimeout(() => setPlayingRecording(null), 3000)
    } catch (error) {
      console.error('Failed to play recording:', error)
      setPlayingRecording(null)
    }
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
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-sm text-gray-400">Completed</p>
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
                <p className="text-2xl font-bold text-white">{stats.in_progress}</p>
                <p className="text-sm text-gray-400">In Progress</p>
              </div>
              <Phone className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto">
              {(['all', 'completed', 'missed', 'in_progress'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap transition-all ${
                    filter === status 
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {status.replace('_', ' ')} {status !== 'all' && `(${stats[status] || 0})`}
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
          {loading && calls.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Failed to load calls</h3>
                <p className="text-gray-400">{error.message}</p>
              </div>
            </div>
          ) : filteredCalls.length > 0 ? (
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
                          <p className="text-white font-medium">{call.customerName || 'Unknown'}</p>
                          <p className="text-sm text-gray-400">{call.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {formatDate(call.startTime)}
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
                          {call.recordingUrl && (
                            <button 
                              onClick={() => handlePlayRecording(call.id)}
                              disabled={playingRecording === call.id}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all disabled:opacity-50" 
                              title="Play Recording"
                            >
                              {playingRecording === call.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {call.transcript && (
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
        
        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 border border-brand-500/50 rounded-lg transition-all"
            >
              Load More Calls
            </button>
          </div>
        )}
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