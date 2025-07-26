import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import { Customer, CustomerSegment } from '@/app/models/dashboard'
import { useUserTenant } from '@/hooks/useUserTenant'

interface UseCustomersOptions {
  search?: string
  segment?: CustomerSegment | 'all'
  sortBy?: 'recent' | 'value' | 'visits' | 'name'
  limit?: number
  offset?: number
}

interface UseCustomersReturn {
  customers: Customer[]
  loading: boolean
  error: Error | null
  totalCount: number
  hasMore: boolean
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
}

export function useCustomers({
  search = '',
  segment = 'all',
  sortBy = 'recent',
  limit = 20,
  offset = 0
}: UseCustomersOptions = {}): UseCustomersReturn {
  const { tenantId } = useUserTenant()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [currentOffset, setCurrentOffset] = useState(offset)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchCustomers = useCallback(async (append = false) => {
    if (!tenantId) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      if (!append) setLoading(true)
      
      const result = await apiClient.getCustomers({
        search,
        segment: segment === 'all' ? undefined : segment,
        sortBy: sortBy,
        page: Math.floor((append ? currentOffset : offset) / limit) + 1,
        pageSize: limit
      })
      
      if (append) {
        setCustomers(prev => [...prev, ...result.customers])
      } else {
        setCustomers(result.customers)
      }
      
      setTotalCount(result.total)
      setError(null)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Failed to fetch customers:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [tenantId, search, segment, sortBy, limit, offset, currentOffset])

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    setCurrentOffset(offset)
    fetchCustomers(false)
  }, [search, segment, sortBy, offset, fetchCustomers])

  // Refetch function
  const refetch = useCallback(async () => {
    setCurrentOffset(offset)
    await fetchCustomers(false)
  }, [fetchCustomers, offset])

  // Load more function for pagination
  const loadMore = useCallback(async () => {
    const newOffset = currentOffset + limit
    setCurrentOffset(newOffset)
    await fetchCustomers(true)
  }, [currentOffset, limit, fetchCustomers])

  const hasMore = customers.length < totalCount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    customers,
    loading,
    error,
    totalCount,
    hasMore,
    refetch,
    loadMore
  }
}