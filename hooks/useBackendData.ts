import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, DashboardStats, Call, SMS, Booking } from '@/lib/api-client';
import {
  subscribeToDailyAnalytics,
  subscribeToCallsTable,
  subscribeToSMSTable,
  subscribeToBookings,
  RealtimeSubscription,
} from '@/lib/supabase-client';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UsePaginatedDataResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  total: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useDashboardStats(): UseDataResult<DashboardStats> {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;

  const fetchStats = useCallback(async () => {
    if (!tenantId) {
      setError(new Error('No tenant ID found'));
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const stats = await apiClient.fetchDashboardStats();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    
    fetchStats();

    // Subscribe to analytics for this tenant only
    subscriptionRef.current = subscribeToDailyAnalytics((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Check if the payload is for our tenant
        if (payload.new?.tenant_id === tenantId) {
          fetchStats();
        }
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [fetchStats, tenantId]);

  return { data, loading, error, refetch: fetchStats };
}

export function useCallHistory(
  initialLimit: number = 20
): UsePaginatedDataResult<Call> {
  const [data, setData] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;

  const fetchCalls = useCallback(
    async (resetOffset: boolean = false) => {
      if (!tenantId) {
        setError(new Error('No tenant ID found'));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const currentOffset = resetOffset ? 0 : offset;
        const result = await apiClient.fetchCalls({
          limit: initialLimit,
          offset: currentOffset,
        });
        
        if (resetOffset) {
          setData(result.calls);
          setOffset(initialLimit);
        } else {
          setData((prev) => [...prev, ...result.calls]);
          setOffset((prev) => prev + initialLimit);
        }
        
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch calls'));
      } finally {
        setLoading(false);
      }
    },
    [offset, initialLimit, tenantId]
  );

  const loadMore = useCallback(async () => {
    if (!loading && data.length < total) {
      await fetchCalls(false);
    }
  }, [loading, data.length, total, fetchCalls]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await fetchCalls(true);
  }, [fetchCalls]);

  useEffect(() => {
    if (!tenantId) return;
    
    fetchCalls(true);

    // Subscribe to calls for this tenant only
    subscriptionRef.current = subscribeToCallsTable((payload) => {
      // Check if the payload is for our tenant
      if (payload.new?.tenant_id !== tenantId) return;
      
      if (payload.eventType === 'INSERT') {
        setData((prev) => [payload.new as Call, ...prev]);
        setTotal((prev) => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        setData((prev) =>
          prev.map((call) =>
            call.id === payload.new.id ? (payload.new as Call) : call
          )
        );
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [tenantId]);

  return {
    data,
    loading,
    error,
    total,
    hasMore: data.length < total,
    loadMore,
    refetch,
  };
}

export function useSMSConversations(
  conversationId?: string,
  initialLimit: number = 50
): UsePaginatedDataResult<SMS> {
  const [data, setData] = useState<SMS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;

  const fetchMessages = useCallback(
    async (resetOffset: boolean = false) => {
      if (!tenantId) {
        setError(new Error('No tenant ID found'));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const currentOffset = resetOffset ? 0 : offset;
        const result = await apiClient.fetchSMS({
          conversationId,
          limit: initialLimit,
          offset: currentOffset,
        });
        
        if (resetOffset) {
          setData(result.messages);
          setOffset(initialLimit);
        } else {
          setData((prev) => [...prev, ...result.messages]);
          setOffset((prev) => prev + initialLimit);
        }
        
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch SMS'));
      } finally {
        setLoading(false);
      }
    },
    [offset, initialLimit, conversationId, tenantId]
  );

  const loadMore = useCallback(async () => {
    if (!loading && data.length < total) {
      await fetchMessages(false);
    }
  }, [loading, data.length, total, fetchMessages]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await fetchMessages(true);
  }, [fetchMessages]);

  useEffect(() => {
    if (!tenantId) return;
    
    fetchMessages(true);

    const filter = conversationId
      ? { column: 'conversation_id', value: conversationId }
      : undefined;

    subscriptionRef.current = subscribeToSMSTable((payload) => {
      // Check if the payload is for our tenant
      if (payload.new?.tenant_id !== tenantId) return;
      
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as SMS;
        if (!conversationId || newMessage.conversationId === conversationId) {
          setData((prev) => [...prev, newMessage]);
          setTotal((prev) => prev + 1);
        }
      }
    }, filter);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [conversationId, tenantId]);

  return {
    data,
    loading,
    error,
    total,
    hasMore: data.length < total,
    loadMore,
    refetch,
  };
}

export function useBookings(
  date?: string
): UseDataResult<Booking[]> {
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;

  const fetchBookings = useCallback(async () => {
    if (!tenantId) {
      setError(new Error('No tenant ID found'));
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.fetchBookings({
        date,
        limit: 100,
      });
      setData(result.bookings);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch bookings'));
    } finally {
      setLoading(false);
    }
  }, [date, tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    
    fetchBookings();

    subscriptionRef.current = subscribeToBookings((payload) => {
      // Check if the payload is for our tenant
      if (payload.new?.tenant_id !== tenantId && payload.old?.tenant_id !== tenantId) return;
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const booking = payload.new as Booking;
        if (!date || booking.date === date) {
          fetchBookings();
        }
      } else if (payload.eventType === 'DELETE') {
        setData((prev) => prev.filter((b) => b.id !== payload.old.id));
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [date, fetchBookings, tenantId]);

  return { data, loading, error, refetch: fetchBookings };
}

export function useBillingInfo() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const billing = await apiClient.fetchBillingInfo();
      setData(billing);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch billing info'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  return { data, loading, error, refetch: fetchBilling };
}