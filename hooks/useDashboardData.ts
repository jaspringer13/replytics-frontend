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
    
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [profile, voice, rules] = await Promise.all([
        apiClient.getBusinessProfile(),
        apiClient.getVoiceSettings(),
        apiClient.getConversationRules()
      ])
      
      setBusinessProfile(profile)
      setVoiceSettings(voice)
      setConversationRules(rules)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!tenantId) return

    const realtimeManager = getRealtimeManager(tenantId)
    
    realtimeManager.startAll({
      onVoiceSettingsUpdate: (update: any) => {
        console.log('Voice settings updated:', update)
        if (update.settings && typeof update.settings === 'object') {
          setVoiceSettings(update.settings as VoiceSettings)
        } else {
          console.error('Invalid voice settings update:', update)
        }
      },
      onConversationRulesUpdate: (update: any) => {
        console.log('Conversation rules updated:', update)
        if (update.rules && typeof update.rules === 'object') {
          setConversationRules(update.rules as ConversationRules)
        } else {
          console.error('Invalid conversation rules update:', update)
        }
      },
      onBusinessUpdate: (update: any) => {
        if (update.type === 'profile_updated') {
          console.log('Business profile updated:', update)
          if (update.data && typeof update.data === 'object') {
            setBusinessProfile(update.data as BusinessProfile)
          } else {
            console.error('Invalid business profile update:', update)
          }
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