import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import { useUserTenant } from '@/hooks/useUserTenant'

interface SegmentCounts {
  all: number;
  vip: number;
  regular: number;
  at_risk: number;
  new: number;
  dormant: number;
}

interface UseCustomerSegmentCountsOptions {
  search?: string;
}

interface UseCustomerSegmentCountsReturn {
  segmentCounts: SegmentCounts;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCustomerSegmentCounts({
  search = ''
}: UseCustomerSegmentCountsOptions = {}): UseCustomerSegmentCountsReturn {
  const { tenantId } = useUserTenant()
  const [segmentCounts, setSegmentCounts] = useState<SegmentCounts>({
    all: 0,
    vip: 0,
    regular: 0,
    at_risk: 0,
    new: 0,
    dormant: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchSegmentCounts = useCallback(async () => {
    if (!tenantId) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      
      const result = await apiClient.getCustomerSegmentCounts(search || undefined) as { data: SegmentCounts }
      
      setSegmentCounts(result.data)
      setError(null)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Failed to fetch segment counts:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [tenantId, search])

  // Initial fetch and refetch on search changes
  useEffect(() => {
    fetchSegmentCounts()
  }, [fetchSegmentCounts])

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchSegmentCounts()
  }, [fetchSegmentCounts])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    segmentCounts,
    loading,
    error,
    refetch
  }
}