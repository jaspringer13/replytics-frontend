/**
 * TENANT ISOLATION SECURITY - BULLETPROOF SECURITY TESTS
 * 
 * Senior Engineering Standard Tests for Multi-Tenant Security
 * 
 * TEST PHILOSOPHY: "Either the test is flawed or the code is - both can't be true"
 * - These tests validate that tenant isolation is bulletproof
 * - Any test failure indicates a CRITICAL security vulnerability
 * - NEVER simplify tests to meet failing code - fix the security holes
 */

import { jest } from '@jest/globals'
import { 
  validateTenantAccess, 
  validateBusinessContext, 
  validateResourceOwnership,
  createTenantScopedQuery,
  createBusinessScopedQuery,
  getUserAccessibleBusinesses,
  TenantIsolationError
} from '@/lib/auth/tenant-isolation'
import { UnauthorizedError, ValidatedSession } from '@/lib/auth/jwt-validation'

// Mock Supabase client
const mockSupabaseQuery = {
  select: jest.fn(() => mockSupabaseQuery),
  eq: jest.fn(() => mockSupabaseQuery),
  single: jest.fn(),
  insert: jest.fn(() => mockSupabaseQuery)
}

const mockSupabase = {
  from: jest.fn(() => mockSupabaseQuery)
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}))

