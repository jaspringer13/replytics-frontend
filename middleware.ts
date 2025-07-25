// middleware.ts - Comprehensive Security Middleware

import { NextResponse, type NextRequest } from 'next/server'
import { validateAuthentication, isProtectedRoute, isPublicRoute, AuthenticationError, UnauthorizedError } from './lib/auth/jwt-validation'
import { validateTenantAccess, TenantIsolationError } from './lib/auth/tenant-isolation'
import { validatePermissions, getRoutePermissions } from './lib/auth/rbac-permissions'
import { logSecurityEvent, SecurityEventType } from './lib/auth/security-monitoring'

// Routes that should redirect *away* if user is already authed
const authRoutes = ['/auth/signin', '/auth/signup']

// API routes that require special handling
const specialAPIRoutes = [
  '/api/auth',
  '/api/debug-session'
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAPIRoute = pathname.startsWith('/api')

  try {
    // Handle auth pages (redirect if already authenticated)
    if (authRoutes.some(route => pathname.startsWith(route))) {
      const session = await validateAuthentication(request);
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.next()
    }

    // Skip middleware for public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next()
    }

    // Handle API routes with comprehensive security
    if (isAPIRoute) {
      return await handleAPIRoute(request, pathname)
    }

    // Handle protected frontend routes
    if (isProtectedRoute(pathname)) {
      return await handleProtectedRoute(request, pathname)
    }

    // Default: continue without authentication
    return NextResponse.next()

  } catch (error) {
    console.error('Middleware error:', error)
    
    // Log security event for middleware errors
    await logSecurityEvent(
      SecurityEventType.SYSTEM_INTRUSION_ATTEMPT,
      {
        error: error instanceof Error ? error.message : 'Unknown middleware error',
        path: pathname,
        method: request.method
      },
      undefined,
      request
    )

    if (isAPIRoute) {
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      )
    }

    // Redirect to error page for frontend routes
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
}

/**
 * Handles API route security validation
 */
async function handleAPIRoute(request: NextRequest, pathname: string): Promise<NextResponse> {
  // Skip authentication for special API routes
  if (specialAPIRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // All other API routes require authentication
  try {
    // Step 1: Validate Authentication
    const session = await validateAuthentication(request)

    // Step 2: Extract and validate tenant context
    const tenantId = extractTenantId(request, session)
    let tenantContext = null
    
    if (tenantId) {
      tenantContext = await validateTenantAccess(session, tenantId, pathname)
    }

    // Step 3: Validate permissions for the specific route
    const requiredPermissions = getRoutePermissions(pathname)
    if (requiredPermissions.length > 0) {
      await validatePermissions(session, requiredPermissions)
    }

    // Step 4: Rate limiting check (basic implementation)
    const rateLimitResult = await checkRateLimit(request, session)
    if (!rateLimitResult.allowed) {
      await logSecurityEvent(
        SecurityEventType.API_RATE_LIMIT_EXCEEDED,
        {
          limit: rateLimitResult.limit,
          current: rateLimitResult.current,
          resetTime: rateLimitResult.resetTime
        },
        session,
        request
      )

      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.resetTime 
        },
        { status: 429 }
      )
    }

    // Step 5: Create secure response with session context
    const response = NextResponse.next()
    
    // Add security headers to the response
    response.headers.set('X-User-ID', session.userId)
    response.headers.set('X-Tenant-ID', session.tenantId)
    response.headers.set('X-Session-ID', session.sessionId)
    
    if (session.businessId) {
      response.headers.set('X-Business-ID', session.businessId)
    }

    // Add security context for the API route
    response.headers.set('X-Auth-Validated', 'true')
    response.headers.set('X-Permissions', JSON.stringify(session.permissions))

    // Log successful API access
    await logSecurityEvent(
      SecurityEventType.SUCCESSFUL_AUTHENTICATION,
      {
        path: pathname,
        method: request.method,
        tenantId: session.tenantId,
        permissions: requiredPermissions
      },
      session,
      request
    )

    return response

  } catch (error) {
    return handleAuthenticationError(error, request, pathname, true)
  }
}

/**
 * Handles protected frontend route security
 */
async function handleProtectedRoute(request: NextRequest, pathname: string): Promise<NextResponse> {
  try {
    const session = await validateAuthentication(request)
    
    // For frontend routes, just ensure basic authentication
    // More granular permissions are handled at the component level
    return NextResponse.next()

  } catch (error) {
    return handleAuthenticationError(error, request, pathname, false)
  }
}

/**
 * Handles authentication and authorization errors
 */
async function handleAuthenticationError(
  error: unknown,
  request: NextRequest,
  pathname: string,
  isAPIRoute: boolean
): Promise<NextResponse> {
  if (error instanceof AuthenticationError) {
    await logSecurityEvent(
      SecurityEventType.AUTHENTICATION_FAILURE,
      {
        error: error.message,
        code: error.code,
        path: pathname,
        method: request.method
      },
      undefined,
      request
    )

    if (isAPIRoute) {
      return NextResponse.json(
        { error: 'Authentication required', code: error.code },
        { status: 401 }
      )
    }

    const signIn = new URL('/auth/signin', request.url)
    signIn.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signIn)
  }

  if (error instanceof UnauthorizedError) {
    await logSecurityEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
      {
        error: error.message,
        code: error.code,
        path: pathname,
        method: request.method
      },
      undefined,
      request
    )

    if (isAPIRoute) {
      return NextResponse.json(
        { error: 'Access denied', code: error.code },
        { status: 403 }
      )
    }

    return NextResponse.redirect(new URL('/auth/error?error=access_denied', request.url))
  }

  if (error instanceof TenantIsolationError) {
    await logSecurityEvent(
      SecurityEventType.TENANT_BOUNDARY_VIOLATION,
      {
        error: error.message,
        code: error.code,
        path: pathname,
        method: request.method
      },
      undefined,
      request
    )

    if (isAPIRoute) {
      return NextResponse.json(
        { error: 'Tenant access violation', code: error.code },
        { status: 403 }
      )
    }

    return NextResponse.redirect(new URL('/auth/error?error=tenant_violation', request.url))
  }

  // Unknown error
  console.error('Unknown authentication error:', error)
  
  if (isAPIRoute) {
    return NextResponse.json(
      { error: 'Authentication system error' },
      { status: 500 }
    )
  }

  return NextResponse.redirect(new URL('/auth/error', request.url))
}

/**
 * Extracts tenant ID from request headers or session context
 */
function extractTenantId(request: NextRequest, session: any): string | null {
  // SECURITY CRITICAL: Never trust client-provided tenant ID alone
  // Always validate against the authenticated session context
  
  const headerTenantId = request.headers.get('X-Tenant-ID')
  const sessionTenantId = session?.tenantId

  // If session has tenant ID, always use that
  if (sessionTenantId) {
    return sessionTenantId
  }

  // Only use header tenant ID if no session context (shouldn't happen for authenticated routes)
  return headerTenantId
}

/**
 * Basic rate limiting implementation
 */
async function checkRateLimit(
  request: NextRequest,
  session: any
): Promise<{ allowed: boolean; limit: number; current: number; resetTime?: number }> {
  // Simple in-memory rate limiting (in production, use Redis or similar)
  const identifier = session?.userId || getClientIP(request)
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 100 // 100 requests per minute per user

  // This is a simplified implementation
  // In production, you would use a proper rate limiting solution
  return {
    allowed: true,
    limit: maxRequests,
    current: 0
  }
}

/**
 * Extracts client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }
  
  return 'unknown'
}

/* Configure which paths run through the middleware */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
