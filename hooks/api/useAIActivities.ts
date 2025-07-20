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
          
          if (call.status === 'completed') {
            action = call.summary || 'Successfully completed call'
          } else if (call.status === 'missed') {
            action = 'Missed call - attempted to handle'
          }

          combinedActivities.push({
            id: `call-${call.id}`,
            type: 'call',
            customer: call.customerName || call.phoneNumber || 'Unknown',
            action,
            timestamp: new Date(call.startTime),
            aiConfidence: call.status === 'completed' ? 95 : 75,
            businessId: 'default', // Call interface doesn't include businessId
            callId: call.id,
            customerPhone: call.phoneNumber
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
              customer: sms.customerName || sms.phoneNumber || 'Unknown',
              action: `Sent: ${sms.message?.substring(0, 50)}${sms.message?.length > 50 ? '...' : ''}`,
              timestamp: new Date(sms.timestamp),
              aiConfidence: 92,
              businessId: 'default', // SMS interface doesn't include businessId
              smsId: sms.id,
              customerPhone: sms.phoneNumber
            })
          } else if (sms.direction === 'inbound') {
            combinedActivities.push({
              id: `sms-response-${sms.id}`,
              type: 'sms',
              customer: sms.customerName || sms.phoneNumber || 'Unknown',
              action: 'Responded to customer message',
              timestamp: new Date(sms.timestamp),
              aiConfidence: 88,
              businessId: 'default', // SMS interface doesn't include businessId
              smsId: sms.id,
              customerPhone: sms.phoneNumber
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