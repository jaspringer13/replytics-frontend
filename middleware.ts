// middleware.ts - Simplified NextAuth Security Middleware

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  // Middleware function
  function middleware(req) {
    const pathname = req.nextUrl.pathname
    const token = req.nextauth.token

    // Skip processing for auth routes when user is already authenticated
    const authRoutes = ['/auth/signin', '/auth/signup']
    if (authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // For protected API routes, add tenant context headers
    if (pathname.startsWith('/api/v2/')) {
      const response = NextResponse.next()
      
      // Add business context headers for tenant isolation
      if (token?.id) response.headers.set('X-User-ID', token.id)
      if (token?.tenantId) response.headers.set('X-Tenant-ID', token.tenantId)
      if (token?.businessId) response.headers.set('X-Business-ID', token.businessId)
      
      return response
    }

    // Continue with request
    return NextResponse.next()
  },
  {
    callbacks: {
      // Authorization check - require businessId and tenantId for protected routes
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Public routes - always allow
        const publicRoutes = ['/', '/about', '/contact', '/pricing']
        if (publicRoutes.includes(pathname) || pathname.startsWith('/public')) {
          return true
        }

        // Special API routes - always allow (NextAuth handles its own auth)
        const specialAPIRoutes = ['/api/auth', '/api/debug-session', '/api/health']
        if (specialAPIRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Protected routes - require valid token with business context
        const protectedRoutes = ['/dashboard', '/api/v2/']
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          // Require authentication
          if (!token) return false
          
          // For onboarding users (step 0), allow access to dashboard but not API
          if (token.onboardingStep === 0) {
            return pathname.startsWith('/dashboard') // Allow dashboard, block API
          }
          
          // For completed users, require full business context
          return !!(token.tenantId && token.businessId)
        }

        // Default: allow access for other routes
        return true
      }
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    }
  }
)


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
