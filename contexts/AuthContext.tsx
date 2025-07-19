"use client"

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  email: string
  name: string
  tenantId?: string
  authToken?: string
  onboardingStep?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  token: string | null
  tenantId: string | null
  onboardingStep: number
  updateOnboardingStep: (step: number) => Promise<void>
  isTokenExpired: boolean
  tokenExpiresAt: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Token expiration utility function
  const isTokenExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return true
    return new Date(expiresAt) <= new Date()
  }
  
  // Get stored expiration time
  const tokenExpiresAt = typeof window !== 'undefined' 
    ? localStorage.getItem('token_expires_at') 
    : null

  // Sync NextAuth session with localStorage and API client
  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      // Store auth data in localStorage for API client
      const authToken = session.user.authToken
      const tenantId = session.user.tenantId
      
      if (authToken && tenantId) {
        localStorage.setItem('auth_token', authToken)
        localStorage.setItem('tenant_id', tenantId)
        localStorage.setItem('token_expires_at', session.expires)
        apiClient.setToken(authToken, session.expires)
        
        // Set cookies for middleware
        document.cookie = `auth_token=${authToken}; path=/; max-age=86400; SameSite=Lax`
        document.cookie = `tenant_id=${tenantId}; path=/; max-age=86400; SameSite=Lax`
        document.cookie = `token_expires_at=${session.expires}; path=/; max-age=86400; SameSite=Lax`
      }
    } else {
      // Clear auth data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('tenant_id')
      localStorage.removeItem('token_expires_at')
      apiClient.setToken(null)
      
      // Remove cookies
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'token_expires_at=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    
    setIsLoading(false)
  }, [session, status])

  // Token expiration monitoring and automatic refresh
  useEffect(() => {
    if (!session || status !== 'authenticated') return

    const checkTokenExpiration = async () => {
      const storedExpiresAt = localStorage.getItem('token_expires_at')
      
      if (isTokenExpired(storedExpiresAt)) {
        console.log('Token expired, attempting to refresh session...')
        
        try {
          // For OAuth sessions, attempt to refresh the session
          const result = await update()
          if (!result) {
            console.log('Session refresh failed, logging out...')
            await logout()
          }
        } catch (error) {
          console.error('Failed to refresh session:', error)
          await logout()
        }
      }
    }

    // Check immediately
    checkTokenExpiration()

    // Set up periodic checking (every 5 minutes)
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [session, status, update])

  // Convert NextAuth session to our User type
  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    tenantId: session.user.tenantId,
    authToken: session.user.authToken,
    onboardingStep: session.user.onboardingStep
  } : null

  // Traditional email/password login (for testing)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password)
      
      if (response.token && response.user) {
        // Calculate token expiration (24 hours from now if not provided)
        const expiresAt = response.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(response.user))
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('tenant_id', response.user.id) // Assuming user.id is tenant_id for email login
        localStorage.setItem('token_expires_at', expiresAt)
        
        // Set API client token with expiration
        apiClient.setToken(response.token, expiresAt)
        
        // Set cookies for middleware
        document.cookie = `auth_token=${response.token}; path=/; max-age=86400; SameSite=Lax`
        document.cookie = `user=${JSON.stringify(response.user)}; path=/; max-age=86400; SameSite=Lax`
        document.cookie = `token_expires_at=${expiresAt}; path=/; max-age=86400; SameSite=Lax`
        
        router.push('/dashboard')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  // Google OAuth sign in
  const signInWithGoogle = async () => {
    try {
      setError(null)
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      if (result?.error) {
        setError(result.error)
        throw new Error(result.error)
      }

      // The backend integration happens in the NextAuth signIn callback
      // Check onboarding status after sign in
      if (session?.user?.onboardingStep === 0) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      setError(error instanceof Error ? error.message : 'Sign in failed')
    }
  }

  // Logout
  const logout = async () => {
    try {
      // Clear backend session if using email/password
      if (!session) {
        await apiClient.logout()
      }
      
      // Clear local storage
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('tenant_id')
      localStorage.removeItem('token_expires_at')
      
      // Clear cookies
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'token_expires_at=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      // Sign out from NextAuth if using OAuth
      if (session) {
        await signOut({ redirect: false })
      }
      
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Update onboarding step
  const updateOnboardingStep = async (step: number) => {
    if (session) {
      await update({ onboardingStep: step })
    }
  }

  const isAuthenticated = !!user || (status === 'authenticated')
  const token = session?.user?.authToken || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)
  const tenantId = session?.user?.tenantId || (typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null)
  const onboardingStep = session?.user?.onboardingStep || 0

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading: isLoading || status === 'loading', 
      login, 
      signInWithGoogle,
      logout, 
      isAuthenticated, 
      token,
      tenantId,
      onboardingStep,
      updateOnboardingStep,
      isTokenExpired: isTokenExpired(tokenExpiresAt),
      tokenExpiresAt
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}