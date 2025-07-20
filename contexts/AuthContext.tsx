"use client"

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react'
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
  businessId?: string  // Add business ID from JWT metadata
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
  businessId: string | null  // Add business context
  onboardingStep: number
  updateOnboardingStep: (step: number) => Promise<void>
  isTokenExpired: boolean
  tokenExpiresAt: string | null
  switchBusiness: (businessId: string) => Promise<void>  // Add business switching
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [error, setError] = useState<string | null>(null)
  
  // Initialize state from localStorage
  const [localUser, setLocalUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUserStr = localStorage.getItem('user')
      if (storedUserStr) {
        try {
          const user = JSON.parse(storedUserStr)
          // Try to get businessId from localStorage if not in user object
          if (!user.businessId) {
            user.businessId = localStorage.getItem('current_business_id')
          }
          return user
        } catch (err) {
          console.error('Failed to parse stored user:', err)
        }
      }
    }
    return null
  })
  
  const [isLoading, setIsLoading] = useState(() => {
    // If we have a stored user/token, we're not loading
    if (typeof window !== 'undefined') {
      const hasStoredAuth = !!localStorage.getItem('auth_token')
      return !hasStoredAuth
    }
    return true
  })
  
  // Token expiration utility function
  const isTokenExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return true
    return new Date(expiresAt) <= new Date()
  }
  
  // Get stored expiration time
  const tokenExpiresAt = typeof window !== 'undefined' 
    ? localStorage.getItem('token_expires_at') 
    : null

  // Initialize API client from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token')
      const expiresAt = localStorage.getItem('token_expires_at')
      
      if (storedToken) {
        apiClient.setToken(storedToken, expiresAt || undefined)
        console.log('AuthContext: Restored auth token from localStorage')
      }
    }
  }, [])

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
    
    // Only set loading false if we're not using email/password auth
    if (!localUser && !localStorage.getItem('auth_token')) {
      setIsLoading(false)
    }
  }, [session, status, localUser])

  // Logout
  const logout = useCallback(async () => {
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
  }, [session, router])

  // Token expiration monitoring and automatic refresh
  useEffect(() => {
    // Skip if loading
    if (status === 'loading') return

    const checkTokenExpiration = async () => {
      const storedExpiresAt = localStorage.getItem('token_expires_at')
      
      if (isTokenExpired(storedExpiresAt)) {
        console.log('Token expired, attempting to refresh session...')
        
        try {
          if (session) {
            // For OAuth sessions, attempt to refresh the session
            const result = await update()
            if (!result) {
              console.log('Session refresh failed, logging out...')
              await logout()
            }
          } else {
            // For credential-based auth, attempt to refresh token
            const refreshed = await apiClient.refreshToken()
            if (!refreshed) {
              console.log('Token refresh failed, logging out...')
              await logout()
            }
          }
        } catch (error) {
          console.error('Failed to refresh session:', error)
          await logout()
        }
      }
    }

    // Only run if we have either a session or stored auth token
    const hasStoredToken = typeof window !== 'undefined' && localStorage.getItem('auth_token')
    if (session || hasStoredToken) {
      // Check immediately
      checkTokenExpiration()

      // Set up periodic checking (every 5 minutes)
      const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [session, status, update, logout])

  // Convert NextAuth session to our User type, or use local user
  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    tenantId: session.user.tenantId,
    authToken: session.user.authToken,
    onboardingStep: session.user.onboardingStep
  } : localUser

  // Traditional email/password login (for testing)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('AuthContext: Attempting login...')
      const response = await apiClient.login(email, password)
      console.log('AuthContext: Login response received:', response)
      
      if (response.token && response.user) {
        console.log('AuthContext: Valid response, setting up auth...')
        // Calculate token expiration (24 hours from now if not provided)
        const expiresAt = response.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        
        // Extract businessId from metadata if available
        const businessId = response.metadata?.current_business_id || undefined
        const userWithBusiness = {
          ...response.user,
          businessId
        }
        
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(userWithBusiness))
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('tenant_id', response.user.id) // Assuming user.id is tenant_id for email login
        localStorage.setItem('token_expires_at', expiresAt)
        
        // Store business ID separately if available
        if (businessId) {
          localStorage.setItem('current_business_id', businessId)
        }
        
        // Set API client token with expiration
        apiClient.setToken(response.token, expiresAt)
        
        // Update local user state with business ID
        setLocalUser(userWithBusiness)
        
        // CRITICAL: Set loading to false after successful login
        setIsLoading(false)
        
        // Set cookies for middleware
        document.cookie = `auth_token=${response.token}; path=/; max-age=86400; SameSite=Lax`
        document.cookie = `user=${JSON.stringify(response.user)}; path=/; max-age=86400; SameSite=Lax`
        document.cookie = `token_expires_at=${expiresAt}; path=/; max-age=86400; SameSite=Lax`
        
        console.log('AuthContext: Auth state before navigation:', {
          user: response.user,
          isLoading: false,
          hasToken: !!response.token
        })
        console.log('AuthContext: Navigating to dashboard...')
        
        // Navigate with client-side routing
        router.push('/dashboard')
        
        return true
      }
      
      console.log('AuthContext: Invalid response - missing token or user')
      return false
    } catch (error) {
      console.error('AuthContext: Login failed with error:', error)
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

  // Update onboarding step
  const updateOnboardingStep = async (step: number) => {
    if (session) {
      await update({ onboardingStep: step })
    }
  }

  // Switch business context
  const switchBusiness = async (businessId: string) => {
    try {
      // Update localStorage
      localStorage.setItem('current_business_id', businessId)
      
      // Update API client with new business context
      apiClient.setBusinessId(businessId)
      
      // Update user object
      if (localUser) {
        const updatedUser = { ...localUser, businessId }
        setLocalUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      
      // If using NextAuth session, update it
      if (session?.user) {
        await update({ businessId })
      }
      
      // Refresh the page to reload with new business context
      router.refresh()
    } catch (error) {
      console.error('Failed to switch business:', error)
      throw error
    }
  }

  // Check localStorage for auth state
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  
  const isAuthenticated = !!user || (status === 'authenticated') || !!storedToken
  const token = session?.user?.authToken || storedToken
  const tenantId = session?.user?.tenantId || (typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null)
  const businessId = user?.businessId || (typeof window !== 'undefined' ? localStorage.getItem('current_business_id') : null)
  const onboardingStep = session?.user?.onboardingStep || 0

  // Debug logging
  useEffect(() => {
    console.log('AuthContext state:', {
      user: !!user,
      localUser: !!localUser,
      isLoading,
      isAuthenticated,
      hasToken: !!token,
      storedToken: !!storedToken,
      nextAuthStatus: status
    })
  }, [user, localUser, isLoading, isAuthenticated, token, storedToken, status])

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading: isLoading, // Don't include NextAuth status for email/password login
      login, 
      signInWithGoogle,
      logout, 
      isAuthenticated, 
      token,
      tenantId,
      businessId,
      onboardingStep,
      updateOnboardingStep,
      switchBusiness,
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