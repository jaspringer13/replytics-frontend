import { NextAuthOptions, DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from '@supabase/supabase-js'

// Define the custom session user interface
interface CustomSessionUser {
  id: string
  email: string
  name: string
  tenantId: string
  businessId: string
  externalId?: string
  onboardingStep: number
  isActive: boolean
  roles: string[]
  permissions: string[]
  lastLogin?: string
  image?: string | null
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      onboardingStep: number
      tenantId?: string
      businessId?: string
      externalId?: string
      isActive?: boolean
      roles?: string[]
      permissions?: string[]
    } & DefaultSession["user"]
  }
  
  interface User {
    id: string
    tenantId?: string
    businessId?: string
    onboardingStep?: number
    externalId?: string
    isActive?: boolean
    roles?: string[]
    permissions?: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    tenantId?: string
    businessId?: string
    onboardingStep: number
    externalId?: string
    isActive?: boolean
    roles?: string[]
    permissions?: string[]
    lastLogin?: string
    exp?: number
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth][signIn] forcing allow', {
        provider: account?.provider,
        email: user?.email,
        id: user?.id,
      });
      return true; // BYPASS EVERYTHING
    },
    async jwt({ token, user, trigger, session }) {
      console.log('[NextAuth][jwt]', { token, user, trigger, session });
      if (user) {
        console.debug('[NextAuth] JWT callback - new user', { 
          userId: user.id,
          tenantId: user.tenantId,
          businessId: user.businessId
        })
        token.id = user.id
        token.tenantId = user.tenantId
        token.businessId = user.businessId
        token.onboardingStep = user.onboardingStep || 0
      }
      
      // Handle session updates (e.g., after onboarding step completion)
      if (trigger === "update" && session?.onboardingStep !== undefined) {
        token.onboardingStep = session.onboardingStep
      }
      
      return token
    },
    /**
     * BULLETPROOF SESSION CALLBACK
     * 
     * Enterprise-grade session management with:
     * - Type-safe JWT data extraction
     * - Comprehensive data validation
     * - Safe fallbacks for missing data
     * - Client-side security boundaries
     * - Detailed logging for debugging
     * - Performance optimization
     */
    async session({ session, token }) {
      console.log('[Auth][Session] Session callback invoked:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!token,
        tokenId: token?.id,
        tokenTenantId: token?.tenantId,
        tokenBusinessId: token?.businessId,
        timestamp: new Date().toISOString()
      })
      
      try {
        // Validate input parameters
        if (!session) {
          console.error('[Auth][Session] Critical: No session object provided')
          throw new Error('Session object is required')
        }
        
        if (!session.user) {
          console.error('[Auth][Session] Critical: No user object in session')
          throw new Error('Session user object is required')
        }
        
        if (!token) {
          console.error('[Auth][Session] Critical: No token provided')
          throw new Error('JWT token is required for session')
        }
        
        // Validate essential token data
        const validationErrors: string[] = []
        
        if (!token.id) validationErrors.push('Token missing user ID')
        if (!token.email) validationErrors.push('Token missing user email')
        if (!token.name) validationErrors.push('Token missing user name')
        
        if (validationErrors.length > 0) {
          console.error('[Auth][Session] Token validation failed:', validationErrors)
          throw new Error(`Invalid token: ${validationErrors.join(', ')}`)
        }
        
        // Type-safe JWT data extraction with fallbacks
        const sessionData: CustomSessionUser = {
          // Core user identification (required)
          id: token.id,
          email: token.email,
          name: token.name,
          
          // Business context (required for multi-tenant operations)
          tenantId: token.tenantId || '',
          businessId: token.businessId || '',
          externalId: token.externalId || undefined,
          
          // User state with safe defaults
          onboardingStep: typeof token.onboardingStep === 'number' ? token.onboardingStep : 0,
          isActive: typeof token.isActive === 'boolean' ? token.isActive : true,
          
          // Security context (optional)
          roles: Array.isArray(token.roles) ? token.roles : [],
          permissions: Array.isArray(token.permissions) ? token.permissions : [],
          lastLogin: token.lastLogin,
          
          // NextAuth default fields (preserve if present)
          image: session.user.image
        }
        
        // Critical validation: Multi-tenant security requires business context
        if (!sessionData.tenantId || !sessionData.businessId) {
          console.warn('[Auth][Session] Missing critical business context:', {
            userId: sessionData.id,
            tenantId: sessionData.tenantId,
            businessId: sessionData.businessId,
            requiresOnboarding: sessionData.onboardingStep === 0
          })
          
          // For new users in onboarding, this is acceptable
          if (sessionData.onboardingStep === 0) {
            console.log('[Auth][Session] User in onboarding, business context will be created during onboarding')
          } else {
            // For existing users, this is a security issue
            console.error('[Auth][Session] Critical: Existing user missing business context')
            // Note: We don't throw here to prevent breaking existing sessions
            // Instead, we log and let the application handle onboarding
            sessionData.onboardingStep = 0 // Force re-onboarding
          }
        }
        
        // Populate the session user object
        session.user = sessionData
        
        // Ensure session expiration is properly set
        if (!session.expires && token.exp && typeof token.exp === 'number') {
          session.expires = new Date(token.exp * 1000).toISOString()
        }
        
        console.log('[Auth][Session] Session populated successfully:', {
          userId: session.user.id,
          email: session.user.email,
          tenantId: session.user.tenantId,
          businessId: session.user.businessId,
          externalId: session.user.externalId,
          onboardingStep: session.user.onboardingStep,
          isActive: session.user.isActive,
          hasRoles: (session.user.roles?.length ?? 0) > 0,
          hasPermissions: (session.user.permissions?.length ?? 0) > 0,
          expires: session.expires,
          timestamp: new Date().toISOString()
        })
        
        return session
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown session processing error'
        const errorStack = error instanceof Error ? error.stack : undefined
        
        console.error('[Auth][Session] Critical session processing error:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasToken: !!token,
          tokenId: token?.id,
          error: errorMessage,
          stack: errorStack,
          timestamp: new Date().toISOString()
        })
        
        // CRITICAL: Return a minimal valid session to prevent authentication failure
        // This prevents the entire auth system from breaking due to session errors
        if (session && token && token.id && token.email) {
          console.warn('[Auth][Session] Returning degraded session due to error')
          
          return {
            ...session,
            user: {
              id: token.id,
              email: token.email,
              name: token.name || token.email.split('@')[0],
              tenantId: token.tenantId || '',
              businessId: token.businessId || '',
              externalId: token.externalId || undefined,
              onboardingStep: 0, // Force onboarding for safety
              isActive: true,
              roles: [],
              permissions: [],
              image: session.user?.image
            },
            expires: session.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
        
        // If we can't construct any valid session, authentication must fail
        throw new Error(`Session callback failed: ${errorMessage}`)
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('http')) return baseUrl + '/dashboard';
      return baseUrl + '/dashboard';
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
}