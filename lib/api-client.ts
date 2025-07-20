import { DashboardOverview, Customer, Service, OperatingHours, BusinessProfile, VoiceSettings, ConversationRules, SMSSettings } from '@/app/models/dashboard';
import { PhoneNumber, PhoneNumberCreate, PhoneNumberUpdate } from '@/app/models/phone-number';
import { StaffMember, StaffCreateRequest, StaffUpdateRequest, StaffAvailability, StaffSchedule, StaffInvitation, StaffActivity } from '@/app/models/staff';
import { validateSMSPayload } from './message-validation';
import { env, API_CONFIG } from '@/lib/config';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  metadata?: {
    current_business_id?: string;
  };
  expires_at?: string;
  expires_in?: number;
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

interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
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
  readAt?: string; // ISO timestamp when message was read
  aiMetadata?: {
    isAIGenerated: boolean;
    confidence?: number;
    responseTime?: number;
    modelUsed?: string;
  };
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
  details?: Record<string, unknown>;
}

class APIClient {
  private baseURL: string;
  private token: string | null = null;
  private tenantId: string | null = null;
  private businessId: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private refreshPromise: Promise<AuthResponse> | null = null;
  private requestQueue: Array<() => void> = [];
  private isRefreshing = false;

  constructor(private requestTimeout: number = API_CONFIG.REQUEST.TIMEOUT) {
    this.baseURL = env.get('BACKEND_API_URL');
    console.log('APIClient initialized with baseURL:', this.baseURL);
    if (!this.baseURL) {
      console.warn('Backend API URL not configured. Please set BACKEND_API_URL in environment.');
    }
  }

