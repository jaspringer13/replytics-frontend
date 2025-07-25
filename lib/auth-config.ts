import { NextAuthOptions, DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from '@supabase/supabase-js'

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      onboardingStep: number
      tenantId?: string
      businessId?: string
    } & DefaultSession["user"]
  }
  
  interface User {
    id: string
    tenantId?: string
    businessId?: string
    onboardingStep?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    tenantId?: string
    businessId?: string
    onboardingStep: number
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
      console.debug('[NextAuth] signIn callback', { 
        provider: account?.provider,
        email: user.email,
        userId: user.id 
      })
      
      if (account?.provider === "google" && user.email) {
        try {
          // Initialize Supabase client with service role
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          
          // Check if user exists in businesses table
          const { data: business, error } = await supabase
            .from('businesses')
            .select('id, tenant_id')
            .eq('email', user.email)
            .single()
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Supabase query error:', error)
            return false
          }
          
          if (business) {
            // Existing user
            user.tenantId = business.id
            user.businessId = business.id
            user.onboardingStep = 5
          } else {
            // New user - create business record
            const { data: newBusiness, error: createError } = await supabase
              .from('businesses')
              .insert({
                email: user.email,
                name: user.name || 'New Business',
                tenant_id: crypto.randomUUID() // Generate new tenant ID
              })
              .select('id, tenant_id')
              .single()
            
            if (createError || !newBusiness) {
              console.error('Failed to create business:', createError)
              return false
            }
            
            user.tenantId = newBusiness.id
            user.businessId = newBusiness.id
            user.onboardingStep = 0
          }
          
          return true
        } catch (error) {
          console.error('Supabase integration error:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
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
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string
        session.user.businessId = token.businessId as string
        session.user.onboardingStep = token.onboardingStep as number
        
        console.debug('[NextAuth] Session callback', { 
          sessionUserId: session.user.id,
          tenantId: session.user.tenantId,
          businessId: session.user.businessId
        })
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.debug('[NextAuth] Redirect callback', { url, baseUrl })
      
      // Always redirect to dashboard after successful sign-in
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/dashboard`
      }
      
      // Redirect from signin page to dashboard
      if (url.includes('/auth/signin')) {
        return `${baseUrl}/dashboard`
      }
      
      return url
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
  // Add debug mode in development
  debug: process.env.NODE_ENV === 'development',
}