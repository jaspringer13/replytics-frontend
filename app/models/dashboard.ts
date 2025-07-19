/**
 * Dashboard-specific data models and types
 */

// Business Configuration Types
export interface BusinessProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  timezone: string;
  website?: string;
  voiceSettings: VoiceSettings;
  conversationRules: ConversationRules;
  smsSettings: SMSSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceSettings {
  voiceId: string;
  speakingStyle: 'friendly_professional' | 'casual' | 'formal' | 'enthusiastic';
  speed: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 2.0
}

export interface ConversationRules {
  allowMultipleServices: boolean;
  allowCancellations: boolean;
  allowRescheduling: boolean;
  noShowBlockEnabled: boolean;
  noShowThreshold: number;
}

export interface SMSSettings {
  enabled: boolean;
  remindersEnabled: boolean;
  reminderHours: number; // Hours before appointment
  notifyOwnerBooking: boolean;
  notifyOwnerCancellation: boolean;
}

// Service Management Types
export interface Service {
  id: string;
  businessId: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description?: string;
  active: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCreate {
  name: string;
  duration: number;
  price: number;
  description?: string;
  active?: boolean;
}

export interface ServiceUpdate {
  name?: string;
  duration?: number;
  price?: number;
  description?: string;
  active?: boolean;
  displayOrder?: number;
}

export interface ServiceTemplate {
  industry: string;
  services: Omit<Service, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>[];
}

// Operating Hours Types
export interface OperatingHours {
  id: string;
  businessId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // "09:00"
  closeTime: string; // "17:00"
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holiday {
  id: string;
  businessId: string;
  date: string; // YYYY-MM-DD
  name: string;
  isClosed: boolean;
  specialHours?: {
    openTime: string;
    closeTime: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SpecialHours {
  id: string;
  businessId: string;
  date: string; // YYYY-MM-DD
  openTime: string;
  closeTime: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Types
export interface Customer {
  id: string;
  businessId: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  totalAppointments: number;
  noShowCount: number;
  lifetimeValue: number;
  averageServiceValue: number;
  lastInteraction: Date;
  firstInteraction: Date;
  segment: CustomerSegment;
  preferences?: Record<string, any>;
  flags?: string[];
}

export type CustomerSegment = 'vip' | 'regular' | 'at_risk' | 'new' | 'dormant';

// Analytics Types
export interface DashboardOverview {
  dateRange: DateRange;
  metrics: {
    totalRevenue: number;
    totalAppointments: number;
    totalCustomers: number;
    averageServiceValue: number;
    bookingRate: number;
    noShowRate: number;
  };
  trends: {
    revenue: TrendData;
    appointments: TrendData;
    newCustomers: TrendData;
  };
  topServices: ServicePerformance[];
  customerSegments: SegmentDistribution;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
  dataPoints: { date: string; value: number }[];
}

export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  revenue: number;
  appointmentCount: number;
  averagePrice: number;
  utilization: number;
}

export interface SegmentDistribution {
  vip: number;
  regular: number;
  atRisk: number;
  new: number;
  dormant: number;
}

// SMS Template Types
export interface SMSTemplate {
  id: string;
  businessId: string;
  templateType: SMSTemplateType;
  template: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type SMSTemplateType = 
  | 'booking_confirmation'
  | 'reminder'
  | 'cancellation'
  | 'rescheduling'
  | 'follow_up'
  | 'promotion';

// Prompt Template Types
export interface PromptTemplate {
  category: PromptCategory;
  key: string;
  template: string;
  variables: string[];
  description: string;
}

export type PromptCategory = 
  | 'greeting'
  | 'booking'
  | 'cancellation'
  | 'information'
  | 'closing'
  | 'error_handling';

// Staff Types
export interface StaffMember {
  id: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'owner' | 'manager' | 'staff';
  services: string[]; // Service IDs this staff member can perform
  availability: StaffAvailability[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Integration Types
export interface CalendarIntegration {
  type: 'google' | 'square';
  enabled: boolean;
  config: Record<string, any>;
  lastSync?: Date;
  syncStatus: 'active' | 'error' | 'disabled';
}

// Request/Response Types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FilterOptions {
  search?: string;
  dateRange?: DateRange;
  status?: string;
  segment?: CustomerSegment;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}