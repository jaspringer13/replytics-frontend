/**
 * API Authentication Middleware
 * 
 * Production-grade authentication for analytics API endpoints.
 * Ported from voice-bot's authentication patterns with NextAuth integration.
 */

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthenticatedUser {
  id: string;
  email: string;
  businessId: string;
  tenantId: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface AuthenticationResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Validates JWT token and returns authenticated user with business context
 * Based on voice-bot's get_dashboard_user_with_business_access pattern
 */
export async function validateApiAuthentication(request: NextRequest): Promise<AuthenticationResult> {
  try {
    // Extract JWT token from NextAuth
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
        statusCode: 401
      };
    }

    // Validate token has required fields
    if (!token.id || !token.email) {
      return {
        success: false,
        error: 'Invalid token: missing user information',
        statusCode: 401
      };
    }

    // Get business context from tenant ID or business ID
    const businessId = token.businessId || token.tenantId;
    if (!businessId) {
      return {
        success: false,
        error: 'No business context available',
        statusCode: 403
      };
    }

    // Validate business access in Supabase
    const { data: businessAccess, error: businessError } = await supabase
      .from('user_business_access')
      .select('role, business_id')
      .eq('user_id', token.id)
      .eq('business_id', businessId)
      .single();

    if (businessError || !businessAccess) {
      return {
        success: false,
        error: 'Unauthorized: No access to requested business',
        statusCode: 403
      };
    }

    // Return authenticated user with business context
    const authenticatedUser: AuthenticatedUser = {
      id: token.id as string,
      email: token.email as string,
      businessId: businessId as string,
      tenantId: businessId as string, // For compatibility
      role: businessAccess.role
    };

    return {
      success: true,
      user: authenticatedUser
    };

  } catch (error) {
    console.error('[Auth Middleware] Authentication validation error:', error);
    return {
      success: false,
      error: 'Internal authentication error',
      statusCode: 500
    };
  }
}

/**
 * Higher-order function to wrap API handlers with authentication
 * Usage: export const GET = withAuth(async (request, { user }) => { ... })
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, context: { user: AuthenticatedUser }, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const authResult = await validateApiAuthentication(request);
    
    if (!authResult.success || !authResult.user) {
      return new Response(
        JSON.stringify({ 
          error: authResult.error || 'Authentication failed',
          success: false 
        }),
        { 
          status: authResult.statusCode || 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Call the original handler with authenticated user context
    return handler(request, { user: authResult.user }, ...args);
  };
}

/**
 * Validates business ID format and converts external_id to UUID if needed
 * Ported from voice-bot's business ID resolution patterns
 */
export async function validateAndResolveBusinessId(businessId: string): Promise<string | null> {
  try {
    // If already UUID format, validate it exists
    if (businessId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('id', businessId)
        .single();
      
      return error ? null : businessId;
    }

    // Convert external_id to UUID
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('external_id', businessId)
      .single();

    return error ? null : data.id;

  } catch (error) {
    console.error('[Auth Middleware] Business ID resolution error:', error);
    return null;
  }
}

/**
 * Permission levels for different API operations
 */
export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

/**
 * Check if user has required permission level for business operations
 */
export function hasPermission(userRole: string, requiredLevel: PermissionLevel): boolean {
  const rolePermissions = {
    'staff': [PermissionLevel.READ],
    'manager': [PermissionLevel.READ, PermissionLevel.WRITE],
    'owner': [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.ADMIN]
  };

  return rolePermissions[userRole as keyof typeof rolePermissions]?.includes(requiredLevel) || false;
}

/**
 * Extract business ID from request headers or URL params
 * Compatible with existing X-Tenant-ID header pattern
 */
export function extractBusinessId(request: NextRequest): string | null {
  // Check X-Tenant-ID header (existing pattern)
  const tenantId = request.headers.get('X-Tenant-ID');
  if (tenantId) return tenantId;

  // Check business_id query parameter
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('business_id');
  if (businessId) return businessId;

  return null;
}