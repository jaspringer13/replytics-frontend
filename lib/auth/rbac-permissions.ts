import { createClient } from '@supabase/supabase-js';
import { ValidatedSession, UnauthorizedError } from './jwt-validation';

// Initialize Supabase client with service role for secure operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define comprehensive permission system
export enum Permission {
  // Dashboard Analytics
  VIEW_ANALYTICS = 'analytics:view',
  EXPORT_ANALYTICS = 'analytics:export',
  VIEW_DETAILED_ANALYTICS = 'analytics:view_detailed',
  
  // Customer Management
  VIEW_CUSTOMERS = 'customers:view',
  CREATE_CUSTOMERS = 'customers:create',
  UPDATE_CUSTOMERS = 'customers:update',
  DELETE_CUSTOMERS = 'customers:delete',
  EXPORT_CUSTOMERS = 'customers:export',
  
  // Appointment Management
  VIEW_APPOINTMENTS = 'appointments:view',
  CREATE_APPOINTMENTS = 'appointments:create',
  UPDATE_APPOINTMENTS = 'appointments:update',
  DELETE_APPOINTMENTS = 'appointments:delete',
  MANAGE_SCHEDULING = 'appointments:manage_scheduling',
  
  // Service Management
  VIEW_SERVICES = 'services:view',
  CREATE_SERVICES = 'services:create',
  UPDATE_SERVICES = 'services:update',
  DELETE_SERVICES = 'services:delete',
  REORDER_SERVICES = 'services:reorder',
  
  // Business Settings
  VIEW_BUSINESS_SETTINGS = 'business:view_settings',
  UPDATE_BUSINESS_SETTINGS = 'business:update_settings',
  MANAGE_BUSINESS_HOURS = 'business:manage_hours',
  MANAGE_VOICE_SETTINGS = 'business:manage_voice',
  MANAGE_CONVERSATION_RULES = 'business:manage_conversation_rules',
  
  // User Management
  VIEW_USERS = 'users:view',
  INVITE_USERS = 'users:invite',
  UPDATE_USER_ROLES = 'users:update_roles',
  DELETE_USERS = 'users:delete',
  
  // System Administration
  VIEW_AUDIT_LOGS = 'system:view_audit_logs',
  MANAGE_INTEGRATIONS = 'system:manage_integrations',
  ACCESS_API = 'system:access_api',
  
  // Billing and Subscriptions
  VIEW_BILLING = 'billing:view',
  MANAGE_BILLING = 'billing:manage',
  VIEW_USAGE = 'billing:view_usage'
}

// Define role hierarchy
export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin', 
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  VIEWER = 'viewer'
}

// Role-based permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    // Full access to everything
    ...Object.values(Permission)
  ],
  
  [Role.ADMIN]: [
    // All permissions except some system-level ones
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.UPDATE_CUSTOMERS,
    Permission.DELETE_CUSTOMERS,
    Permission.EXPORT_CUSTOMERS,
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.UPDATE_APPOINTMENTS,
    Permission.DELETE_APPOINTMENTS,
    Permission.MANAGE_SCHEDULING,
    Permission.VIEW_SERVICES,
    Permission.CREATE_SERVICES,
    Permission.UPDATE_SERVICES,
    Permission.DELETE_SERVICES,
    Permission.REORDER_SERVICES,
    Permission.VIEW_BUSINESS_SETTINGS,
    Permission.UPDATE_BUSINESS_SETTINGS,
    Permission.MANAGE_BUSINESS_HOURS,
    Permission.MANAGE_VOICE_SETTINGS,
    Permission.MANAGE_CONVERSATION_RULES,
    Permission.VIEW_USERS,
    Permission.INVITE_USERS,
    Permission.UPDATE_USER_ROLES,
    Permission.ACCESS_API,
    Permission.VIEW_BILLING,
    Permission.VIEW_USAGE
  ],
  
  [Role.MANAGER]: [
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.UPDATE_CUSTOMERS,
    Permission.EXPORT_CUSTOMERS,
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.UPDATE_APPOINTMENTS,
    Permission.MANAGE_SCHEDULING,
    Permission.VIEW_SERVICES,
    Permission.CREATE_SERVICES,
    Permission.UPDATE_SERVICES,
    Permission.REORDER_SERVICES,
    Permission.VIEW_BUSINESS_SETTINGS,
    Permission.MANAGE_BUSINESS_HOURS,
    Permission.VIEW_USERS,
    Permission.ACCESS_API
  ],
  
  [Role.EMPLOYEE]: [
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.UPDATE_CUSTOMERS,
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.UPDATE_APPOINTMENTS,
    Permission.VIEW_SERVICES,
    Permission.VIEW_BUSINESS_SETTINGS
  ],
  
  [Role.VIEWER]: [
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_APPOINTMENTS,
    Permission.VIEW_SERVICES,
    Permission.VIEW_BUSINESS_SETTINGS
  ]
};

