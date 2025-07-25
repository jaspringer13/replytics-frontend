// middleware.ts

import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that should *always* require authentication
const protectedRoutes = ['/dashboard']

// Routes that should redirect *away* if user is already authed
const authRoutes = ['/auth/signin', '/auth/signup']

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Pull NextAuth‐issued JWT (works in Edge Runtime)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route))

  // 1. Block anonymous users from protected pages
  if (isProtected && !token) {
    const signIn = new URL('/auth/signin', req.url)
    signIn.searchParams.set('redirect', pathname) // so we can bounce back
    return NextResponse.redirect(signIn)
  }

  // 2. Kick logged‑in users off the signin/signup pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // 3. Otherwise, continue
  return NextResponse.next()
}

/* Tell Next.js which paths run through the middleware
   (skip /api/*, static assets, etc.) */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
