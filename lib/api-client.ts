interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface DashboardStats {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgCallDuration: number;
  totalSMS: number;
  bookingsToday: number;
  callsToday: number;
  smsToday: number;
}

interface Call {
  id: string;
  phoneNumber: string;
  customerName?: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'missed' | 'in_progress' | 'failed';
  duration: number;
  startTime: string;
  endTime?: string;
  recordingUrl?: string;
  transcript?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  summary?: string;
}

interface SMS {
  id: string;
  phoneNumber: string;
  customerName?: string;
  message: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  conversationId: string;
  status: 'sent' | 'delivered' | 'failed' | 'received';
}

interface Booking {
  id: string;
  customerName: string;
  phoneNumber: string;
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

interface APIError {
  message: string;
  code?: string;
  details?: any;
}

class APIClient {
  private baseURL: string;
  private token: string | null = null;
  private tenantId: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
    if (!this.baseURL) {
      console.warn('Backend API URL not configured. Please set NEXT_PUBLIC_BACKEND_API_URL in .env.local');
    }
    
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      this.tenantId = localStorage.getItem('tenant_id');
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }
    
    // Add tenant ID to headers if available
    if (this.tenantId) {
      (headers as Record<string, string>)['X-Tenant-ID'] = this.tenantId;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }));
        throw new Error(error.message || `Request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }
  
  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
    if (typeof window !== 'undefined') {
      if (tenantId) {
        localStorage.setItem('tenant_id', tenantId);
      } else {
        localStorage.removeItem('tenant_id');
      }
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/dashboard/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.token);
    // Assuming the response includes tenant_id for email/password login
    if (response.user?.id) {
      this.setTenantId(response.user.id);
    }
    return response;
  }
  
  async loginWithGoogle(googleData: {
    email: string;
    name: string;
    image?: string;
    google_id: string;
  }): Promise<{
    token: string;
    tenant_id: string;
    is_new_user: boolean;
    user: any;
  }> {
    const response = await this.request<any>('/api/dashboard/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    });
    
    this.setToken(response.token);
    this.setTenantId(response.tenant_id);
    return response;
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  async fetchDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/dashboard/stats');
  }

  async fetchCalls(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ calls: Call[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    return this.request<{ calls: Call[]; total: number }>(
      `/api/dashboard/calls?${params.toString()}`
    );
  }

  async fetchCallRecording(callId: string): Promise<{ url: string }> {
    return this.request<{ url: string }>(`/api/dashboard/recordings/${callId}`);
  }

  async fetchSMS(filters?: {
    conversationId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ messages: SMS[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    return this.request<{ messages: SMS[]; total: number }>(
      `/api/dashboard/sms?${params.toString()}`
    );
  }

  async fetchBookings(filters?: {
    date?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ bookings: Booking[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    return this.request<{ bookings: Booking[]; total: number }>(
      `/api/dashboard/bookings?${params.toString()}`
    );
  }

  async fetchBillingInfo(): Promise<{
    usage: {
      minutes: number;
      calls: number;
      sms: number;
      recordings: number;
    };
    limits: {
      minutes: number;
      calls: number;
      sms: number;
      recordings: number;
    };
    billingPeriod: {
      start: string;
      end: string;
    };
  }> {
    return this.request('/api/dashboard/billing');
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/dashboard/auth/refresh', {
      method: 'POST',
    });
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiClient = new APIClient();

export type {
  AuthResponse,
  DashboardStats,
  Call,
  SMS,
  Booking,
  APIError,
};