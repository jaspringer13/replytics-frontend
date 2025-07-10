"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Clock, User, X } from 'lucide-react'
import { subscribeToCallsTable } from '@/lib/supabase-client'
import { Call } from '@/lib/api-client'

export function LiveCallIndicator() {
  const [activeCalls, setActiveCalls] = useState<Call[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Subscribe to calls with status 'in_progress'
    const subscription = subscribeToCallsTable((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const call = payload.new as Call
        if (call.status === 'in_progress') {
          setActiveCalls(prev => {
            // Check if call already exists
            const exists = prev.find(c => c.id === call.id)
            if (exists) {
              // Update existing call
              return prev.map(c => c.id === call.id ? call : c)
            } else {
              // Add new call
              return [...prev, call]
            }
          })
        } else if (call.status === 'completed' || call.status === 'failed') {
          // Remove completed/failed calls
          setActiveCalls(prev => prev.filter(c => c.id !== call.id))
        }
      } else if (payload.eventType === 'DELETE') {
        // Remove deleted calls
        setActiveCalls(prev => prev.filter(c => c.id !== payload.old.id))
      }
    }, { column: 'status', value: 'in_progress' })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (activeCalls.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-50"
      >
        <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-xl ${
          expanded ? 'w-80' : 'w-64'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Phone className="w-5 h-5 text-green-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <span className="text-white font-medium">
                {activeCalls.length} Active Call{activeCalls.length > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {expanded ? <X className="w-4 h-4" /> : null}
            </button>
          </div>

          {/* Call List */}
          <div className="max-h-96 overflow-y-auto">
            {activeCalls.map((call, index) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border-b border-gray-700 last:border-b-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium">
                      {call.customerName || 'Unknown Caller'}
                    </span>
                  </div>
                  <LiveCallDuration startTime={call.startTime} />
                </div>
                
                <p className="text-sm text-gray-400 mb-2">{call.phoneNumber}</p>
                
                {expanded && call.transcript && (
                  <div className="mt-2 p-2 bg-gray-700/50 rounded text-xs text-gray-300">
                    <p className="font-medium mb-1">Live Transcript:</p>
                    <p className="italic">{call.transcript}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          {!expanded && activeCalls.length > 1 && (
            <div className="p-2 text-center">
              <button
                onClick={() => setExpanded(true)}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                View all active calls
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function LiveCallDuration({ startTime }: { startTime: string }) {
  const [duration, setDuration] = useState('0:00')

  useEffect(() => {
    const updateDuration = () => {
      const start = new Date(startTime)
      const now = new Date()
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
      const minutes = Math.floor(diff / 60)
      const seconds = diff % 60
      setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateDuration()
    const interval = setInterval(updateDuration, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  return (
    <div className="flex items-center gap-1 text-sm text-green-400">
      <Clock className="w-3 h-3" />
      {duration}
    </div>
  )
}