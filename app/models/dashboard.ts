/**
 * Dashboard-specific data models and types
 */

// Validation Types
const VALID_TIMEZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
] as const;

type ValidTimezone = typeof VALID_TIMEZONES[number];

export function createValidTimezone(value: string): ValidTimezone {
  if (!VALID_TIMEZONES.includes(value as ValidTimezone)) {
    throw new Error(`Invalid timezone: ${value}. Must be one of: ${VALID_TIMEZONES.join(', ')}`);
  }
  return value as ValidTimezone;
}

type VoiceSpeed = number & { __brand: 'VoiceSpeed' }; // 0.5 to 2.0
type VoicePitch = number & { __brand: 'VoicePitch' }; // 0.5 to 2.0

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
  timezone: ValidTimezone;
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
  speed: VoiceSpeed;
  pitch: VoicePitch;
}

// Helper functions for creating valid ranges
export function createVoiceSpeed(value: number): VoiceSpeed {
  if (value < 0.5 || value > 2.0) {
    throw new Error('Voice speed must be between 0.5 and 2.0');
  }
  return value as VoiceSpeed;
}

export function createVoicePitch(value: number): VoicePitch {
  if (value < 0.5 || value > 2.0) {
    throw new Error('Voice pitch must be between 0.5 and 2.0');
  }
  return value as VoicePitch;
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

export interface ServiceUpdatePayload {
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
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

export interface OperatingHours {
  id: string;
  businessId: string;
  dayOfWeek: DayOfWeek;
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
  specialHoursId?: string; // Reference to SpecialHours if not closed
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

export const CUSTOMER_SEGMENTS = ['vip', 'regular', 'at_risk', 'new', 'dormant'] as const;
export type CustomerSegment = typeof CUSTOMER_SEGMENTS[number];
export type CustomerSegmentFilter = CustomerSegment | 'all';

// Customer segment data with count
export interface CustomerSegmentData {
  segment: CustomerSegment;
  count: number;
}

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
  popularTimes: PopularTime[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

// Helper function to create valid date ranges
export function createDateRange(start: Date, end: Date): DateRange {
  if (start >= end) {
    throw new Error('Start date must be before end date');
  }
  return { start, end };
}

// Type guard for validating date ranges
export function isValidDateRange(dateRange: DateRange): boolean {
  return dateRange.start < dateRange.end;
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

// Analytics Overview alias for compatibility
export type AnalyticsOverview = DashboardOverview;

// Popular Times type
export interface PopularTime {
  hour: number;
  dayOfWeek: DayOfWeek;
  appointmentCount: number;
  label: string;
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
  dayOfWeek: DayOfWeek;
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

export interface FilterOptions<T = any> {
  search?: string;
  dateRange?: DateRange;
  status?: string;
  segment?: CustomerSegment;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}