// Route-based permission requirements
const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/api/v2/dashboard/analytics': [Permission.VIEW_ANALYTICS],
  '/api/v2/dashboard/analytics/overview': [Permission.VIEW_ANALYTICS],
  '/api/v2/dashboard/customers': [Permission.VIEW_CUSTOMERS],
  '/api/v2/dashboard/services': [Permission.VIEW_SERVICES],
  '/api/v2/dashboard/services/reorder': [Permission.REORDER_SERVICES],
  '/api/v2/dashboard/business/profile': [Permission.VIEW_BUSINESS_SETTINGS],
  '/api/v2/dashboard/business/voice-settings': [Permission.MANAGE_VOICE_SETTINGS],
  '/api/v2/dashboard/business/conversation-rules': [Permission.MANAGE_CONVERSATION_RULES],
  '/api/v2/dashboard/business/hours': [Permission.MANAGE_BUSINESS_HOURS],
  '/api/voice/settings': [Permission.MANAGE_VOICE_SETTINGS],
  '/api/performance': [Permission.VIEW_DETAILED_ANALYTICS]
};

export interface UserPermissions {
  userId: string;
  roles: Role[];
  permissions: Permission[];
  businessRole?: Role;
  isOwner: boolean;
}

/**
 * Gets comprehensive user permissions including role-based and explicit permissions
 */
