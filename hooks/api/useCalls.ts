import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient, Call } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query';

interface CallsFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface CallsResponse {
  calls: Call[];
  total: number;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

// Hook for paginated calls with infinite scroll
export function useCalls(filters?: CallsFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.callsList(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.fetchCalls({
        ...filters,
        limit: PAGE_SIZE,
        offset: pageParam,
      });
      
      return {
        ...response,
        hasMore: pageParam + PAGE_SIZE < response.total,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });
}

// Hook for single call details
export function useCall(callId: string) {
  return useQuery({
    queryKey: queryKeys.callById(callId),
    queryFn: async () => {
      const response = await apiClient.request<Call>(`/api/dashboard/calls/${callId}`);
      return response;
    },
    enabled: !!callId,
  });
}

// Hook for call recording
export function useCallRecording(callId: string) {
  return useQuery({
    queryKey: [...queryKeys.callById(callId), 'recording'],
    queryFn: () => apiClient.fetchCallRecording(callId),
    enabled: !!callId,
    staleTime: Infinity, // Recordings don't change
  });
}

// Helper hook for today's calls
export function useTodaysCalls(limit = 100) {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: [...queryKeys.calls(), 'today', today, limit],
    queryFn: async () => {
      const response = await apiClient.fetchCalls({
        startDate: today,
        endDate: today,
        limit,
      });
      return response;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Hook for missed calls
export function useMissedCalls() {
  return useQuery({
    queryKey: [...queryKeys.calls(), 'missed'],
    queryFn: async () => {
      const response = await apiClient.fetchCalls({
        status: 'missed',
        limit: 50,
      });
      return response;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}