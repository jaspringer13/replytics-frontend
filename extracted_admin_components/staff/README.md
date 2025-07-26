# Staff Management Functionality - Extracted Components

## Overview
This directory contains the extracted staff management functionality from the voice bot admin system. The staff management system allows businesses to manage their team members, assign roles, set permissions, and track staff availability.

## Extracted Files

### 1. StaffManagementTab.tsx
The main React component that provides the complete staff management interface, including:
- Staff member listing with role icons and status badges
- Add/invite new staff members
- Edit existing staff member information
- Remove staff members
- Permission matrix display
- Security settings configuration

### 2. staff-types.ts
TypeScript interfaces and types for staff management:
- `StaffMember` interface - Main staff member data structure
- `StaffRole` type - Available roles (owner, manager, stylist, assistant)
- `StaffCreateRequest` & `StaffUpdateRequest` - API request interfaces
- `StaffAvailability` - Staff scheduling availability interface
- `PermissionMatrix` - Role-based permissions structure
- `DEFAULT_PERMISSIONS` - Default permission settings by role

### 3. staff-api-client.ts
Extracted API client methods for staff operations:
- `getStaff()` - Retrieve all staff members
- `addStaffMember()` - Add new staff member
- `updateStaffMember()` - Update staff information
- `removeStaffMember()` - Remove staff member
- `getStaffAvailability()` - Get staff availability schedule
- `updateStaffAvailability()` - Update staff availability

### 4. staff-api-documentation.md
Complete API documentation including:
- Endpoint descriptions
- Request/response formats
- Permission matrix details
- Security features overview

## Key Features

### Role Management
- **Owner**: Full system access
- **Manager/Admin**: Access to bookings, settings, and analytics
- **Stylist/Staff**: Booking management only
- **Assistant**: Basic booking access

### Security Features
- Two-factor authentication support
- Session timeout configuration
- Email notifications for staff changes
- Role-based access control (RBAC)

### Staff Operations
- Add/invite staff via email
- Edit staff details (name, email, phone, role)
- Activate/deactivate staff members
- View staff status (active, invited, inactive)
- Track last login times

## Staff Availability System
While the current implementation includes API endpoints for staff availability management (`getStaffAvailability` and `updateStaffAvailability`), the UI components for scheduling are not yet implemented in the StaffManagementTab. The API infrastructure is in place to support:
- Daily availability schedules
- Break time management
- Service-specific staff assignments

## Integration Points
The staff management system integrates with:
- Authentication system (Supabase)
- Business configuration
- Service management (staff can be assigned to specific services)
- Analytics (tracking staff performance)

## Future Enhancements
Based on the API structure, potential enhancements could include:
- Visual staff availability scheduler
- Staff performance metrics
- Shift management
- Commission tracking (hourly_rate field exists)
- Service-specific staff assignments UI