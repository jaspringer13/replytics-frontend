"use client"

import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, AlertTriangle, X, RefreshCw } from 'lucide-react'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'

// Status indicator component - moved outside to avoid re-creation
const StatusIndicator = memo<{
  statusInfo: any
  status: string
  isTokenRefreshing: boolean
  onShowAlert: () => void
}>(({ statusInfo, status, isTokenRefreshing, onShowAlert }) => {
  if (!statusInfo) return null

  const Icon = statusInfo.icon

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      onClick={onShowAlert}
      className={`fixed bottom-4 left-4 z-50 p-3 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border backdrop-blur-sm shadow-lg`}
    >
      <Icon className={`w-5 h-5 ${statusInfo.color} ${(status === 'connecting' || isTokenRefreshing) ? 'animate-spin' : ''}`} />
    </motion.button>
  )
})

StatusIndicator.displayName = 'StatusIndicator'

// Alert banner component - moved outside to avoid re-creation
const AlertBanner = memo<{
  showAlert: boolean
  statusInfo: any
  status: string
  lastSyncTime: Date | null
  onRetry: () => void
  onClose: () => void
}>(({ showAlert, statusInfo, status, lastSyncTime, onRetry, onClose }) => {
  if (!showAlert || !statusInfo) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border backdrop-blur-sm shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <statusInfo.icon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className={`font-medium ${statusInfo.color} mb-1`}>
            {statusInfo.title}
          </h3>
          <p className="text-sm text-gray-300">{statusInfo.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleTimeString()}` : 'Syncing...'}
          </p>
          {(status === 'error' || status === 'disconnected') && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
})

AlertBanner.displayName = 'AlertBanner'

export function ConnectionStatus() {
  const { status, lastSyncTime, isTokenRefreshing, message, isLoading, retry } = useConnectionStatus()
  const [showAlert, setShowAlert] = useState(false)

  const getStatusInfo = () => {
    if (status === 'disconnected') {
      return {
        icon: WifiOff,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        title: message || 'No Connection',
        message: 'Please check your internet connection. Some features may not work.',
      }
    }

    if (status === 'connecting' || isTokenRefreshing) {
      return {
        icon: RefreshCw,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        title: isTokenRefreshing ? 'Refreshing Authentication' : 'Connecting',
        message: message || 'Please wait while we establish a connection.',
      }
    }

    if (status === 'error') {
      return {
        icon: AlertTriangle,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        title: 'Connection Issues',
        message: message || 'Experiencing connection problems. Some features may be slow.',
      }
    }

    return null
  }

  const statusInfo = getStatusInfo()

  // Auto show alert on issues
  useEffect(() => {
    if (statusInfo && !showAlert && status !== 'connected') {
      setShowAlert(true)
    }
  }, [statusInfo, showAlert, status])

  return (
    <>
      <StatusIndicator 
        statusInfo={statusInfo}
        status={status}
        isTokenRefreshing={isTokenRefreshing}
        onShowAlert={() => setShowAlert(true)}
      />
      <AnimatePresence>
        <AlertBanner 
          showAlert={showAlert}
          statusInfo={statusInfo}
          status={status}
          lastSyncTime={lastSyncTime}
          onRetry={retry}
          onClose={() => setShowAlert(false)}
        />
      </AnimatePresence>
    </>
  )
}