interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  expires_at?: string; // ISO timestamp when token expires
  expires_in?: number; // Seconds until expiry
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
  private tokenExpiresAt: Date | null = null;
  private refreshPromise: Promise<AuthResponse> | null = null;
  private requestQueue: Array<() => void> = [];
  private isRefreshing = false;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
    if (!this.baseURL) {
      console.warn('Backend API URL not configured. Please set NEXT_PUBLIC_BACKEND_API_URL in .env.local');
    }
    
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      this.tenantId = localStorage.getItem('tenant_id');
      const expiresAt = localStorage.getItem('token_expires_at');
      if (expiresAt) {
        this.tokenExpiresAt = new Date(expiresAt);
      }
    }
  }

  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    headers: HeadersInit
  ): Promise<Response> {
    return fetch(url, {
      ...options,
      headers,
    });
  }

  private async handleTokenRefresh(): Promise<AuthResponse> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshPromise = this.refreshToken().finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
        // Process queued requests
        this.requestQueue.forEach(resolve => resolve());
        this.requestQueue = [];
      });
    }
    return this.refreshPromise!;
  }

  private isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiresAt) return false;
    
    const now = new Date();
    const expiresAt = new Date(this.tokenExpiresAt);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    // Token will expire in the next 5 minutes
    return expiresAt <= fiveMinutesFromNow;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // Check if token is about to expire and proactively refresh
    if (this.token && this.isTokenExpiringSoon() && endpoint !== '/api/dashboard/auth/refresh') {
      console.log('Token expiring soon, proactively refreshing...');
      try {
        const authResponse = await this.handleTokenRefresh();
        this.setToken(authResponse.token, authResponse.expires_at, authResponse.expires_in);
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
      }
    }

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
      const response = await this.executeRequest(url, options, headers);

      // Handle 401 errors with token refresh
      if (response.status === 401 && retryCount === 0) {
        // Don't try to refresh if this is already a refresh request
        if (endpoint === '/api/dashboard/auth/refresh') {
          throw new Error('Token refresh failed');
        }

        // Wait for ongoing refresh or start a new one
        if (this.isRefreshing) {
          await new Promise<void>(resolve => {
            this.requestQueue.push(resolve);
          });
        } else {
          try {
            const authResponse = await this.handleTokenRefresh();
            this.setToken(authResponse.token, authResponse.expires_at, authResponse.expires_in);
          } catch (refreshError) {
            // Refresh failed, redirect to sign in
            this.setToken(null);
            this.setTenantId(null);
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/signin';
            }
            throw refreshError;
          }
        }

        // Retry the original request with new token
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }));
        const apiError = new Error(error.message || `Request failed: ${response.statusText}`);
        (apiError as any).response = { status: response.status, data: error };
        throw apiError;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  setToken(token: string | null, expiresAt?: string, expiresIn?: number) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
        
        // Calculate and store expiry time
        if (expiresAt) {
          this.tokenExpiresAt = new Date(expiresAt);
          localStorage.setItem('token_expires_at', expiresAt);
        } else if (expiresIn) {
          // If we get expires_in (seconds), calculate expires_at
          const expiryDate = new Date(Date.now() + expiresIn * 1000);
          this.tokenExpiresAt = expiryDate;
          localStorage.setItem('token_expires_at', expiryDate.toISOString());
        }
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expires_at');
        this.tokenExpiresAt = null;
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
    
    this.setToken(response.token, response.expires_at, response.expires_in);
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
    expires_at?: string;
    expires_in?: number;
  }> {
    const response = await this.request<any>('/api/dashboard/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    });
    
    this.setToken(response.token, response.expires_at, response.expires_in);
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

  getTokenExpiryInfo(): {
    expiresAt: Date | null;
    isExpired: boolean;
    isExpiringSoon: boolean;
    minutesUntilExpiry: number | null;
  } {
    if (!this.tokenExpiresAt) {
      return {
        expiresAt: null,
        isExpired: false,
        isExpiringSoon: false,
        minutesUntilExpiry: null,
      };
    }

    const now = new Date();
    const expiresAt = new Date(this.tokenExpiresAt);
    const msUntilExpiry = expiresAt.getTime() - now.getTime();
    const minutesUntilExpiry = Math.floor(msUntilExpiry / 1000 / 60);

    return {
      expiresAt: this.tokenExpiresAt,
      isExpired: msUntilExpiry <= 0,
      isExpiringSoon: this.isTokenExpiringSoon(),
      minutesUntilExpiry: msUntilExpiry > 0 ? minutesUntilExpiry : null,
    };
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