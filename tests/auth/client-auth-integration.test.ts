/**
 * CLIENT-SIDE AUTHENTICATION INTEGRATION - BULLETPROOF UI SECURITY TESTS
 * 
 * Senior Engineering Standard Tests for Client-Side Authentication Integration
 * 
 * TEST PHILOSOPHY: "Either the test is flawed or the code is - both can't be true"
 * - These tests validate client-side authentication integrates perfectly with NextAuth
 * - Any test failure indicates a client-side security or UX bug
 * - NEVER simplify tests to meet failing code - fix the integration issues
 */

import React from 'react'
import { jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// Mock NextAuth React hooks
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock localStorage for hydration tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Client-Side Authentication Integration Tests', () => {
  
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    } as any)
  })

  describe('AuthContext Integration with NextAuth', () => {
    
    it('should correctly extract business context from NextAuth session', () => {
      // RIGOROUS TEST: AuthContext must perfectly extract data from NextAuth session
      
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
            roles: ['admin', 'user'],
            permissions: ['read', 'write', 'delete']
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="user-id">{auth.user?.id}</div>
            <div data-testid="user-email">{auth.user?.email}</div>
            <div data-testid="user-name">{auth.user?.name}</div>
            <div data-testid="tenant-id">{auth.tenantId}</div>
            <div data-testid="business-id">{auth.businessId}</div>
            <div data-testid="onboarding-step">{auth.onboardingStep}</div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
            <div data-testid="is-loading">{auth.isLoading.toString()}</div>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // CRITICAL: All NextAuth session data must be correctly extracted
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-123')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-456')
      expect(screen.getByTestId('business-id')).toHaveTextContent('business-789')
      expect(screen.getByTestId('onboarding-step')).toHaveTextContent('3')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    })

    it('should handle null session correctly', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="user">{auth.user ? 'has-user' : 'no-user'}</div>
            <div data-testid="tenant-id">{auth.tenantId || 'no-tenant'}</div>
            <div data-testid="business-id">{auth.businessId || 'no-business'}</div>
            <div data-testid="onboarding-step">{auth.onboardingStep}</div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
            <div data-testid="is-loading">{auth.isLoading.toString()}</div>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Should handle null session gracefully
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('no-tenant')
      expect(screen.getByTestId('business-id')).toHaveTextContent('no-business')
      expect(screen.getByTestId('onboarding-step')).toHaveTextContent('0')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    })

    it('should handle loading state correctly', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
            <div data-testid="is-loading">{auth.isLoading.toString()}</div>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('is-loading')).toHaveTextContent('true')
    })

    it('should provide default values for missing business context', () => {
      // Test case where user exists but business context is missing
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User'
            // Missing tenantId, businessId, onboardingStep
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="tenant-id">{auth.tenantId || 'null'}</div>
            <div data-testid="business-id">{auth.businessId || 'null'}</div>
            <div data-testid="onboarding-step">{auth.onboardingStep}</div>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Should provide safe defaults
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('null')
      expect(screen.getByTestId('business-id')).toHaveTextContent('null')
      expect(screen.getByTestId('onboarding-step')).toHaveTextContent('0')
    })
  })

  describe('Sign-In Flow Integration', () => {
    
    it('should execute Google sign-in flow correctly', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })
      
      mockSignIn.mockResolvedValue({
        ok: true,
        error: null,
        status: 200
      } as any)
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <button onClick={auth.signInWithGoogle} data-testid="signin-button">
            Sign In with Google
          </button>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      fireEvent.click(screen.getByTestId('signin-button'))
      
      // Should call NextAuth signIn with correct parameters
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          redirect: false,
          callbackUrl: '/dashboard'
        })
      })
      
      // Should navigate to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle sign-in errors gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })
      
      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'OAuthCallback',
        status: 400
      } as any)
      
      const TestComponent = () => {
        const auth = useAuth()
        const [error, setError] = React.useState<string | null>(null)
        
        const handleSignIn = async () => {
          try {
            await auth.signInWithGoogle()
          } catch (err) {
            setError((err as Error).message)
          }
        }
        
        return (
          <div>
            <button onClick={handleSignIn} data-testid="signin-button">
              Sign In
            </button>
            <div data-testid="error">{error || 'no-error'}</div>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      fireEvent.click(screen.getByTestId('signin-button'))
      
      // Should handle error without crashing
      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
      })
    })
  })

  describe('Logout Flow Integration', () => {
    
    it('should execute logout flow correctly', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            tenantId: 'tenant-456',
            businessId: 'business-789'
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      mockSignOut.mockResolvedValue(undefined as any)
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <button onClick={auth.logout} data-testid="logout-button">
            Logout
          </button>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      fireEvent.click(screen.getByTestId('logout-button'))
      
      // Should call NextAuth signOut and navigate home
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('should handle logout errors gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      mockSignOut.mockRejectedValue(new Error('Logout failed'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <button onClick={auth.logout} data-testid="logout-button">
            Logout
          </button>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      fireEvent.click(screen.getByTestId('logout-button'))
      
      // Should log error but not crash
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Session Updates and Onboarding', () => {
    
    it('should update onboarding step correctly', async () => {
      const mockUpdate = jest.fn()
      
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            onboardingStep: 2
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: mockUpdate
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="onboarding-step">{auth.onboardingStep}</div>
            <button 
              onClick={() => auth.updateOnboardingStep(3)} 
              data-testid="update-step"
            >
              Next Step
            </button>
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('onboarding-step')).toHaveTextContent('2')
      
      fireEvent.click(screen.getByTestId('update-step'))
      
      // Should call NextAuth session update
      expect(mockUpdate).toHaveBeenCalledWith({ onboardingStep: 3 })
    })

    it('should not update onboarding step when no session exists', async () => {
      const mockUpdate = jest.fn()
      
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: mockUpdate
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <button 
            onClick={() => auth.updateOnboardingStep(3)} 
            data-testid="update-step"
          >
            Next Step
          </button>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      fireEvent.click(screen.getByTestId('update-step'))
      
      // Should not call update when no session
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Hydration and SSR Compatibility', () => {
    
    it('should not access localStorage during initial render', () => {
      // CRITICAL TEST: Must not access browser APIs during SSR/hydration
      
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        // This component should NOT access localStorage during render
        return (
          <div data-testid="loading-state">
            {auth.isLoading ? 'loading' : 'loaded'}
          </div>
        )
      }
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Should render without accessing localStorage
      expect(localStorageMock.getItem).not.toHaveBeenCalled()
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading')
    })

    it('should handle server-side rendering without errors', () => {
      // Mock server environment (no window object)
      const originalWindow = global.window
      delete (global as any).window
      
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        return (
          <div data-testid="ssr-test">
            {auth.isLoading ? 'loading' : 'loaded'}
          </div>
        )
      }
      
      // Should render without errors in server environment
      expect(() => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )
      }).not.toThrow()
      
      // Restore window object
      global.window = originalWindow
    })
  })

  describe('Error Boundaries and Context Usage', () => {
    
    it('should throw error when useAuth is used outside AuthProvider', () => {
      const TestComponent = () => {
        try {
          const auth = useAuth()
          return <div data-testid="should-not-render">Should not render</div>
        } catch (error) {
          return <div data-testid="error-caught">{(error as Error).message}</div>
        }
      }
      
      render(<TestComponent />)
      
      expect(screen.getByTestId('error-caught')).toHaveTextContent(
        'useAuth must be used within an AuthProvider'
      )
    })

    it('should provide stable references to prevent unnecessary re-renders', () => {
      const renderCount = jest.fn()
      
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            tenantId: 'tenant-456',
            businessId: 'business-789'
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      const TestComponent = () => {
        const auth = useAuth()
        
        React.useEffect(() => {
          renderCount()
        }, [auth.signInWithGoogle, auth.logout, auth.updateOnboardingStep])
        
        return <div data-testid="stable-refs">Stable</div>
      }
      
      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Rerender with same session data
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Should only render once due to stable references
      expect(renderCount).toHaveBeenCalledTimes(1)
    })
  })

  describe('Real-World Usage Patterns', () => {
    
    it('should support conditional rendering based on auth state', () => {
      const { rerender } = render(
        <AuthProvider>
          <div data-testid="test-container" />
        </AuthProvider>
      )
      
      // Stage 1: Loading state
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      })
      
      const LoadingTestComponent = () => {
        const auth = useAuth()
        
        if (auth.isLoading) {
          return <div data-testid="loading-indicator">Loading...</div>
        }
        
        if (!auth.isAuthenticated) {
          return <div data-testid="signin-prompt">Please sign in</div>
        }
        
        return <div data-testid="authenticated-content">Welcome!</div>
      }
      
      rerender(
        <AuthProvider>
          <LoadingTestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
      
      // Stage 2: Unauthenticated state
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })
      
      rerender(
        <AuthProvider>
          <LoadingTestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('signin-prompt')).toBeInTheDocument()
      
      // Stage 3: Authenticated state
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            tenantId: 'tenant-456',
            businessId: 'business-789'
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      rerender(
        <AuthProvider>
          <LoadingTestComponent />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument()
    })

    it('should support role-based access control', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            tenantId: 'tenant-456',
            businessId: 'business-789',
            roles: ['admin', 'user'],
            permissions: ['read', 'write', 'delete']
          },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn()
      })
      
      const RoleBasedComponent = ({ requiredRole }: { requiredRole: string }) => {
        const auth = useAuth()
        
        const hasRole = auth.user?.roles?.includes(requiredRole)
        
        if (!hasRole) {
          return <div data-testid="access-denied">Access denied</div>
        }
        
        return <div data-testid="admin-content">Admin content</div>
      }
      
      render(
        <AuthProvider>
          <RoleBasedComponent requiredRole="admin" />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
      
      // Test with role user doesn't have
      render(
        <AuthProvider>
          <RoleBasedComponent requiredRole="super-admin" />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('access-denied')).toBeInTheDocument()
    })
  })
})