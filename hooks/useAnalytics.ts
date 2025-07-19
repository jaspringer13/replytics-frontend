import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { AnalyticsOverview } from '@/app/models/dashboard'
import { useUserTenant } from '@/hooks/useUserTenant'

interface UseAnalyticsOptions {
  startDate: string
  endDate: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useAnalytics({
  startDate,
  endDate,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds, matching other dashboard hooks
}: UseAnalyticsOptions) {
  const { tenantId } = useUserTenant()
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!tenantId) return

    try {
      const analytics = await apiClient.getAnalyticsOverview(startDate, endDate)
      setData(analytics)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [tenantId, startDate, endDate])

  // Initial fetch and refresh logic
  useEffect(() => {
    fetchAnalytics()

    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchAnalytics, autoRefresh, refreshInterval])

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    setLoading(true)
    await fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics: data,
    loading,
    error,
    refetch
  }
}