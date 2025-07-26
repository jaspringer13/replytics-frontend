import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, SMS } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query';

interface SMSFilters {
  conversationId?: string;
  startDate?: string;
  endDate?: string;
}

interface SendSMSData {
  phoneNumber: string;
  message: string;
}

const PAGE_SIZE = 50;

// Hook for SMS conversations with infinite scroll
export function useSMSConversations(conversationId?: string) {
  return useInfiniteQuery({
    queryKey: conversationId 
      ? queryKeys.smsConversation(conversationId)
      : queryKeys.sms(),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.fetchSMS({
        conversationId,
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

// Hook for sending SMS with optimistic updates
export function useSendSMS() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SendSMSData) => {
      const response = await apiClient.request<SMS>('/api/dashboard/sms/send', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onMutate: async (newMessage) => {
      // Create optimistic message
      const optimisticMessage: SMS = {
        id: `temp-${Date.now()}`,
        phoneNumber: newMessage.phoneNumber,
        message: newMessage.message,
        direction: 'outbound',
        timestamp: new Date().toISOString(),
        conversationId: '', // Will be set by server
        status: 'sent',
      };
      
      // Add to the conversation immediately
      queryClient.setQueryData(queryKeys.sms(), (old: any) => {
        if (!old || !old.pages || !Array.isArray(old.pages)) {
          return {
            pages: [{
              messages: [optimisticMessage],
              total: 1,
              hasMore: false,
            }],
            pageParams: [0],
          };
        }
        return {
          ...old,
          pages: old.pages.map((page: any, index: number) => {
            if (index === 0) {
              return {
                ...page,
                messages: [optimisticMessage, ...(page.messages || [])],
                total: (page.total || 0) + 1,
              };
            }
            return page;
          }),
        };
      });
      
      return { optimisticMessage };
    },
    onError: (err, newMessage, context) => {
      // Remove optimistic message on error
      if (context?.optimisticMessage) {
        queryClient.setQueryData(queryKeys.sms(), (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: old.pages.map((page: any, index: number) => {
              if (index === 0) {
                return {
                  ...page,
                  messages: (page.messages || []).filter(
                    (msg: SMS) => msg.id !== context.optimisticMessage.id
                  ),
                  total: Math.max((page.total || 1) - 1, 0),
                };
              }
              return page;
            }),
          };
        });
      }
    },
    onSuccess: () => {
      // Refetch to get the real message with server-assigned ID
      queryClient.invalidateQueries({ queryKey: queryKeys.sms() });
    },
  });
}

// Hook for today's SMS count
export function useTodaysSMS() {
  const today = new Date().toISOString().split('T')[0];
  
  return useInfiniteQuery({
    queryKey: [...queryKeys.sms(), 'today', today],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.fetchSMS({
        startDate: today,
        endDate: today,
        limit: PAGE_SIZE,
        offset: pageParam,
      });
      
      return response;
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, page) => acc + page.messages.length, 0);
      if (loaded >= lastPage.total) return undefined;
      return loaded;
    },
    initialPageParam: 0,
    refetchInterval: 60000, // Refresh every minute
  });
}