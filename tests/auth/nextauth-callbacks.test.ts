/**
 * NEXTAUTH CALLBACKS - BULLETPROOF UNIT TESTS
 * 
 * Senior Engineering Standard Tests for Authentication Phase 1-2
 * 
 * TEST PHILOSOPHY: "Either the test is flawed or the code is - both can't be true"
 * - These tests validate the exact implementation in lib/auth-config.ts
 * - Any test failure indicates a code bug that MUST be fixed
 * - NEVER simplify tests to meet failing code
 */

import { jest } from '@jest/globals'
import { NextAuthOptions } from "next-auth"

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(() => ({
      eq: jest.fn()
    })),
    update: jest.fn(() => ({
      eq: jest.fn()
    }))
  }))
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}))

// Import auth config after mocking
import { authOptions } from '@/lib/auth-config'

describe('NextAuth Callbacks - Phase 1-2 Validation', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console spy
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('signIn Callback - Google OAuth Authorization', () => {
    
    it('should allow all Google OAuth sign-ins (BYPASS mode)', async () => {
      // RIGOROUS TEST: Current implementation bypasses all checks
      // If this fails, the signIn callback implementation has changed
      
      const mockUser = {
        id: 'google-user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      }
      
      const mockAccount = {
        provider: 'google',
        type: 'oauth',
        providerAccountId: 'google-123',
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token'
      }
      
      const mockProfile = {
        sub: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      }
      
      // Execute signIn callback
      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile
      })
      
      // CRITICAL: Must always return true in bypass mode
      expect(result).toBe(true)
      
      // Should log the bypass decision
      expect(console.log).toHaveBeenCalledWith(
        '[NextAuth][signIn] forcing allow',
        expect.objectContaining({
          provider: 'google',
          email: 'test@example.com',
          id: 'google-user-123'
        })
      )
    })

    it('should handle invalid provider gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockAccount = { provider: 'invalid-provider' }
      
      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: null
      })
      
      // Even with invalid provider, should return true (bypass mode)
      expect(result).toBe(true)
    })

    it('should handle missing user data gracefully', async () => {
      const result = await authOptions.callbacks!.signIn!({
        user: { id: '', email: '' },
        account: { provider: 'google' },
        profile: null
      })
      
      // Should still allow sign-in in bypass mode
      expect(result).toBe(true)
    })
  })

  describe('JWT Callback - Token Population', () => {
    
    it('should populate JWT token with new user data', async () => {
      // RIGOROUS TEST: JWT callback must populate token with user data
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-456',
        businessId: 'business-789',
        onboardingStep: 2,
        externalId: 'ext-123',
        isActive: true,
        roles: ['admin'],
        permissions: ['read', 'write']
      }
      
      const mockToken = {
        email: 'test@example.com',
        name: 'Test User'
      }
      
      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: mockUser,
        trigger: undefined,
        session: undefined
      })
      
      // CRITICAL: All user data must be transferred to token
      expect(result).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-456',
        businessId: 'business-789',
        onboardingStep: 2
      }))
      
      // Should log the token population
      expect(console.debug).toHaveBeenCalledWith(
        '[NextAuth] JWT callback - new user',
        expect.objectContaining({
          userId: 'user-123',
          tenantId: 'tenant-456',
          businessId: 'business-789'
        })
      )
    })

    it('should handle onboarding step updates via session trigger', async () => {
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        onboardingStep: 0
      }
      
      const mockSession = {
        onboardingStep: 3
      }
      
      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: undefined,
        trigger: 'update',
        session: mockSession
      })
      
      // CRITICAL: Onboarding step must be updated from session
      expect(result.onboardingStep).toBe(3)
      
      // Other token data should remain unchanged
      expect(result.id).toBe('user-123')
      expect(result.email).toBe('test@example.com')
    })

    it('should set default onboarding step for new users', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-456',
        businessId: 'business-789'
        // Note: onboardingStep is undefined
      }
      
      const mockToken = { email: 'test@example.com' }
      
      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: mockUser,
        trigger: undefined,
        session: undefined
      })
      
      // CRITICAL: Default onboarding step must be 0 for new users
      expect(result.onboardingStep).toBe(0)
    })

    it('should preserve existing token data when no user provided', async () => {
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        onboardingStep: 2
      }
      
      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: undefined,
        trigger: undefined,
        session: undefined
      })
      
      // CRITICAL: Existing token data must be preserved
      expect(result).toEqual(mockToken)
    })
  })

  describe('Session Callback - Enterprise-Grade Session Management', () => {
    
    it('should create complete session from valid JWT token', async () => {
      // RIGOROUS TEST: Session callback must create comprehensive session
      
      const mockSession = {
        user: {
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg'
        },
        expires: '2025-01-01T00:00:00.000Z'
      }
      
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-456',
        businessId: 'business-789',
        externalId: 'ext-123',
        onboardingStep: 2,
        isActive: true,
        roles: ['admin', 'user'],
        permissions: ['read', 'write', 'delete'],
        lastLogin: '2025-01-01T00:00:00.000Z',
        exp: Math.floor(Date.now() / 1000) + 3600
      }
      
      const result = await authOptions.callbacks!.session!({
        session: mockSession,
        token: mockToken
      })
      
      // CRITICAL: Complete session object must be created
      expect(result.user).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-456',
        businessId: 'business-789',
        externalId: 'ext-123',
        onboardingStep: 2,
        isActive: true,
        roles: ['admin', 'user'],
        permissions: ['read', 'write', 'delete'],
        lastLogin: '2025-01-01T00:00:00.000Z',
        image: 'https://example.com/avatar.jpg'
      }))
      
      // Should log successful session creation
      expect(console.log).toHaveBeenCalledWith(
        '[Auth][Session] Session populated successfully:',
        expect.objectContaining({
          userId: 'user-123',
          tenantId: 'tenant-456',
          businessId: 'business-789'
        })
      )
    })

    it('should handle new users without business context', async () => {
      const mockSession = {
        user: { email: 'new@example.com' },
        expires: '2025-01-01T00:00:00.000Z'
      }
      
      const mockToken = {
        id: 'user-new',
        email: 'new@example.com',
        name: 'New User',
        onboardingStep: 0
        // Note: tenantId and businessId are undefined (new user)
      }
      
      const result = await authOptions.callbacks!.session!({
        session: mockSession,
        token: mockToken
      })
      
      // Should create session with empty business context
      expect(result.user).toEqual(expect.objectContaining({
        id: 'user-new',
        tenantId: '',
        businessId: '',
        onboardingStep: 0
      }))
      
      // Should log warning about missing business context
      expect(console.warn).toHaveBeenCalledWith(
        '[Auth][Session] Missing critical business context:',
        expect.objectContaining({
          userId: 'user-new',
          requiresOnboarding: true
        })
      )
    })

    it('should force re-onboarding for existing users without business context', async () => {
      const mockSession = {
        user: { email: 'existing@example.com' },
        expires: '2025-01-01T00:00:00.000Z'
      }
      
      const mockToken = {
        id: 'user-existing',
        email: 'existing@example.com',
        name: 'Existing User',
        onboardingStep: 5 // Existing user but missing business context
        // Note: tenantId and businessId are undefined
      }
      
      const result = await authOptions.callbacks!.session!({
        session: mockSession,
        token: mockToken
      })
      
      // CRITICAL: Should force re-onboarding for security
      expect(result.user.onboardingStep).toBe(0)
      
      // Should log error for existing user missing context
      expect(console.error).toHaveBeenCalledWith(
        '[Auth][Session] Critical: Existing user missing business context'
      )
    })

    it('should throw error when session object is missing', async () => {
      await expect(
        authOptions.callbacks!.session!({
          session: null as any,
          token: { id: 'user-123', email: 'test@example.com', name: 'Test' }
        })
      ).rejects.toThrow('Session object is required')
    })

    it('should return degraded session when user object is missing from session', async () => {
      const result = await authOptions.callbacks!.session!({
        session: { expires: '2025-01-01T00:00:00.000Z' } as any,
        token: { id: 'user-123', email: 'test@example.com', name: 'Test' }
      })
      
      // Should return degraded but valid session
      expect(result.user).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test',
        onboardingStep: 0, // Forced for safety
        tenantId: '',
        businessId: ''
      }))
      
      // Should log degraded session warning
      expect(console.warn).toHaveBeenCalledWith(
        '[Auth][Session] Returning degraded session due to error'
      )
    })

    it('should throw error when JWT token is missing', async () => {
      await expect(
        authOptions.callbacks!.session!({
          session: { user: { email: 'test@example.com' }, expires: '2025-01-01T00:00:00.000Z' },
          token: null as any
        })
      ).rejects.toThrow('JWT token is required for session')
    })

    it('should throw error when essential token data is missing', async () => {
      const mockSession = {
        user: { email: 'test@example.com' },
        expires: '2025-01-01T00:00:00.000Z'
      }
      
      // Missing required fields
      const invalidToken = {
        // Missing id, email, name
      }
      
      await expect(
        authOptions.callbacks!.session!({
          session: mockSession,
          token: invalidToken as any
        })
      ).rejects.toThrow(/Invalid token:.*missing/)
    })

    it('should return degraded session on processing error with valid token', async () => {
      const mockSession = {
        user: { email: 'test@example.com' },
        expires: '2025-01-01T00:00:00.000Z'
      }
      
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
      
      // Simulate processing error by providing invalid session structure
      const invalidSession = {
        ...mockSession,
        user: null // This will cause an error in processing
      }
      
      const result = await authOptions.callbacks!.session!({
        session: invalidSession as any,
        token: mockToken
      })
      
      // Should return degraded but valid session
      expect(result.user).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        onboardingStep: 0 // Forced for safety
      }))
      
      // Should log degraded session warning
      expect(console.warn).toHaveBeenCalledWith(
        '[Auth][Session] Returning degraded session due to error'
      )
    })

    it('should set default values for optional fields', async () => {
      const mockSession = {
        user: { email: 'test@example.com' },
        expires: '2025-01-01T00:00:00.000Z'
      }
      
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
        // Missing all optional fields
      }
      
      const result = await authOptions.callbacks!.session!({
        session: mockSession,
        token: mockToken
      })
      
      // Should set safe defaults
      expect(result.user).toEqual(expect.objectContaining({
        tenantId: '',
        businessId: '',
        onboardingStep: 0,
        isActive: true,
        roles: [],
        permissions: []
      }))
    })
  })

  describe('Redirect Callback - Navigation Logic', () => {
    
    it('should redirect to dashboard for successful authentication', async () => {
      const baseUrl = 'https://example.com'
      
      const result = await authOptions.callbacks!.redirect!({
        url: '/auth/signin',
        baseUrl
      })
      
      expect(result).toBe('https://example.com/dashboard')
    })

    it('should preserve valid internal URLs', async () => {
      const baseUrl = 'https://example.com'
      const url = 'https://example.com/dashboard/settings'
      
      const result = await authOptions.callbacks!.redirect!({
        url,
        baseUrl
      })
      
      expect(result).toBe(url)
    })

    it('should redirect external URLs to dashboard', async () => {
      const baseUrl = 'https://example.com'
      const externalUrl = 'https://malicious.com/redirect'
      
      const result = await authOptions.callbacks!.redirect!({
        url: externalUrl,
        baseUrl
      })
      
      expect(result).toBe('https://example.com/dashboard')
    })
  })

  describe('Configuration Validation', () => {
    
    it('should have correct provider configuration', () => {
      expect(authOptions.providers).toHaveLength(1)
      expect(authOptions.providers[0]).toEqual(
        expect.objectContaining({
          id: 'google'
        })
      )
    })

    it('should use JWT strategy', () => {
      expect(authOptions.session?.strategy).toBe('jwt')
    })

    it('should have correct session and JWT max age', () => {
      const thirtyDays = 30 * 24 * 60 * 60
      expect(authOptions.session?.maxAge).toBe(thirtyDays)
      expect(authOptions.jwt?.maxAge).toBe(thirtyDays)
    })

    it('should have debug mode enabled', () => {
      expect(authOptions.debug).toBe(true)
    })

    it('should have correct page configurations', () => {
      expect(authOptions.pages).toEqual({
        signIn: "/auth/signin",
        error: "/auth/error"
      })
    })
  })
})