export async function getUserPermissions(session: ValidatedSession): Promise<UserPermissions> {
  try {
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          name,
          permissions,
          level
        ),
        business_id,
        businesses!inner (
          owner_id,
          tenant_id
        )
      `)
      .eq('user_id', session.userId)
      .eq('is_active', true)
      .eq('businesses.tenant_id', session.tenantId); // Ensure tenant isolation

    if (error) {
      console.error('Error fetching user roles:', error);
      return {
        userId: session.userId,
        roles: [Role.VIEWER], // Default to minimal permissions
        permissions: ROLE_PERMISSIONS[Role.VIEWER],
        isOwner: false
      };
    }

    // Extract roles and check if user is business owner
    const roles: Role[] = [];
    const explicitPermissions: Permission[] = [];
    let isOwner = false;
    let businessRole: Role | undefined;

    for (const userRole of userRoles || []) {
      const roleName = (userRole.roles as any)?.name as Role;
      if (roleName && Object.values(Role).includes(roleName)) {
        roles.push(roleName);
        
        // Add role-based permissions
        if (ROLE_PERMISSIONS[roleName]) {
          explicitPermissions.push(...ROLE_PERMISSIONS[roleName]);
        }
        
        // Check if user is owner of any business
        if ((userRole.businesses as any)?.owner_id === session.userId) {
          isOwner = true;
          businessRole = Role.OWNER;
        } else if (!businessRole || getRoleLevel(roleName) > getRoleLevel(businessRole)) {
          businessRole = roleName;
        }
      }
      
      // Add explicit permissions from database
      const rolePermissions = (userRole.roles as any)?.permissions || [];
      explicitPermissions.push(...rolePermissions);
    }

    // If user is owner but doesn't have owner role, add it
    if (isOwner && !roles.includes(Role.OWNER)) {
      roles.push(Role.OWNER);
      explicitPermissions.push(...ROLE_PERMISSIONS[Role.OWNER]);
    }

    // Remove duplicates and ensure viewer role as minimum
    const uniqueRoles = roles.length > 0 ? Array.from(new Set(roles)) : [Role.VIEWER];
    const uniquePermissions = Array.from(new Set(explicitPermissions));

    return {
      userId: session.userId,
      roles: uniqueRoles,
      permissions: uniquePermissions.length > 0 ? uniquePermissions : ROLE_PERMISSIONS[Role.VIEWER],
      businessRole: businessRole || Role.VIEWER,
      isOwner
    };

  } catch (error) {
    console.error('Error getting user permissions:', error);
    
    // Return minimal permissions on error
    return {
      userId: session.userId,
      roles: [Role.VIEWER],
      permissions: ROLE_PERMISSIONS[Role.VIEWER],
      isOwner: false
    };
  }
}

/**
 * Validates that user has required permissions for a specific action
 */
export async function validatePermissions(
  session: ValidatedSession,
  requiredPermissions: Permission[]
): Promise<void> {
  if (requiredPermissions.length === 0) {
    return; // No permissions required
  }

  const userPermissions = await getUserPermissions(session);
  
  // Check if user has all required permissions
  const hasAllPermissions = requiredPermissions.every(required => 
    userPermissions.permissions.includes(required)
  );

  if (!hasAllPermissions) {
    const missingPermissions = requiredPermissions.filter(required => 
      !userPermissions.permissions.includes(required)
    );

    // Log permission violation
    await logPermissionViolation({
      userId: session.userId,
      email: session.email,
      tenantId: session.tenantId,
      requiredPermissions,
      userPermissions: userPermissions.permissions,
      missingPermissions,
      timestamp: new Date()
    });

    throw new UnauthorizedError(
      `Insufficient permissions. Missing: ${missingPermissions.join(', ')}`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }
}

/**
 * Gets required permissions for a specific route
 */
export function getRoutePermissions(routePath: string): Permission[] {
  // Check exact match first
  if (ROUTE_PERMISSIONS[routePath]) {
    return ROUTE_PERMISSIONS[routePath];
  }
  
  // Check for pattern matches
  for (const [pattern, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (routePath.startsWith(pattern)) {
      return permissions;
    }
  }
  
  // Default: no specific permissions required
  return [];
}

/**
 * Validates user has permission to perform specific resource actions
 */
export async function validateResourcePermission(
  session: ValidatedSession,
  resource: string,
  action: 'view' | 'create' | 'update' | 'delete',
  resourceId?: string
): Promise<void> {
  const permissionMap: Record<string, Record<string, Permission>> = {
    customers: {
      view: Permission.VIEW_CUSTOMERS,
      create: Permission.CREATE_CUSTOMERS,
      update: Permission.UPDATE_CUSTOMERS,
      delete: Permission.DELETE_CUSTOMERS
    },
    appointments: {
      view: Permission.VIEW_APPOINTMENTS,
      create: Permission.CREATE_APPOINTMENTS,
      update: Permission.UPDATE_APPOINTMENTS,
      delete: Permission.DELETE_APPOINTMENTS
    },
    services: {
      view: Permission.VIEW_SERVICES,
      create: Permission.CREATE_SERVICES,
      update: Permission.UPDATE_SERVICES,
      delete: Permission.DELETE_SERVICES
    },
    business: {
      view: Permission.VIEW_BUSINESS_SETTINGS,
      update: Permission.UPDATE_BUSINESS_SETTINGS
    }
  };

  const requiredPermission = permissionMap[resource]?.[action];
  if (!requiredPermission) {
    return; // No specific permission required
  }

  await validatePermissions(session, [requiredPermission]);
}

/**
 * Checks if user has any of the specified roles
 */
export async function hasRole(session: ValidatedSession, roles: Role[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(session);
  return roles.some(role => userPermissions.roles.includes(role));
}

/**
 * Checks if user has minimum role level
 */
export async function hasMinimumRole(session: ValidatedSession, minimumRole: Role): Promise<boolean> {
  const userPermissions = await getUserPermissions(session);
  const minimumLevel = getRoleLevel(minimumRole);
  
  return userPermissions.roles.some(role => getRoleLevel(role) >= minimumLevel);
}

/**
 * Gets numerical level for role comparison
 */
function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    [Role.VIEWER]: 1,
    [Role.EMPLOYEE]: 2,
    [Role.MANAGER]: 3,
    [Role.ADMIN]: 4,
    [Role.OWNER]: 5
  };
  
  return levels[role] || 0;
}

/**
 * Creates permission-based query filters
 */
export async function createPermissionScopedQuery(
  query: any,
  session: ValidatedSession,
  requiredPermission: Permission
): Promise<any> {
  await validatePermissions(session, [requiredPermission]);
  return query;
}

/**
 * Logs permission violations for security monitoring
 */
async function logPermissionViolation(violation: {
  userId: string;
  email: string;
  tenantId: string;
  requiredPermissions: Permission[];
  userPermissions: Permission[];
  missingPermissions: Permission[];
  timestamp: Date;
}): Promise<void> {
  try {
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: 'PERMISSION_VIOLATION',
        user_id: violation.userId,
        email: violation.email,
        tenant_id: violation.tenantId,
        details: JSON.stringify({
          requiredPermissions: violation.requiredPermissions,
          userPermissions: violation.userPermissions,
          missingPermissions: violation.missingPermissions
        }),
        severity: 'MEDIUM',
        created_at: violation.timestamp.toISOString()
      });

  } catch (error) {
    console.error('Failed to log permission violation:', error);
  }
}

/**
 * Helper to check if user can access admin features
 */
export async function canAccessAdminFeatures(session: ValidatedSession): Promise<boolean> {
  return await hasMinimumRole(session, Role.ADMIN);
}

/**
 * Helper to check if user can manage users
 */
export async function canManageUsers(session: ValidatedSession): Promise<boolean> {
  const userPermissions = await getUserPermissions(session);
  return userPermissions.permissions.includes(Permission.INVITE_USERS) ||
         userPermissions.permissions.includes(Permission.UPDATE_USER_ROLES);
}

/**
 * Helper to check if user can access billing information
 */
export async function canAccessBilling(session: ValidatedSession): Promise<boolean> {
  const userPermissions = await getUserPermissions(session);
  return userPermissions.permissions.includes(Permission.VIEW_BILLING) ||
         userPermissions.isOwner;
}