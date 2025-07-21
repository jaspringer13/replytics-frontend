"use client"

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-client'
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  email: string
  name: string
  tenantId: string
  businessId?: string
  permissions: string[]
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
  businessId: string | null
  onboardingStep: number
  updateOnboardingStep: (step: number) => Promise<void>
  isTokenExpired: boolean
  tokenExpiresAt: string | null
  switchBusiness: (businessId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const supabase = getSupabaseClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Convert Supabase user to our User type
  const createUserFromSupabase = useCallback((supabaseUser: SupabaseUser, session: Session): User => {
    const metadata = supabaseUser.user_metadata || {}
    const appMetadata = supabaseUser.app_metadata || {}
    
    // Extract tenant and business info
    const tenantId = appMetadata.tenant_id || metadata.tenant_id || supabaseUser.id
    const businessId = appMetadata.business_id || metadata.current_business_id || localStorage.getItem('current_business_id') || undefined
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: metadata.full_name || metadata.name || supabaseUser.email || 'User',
      tenantId,
      businessId,
      permissions: appMetadata.permissions || ['admin'],
      onboardingStep: metadata.onboarding_step || 0
    }
  }, [])

  // Update API client with Supabase token
  const updateApiClient = useCallback((session: Session | null) => {
    if (session) {
      apiClient.setToken(session.access_token, session.expires_at?.toString())
      console.log('Updated API client with Supabase token')
    } else {
      apiClient.setToken(null)
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session)
      setSession(session)
      if (session?.user) {
        const user = createUserFromSupabase(session.user, session)
        setUser(user)
        updateApiClient(session)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session)
      setSession(session)
      if (session?.user) {
        const user = createUserFromSupabase(session.user, session)
        setUser(user)
        updateApiClient(session)
        
        // Store business ID if available
        if (user.businessId) {
          localStorage.setItem('current_business_id', user.businessId)
        }
      } else {
        setUser(null)
        updateApiClient(null)
        localStorage.removeItem('current_business_id')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, createUserFromSupabase, updateApiClient])

  // Email/password login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting Supabase login...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Supabase login error:', error)
        return false
      }

      if (data.session) {
        console.log('Login successful, navigating to dashboard...')
        router.push('/dashboard')
        return true
      }

      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  // Google OAuth sign in
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Google sign in error:', error)
        throw error
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Update onboarding step
  const updateOnboardingStep = async (step: number) => {
    try {
      if (session?.user) {
        const { error } = await supabase.auth.updateUser({
          data: {
            onboarding_step: step
          }
        })
        
        if (error) throw error
        
        // Update local user state
        if (user) {
          setUser({ ...user, onboardingStep: step })
        }
      }
    } catch (error) {
      console.error('Failed to update onboarding step:', error)
      throw error
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
      if (user) {
        setUser({ ...user, businessId })
      }
      
      // Update user metadata in Supabase
      if (session?.user) {
        await supabase.auth.updateUser({
          data: {
            current_business_id: businessId
          }
        })
      }
      
      // Refresh the page to reload with new business context
      router.refresh()
    } catch (error) {
      console.error('Failed to switch business:', error)
      throw error
    }
  }

  const isAuthenticated = !!user && !!session
  const token = session?.access_token || null
  const tenantId = user?.tenantId || null
  const businessId = user?.businessId || null
  const onboardingStep = user?.onboardingStep || 0
  
  // Calculate token expiration
  const tokenExpiresAt = session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
  const isTokenExpired = session ? new Date() > new Date(session.expires_at! * 1000) : false

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      login, 
      signInWithGoogle,
      logout, 
      isAuthenticated, 
      token,
      tenantId,
      businessId,
      onboardingStep,
      updateOnboardingStep,
      isTokenExpired,
      tokenExpiresAt,
      switchBusiness
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}