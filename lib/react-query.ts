import { QueryClient, DefaultOptions } from '@tanstack/react-query';

interface QueryError {
  response?: {
    status: number;
  };
}

// Allow configuration via environment variables
const STALE_TIME = parseInt(process.env.NEXT_PUBLIC_QUERY_STALE_TIME || '300000'); // 5 min default
const GC_TIME = parseInt(process.env.NEXT_PUBLIC_QUERY_GC_TIME || '600000'); // 10 min default

const defaultQueryOptions: DefaultOptions = {
  queries: {
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: (failureCount: number, error: unknown) => {
      const queryError = error as QueryError;
      // Don't retry on 4xx errors except 401 (which we'll handle with token refresh)
      if (queryError?.response?.status && queryError.response.status >= 400 && queryError.response.status < 500 && queryError.response.status !== 401) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
    },
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',
  },
  mutations: {
    retry: false,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

// Query key factory for consistent key management
export const queryKeys = {
  all: ['replytics'] as const,
  auth: () => [...queryKeys.all, 'auth'] as const,
  calls: () => [...queryKeys.all, 'calls'] as const,
  callsList: (filters?: any) => [...queryKeys.calls(), 'list', filters] as const,
  callById: (id: string) => [...queryKeys.calls(), id] as const,
  stats: () => [...queryKeys.all, 'stats'] as const,
  bookings: () => [...queryKeys.all, 'bookings'] as const,
  bookingsList: (filters?: any) => [...queryKeys.bookings(), 'list', filters] as const,
  bookingsByDate: (date: string) => [...queryKeys.bookings(), date] as const,
  sms: () => [...queryKeys.all, 'sms'] as const,
  smsConversation: (conversationId: string) => [...queryKeys.sms(), conversationId] as const,
  activities: () => [...queryKeys.all, 'activities'] as const,
  aiActivities: (filters?: any) => [...queryKeys.activities(), 'ai', filters] as const,
  billing: () => [...queryKeys.all, 'billing'] as const,
};