/**
 * Staff Management Types and Interfaces
 */

// Main staff member interface
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'staff';
  status: 'active' | 'invited' | 'inactive';
  permissions: {
    manage_bookings: boolean;
    manage_settings: boolean;
    view_analytics: boolean;
    manage_staff: boolean;
  };
  created_at: string;
  last_login?: string;
}

// Staff role types
export type StaffRole = 'owner' | 'manager' | 'stylist' | 'assistant';

// API request interfaces
export interface StaffCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  role: 'owner' | 'manager' | 'stylist' | 'assistant';
  services?: string[];
  hourly_rate?: number;
  active?: boolean;
}

export interface StaffUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'owner' | 'manager' | 'stylist' | 'assistant';
  services?: string[];
  hourly_rate?: number;
  active?: boolean;
}

// Staff availability interface
export interface StaffAvailability {
  staff_id: string;
  day_of_week: number; // 0-6, 0 = Sunday
  start_time: string;   // HH:MM format
  end_time: string;     // HH:MM format
  is_available: boolean;
  breaks?: Array<{
    start: string;
    end: string;
  }>;
}

// Permission matrix interface
export interface PermissionMatrix {
  role: StaffRole;
  permissions: {
    manage_bookings: boolean;
    manage_settings: boolean;
    view_analytics: boolean;
    manage_staff: boolean;
  };
}

// Default permission matrices by role
export const DEFAULT_PERMISSIONS: Record<StaffRole, PermissionMatrix['permissions']> = {
  owner: {
    manage_bookings: true,
    manage_settings: true,
    view_analytics: true,
    manage_staff: true,
  },
  manager: {
    manage_bookings: true,
    manage_settings: true,
    view_analytics: true,
    manage_staff: false,
  },
  stylist: {
    manage_bookings: true,
    manage_settings: false,
    view_analytics: false,
    manage_staff: false,
  },
  assistant: {
    manage_bookings: true,
    manage_settings: false,
    view_analytics: false,
    manage_staff: false,
  },
};