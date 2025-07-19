import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { BusinessProfile, VoiceSettings, ConversationRules } from '@/app/models/dashboard'
import { useUserTenant } from '@/hooks/useUserTenant'
import { getRealtimeManager } from '@/app/websocket/dashboard_handler'

interface UseDashboardDataReturn {
  businessProfile: BusinessProfile | null
  voiceSettings: VoiceSettings | null
  conversationRules: ConversationRules | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => Promise<void>
  updateConversationRules: (rules: Partial<ConversationRules>) => Promise<void>
}

export function useDashboardData(): UseDashboardDataReturn {
  const { tenantId } = useUserTenant()
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings | null>(null)
  const [conversationRules, setConversationRules] = useState<ConversationRules | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!tenantId) return

    const abortController = new AbortController()
    
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [profile, voice, rules] = await Promise.all([
        apiClient.getBusinessProfile({ signal: abortController.signal }),
        apiClient.getVoiceSettings({ signal: abortController.signal }),
        apiClient.getConversationRules({ signal: abortController.signal })
      ])
      
      // Check if the request was aborted
      if (abortController.signal.aborted) return
      
      setBusinessProfile(profile)
      setVoiceSettings(voice)
      setConversationRules(rules)
      setError(null)
    } catch (err) {
      // Ignore abort errors
      if ((err as Error).name === 'AbortError') return
      
      console.error('Failed to fetch dashboard data:', err)
      setError(err as Error)
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
    
    return () => abortController.abort()
  }, [tenantId])

  // Initial fetch
  useEffect(() => {
    const cleanup = fetchData()
    return () => cleanup?.()
  }, [fetchData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!tenantId) return

    const realtimeManager = getRealtimeManager(tenantId)
    
    realtimeManager.startAll({
      onVoiceSettingsUpdate: (update) => {
        console.log('Voice settings updated:', update)
        setVoiceSettings(update.settings)
      },
      onConversationRulesUpdate: (update) => {
        console.log('Conversation rules updated:', update)
        setConversationRules(update.rules)
      },
      onBusinessUpdate: (update) => {
        if (update.type === 'profile_updated') {
          console.log('Business profile updated:', update)
          setBusinessProfile(update.data)
        }
      }
    })

    return () => {
      realtimeManager.stopAll()
    }
  }, [tenantId])

  // Update voice settings
  const updateVoiceSettings = useCallback(async (settings: Partial<VoiceSettings>) => {
    try {
      const updated = await apiClient.updateVoiceSettings(settings)
      setVoiceSettings(updated)
    } catch (err) {
      console.error('Failed to update voice settings:', err)
      throw err
    }
  }, [])

  // Update conversation rules
  const updateConversationRules = useCallback(async (rules: Partial<ConversationRules>) => {
    try {
      const updated = await apiClient.updateConversationRules(rules)
      setConversationRules(updated)
    } catch (err) {
      console.error('Failed to update conversation rules:', err)
      throw err
    }
  }, [])

  return {
    businessProfile,
    voiceSettings,
    conversationRules,
    loading,
    error,
    refetch: fetchData,
    updateVoiceSettings,
    updateConversationRules
  }
}