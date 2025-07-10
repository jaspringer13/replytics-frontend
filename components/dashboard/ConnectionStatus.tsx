"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, AlertTriangle, X } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')
  const [showAlert, setShowAlert] = useState(false)
  const [lastChecked, setLastChecked] = useState(new Date())

  useEffect(() => {
    // Check browser online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
      if (!navigator.onLine) {
        setShowAlert(true)
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Check backend connection periodically
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })
        
        if (response.ok) {
          setBackendStatus('connected')
          setShowAlert(false)
        } else {
          setBackendStatus('error')
          setShowAlert(true)
        }
      } catch (error) {
        setBackendStatus('disconnected')
        setShowAlert(true)
      }
      
      setLastChecked(new Date())
    }

    // Initial check
    updateOnlineStatus()
    checkBackendStatus()

    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      clearInterval(interval)
    }
  }, [])

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        title: 'No Internet Connection',
        message: 'Please check your internet connection. Some features may not work.',
      }
    }

    if (backendStatus === 'disconnected') {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        title: 'Backend Disconnected',
        message: 'Unable to connect to the server. Data may not be up to date.',
      }
    }

    if (backendStatus === 'error') {
      return {
        icon: AlertTriangle,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        title: 'Connection Issues',
        message: 'Experiencing connection problems. Some features may be slow.',
      }
    }

    return null
  }

  const statusInfo = getStatusInfo()

  // Status indicator in corner
  const StatusIndicator = () => {
    if (!statusInfo) return null

    const Icon = statusInfo.icon

    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowAlert(true)}
        className={`fixed bottom-4 left-4 z-50 p-3 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border backdrop-blur-sm shadow-lg`}
      >
        <Icon className={`w-5 h-5 ${statusInfo.color}`} />
      </motion.button>
    )
  }

  // Alert banner
  const AlertBanner = () => {
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
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <StatusIndicator />
      <AnimatePresence>
        <AlertBanner />
      </AnimatePresence>
    </>
  )
}

// Hook to use connection status in other components
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    // Check backend connection
    const checkConnection = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        })
        setIsConnected(response.ok)
      } catch {
        setIsConnected(false)
      }
    }

    updateStatus()
    checkConnection()

    const interval = setInterval(checkConnection, 60000) // Check every minute

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      clearInterval(interval)
    }
  }, [])

  return { isOnline, isConnected }
}