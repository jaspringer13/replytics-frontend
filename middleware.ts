// middleware.ts - NextAuth-powered Security Middleware

import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that should redirect *away* if user is already authed
const authRoutes = ['/auth/signin', '/auth/signup']

// Public routes that don't require authentication
const publicRoutes = ['/', '/about', '/contact', '/pricing']

// API routes that require special handling (NextAuth, health checks, etc.)
const specialAPIRoutes = [
  '/api/auth',
  '/api/debug-session',
  '/api/health'
]

// Protected routes that require authentication
const protectedRoutes = ['/dashboard']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAPIRoute = pathname.startsWith('/api')

  try {
    // Get NextAuth token for authentication check
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Handle auth pages (redirect if already authenticated)
    if (authRoutes.some(route => pathname.startsWith(route))) {
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.next()
    }

    // Skip middleware for public routes
    if (publicRoutes.includes(pathname) || pathname.startsWith('/public')) {
      return NextResponse.next()
    }

    // Skip middleware for special API routes (NextAuth handles its own auth)
    if (specialAPIRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Handle protected API routes
    if (isAPIRoute && pathname.startsWith('/api/v2/')) {
      if (!token?.tenantId || !token?.businessId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Add security headers for authenticated API requests
      const response = NextResponse.next()
      response.headers.set('X-User-ID', token.id as string)
      response.headers.set('X-Tenant-ID', token.tenantId as string)
      response.headers.set('X-Business-ID', token.businessId as string)
      return response
    }

    // Handle protected frontend routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      if (!token) {
        const signIn = new URL('/auth/signin', request.url)
        signIn.searchParams.set('redirect', pathname)
        return NextResponse.redirect(signIn)
      }
      return NextResponse.next()
    }

    // Default: continue without authentication
    return NextResponse.next()

  } catch (error) {
    console.error('Middleware error:', error)

    if (isAPIRoute) {
      return NextResponse.json(
        { error: 'Authentication system error' },
        { status: 500 }
      )
    }

    // Redirect to error page for frontend routes
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
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