describe('Tenant Isolation Security Tests - Critical Security Validation', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console spies
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('validateTenantAccess - Cross-Tenant Access Prevention', () => {
    
    const validSession: ValidatedSession = {
      userId: 'user-123',
      email: 'test@example.com',
      tenantId: 'tenant-456',
      businessId: 'business-789',
      roles: ['user'],
      permissions: ['read'],
      sessionId: 'session-123'
    }

    it('should BLOCK cross-tenant access attempts', async () => {
      // CRITICAL SECURITY TEST: Must prevent access to other tenant's data
      
      const maliciousTenantId = 'malicious-tenant-999'
      
      // Attempt cross-tenant access
      await expect(
        validateTenantAccess(validSession, maliciousTenantId, '/api/sensitive-data')
      ).rejects.toThrow(UnauthorizedError)
      
      await expect(
        validateTenantAccess(validSession, maliciousTenantId, '/api/sensitive-data')
      ).rejects.toThrow('Access denied to requested tenant data')
      
      // Should log security violation
      expect(console.error).toHaveBeenCalledWith(
        'SECURITY ALERT - Tenant Isolation Violation:',
        expect.objectContaining({
          type: 'CROSS_TENANT_ACCESS_ATTEMPT',
          userId: 'user-123',
          authorizedTenant: 'tenant-456',
          requestedTenant: 'malicious-tenant-999'
        })
      )
    })

    it('should ALLOW access to authorized tenant with valid business', async () => {
      // Mock successful business lookup
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'business-789',
          name: 'Test Business',
          tenant_id: 'tenant-456',
          is_active: true,
          subscription_tier: 'pro',
          features: ['feature1', 'feature2'],
          owner_id: 'user-123',
          business_users: [
            { user_id: 'user-123', role: 'owner', is_active: true }
          ]
        },
        error: null
      })
      
      const result = await validateTenantAccess(
        validSession, 
        'tenant-456', // Same as session tenant
        '/api/dashboard/analytics'
      )
      
      // Should return complete tenant context
      expect(result).toEqual({
        tenantId: 'tenant-456',
        businessId: 'business-789',
        businessName: 'Test Business',
        isActive: true,
        subscriptionTier: 'pro',
        features: ['feature1', 'feature2']
      })
      
      // Should log successful access
      expect(mockSupabase.from).toHaveBeenCalledWith('security_audit_log')
    })

    it('should BLOCK access to inactive businesses', async () => {
      // Mock inactive business
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'business-789',
          tenant_id: 'tenant-456',
          is_active: false, // Business is inactive
          owner_id: 'user-123'
        },
        error: null
      })
      
      await expect(
        validateTenantAccess(validSession, 'tenant-456')
      ).rejects.toThrow(UnauthorizedError)
      
      await expect(
        validateTenantAccess(validSession, 'tenant-456')
      ).rejects.toThrow('Requested tenant not found or inactive')
    })

    it('should BLOCK unauthorized users from business access', async () => {
      // Mock business where user has no access
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'business-789',
          tenant_id: 'tenant-456',
          is_active: true,
          owner_id: 'different-user-456', // Different owner
          business_users: [
            { user_id: 'different-user-789', role: 'admin', is_active: true }
            // Current user not in business_users
          ]
        },
        error: null
      })
      
      await expect(
        validateTenantAccess(validSession, 'tenant-456')
      ).rejects.toThrow(UnauthorizedError)
      
      await expect(
        validateTenantAccess(validSession, 'tenant-456')
      ).rejects.toThrow('User not authorized to access this business')
    })

    it('should BLOCK access when business lookup fails', async () => {
      // Mock database error
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Business not found' }
      })
      
      await expect(
        validateTenantAccess(validSession, 'tenant-456')
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should handle database errors securely', async () => {
      // Mock database connection failure
      mockSupabaseQuery.single.mockRejectedValue(new Error('Database connection failed'))
      
      await expect(
        validateTenantAccess(validSession, 'tenant-456')
      ).rejects.toThrow(TenantIsolationError)
    })
  })

  describe('validateBusinessContext - Business-Level Security', () => {
    
    const validSession: ValidatedSession = {
      userId: 'user-123',
      email: 'test@example.com',
      tenantId: 'tenant-456',
      businessId: 'business-789',
      roles: ['user'],
      permissions: ['read'],
      sessionId: 'session-123'
    }

    it('should ALLOW access to user-owned business', async () => {
      // Mock business owned by user
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'business-789',
          tenant_id: 'tenant-456',
          is_active: true,
          owner_id: 'user-123', // User owns this business
          business_users: []
        },
        error: null
      })
      
      const result = await validateBusinessContext(validSession, 'business-789')
      expect(result).toBe(true)
    })

    it('should ALLOW access to business where user is authorized member', async () => {
      // Mock business where user is authorized member
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'business-789',
          tenant_id: 'tenant-456',
          is_active: true,
          owner_id: 'different-user-456',
          business_users: [
            { user_id: 'user-123', is_active: true } // User is authorized member
          ]
        },
        error: null
      })
      
      const result = await validateBusinessContext(validSession, 'business-789')
      expect(result).toBe(true)
    })

    it('should BLOCK access to business in different tenant', async () => {
      // Mock business in different tenant
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'business-789',
          tenant_id: 'different-tenant-999', // Different tenant!
          is_active: true,
          owner_id: 'user-123'
        },
        error: null
      })
      
      const result = await validateBusinessContext(validSession, 'business-789')
      expect(result).toBe(false)
    })

    it('should BLOCK access to inactive business', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'business-789',
          tenant_id: 'tenant-456',
          is_active: false, // Inactive business
          owner_id: 'user-123'
        },
        error: null
      })
      
      const result = await validateBusinessContext(validSession, 'business-789')
      expect(result).toBe(false)
    })

    it('should BLOCK access when user is not authorized', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'business-789',
          tenant_id: 'tenant-456',
          is_active: true,
          owner_id: 'different-user-456',
          business_users: [
            { user_id: 'different-user-789', is_active: true }
            // Current user not authorized
          ]
        },
        error: null
      })
      
      const result = await validateBusinessContext(validSession, 'business-789')
      expect(result).toBe(false)
    })
  })

  describe('validateResourceOwnership - Resource-Level Security', () => {
    
    const validSession: ValidatedSession = {
      userId: 'user-123',
      email: 'test@example.com',
      tenantId: 'tenant-456',
      businessId: 'business-789',
      roles: ['user'],
      permissions: ['read'],
      sessionId: 'session-123'
    }

    it('should ALLOW access to resource owned by same tenant', async () => {
      // Mock resource in same tenant
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'resource-123',
          tenant_id: 'tenant-456' // Same tenant
        },
        error: null
      })
      
      const result = await validateResourceOwnership(
        validSession,
        'phone_numbers',
        'resource-123'
      )
      
      expect(result).toBe(true)
    })

    it('should BLOCK access to resource in different tenant', async () => {
      // Mock resource in different tenant
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'resource-123',
          tenant_id: 'malicious-tenant-999' // Different tenant!
        },
        error: null
      })
      
      const result = await validateResourceOwnership(
        validSession,
        'phone_numbers',
        'resource-123'
      )
      
      expect(result).toBe(false)
      
      // Should log security violation
      expect(console.error).toHaveBeenCalledWith(
        'SECURITY ALERT - Tenant Isolation Violation:',
        expect.objectContaining({
          type: 'CROSS_TENANT_RESOURCE_ACCESS',
          userId: 'user-123',
          authorizedTenant: 'tenant-456',
          requestedTenant: 'malicious-tenant-999'
        })
      )
    })

    it('should validate business-level resource access', async () => {
      // Mock resource with business constraint
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'resource-123',
          tenant_id: 'tenant-456',
          business_id: 'business-789'
        },
        error: null
      })
      
      // Mock business validation success
      const mockBusinessValidation = jest.fn().mockResolvedValue(true)
      jest.doMock('@/lib/auth/tenant-isolation', () => ({
        ...jest.requireActual('@/lib/auth/tenant-isolation'),
        validateBusinessContext: mockBusinessValidation
      }))
      
      const result = await validateResourceOwnership(
        validSession,
        'services',
        'resource-123',
        'tenant_id',
        'business_id'
      )
      
      expect(result).toBe(true)
    })

    it('should BLOCK access when resource not found', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Resource not found' }
      })
      
      const result = await validateResourceOwnership(
        validSession,
        'phone_numbers',
        'nonexistent-resource'
      )
      
      expect(result).toBe(false)
    })
  })

  describe('Database Query Scoping - Bulletproof Query Protection', () => {
    
    const validSession: ValidatedSession = {
      userId: 'user-123',
      email: 'test@example.com',
      tenantId: 'tenant-456',
      businessId: 'business-789',
      roles: ['user'],
      permissions: ['read'],
      sessionId: 'session-123'
    }

    it('should create tenant-scoped queries correctly', () => {
      const mockQuery = {
        eq: jest.fn(() => mockQuery)
      }
      
      const scopedQuery = createTenantScopedQuery(mockQuery, validSession)
      
      // Should add tenant filter
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant-456')
      expect(scopedQuery).toBe(mockQuery)
    })

    it('should create business-scoped queries correctly', () => {
      const mockQuery = {
        eq: jest.fn(() => mockQuery)
      }
      
      const scopedQuery = createBusinessScopedQuery(
        mockQuery, 
        validSession, 
        'business-specific-123'
      )
      
      // Should add both tenant and business filters
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant-456')
      expect(mockQuery.eq).toHaveBeenCalledWith('business_id', 'business-specific-123')
    })

    it('should use session business ID when no specific business provided', () => {
      const mockQuery = {
        eq: jest.fn(() => mockQuery)
      }
      
      const scopedQuery = createBusinessScopedQuery(mockQuery, validSession)
      
      // Should use session's business ID
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant-456')
      expect(mockQuery.eq).toHaveBeenCalledWith('business_id', 'business-789')
    })

    it('should support custom column names', () => {
      const mockQuery = {
        eq: jest.fn(() => mockQuery)
      }
      
      createTenantScopedQuery(mockQuery, validSession, 'custom_tenant_column')
      
      expect(mockQuery.eq).toHaveBeenCalledWith('custom_tenant_column', 'tenant-456')
    })
  })

  describe('getUserAccessibleBusinesses - Business Access Control', () => {
    
    const validSession: ValidatedSession = {
      userId: 'user-123',
      email: 'test@example.com',
      tenantId: 'tenant-456',
      businessId: 'business-789',
      roles: ['user'],
      permissions: ['read'],
      sessionId: 'session-123'
    }

    it('should return only businesses user owns or has access to', async () => {
      // Mock businesses query
      mockSupabaseQuery.single = undefined // Reset single method
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'business-owned',
                  name: 'Owned Business',
                  owner_id: 'user-123', // User owns this
                  business_users: []
                },
                {
                  id: 'business-member',
                  name: 'Member Business',
                  owner_id: 'different-user',
                  business_users: [
                    { user_id: 'user-123', role: 'admin', is_active: true } // User is member
                  ]
                },
                {
                  id: 'business-no-access',
                  name: 'No Access Business',
                  owner_id: 'different-user',
                  business_users: [
                    { user_id: 'different-user-2', role: 'admin', is_active: true }
                    // User has no access
                  ]
                }
              ],
              error: null
            })
          }))
        }))
      })
      
      const result = await getUserAccessibleBusinesses(validSession)
      
      // Should return only businesses user has access to
      expect(result).toEqual([
        {
          id: 'business-owned',
          name: 'Owned Business',
          role: 'owner'
        },
        {
          id: 'business-member',
          name: 'Member Business',
          role: 'admin'
        }
      ])
      
      // Should NOT include business-no-access
      expect(result).not.toContainEqual(
        expect.objectContaining({ id: 'business-no-access' })
      )
    })

    it('should return empty array when database query fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          }))
        }))
      })
      
      const result = await getUserAccessibleBusinesses(validSession)
      expect(result).toEqual([])
    })
  })

  describe('Security Audit Logging', () => {
    
    it('should log all security violations to audit table', async () => {
      const validSession: ValidatedSession = {
        userId: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        businessId: 'business-789',
        roles: ['user'],
        permissions: ['read'],
        sessionId: 'session-123'
      }
      
      // Attempt cross-tenant access to trigger logging
      try {
        await validateTenantAccess(validSession, 'malicious-tenant-999')
      } catch (error) {
        // Expected to throw
      }
      
      // Should insert security event into audit log
      expect(mockSupabase.from).toHaveBeenCalledWith('security_audit_log')
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'CROSS_TENANT_ACCESS_ATTEMPT',
          user_id: 'user-123',
          email: 'test@example.com',
          tenant_id: 'tenant-456',
          severity: 'HIGH'
        })
      )
    })

    it('should not fail when audit logging fails', async () => {
      // Mock audit logging failure
      mockSupabaseQuery.insert.mockRejectedValue(new Error('Logging failed'))
      
      const validSession: ValidatedSession = {
        userId: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        businessId: 'business-789',
        roles: ['user'],
        permissions: ['read'],
        sessionId: 'session-123'
      }
      
      // Should still throw security error even if logging fails
      await expect(
        validateTenantAccess(validSession, 'malicious-tenant-999')
      ).rejects.toThrow(UnauthorizedError)
      
      // Should log error to console as fallback
      expect(console.error).toHaveBeenCalledWith(
        'Failed to log tenant violation:',
        expect.any(Error)
      )
    })
  })

  describe('Edge Cases and Attack Vectors', () => {
    
    it('should prevent SQL injection in tenant ID', async () => {
      const validSession: ValidatedSession = {
        userId: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        businessId: 'business-789',
        roles: ['user'],
        permissions: ['read'],
        sessionId: 'session-123'
      }
      
      const maliciousTenantId = "'; DROP TABLE businesses; --"
      
      await expect(
        validateTenantAccess(validSession, maliciousTenantId)
      ).rejects.toThrow(UnauthorizedError)
      
      // Should treat as regular cross-tenant access attempt
      expect(console.error).toHaveBeenCalledWith(
        'SECURITY ALERT - Tenant Isolation Violation:',
        expect.objectContaining({
          requestedTenant: maliciousTenantId
        })
      )
    })

    it('should handle null/undefined tenant ID attacks', async () => {
      const validSession: ValidatedSession = {
        userId: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        businessId: 'business-789',
        roles: ['user'],
        permissions: ['read'],
        sessionId: 'session-123'
      }
      
      await expect(
        validateTenantAccess(validSession, null as any)
      ).rejects.toThrow(UnauthorizedError)
      
      await expect(
        validateTenantAccess(validSession, undefined as any)
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should prevent privilege escalation through role manipulation', async () => {
      // Mock business with complex permission structure
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'business-789',
          tenant_id: 'tenant-456',
          is_active: true,
          owner_id: 'different-user',
          business_users: [
            { user_id: 'user-123', role: 'read-only', is_active: false } // Inactive user
          ]
        },
        error: null
      })
      
      const validSession: ValidatedSession = {
        userId: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        businessId: 'business-789',
        roles: ['admin'], // User claims admin role in JWT
        permissions: ['read', 'write', 'delete'], // User claims extensive permissions
        sessionId: 'session-123'
      }
      
      // Should still deny access because user is inactive in business
      await expect(
        validateTenantAccess(validSession, 'tenant-456')
      ).rejects.toThrow(UnauthorizedError)
    })
  })
})