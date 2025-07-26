"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'

interface User {
  id: string
  email: string
  name: string
  tenantId?: string
  onboardingStep?: number
  businessId?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  tenantId: string | null
  businessId: string | null
  onboardingStep: number
  updateOnboardingStep: (step: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { data: session, status, update } = useSession()

  // Convert NextAuth session to our User type
  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    tenantId: session.user.tenantId,
    businessId: session.user.businessId,
    onboardingStep: session.user.onboardingStep || 0
  } : null

  // Logout using NextAuth
  const logout = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Google OAuth sign in
  const signInWithGoogle = async () => {
    try {
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      if (result?.error) {
        throw new Error(result.error)
      }

      // Navigate based on onboarding status
      // Note: session will be updated after sign in completes
      router.push('/dashboard')
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  // Update onboarding step
  const updateOnboardingStep = async (step: number) => {
    if (session) {
      await update({ onboardingStep: step })
    }
  }

  // Derive auth state from NextAuth session only
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const tenantId = user?.tenantId || null
  const businessId = user?.businessId || null
  const onboardingStep = user?.onboardingStep || 0

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      signInWithGoogle,
      logout, 
      isAuthenticated, 
      tenantId,
      businessId,
      onboardingStep,
      updateOnboardingStep
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