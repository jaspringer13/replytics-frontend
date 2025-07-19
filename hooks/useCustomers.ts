import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { Customer, CustomerSegment } from '@/app/models/dashboard'
import { useUserTenant } from '@/hooks/useUserTenant'

interface UseCustomersOptions {
  search?: string
  segment?: CustomerSegment['segment'] | 'all'
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

  const fetchCustomers = useCallback(async (append = false) => {
    if (!tenantId) return

    try {
      if (!append) setLoading(true)
      
      const result = await apiClient.getCustomers({
        search,
        segment: segment === 'all' ? undefined : segment,
        sort_by: sortBy,
        limit,
        offset: append ? currentOffset : offset
      })
      
      if (append) {
        setCustomers(prev => [...prev, ...result.customers])
      } else {
        setCustomers(result.customers)
      }
      
      setTotalCount(result.total)
      setError(null)
    } catch (err) {
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
  }, [search, segment, sortBy, offset])

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