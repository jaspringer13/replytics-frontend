// Voice Bot API client for Next.js frontend
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Types
export interface BusinessProfile {
  business_id: string;
  name: string;
  phone?: string;
  email?: string;
  timezone: string;
  industry?: string;
  address?: string;
}

export interface Service {
  id: string;
  name: string;
  display_name: string;
  duration_minutes: number;
  price: number;
  description?: string;
  active: boolean;
}

export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    is_open: boolean;
  };
}

export interface Analytics {
  total_calls: number;
  total_sms: number;
  successful_bookings: number;
  period: string;
  metrics: Record<string, unknown>;
}

// API Client
class VoiceBotAPI {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}/api/v2/dashboard/voice-bot${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'API request failed');
    }

    return response.json();
  }

  // Business Profile
  async getBusinessProfile(businessId: string): Promise<BusinessProfile> {
    return this.request(`/business?business_id=${businessId}`);
  }

  async updateBusinessProfile(
    businessId: string,
    updates: Partial<BusinessProfile>
  ): Promise<BusinessProfile> {
    return this.request(`/business?business_id=${businessId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Services
  async getServices(
    businessId: string,
    includeInactive = false
  ): Promise<{ services: Service[]; total: number }> {
    return this.request(
      `/services?business_id=${businessId}&include_inactive=${includeInactive}`
    );
  }

  async createService(
    businessId: string,
    service: Partial<Service>
  ): Promise<{ service_id: string }> {
    return this.request(`/services?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify(service),
    });
  }

  async updateService(
    businessId: string,
    serviceId: string,
    updates: Partial<Service>
  ): Promise<{ success: boolean }> {
    return this.request(
      `/services/${serviceId}?business_id=${businessId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  }

  async reorderServices(
    businessId: string,
    serviceIds: string[]
  ): Promise<{ success: boolean }> {
    return this.request(`/services/reorder?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify({ service_ids: serviceIds }),
    });
  }

  // Business Hours
  async getBusinessHours(businessId: string): Promise<BusinessHours> {
    return this.request(`/hours?business_id=${businessId}`);
  }

  async updateBusinessHours(
    businessId: string,
    hours: BusinessHours
  ): Promise<{ success: boolean }> {
    return this.request(`/hours?business_id=${businessId}`, {
      method: 'PUT',
      body: JSON.stringify(hours),
    });
  }

  // Analytics
  async getAnalytics(
    businessId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      metrics?: string[];
    }
  ): Promise<Analytics> {
    const params = new URLSearchParams({ business_id: businessId });
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.metrics) params.append('metrics', options.metrics.join(','));

    return this.request(`/analytics?${params}`);
  }
}

// Export singleton
export const voiceBotAPI = new VoiceBotAPI();

// React Query Hooks
export function useBusinessProfile(businessId: string) {
  return useQuery({
    queryKey: ['business-profile', businessId],
    queryFn: () => voiceBotAPI.getBusinessProfile(businessId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      updates,
    }: {
      businessId: string;
      updates: Partial<BusinessProfile>;
    }) => voiceBotAPI.updateBusinessProfile(businessId, updates),
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
    },
  });
}

export function useServices(businessId: string, includeInactive = false) {
  return useQuery({
    queryKey: ['services', businessId, includeInactive],
    queryFn: () => voiceBotAPI.getServices(businessId, includeInactive),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      service,
    }: {
      businessId: string;
      service: Partial<Service>;
    }) => voiceBotAPI.createService(businessId, service),
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      serviceId,
      updates,
    }: {
      businessId: string;
      serviceId: string;
      updates: Partial<Service>;
    }) => voiceBotAPI.updateService(businessId, serviceId, updates),
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] });
    },
  });
}

export function useReorderServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      serviceIds,
    }: {
      businessId: string;
      serviceIds: string[];
    }) => voiceBotAPI.reorderServices(businessId, serviceIds),
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] });
    },
  });
}

export function useBusinessHours(businessId: string) {
  return useQuery({
    queryKey: ['business-hours', businessId],
    queryFn: () => voiceBotAPI.getBusinessHours(businessId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      hours,
    }: {
      businessId: string;
      hours: BusinessHours;
    }) => voiceBotAPI.updateBusinessHours(businessId, hours),
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: ['business-hours', businessId] });
    },
  });
}

export function useAnalytics(
  businessId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    metrics?: string[];
  }
) {
  return useQuery({
    queryKey: ['analytics', businessId, options],
    queryFn: () => voiceBotAPI.getAnalytics(businessId, options),
    staleTime: 60 * 1000, // 1 minute
  });
}