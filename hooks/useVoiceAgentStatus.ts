import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useUserTenant } from '@/hooks/useUserTenant'
import { useDashboardData } from '@/hooks/useDashboardData'
import { isWithinBusinessHours, getBusinessTime } from '@/lib/utils/businessHours'

interface StatusUpdatePayload {
  isActive?: boolean
  isListening?: boolean
  lastActivity?: string
  callsHandled?: number
  averageCallDuration?: number
}

interface CallUpdatePayload {
  callEnded?: boolean
  phoneNumber?: string
  duration?: number
  status?: 'ringing' | 'connected' | 'ended'
}

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
  const { businessProfile } = useDashboardData()
  const [status, setStatus] = useState<UseVoiceAgentStatusReturn>({
    isActive: false,
    isListening: false,
    lastActivity: null,
    callsHandled: 0,
    averageCallDuration: 0,
    currentCall: null
  })

  const checkAgentStatus = useCallback(async () => {
    try {
      // In a real implementation, this would check the actual voice agent status
      // For now, we'll simulate it based on business hours and settings
      const businessTime = getBusinessTime(businessProfile?.timezone)
      const isActive = isWithinBusinessHours(businessProfile?.timezone)
      
      setStatus(prev => ({
        ...prev,
        isActive,
        isListening: isActive && !prev.currentCall,
        lastActivity: isActive ? new Date() : prev.lastActivity,
        // Mock data for demo - use business time-based seed for consistency
        callsHandled: Math.floor((businessTime.getHours() * 2) + (businessTime.getMinutes() / 10)),
        averageCallDuration: 120 + (businessTime.getHours() * 5)
      }))
    } catch (error) {
      console.error('Failed to check voice agent status:', error)
    }
  }, [businessProfile?.timezone])

  const updateStatus = useCallback((data: StatusUpdatePayload) => {
    setStatus(prev => ({
      ...prev,
      isActive: data.isActive ?? prev.isActive,
      isListening: data.isListening ?? prev.isListening,
      lastActivity: data.lastActivity ? new Date(data.lastActivity) : prev.lastActivity,
      callsHandled: data.callsHandled ?? prev.callsHandled,
      averageCallDuration: data.averageCallDuration ?? prev.averageCallDuration
    }))
  }, [])

  const updateCallStatus = useCallback((data: CallUpdatePayload) => {
    setStatus(prev => ({
      ...prev,
      currentCall: data.callEnded ? null : {
        phoneNumber: data.phoneNumber || '',
        duration: data.duration || 0,
        status: data.status || 'ringing'
      },
      isListening: !data.callEnded && prev.isActive
    }))
  }, [])

  useEffect(() => {
    if (!tenantId) return

    // Check initial status
    checkAgentStatus()

    // Subscribe to real-time updates
    const channel = getSupabaseClient()
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
      getSupabaseClient().removeChannel(channel)
      clearInterval(interval)
    }
  }, [tenantId, checkAgentStatus, updateStatus, updateCallStatus])

  return status
}