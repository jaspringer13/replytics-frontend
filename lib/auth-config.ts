import { NextAuthOptions, DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      onboardingStep: number
      tenantId?: string
      authToken?: string
    } & DefaultSession["user"]
  }
  
  interface User {
    id: string
    tenantId?: string
    authToken?: string
    onboardingStep?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    tenantId?: string
    authToken?: string
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
      if (account?.provider === "google") {
        try {
          // Register/login with backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/dashboard/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
              google_id: user.id || user.email
            })
          })
          
          if (!response.ok) {
            console.error('Backend auth failed:', await response.text())
            return false
          }
          
          const data = await response.json()
          
          // Store backend data on user object for JWT callback
          user.tenantId = data.tenant_id
          user.authToken = data.token
          user.onboardingStep = data.is_new_user ? 0 : 5 // 0 for new users, 5 for existing
          
          return true
        } catch (error) {
          console.error('Backend integration error:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
        token.authToken = user.authToken
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
        session.user.authToken = token.authToken as string
        session.user.onboardingStep = token.onboardingStep as number
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect based on onboarding status
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
  },
  secret: process.env.NEXTAUTH_SECRET,
}