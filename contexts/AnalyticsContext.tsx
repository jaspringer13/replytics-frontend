"use client"

import React, { createContext, useContext, ReactNode } from 'react';
import { useAnalyticsData, UseAnalyticsDataReturn, UseAnalyticsDataOptions } from '@/lib/hooks/useAnalyticsData';

type AnalyticsContextValue = UseAnalyticsDataReturn;

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  options?: UseAnalyticsDataOptions;
}

export function AnalyticsProvider({ children, options }: AnalyticsProviderProps) {
  const analyticsData = useAnalyticsData(options);

  const value: AnalyticsContextValue = analyticsData;

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// Export specific hooks for convenience
export function useAnalyticsDateRange() {
  const { dateRange, setDateRange, validateDateRange } = useAnalytics();
  return { dateRange, setDateRange, validateDateRange };
}

export function useAnalyticsMetrics() {
  const { data, calculateRetentionRate } = useAnalytics();
  return { data, calculateRetentionRate };
}

export function useAnalyticsLoading() {
  const { loading, error, refetch } = useAnalytics();
  return { loading, error, refetch };
}