  private initializeFromStorage() {
    if (typeof window !== 'undefined' && !this.token) {
      this.token = localStorage.getItem('auth_token');
      this.tenantId = localStorage.getItem('tenant_id');
      this.businessId = localStorage.getItem('current_business_id');
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
    if (!this.refreshPromise) {
      throw new Error('Token refresh promise not initialized');
    }
    return this.refreshPromise;
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
    // Initialize from storage on first request
    this.initializeFromStorage();
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
    
    // Add business ID to headers if available
    if (this.businessId) {
      (headers as Record<string, string>)['X-Business-ID'] = this.businessId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await this.executeRequest(url, {
        ...options,
        signal: controller.signal
      }, headers);
      clearTimeout(timeoutId);

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
        const apiError = new Error(error.message || `Request failed: ${response.statusText}`) as Error & {
          response: { status: number; data: unknown };
        };
        apiError.response = { status: response.status, data: error };
        throw apiError;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
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

  setBusinessId(businessId: string | null) {
    this.businessId = businessId;
    if (typeof window !== 'undefined') {
      if (businessId) {
        localStorage.setItem('current_business_id', businessId);
      } else {
        localStorage.removeItem('current_business_id');
      }
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('Login attempt:', { email, baseURL: this.baseURL });
    try {
      const response = await this.request<AuthResponse>('/api/dashboard/auth/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      console.log('Login response:', response);
      
      this.setToken(response.token, response.expires_at, response.expires_in);
      // Assuming the response includes tenant_id for email/password login
      if (response.user?.id) {
        this.setTenantId(response.user.id);
      }
      // Set business ID from metadata if available
      if (response.metadata?.current_business_id) {
        this.setBusinessId(response.metadata.current_business_id);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
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
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
    };
    metadata?: {
      current_business_id?: string;
    };
    expires_at?: string;
    expires_in?: number;
  }> {
    const response = await this.request<{
      token: string;
      tenant_id: string;
      is_new_user: boolean;
      user: {
        id: string;
        email: string;
        name: string;
        avatar?: string;
      };
      metadata?: {
        current_business_id?: string;
      };
      expires_at?: string;
      expires_in?: number;
    }>('/api/dashboard/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    });
    
    this.setToken(response.token, response.expires_at, response.expires_in);
    this.setTenantId(response.tenant_id);
    // Set business ID from metadata if available
    if (response.metadata?.current_business_id) {
      this.setBusinessId(response.metadata.current_business_id);
    }
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
    this.initializeFromStorage();
    return !!this.token;
  }

  getTokenExpiryInfo(): {
    expiresAt: Date | null;
    isExpired: boolean;
    isExpiringSoon: boolean;
    minutesUntilExpiry: number | null;
  } {
    this.initializeFromStorage();
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

  // V2 Dashboard API Methods

  // Business Configuration
  async getBusinessProfile(): Promise<BusinessProfile> {
    return this.request('/api/v2/dashboard/business');
  }

  async updateBusinessProfile(updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return this.request('/api/v2/dashboard/business', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getVoiceSettings(): Promise<VoiceSettings> {
    return this.request('/api/v2/dashboard/prompts');
  }

  async updateVoiceSettings(settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
    return this.request('/api/v2/dashboard/prompts', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  async getConversationRules(): Promise<ConversationRules> {
    return this.request('/api/v2/dashboard/business');
  }

  async updateConversationRules(rules: Partial<ConversationRules>): Promise<ConversationRules> {
    return this.request('/api/v2/dashboard/business', {
      method: 'PATCH',
      body: JSON.stringify(rules),
    });
  }

  // Services Management
  async getServices(includeInactive = false): Promise<Service[]> {
    const params = new URLSearchParams();
    if (includeInactive) params.append('include_inactive', 'true');
    return this.request(`/api/v2/dashboard/services?${params.toString()}`);
  }

  async createService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request('/api/v2/dashboard/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
  }

  async updateService(id: string, updates: Partial<Service>) {
    return this.request(`/api/v2/dashboard/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteService(id: string) {
    return this.request(`/api/v2/dashboard/services/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderServices(serviceIds: string[]) {
    return this.request('/api/v2/dashboard/services/reorder', {
      method: 'POST',
      body: JSON.stringify({ service_ids: serviceIds }),
    });
  }

  // Operating Hours
  async getBusinessHours(): Promise<OperatingHours[]> {
    return this.request('/api/v2/dashboard/hours');
  }

  async updateBusinessHours(hours: OperatingHours[]) {
    return this.request('/api/v2/dashboard/hours', {
      method: 'PUT',
      body: JSON.stringify(hours),
    });
  }

  // Analytics
  async getAnalyticsOverview(startDate?: string, endDate?: string): Promise<DashboardOverview> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/api/v2/dashboard/analytics/overview?${params.toString()}`);
  }

  // Customers
  async getCustomers(filters?: {
    search?: string;
    segment?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): Promise<{ customers: Customer[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    return this.request(`/api/v2/dashboard/customers?${params.toString()}`);
  }

  async getCustomerSegmentCounts(search?: string) {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    return this.request(`/api/v2/dashboard/customers/segments/counts?${params.toString()}`);
  }

  // SMS Management
  async sendSMSMessage(data: {
    conversationId: string;
    message: string;
    direction: 'outbound' | 'inbound';
  }): Promise<SMS> {
    // Validate payload before sending
    const validation = validateSMSPayload(data);
    if (!validation.isValid) {
      throw new Error(`Invalid SMS payload: ${validation.errors.join(', ')}`);
    }

    // Use sanitized message
    const sanitizedData = {
      ...data,
      message: validation.sanitizedMessage || data.message
    };

    return this.request('/api/v2/dashboard/sms/send', {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });
  }

  async overrideAIMessage(messageId: string, data: {
    message: string;
    overrideReason: string;
  }): Promise<SMS> {
    return this.request(`/api/v2/dashboard/sms/${messageId}/override`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Phone-scoped SMS operation with context validation
  async sendSMS(phoneId: string, data: {
    conversationId: string;
    message: string;
    direction: 'outbound' | 'inbound';
  }): Promise<SMS> {
    if (!phoneId) {
      throw new Error('Phone ID is required for SMS operations');
    }
    return this.request('/api/v2/dashboard/sms', {
      method: 'POST',
      headers: {
        'X-Phone-Number-Id': phoneId
      },
      body: JSON.stringify(data),
    });
  }

  // Industry Templates
  async getIndustryTemplates() {
    return this.request('/api/v2/dashboard/services/templates');
  }

  async applyIndustryTemplate(templateId: string) {
    return this.request(`/api/v2/dashboard/services/templates/${templateId}/apply`, {
      method: 'POST',
    });
  }

  // Holidays
  async getHolidays() {
    return this.request('/api/v2/dashboard/holidays');
  }

  async addHoliday(holiday: {
    date: string;
    name: string;
    isClosed: boolean;
    specialHours?: { openTime: string; closeTime: string };
  }) {
    return this.request('/api/v2/dashboard/holidays', {
      method: 'POST',
      body: JSON.stringify(holiday),
    });
  }

  async removeHoliday(holidayId: string) {
    return this.request(`/api/v2/dashboard/holidays/${holidayId}`, {
      method: 'DELETE',
    });
  }

  // SMS Settings and Templates
  async getSMSSettings() {
    return this.request('/api/v2/dashboard/sms/settings');
  }

  async updateSMSSettings(settings: Partial<SMSSettings>) {
    return this.request('/api/v2/dashboard/sms/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  async getSMSTemplates() {
    return this.request('/api/v2/dashboard/sms/templates');
  }

  async updateSMSTemplate(templateId: string, template: {
    template: string;
    variables?: string[];
  }) {
    return this.request(`/api/v2/dashboard/sms/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(template),
    });
  }

  // System Configuration
  async getSystemConfig() {
    return this.request('/api/v2/dashboard/config/system');
  }

  // Configuration Management
  async cloneConfiguration(targetBusinessId: string) {
    return this.request('/api/v2/dashboard/config/clone', {
      method: 'POST',
      body: JSON.stringify({ targetBusinessId }),
    });
  }

  // Create WebSocket connection for real-time updates
  createWebSocketConnection() {
    this.initializeFromStorage();
    const token = this.token;
    const businessId = this.businessId;
    
    if (!token) {
      throw new Error('No auth token available for WebSocket connection');
    }
    
    if (!businessId) {
      throw new Error('No business context available for WebSocket connection');
    }

    // Use secure WebSocket (wss) and remove token from URL for security
    const baseURL = this.baseURL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${baseURL}/api/v2/dashboard/ws`);
    
    // Send authentication token as first message after connection opens
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'auth', token, business_id: businessId }));
    });
    
    return ws;
  }

  // Phone Number Management
  async getPhoneNumbers(): Promise<PhoneNumber[]> {
    // Business ID comes from auth context headers
    return this.request('/api/v2/dashboard/phone-numbers');
  }

  async getPhoneNumber(phoneId: string): Promise<PhoneNumber> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}`);
  }

  async searchAvailablePhoneNumbers(filters?: {
    areaCode?: string;
    contains?: string;
  }): Promise<Array<{
    phone_number: string;
    friendly_name: string;
    locality: string;
    region: string;
    postal_code: string;
    capabilities: {
      voice: boolean;
      sms: boolean;
      mms: boolean;
    };
    monthlyPrice: number;
  }>> {
    // TODO: Implement phone number search in backend
    // For now, return empty array as the backend endpoint doesn't exist
    console.warn('Phone number search not implemented in backend');
    return Promise.resolve([]);
  }

  async provisionPhoneNumber(data: {
    displayName: string;
    areaCode?: string;
    timezone?: string;
    description?: string;
  }): Promise<PhoneNumber> {
    // Business ID comes from auth context headers
    return this.request('/api/v2/dashboard/phone-numbers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Alias for compatibility
  async createPhoneNumber(data: any): Promise<PhoneNumber> {
    return this.provisionPhoneNumber(data);
  }

  async updatePhoneNumber(phoneId: string, updates: PhoneNumberUpdate): Promise<PhoneNumber> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async setPrimaryPhoneNumber(phoneId: string): Promise<PhoneNumber> {
    // Business ID comes from auth context headers
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/set-primary`, {
      method: 'POST',
    });
  }

  async suspendPhoneNumber(phoneId: string): Promise<PhoneNumber> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/suspend`, {
      method: 'POST',
    });
  }

  async releasePhoneNumber(phoneId: string): Promise<void> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/release`, {
      method: 'DELETE',
    });
  }

  // Alias for compatibility
  async deletePhoneNumber(phoneId: string): Promise<void> {
    return this.releasePhoneNumber(phoneId);
  }

  // Calendar Management for Phone Numbers
  async assignPhoneCalendars(phoneId: string, calendars: Array<{
    calendar_provider: string;
    calendar_id: string;
    priority: number;
  }>): Promise<void> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/calendars`, {
      method: 'POST',
      body: JSON.stringify({ calendars }),
    });
  }

  // Get effective settings (merged business + phone overrides)
  async getPhoneEffectiveSettings(phoneId: string): Promise<{
    voice_settings: VoiceSettings;
    conversation_settings: ConversationRules;
    sms_settings: SMSSettings;
  }> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/settings`);
  }

  // Business Management
  async getCurrentBusiness(): Promise<BusinessProfile> {
    return this.request('/api/v2/dashboard/business');
  }

  async updateBusiness(updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return this.request('/api/v2/dashboard/business', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Phone-specific settings methods
  async getPhoneVoiceSettings(phoneId: string): Promise<VoiceSettings> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/voice-settings`);
  }

  async updatePhoneVoiceSettings(phoneId: string, settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/voice-settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  async getPhoneConversationRules(phoneId: string): Promise<ConversationRules> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/conversation-rules`);
  }

  async updatePhoneConversationRules(phoneId: string, rules: Partial<ConversationRules>): Promise<ConversationRules> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/conversation-rules`, {
      method: 'PATCH',
      body: JSON.stringify(rules),
    });
  }

  async getPhoneOperatingHours(phoneId: string): Promise<OperatingHours[]> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/operating-hours`);
  }

  async updatePhoneOperatingHours(phoneId: string, data: {
    operatingHours?: Array<{
      day: string;
      enabled: boolean;
      hours?: Array<{
        open: string;
        close: string;
      }>;
    }>;
    timezone?: string;
  }): Promise<any> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/operating-hours`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updatePhoneSmsSettings(phoneId: string, settings: {
    enabled?: boolean;
    reminderHours?: number;
  }): Promise<any> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/sms-settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  // Phone-scoped operations
  async getPhoneServices(phoneId: string): Promise<Service[]> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/services`);
  }

  async getPhoneCalls(phoneId: string, filters?: {
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
    
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/calls?${params.toString()}`);
  }

  async getPhoneSMS(phoneId: string, filters?: {
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
    
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/sms?${params.toString()}`);
  }

  async getPhoneBookings(phoneId: string, filters?: {
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
    
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/bookings?${params.toString()}`);
  }

  // Create phone-specific WebSocket connection
  createPhoneWebSocketConnection(phoneId: string) {
    this.initializeFromStorage();
    const token = this.token;
    if (!token) {
      throw new Error('No auth token available for WebSocket connection');
    }

    const baseURL = this.baseURL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${baseURL}/api/v2/dashboard/ws`);
    
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'auth', token, phone_id: phoneId }));
    });
    
    return ws;
  }

  // Test voice configuration
  async testVoiceConfiguration(
    phoneId: string, 
    voiceId: string, 
    testText: string
  ): Promise<{ success: boolean; audioUrl?: string; error?: string; duration?: number }> {
    return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/voice-test`, {
      method: 'POST',
      body: JSON.stringify({ voiceId, text: testText }),
    });
  }

  // Test integration connection
  async testIntegration(integrationId: string): Promise<TestConnectionResult> {
    return this.request('/api/v2/dashboard/integrations/test', {
      method: 'POST',
      body: JSON.stringify({ integration_id: integrationId })
    });
  }

  // Staff Management
  async getStaffMembers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<StaffMember[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    return this.request(`/api/v2/dashboard/staff?${params.toString()}`);
  }

  async getStaffMember(staffId: string): Promise<StaffMember> {
    return this.request(`/api/v2/dashboard/staff/${staffId}`);
  }

  async createStaffMember(data: StaffCreateRequest): Promise<StaffMember> {
    return this.request('/api/v2/dashboard/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStaffMember(staffId: string, data: StaffUpdateRequest): Promise<StaffMember> {
    return this.request(`/api/v2/dashboard/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStaffMember(staffId: string): Promise<void> {
    return this.request(`/api/v2/dashboard/staff/${staffId}`, {
      method: 'DELETE',
    });
  }

  // Staff Availability
  async getStaffAvailability(staffId: string): Promise<StaffAvailability[]> {
    return this.request(`/api/v2/dashboard/staff/${staffId}/availability`);
  }

  async updateStaffAvailability(staffId: string, availability: StaffAvailability[]): Promise<StaffAvailability[]> {
    return this.request(`/api/v2/dashboard/staff/${staffId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    });
  }

  // Staff Schedule
  async getStaffSchedule(staffId: string, startDate: string, endDate: string): Promise<StaffSchedule[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    
    return this.request(`/api/v2/dashboard/staff/${staffId}/schedule?${params.toString()}`);
  }

  async updateStaffSchedule(staffId: string, date: string, schedule: StaffSchedule): Promise<StaffSchedule> {
    return this.request(`/api/v2/dashboard/staff/${staffId}/schedule/${date}`, {
      method: 'PUT',
      body: JSON.stringify(schedule),
    });
  }

  // Staff Invitations
  async createStaffInvitation(data: {
    email: string;
    role: string;
    permissions?: Record<string, boolean>;
  }): Promise<StaffInvitation> {
    return this.request('/api/v2/dashboard/staff/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStaffInvitations(): Promise<StaffInvitation[]> {
    return this.request('/api/v2/dashboard/staff/invitations');
  }

  async revokeStaffInvitation(invitationId: string): Promise<void> {
    return this.request(`/api/v2/dashboard/staff/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  }

  async resendStaffInvitation(invitationId: string): Promise<StaffInvitation> {
    return this.request(`/api/v2/dashboard/staff/invitations/${invitationId}/resend`, {
      method: 'POST',
    });
  }

  // Staff Activity
  async getStaffActivity(staffId: string, filters?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ activities: StaffActivity[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    return this.request(`/api/v2/dashboard/staff/${staffId}/activity?${params.toString()}`);
  }

  // Business Security Settings
  async getBusinessSecuritySettings(): Promise<{
    require_2fa?: boolean;
    session_timeout?: boolean;
    email_notifications?: boolean;
  }> {
    return this.request('/api/v2/dashboard/business/security-settings');
  }

  async updateBusinessSecuritySettings(settings: {
    require_2fa?: boolean;
    session_timeout?: boolean;
    email_notifications?: boolean;
  }): Promise<void> {
    return this.request('/api/v2/dashboard/business/security-settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  // Backward compatibility methods for tests
  async setPrimaryPhone(businessId: string, phoneId: string): Promise<PhoneNumber> {
    // Note: businessId parameter is ignored as it comes from auth context
    return this.setPrimaryPhoneNumber(phoneId);
  }

  async testPhoneVoice(
    phoneId: string, 
    voiceId: string, 
    testText: string
  ): Promise<{ success: boolean; audioUrl?: string; error?: string; duration?: number }> {
    return this.testVoiceConfiguration(phoneId, voiceId, testText);
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