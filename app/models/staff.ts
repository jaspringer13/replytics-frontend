/**
 * Staff Management Models
 */

// Staff role types
export type StaffRole = 'owner' | 'admin' | 'staff';

// Main staff member interface
export interface StaffMember {
  id: string;
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  status: 'active' | 'invited' | 'inactive';
  permissions: StaffPermissions;
  services?: string[]; // IDs of services this staff member can provide
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
  avatar_url?: string;
}

// Staff permissions interface
export interface StaffPermissions {
  manage_bookings: boolean;
  manage_settings: boolean;
  view_analytics: boolean;
  manage_staff: boolean;
  manage_customers: boolean;
  manage_services: boolean;
}


// API request interfaces
export interface StaffCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  services?: string[];
  hourly_rate?: number;
  permissions?: Partial<StaffPermissions>;
}

export interface StaffUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  services?: string[];
  hourly_rate?: number;
  permissions?: Partial<StaffPermissions>;
  status?: 'active' | 'inactive';
}

// Staff availability interface
export interface StaffAvailability {
  id: string;
  staff_id: string;
  day_of_week: number; // 0-6, 0 = Sunday
  start_time: string;   // HH:MM format
  end_time: string;     // HH:MM format
  timezone?: string;    // IANA timezone identifier
  is_available: boolean;
  breaks?: StaffBreak[];
}

export interface StaffBreak {
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  description?: string;
}

// Staff schedule interface
export interface StaffSchedule {
  staff_id: string;
  date: string; // YYYY-MM-DD
  shifts: StaffShift[];
  is_available: boolean;
  notes?: string;
}

export interface StaffShift {
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  break_duration?: number; // minutes
  services?: string[]; // Service IDs available during this shift
}

// Staff invitation interface
export interface StaffInvitation {
  id: string;
  business_id: string;
  email: string;
  role: StaffRole;
  permissions: StaffPermissions;
  token: string;
  expires_at: string;
  created_at: string;
  created_by: string;
  accepted_at?: string;
}

// Action-specific detail types
export type ActivityDetails = 
  | { action: 'booking_created'; booking_id: string; customer_id: string }
  | { action: 'booking_updated'; booking_id: string; changes: string[] }
  | { action: 'booking_cancelled'; booking_id: string; reason?: string }
  | { action: 'settings_changed'; section: string; changes: string[] }
  | { action: 'login' | 'logout' };

// Staff activity/audit log
export interface StaffActivity {
  id: string;
  staff_id: string;
  action: 'login' | 'logout' | 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'settings_changed';
  details?: ActivityDetails;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Default permission matrices by role
export const DEFAULT_PERMISSIONS: Record<'owner' | 'admin' | 'staff', StaffPermissions> = {
  owner: {
    manage_bookings: true,
    manage_settings: true,
    view_analytics: true,
    manage_staff: true,
    manage_customers: true,
    manage_services: true,
  },
  admin: {
    manage_bookings: true,
    manage_settings: true,
    view_analytics: true,
    manage_staff: false,
    manage_customers: true,
    manage_services: true,
  },
  staff: {
    manage_bookings: true,
    manage_settings: false,
    view_analytics: false,
    manage_staff: false,
    manage_customers: false,
    manage_services: false,
  },
};

// Helper type guards
export function isOwner(member: StaffMember): boolean {
  return member.role === 'owner';
}

export function isAdmin(member: StaffMember): boolean {
  return member.role === 'admin' || member.role === 'owner';
}

export function hasPermission(member: StaffMember, permission: keyof StaffPermissions): boolean {
  return member.permissions[permission] === true;
}