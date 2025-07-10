import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes
const protectedRoutes = ['/dashboard']

// Define public routes that should redirect to dashboard if authenticated
const authRoutes = ['/auth/signin', '/auth/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user is authenticated by looking for the user data in cookies
  // Note: In a real app, this would be a secure HTTP-only cookie with a session token
  // For this demo, we're checking localStorage via a custom header set by the client
  const isAuthenticated = request.cookies.get('user')?.value

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Redirect to sign in if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL('/auth/signin', request.url)
    // Add the original URL as a redirect parameter
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}