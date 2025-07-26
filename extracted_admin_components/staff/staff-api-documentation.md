# Staff Management API Documentation

## Overview
The staff management functionality provides endpoints for managing team members, their roles, permissions, and availability in the voice bot admin system.

## API Endpoints

### 1. Get Staff Members
```typescript
apiClient.getStaff(businessId: string, activeOnly: boolean = true)
```
- **Method**: GET
- **Endpoint**: `/api/v2/dashboard/staff?business_id=${businessId}&active_only=${activeOnly}`
- **Description**: Retrieves all staff members for a business
- **Parameters**:
  - `businessId`: The ID of the business
  - `activeOnly`: Whether to return only active staff members (default: true)
- **Response**: Object containing array of staff members

### 2. Add Staff Member
```typescript
apiClient.addStaffMember(businessId: string, staffData: StaffCreateRequest)
```
- **Method**: POST
- **Endpoint**: `/api/v2/dashboard/staff?business_id=${businessId}`
- **Description**: Adds a new staff member to the business
- **Request Body**:
  ```typescript
  {
    name: string;
    email?: string;
    phone?: string;
    role: 'owner' | 'manager' | 'stylist' | 'assistant';
    services?: string[];
    hourly_rate?: number;
    active?: boolean;
  }
  ```

### 3. Update Staff Member
```typescript
apiClient.updateStaffMember(businessId: string, staffId: string, updates: StaffUpdateRequest)
```
- **Method**: PATCH
- **Endpoint**: `/api/v2/dashboard/staff/${staffId}?business_id=${businessId}`
- **Description**: Updates an existing staff member's information
- **Request Body**:
  ```typescript
  {
    name?: string;
    email?: string;
    phone?: string;
    role?: 'owner' | 'manager' | 'stylist' | 'assistant';
    services?: string[];
    hourly_rate?: number;
    active?: boolean;
  }
  ```

### 4. Remove Staff Member
```typescript
apiClient.removeStaffMember(businessId: string, staffId: string)
```
- **Method**: DELETE
- **Endpoint**: `/api/v2/dashboard/staff/${staffId}?business_id=${businessId}`
- **Description**: Removes a staff member from the business

### 5. Get Staff Availability
```typescript
apiClient.getStaffAvailability(businessId: string, staffId: string)
```
- **Method**: GET
- **Endpoint**: `/api/v2/dashboard/staff/${staffId}/availability?business_id=${businessId}`
- **Description**: Retrieves availability schedule for a specific staff member

### 6. Update Staff Availability
```typescript
apiClient.updateStaffAvailability(businessId: string, staffId: string, availability: Record<string, any>)
```
- **Method**: PATCH
- **Endpoint**: `/api/v2/dashboard/staff/${staffId}/availability?business_id=${businessId}`
- **Description**: Updates availability schedule for a staff member
- **Request Body**:
  ```typescript
  {
    availability: Record<string, any>
  }
  ```

## Key Features

### Role-Based Permissions
The system supports four main roles:
1. **Owner**: Full access to all features
2. **Manager/Admin**: Access to bookings, settings, and analytics
3. **Stylist/Staff**: Access to bookings only
4. **Assistant**: Basic booking access

### Permission Matrix
| Permission | Owner | Admin | Staff |
|------------|-------|-------|-------|
| Manage Bookings | ✓ | ✓ | ✓ |
| View Analytics | ✓ | ✓ | - |
| Manage Settings | ✓ | ✓ | - |
| Manage Staff | ✓ | - | - |

### Security Features
- Two-Factor Authentication option
- Session timeout configuration
- Email notifications for staff changes
- Role-based access control

## Component Structure
The staff management functionality includes:
- Staff listing with status badges
- Add/invite staff dialog
- Edit staff information dialog
- Permission matrix display
- Security settings configuration