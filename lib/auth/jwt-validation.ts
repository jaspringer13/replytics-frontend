import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for secure operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ValidatedSession {
  userId: string;
  email: string;
  tenantId: string;
  businessId?: string;
  permissions: string[];
  roles: string[];
  sessionId: string;
  expiresAt: Date;
  isActive: boolean;
}

export class AuthenticationError extends Error {
  constructor(message: string, public code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string, public code: string = 'UNAUTHORIZED') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Validates JWT token from NextAuth and enriches with business context
 * This is the primary authentication validation function for all API routes
 */
export async function validateAuthentication(request: NextRequest): Promise<ValidatedSession> {
  try {
    // Extract and validate NextAuth JWT token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      throw new AuthenticationError('No valid authentication token found', 'NO_TOKEN');
    }

    // Validate token expiration
    if (token.exp && (token.exp as number) < Date.now() / 1000) {
      throw new AuthenticationError('Authentication token has expired', 'TOKEN_EXPIRED');
    }

    // Validate required token fields
    if (!token.id || !token.email) {
      throw new AuthenticationError('Invalid token structure - missing required fields', 'INVALID_TOKEN');
    }

    // Get user from database with business context
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        tenant_id,
        business_id,
        is_active,
        last_login_at,
        user_roles (
          role_id,
          roles (
            name,
            permissions
          )
        ),
        businesses (
          id,
          name,
          is_active
        )
      `)
      .eq('id', token.id)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      await logSecurityEvent({
        type: 'INVALID_USER_ACCESS',
        userId: token.id as string,
        email: token.email as string,
        details: userError?.message || 'User not found or inactive',
        timestamp: new Date(),
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      
      throw new AuthenticationError('User account not found or inactive', 'USER_INACTIVE');
    }

    // Validate business context if business_id exists
    if (user.business_id && (!user.businesses || !(user.businesses as any).is_active)) {
      throw new AuthenticationError('Associated business is inactive', 'BUSINESS_INACTIVE');
    }

    // Extract roles and permissions
    const roles = user.user_roles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
    const permissions = user.user_roles?.flatMap((ur: any) => 
      ur.roles?.permissions || []
    ).filter(Boolean) || [];

    // Update last activity timestamp
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Log successful authentication
    await logSecurityEvent({
      type: 'SUCCESSFUL_AUTHENTICATION',
      userId: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      businessId: user.business_id,
      timestamp: new Date(),
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      businessId: user.business_id,
      permissions,
      roles,
      sessionId: token.jti as string || `session_${Date.now()}`,
      expiresAt: new Date((token.exp as number) * 1000),
      isActive: user.is_active
    };

  } catch (error) {
    // Log authentication failure
    await logSecurityEvent({
      type: 'AUTHENTICATION_FAILURE',
      details: error instanceof Error ? error.message : 'Unknown authentication error',
      timestamp: new Date(),
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Re-throw known errors, wrap unknown ones
    if (error instanceof AuthenticationError || error instanceof UnauthorizedError) {
      throw error;
    }
    
    throw new AuthenticationError('Authentication validation failed', 'VALIDATION_ERROR');
  }
}

/**
 * Validates user session is still active and not compromised
 */
export async function validateSessionSecurity(session: ValidatedSession, request: NextRequest): Promise<void> {
  // Check for concurrent session limits (if implemented)
  const { data: activeSessions, error } = await supabase
    .from('user_sessions')
    .select('id, created_at, ip_address, user_agent')
    .eq('user_id', session.userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error checking active sessions:', error);
    return; // Don't fail auth for session check errors
  }

  // Log suspicious activity if too many concurrent sessions
  const maxConcurrentSessions = 5;
  if (activeSessions && activeSessions.length > maxConcurrentSessions) {
    await logSecurityEvent({
      type: 'SUSPICIOUS_CONCURRENT_SESSIONS',
      userId: session.userId,
      email: session.email,
      details: `User has ${activeSessions.length} concurrent sessions (max: ${maxConcurrentSessions})`,
      timestamp: new Date(),
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    });
  }

  // Check for IP address changes (basic geo-location security)
  const currentIP = getClientIP(request);
  const recentSessions = activeSessions?.slice(0, 3) || [];
  const hasIPMismatch = recentSessions.length > 0 && 
    !recentSessions.some(s => s.ip_address === currentIP);

  if (hasIPMismatch && recentSessions.length > 0) {
    await logSecurityEvent({
      type: 'IP_ADDRESS_CHANGE',
      userId: session.userId,
      email: session.email,
      details: `IP changed from ${recentSessions[0].ip_address} to ${currentIP}`,
      timestamp: new Date(),
      ipAddress: currentIP,
      userAgent: request.headers.get('user-agent') || 'unknown'
    });
  }
}

/**
 * Logs security events for monitoring and audit trails
 */
async function logSecurityEvent(event: {
  type: string;
  userId?: string;
  email?: string;
  tenantId?: string;
  businessId?: string;
  details?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}): Promise<void> {
  try {
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: event.type,
        user_id: event.userId,
        email: event.email,
        tenant_id: event.tenantId,
        business_id: event.businessId,
        details: event.details,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        created_at: event.timestamp.toISOString()
      });
  } catch (error) {
    // Don't fail authentication due to logging errors, but log to console
    console.error('Failed to log security event:', error);
  }
}

/**
 * Extracts client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  return 'unknown';
}

/**
 * Helper function to check if a route should be protected
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedPatterns = [
    '/api/v2/dashboard',
    '/dashboard',
    '/api/voice/settings',
    '/api/performance'
  ];
  
  return protectedPatterns.some(pattern => pathname.startsWith(pattern));
}

/**
 * Helper function to check if a route is public (no auth required)
 */
export function isPublicRoute(pathname: string): boolean {
  const publicPatterns = [
    '/api/auth',
    '/auth',
    '/_next',
    '/favicon.ico',
    '/public',
    '/',
    '/about',
    '/contact',
    '/pricing'
  ];
  
  return publicPatterns.some(pattern => pathname.startsWith(pattern));
}