"use client"

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { AnalyticsOverview } from '@/app/models/dashboard';
import { useUserTenant } from '@/hooks/useUserTenant';

export interface DateRange {
  start: string;
  end: string;
}

export interface UseAnalyticsDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseAnalyticsDataReturn {
  data: AnalyticsOverview | null;
  loading: boolean;
  error: Error | null;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  validateDateRange: (start: string, end: string) => boolean;
  calculateRetentionRate: () => number;
  refetch: () => Promise<void>;
}

const DEFAULT_DATE_RANGE = {
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
};

const MAX_DATE_RANGE_DAYS = 365;

export function useAnalyticsData(
  options: UseAnalyticsDataOptions = {}
): UseAnalyticsDataReturn {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  const { tenantId } = useUserTenant();
  
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dateRange, setDateRangeState] = useState<DateRange>(DEFAULT_DATE_RANGE);

  const validateDateRange = useCallback((start: string, end: string): boolean => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff >= 0 && daysDiff <= MAX_DATE_RANGE_DAYS;
  }, []);

  const setDateRange = useCallback((range: DateRange) => {
    if (validateDateRange(range.start, range.end)) {
      setDateRangeState(range);
    }
  }, [validateDateRange]);

  const calculateRetentionRate = useCallback((): number => {
    if (!data?.customerSegments) return 0;
    
    const segments = data.customerSegments;
    const totalCustomers = Object.values(segments).reduce((sum, count) => sum + count, 0);
    
    if (totalCustomers === 0) return 0;
    
    // Retention = (VIP + Regular customers) / Total customers * 100
    const retainedCustomers = (segments.vip || 0) + (segments.regular || 0);
    return (retainedCustomers / totalCustomers) * 100;
  }, [data]);

  const fetchAnalytics = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const analytics = await apiClient.getAnalyticsOverview(dateRange.start, dateRange.end);
      setData(analytics);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, dateRange]);

  // Fetch data when date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || loading) return;

    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAnalytics, loading]);

  const refetch = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    dateRange,
    setDateRange,
    validateDateRange,
    calculateRetentionRate,
    refetch,
  };
}