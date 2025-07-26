import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { apiClient, Booking } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query';

interface BookingsFilters {
  date?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface CreateBookingData {
  customerName: string;
  phoneNumber: string;
  date: string;
  time: string;
  service: string;
  notes?: string;
}

interface UpdateBookingData extends Partial<CreateBookingData> {
  id: string;
  status?: 'confirmed' | 'pending' | 'cancelled';
}

interface BookingsQueryData {
  bookings: Booking[];
  total: number;
}

// Hook for fetching bookings
export function useBookings(filters?: BookingsFilters) {
  return useQuery({
    queryKey: filters?.date 
      ? queryKeys.bookingsByDate(filters.date)
      : queryKeys.bookingsList(filters),
    queryFn: () => apiClient.fetchBookings(filters),
    refetchInterval: filters?.date === format(new Date(), 'yyyy-MM-dd') 
      ? 60000 // Refresh today's bookings every minute
      : undefined,
  });
}

// Hook for today's bookings
export function useTodaysBookings() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: queryKeys.bookingsByDate(today),
    queryFn: () => apiClient.fetchBookings({ date: today, limit: 100 }),
    refetchInterval: 60000, // Refresh every minute
  });
}

// Hook for upcoming bookings (next 7 days)
export function useUpcomingBookings() {
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  return useQuery({
    queryKey: [...queryKeys.bookings(), 'upcoming'],
    queryFn: async () => {
      const response = await apiClient.request<{ bookings: Booking[]; total: number }>(
        `/api/dashboard/bookings?startDate=${format(today, 'yyyy-MM-dd')}&endDate=${format(nextWeek, 'yyyy-MM-dd')}&limit=100`
      );
      return response;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

// Mutation for creating a booking with optimistic updates
export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const response = await apiClient.request<Booking>('/api/dashboard/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onMutate: async (newBooking) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings() });
      
      // Snapshot the previous value
      const previousBookings = queryClient.getQueryData(queryKeys.bookingsByDate(newBooking.date));
      
      // Optimistically update to the new value
      if (previousBookings) {
        queryClient.setQueryData(queryKeys.bookingsByDate(newBooking.date), (old: BookingsQueryData | undefined) => ({
          ...old,
          bookings: [...(old?.bookings || []), {
            ...newBooking,
            id: `temp-${Date.now()}`,
            status: 'pending',
          }],
          total: (old?.total || 0) + 1,
        }));
      }
      
      return { previousBookings };
    },
    onError: (err, newBooking, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBookings) {
        queryClient.setQueryData(
          queryKeys.bookingsByDate(newBooking.date),
          context.previousBookings
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings() });
    },
  });
}

// Mutation for updating a booking with optimistic updates
export function useUpdateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateBookingData) => {
      const response = await apiClient.request<Booking>(`/api/dashboard/bookings/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    },
    onMutate: async (updatedBooking) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings() });
      
      // Snapshot the previous value
      const previousBookings = queryClient.getQueriesData({ queryKey: queryKeys.bookings() });
      
      // Optimistically update the booking in all relevant queries
      queryClient.setQueriesData(
        { queryKey: queryKeys.bookings() },
        (old: BookingsQueryData | undefined) => {
          if (!old?.bookings) return old;
          
          return {
            ...old,
            bookings: old.bookings.map(booking => 
              booking.id === updatedBooking.id 
                ? { ...booking, ...updatedBooking }
                : booking
            ),
          };
        }
      );
      
      return { previousBookings };
    },
    onError: (err, updatedBooking, context) => {
      // If the mutation fails, roll back
      if (context?.previousBookings) {
        context.previousBookings.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings() });
    },
  });
}

// Mutation for canceling a booking with optimistic updates
export function useCancelBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiClient.request<Booking>(`/api/dashboard/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      return response;
    },
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings() });
      
      // Snapshot the previous value
      const previousBookings = queryClient.getQueriesData({ queryKey: queryKeys.bookings() });
      
      // Optimistically update the booking status to cancelled
      queryClient.setQueriesData(
        { queryKey: queryKeys.bookings() },
        (old: BookingsQueryData | undefined) => {
          if (!old?.bookings) return old;
          
          return {
            ...old,
            bookings: old.bookings.map(booking => 
              booking.id === bookingId 
                ? { ...booking, status: 'cancelled' as const }
                : booking
            ),
          };
        }
      );
      
      return { previousBookings };
    },
    onError: (err, bookingId, context) => {
      // If the mutation fails, roll back
      if (context?.previousBookings) {
        context.previousBookings.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings() });
    },
  });
}