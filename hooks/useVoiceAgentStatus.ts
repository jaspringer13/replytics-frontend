import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useUserTenant } from '@/hooks/useUserTenant'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UseVoiceAgentStatusReturn {
  isActive: boolean
  isListening: boolean
  lastActivity: Date | null
  callsHandled: number
  averageCallDuration: number
  currentCall: {
    phoneNumber: string
    duration: number
    status: 'ringing' | 'connected' | 'ended'
  } | null
}

export function useVoiceAgentStatus(): UseVoiceAgentStatusReturn {
  const { tenantId } = useUserTenant()
  const [status, setStatus] = useState<UseVoiceAgentStatusReturn>({
    isActive: false,
    isListening: false,
    lastActivity: null,
    callsHandled: 0,
    averageCallDuration: 0,
    currentCall: null
  })

  useEffect(() => {
    if (!tenantId) return

    // Check initial status
    checkAgentStatus()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`voice-agent:${tenantId}`)
      .on('broadcast', { event: 'status_update' }, (payload) => {
        console.log('Voice agent status update:', payload)
        updateStatus(payload.payload)
      })
      .on('broadcast', { event: 'call_update' }, (payload) => {
        console.log('Voice agent call update:', payload)
        updateCallStatus(payload.payload)
      })
      .subscribe()

    // Poll for status every 30 seconds as backup
    const interval = setInterval(checkAgentStatus, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [tenantId])

  const checkAgentStatus = async () => {
    try {
      // In a real implementation, this would check the actual voice agent status
      // For now, we'll simulate it based on business hours and settings
      const now = new Date()
      const hour = now.getHours()
      const isBusinessHours = hour >= 9 && hour < 17 // 9 AM to 5 PM
      const isWeekday = now.getDay() >= 1 && now.getDay() <= 5

      // Simulate agent being active during business hours on weekdays
      const isActive = isBusinessHours && isWeekday
      
      setStatus(prev => ({
        ...prev,
        isActive,
        isListening: isActive && !prev.currentCall,
        lastActivity: isActive ? new Date() : prev.lastActivity,
        // Mock data for demo
        callsHandled: Math.floor(Math.random() * 50),
        averageCallDuration: Math.floor(Math.random() * 180) + 60
      }))
    } catch (error) {
      console.error('Failed to check voice agent status:', error)
    }
  }

  const updateStatus = (data: any) => {
    setStatus(prev => ({
      ...prev,
      isActive: data.isActive ?? prev.isActive,
      isListening: data.isListening ?? prev.isListening,
      lastActivity: data.lastActivity ? new Date(data.lastActivity) : prev.lastActivity,
      callsHandled: data.callsHandled ?? prev.callsHandled,
      averageCallDuration: data.averageCallDuration ?? prev.averageCallDuration
    }))
  }

  const updateCallStatus = (data: any) => {
    setStatus(prev => ({
      ...prev,
      currentCall: data.callEnded ? null : {
        phoneNumber: data.phoneNumber,
        duration: data.duration,
        status: data.status
      },
      isListening: !data.callEnded && prev.isActive
    }))
  }

  return status
}