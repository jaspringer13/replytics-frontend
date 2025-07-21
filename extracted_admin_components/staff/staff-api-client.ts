/**
 * Staff Management API Client Methods
 * Extracted from the main API client for staff-related operations
 */

import { StaffCreateRequest, StaffUpdateRequest } from './staff-types';

// Staff Management API Methods
export class StaffAPIClient {
  private baseURL: string;
  private getAuthHeaders: () => Promise<HeadersInit>;

  constructor(baseURL: string, getAuthHeaders: () => Promise<HeadersInit>) {
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `${errorMessage} - ${errorData.detail || errorData.message || JSON.stringify(errorData)}`;
      } catch {
        const errorText = await response.text();
        errorMessage = `${errorMessage} ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Get all staff members for a business
  async getStaff(businessId: string, activeOnly = true) {
    return this.request(`/api/v2/dashboard/staff?business_id=${businessId}&active_only=${activeOnly}`);
  }

  // Add a new staff member
  async addStaffMember(businessId: string, staffData: StaffCreateRequest) {
    return this.request(`/api/v2/dashboard/staff?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  // Update an existing staff member
  async updateStaffMember(businessId: string, staffId: string, updates: StaffUpdateRequest) {
    return this.request(`/api/v2/dashboard/staff/${staffId}?business_id=${businessId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Remove a staff member
  async removeStaffMember(businessId: string, staffId: string) {
    return this.request(`/api/v2/dashboard/staff/${staffId}?business_id=${businessId}`, {
      method: 'DELETE',
    });
  }

  // Get staff availability schedule
  async getStaffAvailability(businessId: string, staffId: string) {
    return this.request(`/api/v2/dashboard/staff/${staffId}/availability?business_id=${businessId}`);
  }

  // Update staff availability schedule
  async updateStaffAvailability(businessId: string, staffId: string, availability: Record<string, any>) {
    return this.request(`/api/v2/dashboard/staff/${staffId}/availability?business_id=${businessId}`, {
      method: 'PATCH',
      body: JSON.stringify({ availability }),
    });
  }
}

// Example usage:
/*
const apiClient = new StaffAPIClient(
  'http://localhost:8000',
  async () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  })
);

// Get all staff
const staff = await apiClient.getStaff('business-123');

// Add new staff member
const newStaff = await apiClient.addStaffMember('business-123', {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'stylist',
  active: true,
});

// Update staff availability
await apiClient.updateStaffAvailability('business-123', 'staff-456', {
  monday: { start: '09:00', end: '17:00', is_available: true },
  tuesday: { start: '09:00', end: '17:00', is_available: true },
  // ... other days
});
*/