/**
 * Staff Management Models
 */

// Staff role types
export type StaffRole = 'owner' | 'manager' | 'staff';

// Main staff member interface
export interface StaffMember {
  id: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  status: 'active' | 'invited' | 'inactive';
  permissions: StaffPermissions;
  services?: string[]; // IDs of services this staff member can provide
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  avatarUrl?: string;
}

// Staff permissions interface
export interface StaffPermissions {
  manageBookings: boolean;
  manageSettings: boolean;
  viewAnalytics: boolean;
  manageStaff: boolean;
  manageCustomers: boolean;
  manageServices: boolean;
}


// API request interfaces
export interface StaffCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  services?: string[];
  hourlyRate?: number;
  permissions?: Partial<StaffPermissions>;
}

export interface StaffUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  services?: string[];
  hourlyRate?: number;
  permissions?: Partial<StaffPermissions>;
  status?: 'active' | 'inactive';
}

// Staff availability interface
export interface StaffAvailability {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0-6, 0 = Sunday
  startTime: string;   // HH:MM format
  endTime: string;     // HH:MM format
  timezone?: string;    // IANA timezone identifier
  isAvailable: boolean;
  breaks?: StaffBreak[];
}

export interface StaffBreak {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  description?: string;
}

// Staff schedule interface
export interface StaffSchedule {
  staffId: string;
  date: string; // YYYY-MM-DD
  shifts: StaffShift[];
  isAvailable: boolean;
  notes?: string;
}

export interface StaffShift {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  breakDuration?: number; // minutes
  services?: string[]; // Service IDs available during this shift
}

// Staff invitation interface
export interface StaffInvitation {
  id: string;
  businessId: string;
  email: string;
  role: StaffRole;
  permissions: StaffPermissions;
  token: string;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  acceptedAt?: string;
}

// Action-specific detail types
export type ActivityDetails = 
  | { action: 'booking_created'; bookingId: string; customerId: string }
  | { action: 'booking_updated'; bookingId: string; changes: string[] }
  | { action: 'booking_cancelled'; bookingId: string; reason?: string }
  | { action: 'settings_changed'; section: string; changes: string[] }
  | { action: 'login' | 'logout' };

// Staff activity/audit log
export interface StaffActivity {
  id: string;
  staffId: string;
  action: 'login' | 'logout' | 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'settings_changed';
  details?: ActivityDetails;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Default permission matrices by role
export const DEFAULT_PERMISSIONS: Record<'owner' | 'manager' | 'staff', StaffPermissions> = {
  owner: {
    manage_bookings: true,
    manage_settings: true,
    view_analytics: true,
    manage_staff: true,
    manage_customers: true,
    manage_services: true,
  },
  manager: {
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
  return member.role === 'manager' || member.role === 'owner';
}

export function hasPermission(member: StaffMember, permission: keyof StaffPermissions): boolean {
  return member.permissions[permission] === true;
}