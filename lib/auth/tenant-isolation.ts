import { createClient } from '@supabase/supabase-js';
import { ValidatedSession, UnauthorizedError } from './jwt-validation';

// Initialize Supabase client with service role for secure operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TenantContext {
  tenantId: string;
  businessId?: string;
  businessName?: string;
  isActive: boolean;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  features: string[];
}

export class TenantIsolationError extends Error {
  constructor(message: string, public code: string = 'TENANT_ISOLATION_ERROR') {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

/**
 * CRITICAL: Validates that the user has access to the requested tenant
 * This prevents cross-tenant data leakage - the most critical security vulnerability
 */
export async function validateTenantAccess(
  session: ValidatedSession,
  requestedTenantId: string,
  requestPath?: string
): Promise<TenantContext> {
  try {
    // SECURITY CRITICAL: Never trust client-provided tenant ID
    // Always validate against the JWT-provided tenant context
    if (session.tenantId !== requestedTenantId) {
      await logTenantViolation({
        type: 'CROSS_TENANT_ACCESS_ATTEMPT',
        userId: session.userId,
        email: session.email,
        authorizedTenant: session.tenantId,
        requestedTenant: requestedTenantId,
        requestPath: requestPath || 'unknown',
        timestamp: new Date()
      });
      
      throw new UnauthorizedError(
        'Access denied to requested tenant data',
        'TENANT_ACCESS_DENIED'
      );
    }

    // Get tenant context with business validation
    const { data: tenant, error: tenantError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        tenant_id,
        is_active,
        subscription_tier,
        features,
        owner_id,
        business_users (
          user_id,
          role,
          is_active
        )
      `)
      .eq('tenant_id', requestedTenantId)
      .eq('is_active', true)
      .single();

    if (tenantError || !tenant) {
      await logTenantViolation({
        type: 'INVALID_TENANT_ACCESS',
        userId: session.userId,
        email: session.email,
        requestedTenant: requestedTenantId,
        details: tenantError?.message || 'Tenant not found or inactive',
        requestPath: requestPath || 'unknown',
        timestamp: new Date()
      });
      
      throw new UnauthorizedError(
        'Requested tenant not found or inactive',
        'TENANT_NOT_FOUND'
      );
    }

    // Validate user has explicit access to this business
    const userHasAccess = tenant.owner_id === session.userId || 
      tenant.business_users?.some((bu: any) => 
        bu.user_id === session.userId && bu.is_active
      );

    if (!userHasAccess) {
      await logTenantViolation({
        type: 'UNAUTHORIZED_BUSINESS_ACCESS',
        userId: session.userId,
        email: session.email,
        requestedTenant: requestedTenantId,
        businessId: tenant.id,
        details: 'User not authorized for this business',
        requestPath: requestPath || 'unknown',
        timestamp: new Date()
      });
      
      throw new UnauthorizedError(
        'User not authorized to access this business',
        'BUSINESS_ACCESS_DENIED'
      );
    }

    // Log successful tenant access validation
    await logTenantAccess({
      type: 'SUCCESSFUL_TENANT_ACCESS',
      userId: session.userId,
      email: session.email,
      tenantId: requestedTenantId,
      businessId: tenant.id,
      requestPath: requestPath || 'unknown',
      timestamp: new Date()
    });

    return {
      tenantId: tenant.tenant_id,
      businessId: tenant.id,
      businessName: tenant.name,
      isActive: tenant.is_active,
      subscriptionTier: tenant.subscription_tier || 'free',
      features: tenant.features || []
    };

  } catch (error) {
    // Re-throw known errors, wrap unknown ones
    if (error instanceof UnauthorizedError || error instanceof TenantIsolationError) {
      throw error;
    }
    
    throw new TenantIsolationError(
      'Tenant validation failed',
      'TENANT_VALIDATION_ERROR'
    );
  }
}

/**
 * Validates business context access patterns similar to voice-bot implementation
 * Ensures user can only access data within their authorized business scope
 */
export async function validateBusinessContext(
  session: ValidatedSession,
  businessId?: string
): Promise<boolean> {
  if (!businessId) {
    return true; // No specific business context required
  }

  // Validate the business belongs to the user's tenant
  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, tenant_id, owner_id, business_users(user_id, is_active)')
    .eq('id', businessId)
    .eq('tenant_id', session.tenantId) // Critical: ensure same tenant
    .eq('is_active', true)
    .single();

  if (error || !business) {
    return false;
  }

  // Check if user has access to this specific business
  const hasAccess = business.owner_id === session.userId ||
    business.business_users?.some((bu: any) => 
      bu.user_id === session.userId && bu.is_active
    );

  return hasAccess;
}

/**
 * Creates tenant-scoped database query filters
 * CRITICAL: Always use this to scope database queries to the user's tenant
 */
export function createTenantScopedQuery<T>(
  query: any,
  session: ValidatedSession,
  tenantColumn: string = 'tenant_id'
): any {
  return query.eq(tenantColumn, session.tenantId);
}

/**
 * Creates business-scoped database query filters
 * Use this when queries need to be scoped to a specific business within a tenant
 */
export function createBusinessScopedQuery<T>(
  query: any,
  session: ValidatedSession,
  businessId?: string,
  businessColumn: string = 'business_id'
): any {
  let scopedQuery = createTenantScopedQuery(query, session);
  
  if (businessId) {
    scopedQuery = scopedQuery.eq(businessColumn, businessId);
  } else if (session.businessId) {
    scopedQuery = scopedQuery.eq(businessColumn, session.businessId);
  }
  
  return scopedQuery;
}

/**
 * Validates that a resource belongs to the user's tenant
 * Use this before allowing any resource access or modification
 */
export async function validateResourceOwnership(
  session: ValidatedSession,
  tableName: string,
  resourceId: string,
  tenantColumn: string = 'tenant_id',
  businessColumn?: string
): Promise<boolean> {
  try {
    const selectFields = businessColumn 
      ? `id, ${tenantColumn}, ${businessColumn}`
      : `id, ${tenantColumn}`;

    const { data: resource, error } = await supabase
      .from(tableName)
      .select(selectFields)
      .eq('id', resourceId)
      .single();

    if (error || !resource) {
      return false;
    }

    // Check tenant ownership
    if ((resource as any)[tenantColumn] !== session.tenantId) {
      await logTenantViolation({
        type: 'CROSS_TENANT_RESOURCE_ACCESS',
        userId: session.userId,
        email: session.email,
        authorizedTenant: session.tenantId,
        requestedTenant: (resource as any)[tenantColumn],
        details: `Attempted access to ${tableName}:${resourceId}`,
        timestamp: new Date()
      });
      return false;
    }

    // Check business ownership if business column exists
    if (businessColumn && (resource as any)[businessColumn]) {
      const hasBusinessAccess = await validateBusinessContext(
        session,
        (resource as any)[businessColumn]
      );
      if (!hasBusinessAccess) {
        return false;
      }
    }

    return true;

  } catch (error) {
    console.error('Error validating resource ownership:', error);
    return false;
  }
}

/**
 * Gets all businesses the user has access to within their tenant
 */
export async function getUserAccessibleBusinesses(
  session: ValidatedSession
): Promise<Array<{ id: string; name: string; role: string }>> {
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      owner_id,
      business_users (
        user_id,
        role,
        is_active
      )
    `)
    .eq('tenant_id', session.tenantId)
    .eq('is_active', true);

  if (error || !businesses) {
    return [];
  }

  return businesses
    .filter(business => {
      // User is owner or has active business user record
      return business.owner_id === session.userId ||
        business.business_users?.some((bu: any) => 
          bu.user_id === session.userId && bu.is_active
        );
    })
    .map(business => ({
      id: business.id,
      name: business.name,
      role: business.owner_id === session.userId 
        ? 'owner' 
        : business.business_users?.find((bu: any) => 
            bu.user_id === session.userId
          )?.role || 'member'
    }));
}

/**
 * Logs tenant access violations for security monitoring
 */
async function logTenantViolation(violation: {
  type: string;
  userId: string;
  email: string;
  authorizedTenant?: string;
  requestedTenant?: string;
  businessId?: string;
  details?: string;
  requestPath?: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: violation.type,
        user_id: violation.userId,
        email: violation.email,
        tenant_id: violation.authorizedTenant,
        details: JSON.stringify({
          authorizedTenant: violation.authorizedTenant,
          requestedTenant: violation.requestedTenant,
          businessId: violation.businessId,
          requestPath: violation.requestPath,
          details: violation.details
        }),
        severity: 'HIGH', // Tenant violations are always high severity
        created_at: violation.timestamp.toISOString()
      });

    // Also log to console for immediate alerting
    console.error('SECURITY ALERT - Tenant Isolation Violation:', violation);

  } catch (error) {
    console.error('Failed to log tenant violation:', error);
  }
}

/**
 * Logs successful tenant access for audit trails
 */
async function logTenantAccess(access: {
  type: string;
  userId: string;
  email: string;
  tenantId: string;
  businessId?: string;
  requestPath: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: access.type,
        user_id: access.userId,
        email: access.email,
        tenant_id: access.tenantId,
        business_id: access.businessId,
        details: JSON.stringify({
          requestPath: access.requestPath
        }),
        severity: 'INFO',
        created_at: access.timestamp.toISOString()
      });

  } catch (error) {
    // Don't fail requests due to logging errors
    console.error('Failed to log tenant access:', error);
  }
}