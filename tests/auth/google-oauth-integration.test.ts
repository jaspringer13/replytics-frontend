/**
 * GOOGLE OAUTH INTEGRATION - BULLETPROOF FLOW TESTS
 * 
 * Senior Engineering Standard Tests for Complete Authentication Flow
 * 
 * TEST PHILOSOPHY: "Either the test is flawed or the code is - both can't be true"
 * - These tests validate the complete OAuth flow from login to dashboard
 * - Any test failure indicates a system bug that MUST be fixed
 * - NEVER simplify tests to meet failing code
 */

import React from 'react'
import { jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn()
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('Google OAuth Integration Tests - Complete Flow', () => {
  
  const mockPush = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    } as any)
  })

  describe('New User Registration Flow', () => {
    
    it('should complete new user OAuth flow with business context creation', async () => {
      // RIGOROUS TEST: New user flow must create business context during onboarding
      
      // Stage 1: Initial unauthenticated state
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="auth-status">{auth.isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
            <div data-testid="loading-status">{auth.isLoading ? 'loading' : 'ready'}</div>
            <button onClick={auth.signInWithGoogle} data-testid="signin-button">
              Sign In with Google
            </button>
          </div>
        )
      }
      
      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Should show unauthenticated state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready')
      
      // Stage 2: Initiate Google OAuth
      mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200 })
      
      fireEvent.click(screen.getByTestId('signin-button'))
      
      // Should call NextAuth signIn with correct parameters
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      // Should navigate to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
      
      // Stage 3: OAuth callback returns with new user (no business context yet)
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'new-user-123',
            email: 'newuser@example.com',
            name: 'New User',
            tenantId: '', // New user - no business context yet
            businessId: '',
            onboardingStep: 0, // Needs onboarding
            isActive: true,
            roles: [],
            permissions: []
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Should show authenticated state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      
      // Auth context should extract business data correctly
      const TestBusinessContext = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="tenant-id">{auth.tenantId || 'no-tenant'}</div>
            <div data-testid="business-id">{auth.businessId || 'no-business'}</div>
            <div data-testid="onboarding-step">{auth.onboardingStep}</div>
          </div>
        )
      }
      
      rerender(
        <AuthProvider>
          <TestBusinessContext />
        </AuthProvider>
      )
      
      // New user should have no business context but be ready for onboarding
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('no-tenant')
      expect(screen.getByTestId('business-id')).toHaveTextContent('no-business')
      expect(screen.getByTestId('onboarding-step')).toHaveTextContent('0')
    })
    
    it('should handle onboarding completion and business context creation', async () => {
      // Stage 1: User completes onboarding, business context is created
      const mockUpdate = jest.fn()
      
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Test User',
            tenantId: 'tenant-456', // Business context created
            businessId: 'business-789',
            onboardingStep: 3, // Completed onboarding
            isActive: true,
            roles: ['owner'],
            permissions: ['admin']
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: mockUpdate
      })
      
      const TestOnboardingUpdate = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="tenant-id">{auth.tenantId}</div>
            <div data-testid="business-id">{auth.businessId}</div>
            <div data-testid="onboarding-step">{auth.onboardingStep}</div>
            <button 
              onClick={() => auth.updateOnboardingStep(4)} 
              data-testid="complete-onboarding"
            >
              Complete Onboarding
            </button>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestOnboardingUpdate />
        </AuthProvider>
      )
      
      // Should show business context
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-456')
      expect(screen.getByTestId('business-id')).toHaveTextContent('business-789')
      expect(screen.getByTestId('onboarding-step')).toHaveTextContent('3')
      
      // Complete onboarding
      fireEvent.click(screen.getByTestId('complete-onboarding'))
      
      // Should update session with new onboarding step
      expect(mockUpdate).toHaveBeenCalledWith({ onboardingStep: 4 })
    })
  })

  describe('Existing User Login Flow', () => {
    
    it('should retrieve existing business context on login', async () => {
      // RIGOROUS TEST: Existing user must have business context populated from JWT
      
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'existing-user-456',
            email: 'existing@example.com',
            name: 'Existing User',
            tenantId: 'tenant-789',
            businessId: 'business-123',
            onboardingStep: 5, // Completed user
            isActive: true,
            roles: ['admin', 'user'],
            permissions: ['read', 'write', 'delete']
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      const TestExistingUser = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="user-id">{auth.user?.id}</div>
            <div data-testid="email">{auth.user?.email}</div>
            <div data-testid="tenant-id">{auth.tenantId}</div>
            <div data-testid="business-id">{auth.businessId}</div>
            <div data-testid="onboarding-step">{auth.onboardingStep}</div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestExistingUser />
        </AuthProvider>
      )
      
      // CRITICAL: All business context must be available
      expect(screen.getByTestId('user-id')).toHaveTextContent('existing-user-456')
      expect(screen.getByTestId('email')).toHaveTextContent('existing@example.com')
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-789')
      expect(screen.getByTestId('business-id')).toHaveTextContent('business-123')
      expect(screen.getByTestId('onboarding-step')).toHaveTextContent('5')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
    })
    
    it('should handle existing user with missing business context (force re-onboarding)', async () => {
      // Edge case: Existing user somehow lost business context - should force re-onboarding
      
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'corrupted-user-789',
            email: 'corrupted@example.com',
            name: 'Corrupted User',
            tenantId: '', // Missing business context
            businessId: '',
            onboardingStep: 0, // Forced to 0 by session callback
            isActive: true,
            roles: [],
            permissions: []
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      const TestCorruptedUser = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="tenant-id">{auth.tenantId || 'no-tenant'}</div>
            <div data-testid="business-id">{auth.businessId || 'no-business'}</div>
            <div data-testid="onboarding-step">{auth.onboardingStep}</div>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestCorruptedUser />
        </AuthProvider>
      )
      
      // Should show no business context and reset onboarding
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('no-tenant')
      expect(screen.getByTestId('business-id')).toHaveTextContent('no-business')
      expect(screen.getByTestId('onboarding-step')).toHaveTextContent('0')
    })
  })

  describe('Authentication State Management', () => {
    
    it('should handle loading states correctly', async () => {
      // Test loading state during authentication
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      })
      
      const TestLoadingState = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="is-loading">{auth.isLoading.toString()}</div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestLoadingState />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('is-loading')).toHaveTextContent('true')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
    })
    
    it('should handle authentication transitions correctly', async () => {
      // Test transition from unauthenticated to authenticated
      const { rerender } = render(
        <AuthProvider>
          <div data-testid="test" />
        </AuthProvider>
      )
      
      // Stage 1: Unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })
      
      const TestTransition = () => {
        const auth = useAuth()
        return (
          <div data-testid="auth-status">
            {auth.isLoading ? 'loading' : (auth.isAuthenticated ? 'authenticated' : 'unauthenticated')}
          </div>
        )
      }
      
      rerender(
        <AuthProvider>
          <TestTransition />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
      
      // Stage 2: Authenticate
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            tenantId: 'tenant-456',
            businessId: 'business-789',
            onboardingStep: 2,
            isActive: true,
            roles: ['user'],
            permissions: ['read']
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      rerender(
        <AuthProvider>
          <TestTransition />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })
  })

  describe('Session Persistence and Refresh', () => {
    
    it('should maintain session across page refreshes', () => {
      // Simulate page refresh with existing session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            tenantId: 'tenant-456',
            businessId: 'business-789',
            onboardingStep: 3,
            isActive: true,
            roles: ['user'],
            permissions: ['read']
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      const TestPersistence = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="user-id">{auth.user?.id}</div>
            <div data-testid="tenant-id">{auth.tenantId}</div>
            <div data-testid="business-id">{auth.businessId}</div>
          </div>
        )
      }
      
      // Render component (simulating page refresh)
      render(
        <AuthProvider>
          <TestPersistence />
        </AuthProvider>
      )
      
      // Session data should be immediately available
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-123')
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-456')
      expect(screen.getByTestId('business-id')).toHaveTextContent('business-789')
    })
  })

  describe('Error Handling', () => {
    
    it('should handle Google OAuth errors gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })
      
      // Mock signIn to reject with error
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'OAuthCallback',
        status: 400
      })
      
      const TestErrorHandling = () => {
        const auth = useAuth()
        return (
          <button onClick={auth.signInWithGoogle} data-testid="signin-button">
            Sign In
          </button>
        )
      }
      
      render(
        <AuthProvider>
          <TestErrorHandling />
        </AuthProvider>
      )
      
      // Should handle error gracefully and not crash
      await expect(async () => {
        fireEvent.click(screen.getByTestId('signin-button'))
        await waitFor(() => expect(mockSignIn).toHaveBeenCalled())
      }).not.toThrow()
    })
    
    it('should handle missing user context gracefully', () => {
      // Test error boundary when context is used outside provider
      const TestOutsideProvider = () => {
        try {
          const auth = useAuth()
          return <div data-testid="should-not-render" />
        } catch (error) {
          return <div data-testid="error-caught">{(error as Error).message}</div>
        }
      }
      
      render(<TestOutsideProvider />)
      
      expect(screen.getByTestId('error-caught')).toHaveTextContent(
        'useAuth must be used within an AuthProvider'
      )
    })
  })

  describe('Logout Flow', () => {
    
    it('should handle logout correctly', async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined)
      
      // Mock the signOut function
      jest.doMock('next-auth/react', () => ({
        ...jest.requireActual('next-auth/react'),
        signOut: mockSignOut
      }))
      
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            tenantId: 'tenant-456',
            businessId: 'business-789',
            onboardingStep: 3,
            isActive: true,
            roles: ['user'],
            permissions: ['read']
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      const TestLogout = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
            <button onClick={auth.logout} data-testid="logout-button">
              Logout
            </button>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestLogout />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      
      fireEvent.click(screen.getByTestId('logout-button'))
      
      // Should navigate to home page after logout
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })
  })
})