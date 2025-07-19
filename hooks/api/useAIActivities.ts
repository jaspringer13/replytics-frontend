import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

export interface AIActivity {
  id: string
  type: 'call' | 'sms' | 'chat'
  customer: string
  action: string
  timestamp: Date
  aiConfidence?: number
  businessId: string
  callId?: string
  smsId?: string
  customerPhone?: string
}

interface UseAIActivitiesResult {
  activities: AIActivity[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface AIActivitiesOptions {
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useAIActivities(options: AIActivitiesOptions = {}): UseAIActivitiesResult {
  const {
    limit = 10,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options

  const [activities, setActivities] = useState<AIActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      setError(null)
      
      // Fetch recent calls and SMS in parallel
      const [callsResponse, smsResponse] = await Promise.all([
        apiClient.fetchCalls({
          limit,
          offset: 0
        }),
        apiClient.fetchSMS({
          limit,
          offset: 0
        })
      ])

      const combinedActivities: AIActivity[] = []

      // Convert calls to AI activities
      if (callsResponse.calls) {
        callsResponse.calls.forEach(call => {
          let action = 'Handled incoming call'
          
          if (call.outcome === 'completed') {
            action = call.summary || 'Successfully completed call'
          } else if (call.outcome === 'missed') {
            action = 'Missed call - attempted to handle'
          } else if (call.outcome === 'appointment_booked') {
            action = 'Booked appointment during call'
          }

          combinedActivities.push({
            id: `call-${call.id}`,
            type: 'call',
            customer: call.caller_name || call.caller_phone || 'Unknown',
            action,
            timestamp: new Date(call.created_at || call.call_time),
            aiConfidence: call.outcome === 'completed' ? 95 : call.outcome === 'appointment_booked' ? 98 : 75,
            businessId: call.business_id,
            callId: call.id,
            customerPhone: call.caller_phone
          })
        })
      }

      // Convert SMS to AI activities
      if (smsResponse.messages) {
        smsResponse.messages.forEach(sms => {
          if (sms.direction === 'outbound') {
            combinedActivities.push({
              id: `sms-${sms.id}`,
              type: 'sms',
              customer: sms.customer_name || sms.from_phone || 'Unknown',
              action: `Sent: ${sms.content?.substring(0, 50)}${sms.content?.length > 50 ? '...' : ''}`,
              timestamp: new Date(sms.created_at),
              aiConfidence: 92,
              businessId: sms.business_id,
              smsId: sms.id,
              customerPhone: sms.from_phone
            })
          } else if (sms.direction === 'inbound') {
            combinedActivities.push({
              id: `sms-response-${sms.id}`,
              type: 'sms',
              customer: sms.customer_name || sms.from_phone || 'Unknown',
              action: 'Responded to customer message',
              timestamp: new Date(sms.created_at),
              aiConfidence: 88,
              businessId: sms.business_id,
              smsId: sms.id,
              customerPhone: sms.from_phone
            })
          }
        })
      }

      // Sort by timestamp (most recent first) and limit
      const sortedActivities = combinedActivities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)

      setActivities(sortedActivities)
    } catch (err) {
      console.error('Error fetching AI activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch AI activities')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchActivities, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchActivities])

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities
  }
}