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
    async session({ session, token }) {
      console.log('[NextAuth][session]', { session, token });
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