import { useQuery } from '@tanstack/react-query';
import { apiClient, DashboardStats } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query';

export interface StatsData extends DashboardStats {
  // Additional computed fields
  answerRate: number;
  avgCallsPerDay: number;
  conversionRate: number;
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: async (): Promise<StatsData> => {
      const stats = await apiClient.fetchDashboardStats();
      
      // Compute additional metrics
      const answerRate = stats.totalCalls > 0 
        ? (stats.answeredCalls / stats.totalCalls) * 100 
        : 0;
      
      const avgCallsPerDay = stats.callsToday;
      
      const conversionRate = stats.callsToday > 0
        ? (stats.bookingsToday / stats.callsToday) * 100
        : 0;
      
      return {
        ...stats,
        answerRate,
        avgCallsPerDay,
        conversionRate,
      };
    },
    // Refetch every 30 seconds to keep stats fresh
    refetchInterval: 30000,
    // Keep data fresh for 1 minute (overrides global staleTime for this query)
    staleTime: 60000,
  });
}

// Helper hook for quick stats access with loading states
export function useQuickStats() {
  const { data, isLoading, error } = useStats();
  
  return {
    totalCalls: data?.totalCalls ?? 0,
    callsToday: data?.callsToday ?? 0,
    bookingsToday: data?.bookingsToday ?? 0,
    smsToday: data?.smsToday ?? 0,
    answerRate: data?.answerRate ?? 0,
    avgCallDuration: data?.avgCallDuration ?? 0,
    isLoading,
    error,
  };
}