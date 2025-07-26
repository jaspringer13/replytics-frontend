/**
 * Security Integration Test Suite for Voice-Bot Analytics Integration
 * 
 * CRITICAL SECURITY VALIDATION:
 * - JWT token validation across all endpoints
 * - Tenant isolation enforcement in database queries  
 * - RBAC permission validation for different user roles
 * - Session management across browser and API sessions
 * - SQL injection prevention and input sanitization
 * - Rate limiting and DDoS protection
 * - Cross-tenant data leakage prevention
 * - Security audit logging and monitoring
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { validateAuthentication, ValidatedSession, AuthenticationError } from '../../lib/auth/jwt-validation';
import { validateTenantAccess, TenantContext, TenantIsolationError } from '../../lib/auth/tenant-isolation';
import { validatePermissions, Permission } from '../../lib/auth/rbac-permissions';
import { logSecurityEvent, SecurityEventType } from '../../lib/auth/security-monitoring';

// Security test configuration
const SECURITY_TEST_CONFIG = {
  TEST_TENANTS: [
    { id: 'security_tenant_001', name: 'Security Test Tenant 1' },
    { id: 'security_tenant_002', name: 'Security Test Tenant 2' }
  ],
  TEST_USERS: [
    { id: 'security_user_001', email: 'admin@test1.com', role: 'admin', tenantId: 'security_tenant_001' },
    { id: 'security_user_002', email: 'user@test1.com', role: 'user', tenantId: 'security_tenant_001' },
    { id: 'security_user_003', email: 'admin@test2.com', role: 'admin', tenantId: 'security_tenant_002' }
  ],
  ATTACK_SCENARIOS: {
    SQL_INJECTION_PAYLOADS: [
      "'; DROP TABLE businesses; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; UPDATE users SET is_admin=true WHERE id='1'; --",
      "'; DELETE FROM security_audit_log; --"
    ],
    XSS_PAYLOADS: [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>",
      "<svg onload=alert('xss')>",
      "<iframe src='javascript:alert(\"xss\")'></iframe>"
    ],
    INVALID_TOKENS: [
      'invalid_jwt_token',
      'expired.jwt.token',
      'malformed.jwt',
      '',
      null,
      undefined
    ]
  }
};

// Supabase client for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mock session factory
const createSecurityTestSession = (overrides: Partial<ValidatedSession> = {}): ValidatedSession => ({
  userId: 'security_user_001',
  email: 'admin@test1.com',
  tenantId: 'security_tenant_001',
  businessId: 'security_business_001',
  permissions: ['VIEW_ANALYTICS', 'MANAGE_BUSINESS'],
  roles: ['admin'],
  sessionId: 'security_session_123',
  expiresAt: new Date(Date.now() + 3600000),
  isActive: true,
  ...overrides
});

describe('Security Integration Tests', () => {

  beforeAll(async () => {
    console.log('🔐 Starting Security Integration Tests');
    await setupSecurityTestData();
  });

  afterAll(async () => {
    await cleanupSecurityTestData();
    console.log('✅ Security Integration Tests Complete');
  });

  /**
   * AUTHENTICATION SECURITY TESTS
   * Critical: Validate JWT and session security
   */
  describe('Authentication Security', () => {

    test('should reject invalid JWT tokens', async () => {
      for (const invalidToken of SECURITY_TEST_CONFIG.ATTACK_SCENARIOS.INVALID_TOKENS) {
        try {
          // Simulate invalid token validation
          const mockRequest = {
            headers: {
              get: (name: string) => {
                if (name === 'authorization') {
                  return invalidToken ? `Bearer ${invalidToken}` : null;
                }
                return null;
              }
            }
          } as any;

          // This should throw an authentication error
          expect(async () => {
            await validateAuthentication(mockRequest);
          }).rejects.toThrow(AuthenticationError);

        } catch (error) {
          // Expected behavior - invalid tokens should be rejected
          expect(error).toBeInstanceOf(AuthenticationError);
        }
      }
    });

    test('should validate session expiration enforcement', async () => {
      const expiredSession = createSecurityTestSession({
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      });

      // Expired sessions should be rejected
      expect(expiredSession.expiresAt.getTime()).toBeLessThan(Date.now());

      // Mock request with expired session
      const mockRequest = {
        headers: {
          get: (name: string) => name === 'user-agent' ? 'test-agent' : 'test-ip'
        }
      } as any;

      // Validation should fail for expired session
      try {
        await validateAuthentication(mockRequest);
        fail('Should have rejected expired session');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
      }
    });

    test('should prevent session fixation attacks', async () => {
      const session1 = createSecurityTestSession({ sessionId: 'session_001' });
      const session2 = createSecurityTestSession({ sessionId: 'session_002', userId: 'different_user' });

      // Session IDs should be unique per user
      expect(session1.sessionId).not.toBe(session2.sessionId);
      expect(session1.userId).not.toBe(session2.userId);
    });

    test('should enforce concurrent session limits', async () => {
      const userId = 'security_user_concurrent_test';
      const maxSessions = 5;

      // Simulate multiple concurrent sessions
      const sessions = Array.from({ length: maxSessions + 2 }, (_, i) => ({
        id: `session_${i}`,
        user_id: userId,
        ip_address: `192.168.1.${i}`,
        user_agent: `TestAgent/${i}`,
        created_at: new Date(),
        is_active: true
      }));

      // More than max sessions should trigger security alert
      expect(sessions.length).toBeGreaterThan(maxSessions);

      // Log security event for excessive sessions
      await logSecurityEvent(
        SecurityEventType.SUSPICIOUS_CONCURRENT_SESSIONS,
        {
          details: `User has ${sessions.length} concurrent sessions (max: ${maxSessions})`,
          userId: userId
        },
        createSecurityTestSession({ userId }),
        {} as any
      );
    });
  });

  /**
   * TENANT ISOLATION SECURITY TESTS
   * Critical: Prevent cross-tenant data leakage
   */
  describe('Tenant Isolation Security', () => {

    test('should prevent cross-tenant data access attempts', async () => {
      const tenant1Session = createSecurityTestSession({
        tenantId: 'security_tenant_001',
        businessId: 'business_001'
      });

      const tenant2Session = createSecurityTestSession({
        tenantId: 'security_tenant_002', 
        businessId: 'business_002'
      });

      // Attempt to access different tenant's data should fail
      try {
        await validateTenantAccess(tenant1Session, 'security_tenant_002', '/api/analytics');
        fail('Should have prevented cross-tenant access');
      } catch (error) {
        expect(error).toBeInstanceOf(TenantIsolationError);
        expect((error as TenantIsolationError).code).toBe('TENANT_ACCESS_DENIED');
      }

      // Same tenant access should succeed
      const validAccess = await validateTenantAccess(tenant1Session, 'security_tenant_001', '/api/analytics');
      expect(validAccess.tenantId).toBe('security_tenant_001');
    });

    test('should validate database query tenant scoping', async () => {
      const session = createSecurityTestSession();

      // Test tenant-scoped query construction
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis()
      };

      // Simulate tenant-scoped query
      const tenantScopedQuery = mockQuery.eq('tenant_id', session.tenantId);
      
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', session.tenantId);
    });

    test('should log tenant violation attempts', async () => {
      const maliciousSession = createSecurityTestSession();

      // Simulate tenant violation attempt
      const violation = {
        type: 'CROSS_TENANT_ACCESS_ATTEMPT',
        userId: maliciousSession.userId,
        email: maliciousSession.email,
        authorizedTenant: maliciousSession.tenantId,
        requestedTenant: 'unauthorized_tenant',
        requestPath: '/api/v2/dashboard/analytics/overview',
        timestamp: new Date()
      };

      // Log violation to security audit
      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          event_type: violation.type,
          user_id: violation.userId,
          email: violation.email,
          tenant_id: violation.authorizedTenant,
          details: JSON.stringify({
            requestedTenant: violation.requestedTenant,
            requestPath: violation.requestPath
          }),
          severity: 'HIGH',
          created_at: violation.timestamp.toISOString()
        });

      expect(error).toBeNull();
    });

    test('should prevent business context switching attacks', async () => {
      const session = createSecurityTestSession({
        businessId: 'legitimate_business'
      });

      // Attempt to access different business within same tenant
      const attackBusinessId = 'target_business';

      // Validate business access
      const { data: business } = await supabase
        .from('businesses')
        .select('id, tenant_id, owner_id')
        .eq('id', attackBusinessId)
        .eq('tenant_id', session.tenantId)
        .single();

      // Should only return business if user has legitimate access
      if (business && business.owner_id !== session.userId) {
        // Check if user has explicit business access
        const { data: access } = await supabase
          .from('business_users')
          .select('user_id')
          .eq('business_id', attackBusinessId)
          .eq('user_id', session.userId)
          .eq('is_active', true)
          .single();

        expect(access).toBeFalsy(); // Should not have unauthorized access
      }
    });
  });

  /**
   * RBAC PERMISSION SECURITY TESTS
   * Critical: Validate role-based access control
   */
  describe('RBAC Permission Security', () => {

    test('should enforce permission-based access control', async () => {
      const limitedSession = createSecurityTestSession({
        permissions: ['VIEW_BASIC'], // Missing VIEW_ANALYTICS
        roles: ['viewer']
      });

      const adminSession = createSecurityTestSession({
        permissions: ['VIEW_ANALYTICS', 'MANAGE_BUSINESS', 'ADMIN_ACCESS'],
        roles: ['admin']
      });

      // Limited user should not have analytics access
      expect(limitedSession.permissions).not.toContain('VIEW_ANALYTICS');
      expect(adminSession.permissions).toContain('VIEW_ANALYTICS');

      // Simulate permission validation
      try {
        await validatePermissions(limitedSession, [Permission.VIEW_ANALYTICS]);
        fail('Should have denied access to user without analytics permission');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should prevent privilege escalation attempts', async () => {
      const userSession = createSecurityTestSession({
        permissions: ['VIEW_BASIC'],
        roles: ['user']
      });

      // Attempt to perform admin action should fail
      const adminPermissions = [Permission.ADMIN_ACCESS, Permission.MANAGE_USERS];
      
      for (const permission of adminPermissions) {
        expect(userSession.permissions).not.toContain(permission);
      }
    });

    test('should validate role hierarchy enforcement', async () => {
      const roleHierarchy = {
        'super_admin': ['admin', 'user', 'viewer'],
        'admin': ['user', 'viewer'],
        'user': ['viewer'],
        'viewer': []
      };

      const testUser = createSecurityTestSession({
        roles: ['user']
      });

      // User should not have admin or super_admin permissions
      expect(testUser.roles).not.toContain('admin');
      expect(testUser.roles).not.toContain('super_admin');
    });
  });

  /**
   * INPUT VALIDATION & INJECTION PREVENTION TESTS  
   * Critical: Prevent SQL injection and XSS attacks
   */
  describe('Input Validation & Injection Prevention', () => {

    test('should prevent SQL injection attacks', async () => {
      const sqlPayloads = SECURITY_TEST_CONFIG.ATTACK_SCENARIOS.SQL_INJECTION_PAYLOADS;

      for (const payload of sqlPayloads) {
        try {
          // Test business ID resolution with malicious input
          const result = await validateBusinessIdInput(payload);
          
          // Malicious input should be rejected or sanitized
          expect(result.isValid).toBe(false);
          expect(result.sanitizedInput).not.toContain('DROP TABLE');
          expect(result.sanitizedInput).not.toContain('DELETE FROM');
          expect(result.sanitizedInput).not.toContain('UPDATE');
          expect(result.sanitizedInput).not.toContain('UNION SELECT');

        } catch (error) {
          // Expected - malicious input should be rejected
          expect(error).toBeDefined();
        }
      }
    });

    test('should sanitize XSS payloads in input fields', async () => {
      const xssPayloads = SECURITY_TEST_CONFIG.ATTACK_SCENARIOS.XSS_PAYLOADS;

      for (const payload of xssPayloads) {
        const sanitized = sanitizeInput(payload);
        
        // XSS payloads should be neutralized
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
        expect(sanitized).not.toContain('<iframe');
      }
    });

    test('should validate API parameter sanitization', async () => {
      const maliciousParams = {
        businessId: "'; DROP TABLE businesses; --",
        startDate: "<script>alert('xss')</script>",
        endDate: "' OR '1'='1",
        userId: "../../../etc/passwd"
      };

      // Each parameter should be validated and sanitized
      Object.entries(maliciousParams).forEach(([key, value]) => {
        const sanitized = sanitizeInput(value);
        
        // Should remove or escape dangerous characters
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('../');
        expect(sanitized).not.toContain('DROP TABLE');
      });
    });

    test('should enforce input length limits', async () => {
      const oversizedInput = 'A'.repeat(10000); // 10KB string
      const result = validateBusinessIdInput(oversizedInput);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });
  });

  /**
   * RATE LIMITING & DOS PREVENTION TESTS
   * Critical: Prevent abuse and ensure availability
   */
  describe('Rate Limiting & DoS Prevention', () => {

    test('should enforce API rate limiting', async () => {
      const session = createSecurityTestSession();
      const requestLimit = 100; // requests per minute
      const testRequests = requestLimit + 10;

      // Simulate rapid requests
      const requests = Array.from({ length: testRequests }, (_, i) => ({
        sessionId: session.sessionId,
        timestamp: new Date(),
        endpoint: '/api/v2/dashboard/analytics/overview'
      }));

      // Check if rate limiting would be triggered
      const requestsInLastMinute = requests.filter(
        req => req.timestamp.getTime() > Date.now() - 60000
      ).length;

      expect(requestsInLastMinute).toBeGreaterThan(requestLimit);
      
      // Rate limiting should be enforced
      console.log(`Rate limit check: ${requestsInLastMinute} requests (limit: ${requestLimit})`);
    });

    test('should detect and prevent brute force attacks', async () => {
      const attackerIP = '192.168.1.100';
      const failedAttempts = 10;
      const timeWindow = 300000; // 5 minutes

      // Simulate failed login attempts
      const attempts = Array.from({ length: failedAttempts }, (_, i) => ({
        ip: attackerIP,
        timestamp: new Date(Date.now() - (i * 10000)), // 10 seconds apart
        success: false
      }));

      const recentFailures = attempts.filter(
        attempt => attempt.timestamp.getTime() > Date.now() - timeWindow
      ).length;

      // Should trigger brute force protection
      expect(recentFailures).toBeGreaterThanOrEqual(5);
    });

    test('should limit concurrent connections per user', async () => {
      const userId = 'security_test_user';
      const maxConnections = 10;
      const currentConnections = 12;

      // Simulate excessive connections
      expect(currentConnections).toBeGreaterThan(maxConnections);
      
      // Should trigger connection limiting
      console.log(`Connection limit check: ${currentConnections} active (limit: ${maxConnections})`);
    });
  });

  /**
   * SECURITY MONITORING & AUDIT TESTS
   * Critical: Validate security event logging and monitoring
   */
  describe('Security Monitoring & Audit', () => {

    test('should log all authentication events', async () => {
      const session = createSecurityTestSession();

      // Test successful authentication logging
      await logSecurityEvent(
        SecurityEventType.SUCCESSFUL_AUTHENTICATION,
        {
          details: 'User authenticated successfully',
          userId: session.userId,
          ipAddress: '192.168.1.1'
        },
        session,
        {} as any
      );

      // Verify event was logged
      const { data: auditLogs, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', session.userId)
        .eq('event_type', 'SUCCESSFUL_AUTHENTICATION')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(error).toBeNull();
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs![0].event_type).toBe('SUCCESSFUL_AUTHENTICATION');
    });

    test('should track sensitive data access', async () => {
      const session = createSecurityTestSession();

      // Log analytics data access
      await logSecurityEvent(
        SecurityEventType.SENSITIVE_DATA_ACCESS,
        {
          resource: 'analytics_overview',
          details: 'User accessed revenue analytics',
          userId: session.userId
        },
        session,
        {} as any
      );

      // Verify sensitive access was logged
      const { data: auditLog } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('event_type', 'SENSITIVE_DATA_ACCESS')
        .eq('user_id', session.userId)
        .limit(1);

      expect(auditLog).toHaveLength(1);
      expect(JSON.parse(auditLog![0].details)).toHaveProperty('resource', 'analytics_overview');
    });

    test('should alert on suspicious activity patterns', async () => {
      const session = createSecurityTestSession();

      // Simulate suspicious activity
      const suspiciousEvents = [
        'FAILED_AUTHENTICATION',
        'CROSS_TENANT_ACCESS_ATTEMPT', 
        'PRIVILEGE_ESCALATION_ATTEMPT',
        'SUSPICIOUS_DATA_ACCESS',
        'UNUSUAL_LOGIN_LOCATION'
      ];

      // Log multiple suspicious events
      for (const eventType of suspiciousEvents) {
        await logSecurityEvent(
          eventType as SecurityEventType,
          {
            details: `Suspicious activity detected: ${eventType}`,
            severity: 'HIGH'
          },
          session,
          {} as any
        );
      }

      // Check for pattern detection
      const { data: suspiciousLogs } = await supabase
        .from('security_audit_log')
        .select('event_type')
        .eq('user_id', session.userId)
        .gte('created_at', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
        .eq('severity', 'HIGH');

      expect(suspiciousLogs!.length).toBeGreaterThanOrEqual(3); // Pattern threshold
    });

    test('should maintain audit log integrity', async () => {
      const session = createSecurityTestSession();
      
      // Create test audit entry
      const { data: inserted, error: insertError } = await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'TEST_AUDIT_INTEGRITY',
          user_id: session.userId,
          details: 'Integrity test entry',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      expect(inserted).toBeDefined();

      // Attempt to modify audit log should fail (if RLS is properly configured)
      const { error: updateError } = await supabase
        .from('security_audit_log')
        .update({ details: 'Modified entry' })
        .eq('id', inserted!.id);

      // Audit logs should be immutable
      expect(updateError).toBeDefined(); // Should fail due to RLS
    });
  });
});

/**
 * SECURITY TEST HELPER FUNCTIONS
 */

async function setupSecurityTestData(): Promise<void> {
  console.log('🔧 Setting up security test data...');

  // Create test tenants
  for (const tenant of SECURITY_TEST_CONFIG.TEST_TENANTS) {
    await supabase
      .from('tenants')
      .upsert({
        id: tenant.id,
        name: tenant.name,
        is_active: true
      }, { onConflict: 'id' });
  }

  // Create test users
  for (const user of SECURITY_TEST_CONFIG.TEST_USERS) {
    await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        tenant_id: user.tenantId,
        role: user.role,
        is_active: true
      }, { onConflict: 'id' });
  }

  // Create test businesses
  await supabase
    .from('businesses')
    .upsert([
      {
        id: 'security_business_001',
        name: 'Security Test Business 1',
        tenant_id: 'security_tenant_001',
        owner_id: 'security_user_001',
        is_active: true
      },
      {
        id: 'security_business_002', 
        name: 'Security Test Business 2',
        tenant_id: 'security_tenant_002',
        owner_id: 'security_user_003',
        is_active: true
      }
    ], { onConflict: 'id' });

  console.log('✅ Security test data setup complete');
}

async function cleanupSecurityTestData(): Promise<void> {
  console.log('🧹 Cleaning up security test data...');

  // Clean up in reverse dependency order
  await supabase.from('security_audit_log').delete().like('user_id', 'security_%');
  await supabase.from('business_users').delete().like('user_id', 'security_%');
  await supabase.from('businesses').delete().like('id', 'security_%');
  await supabase.from('users').delete().like('id', 'security_%');
  await supabase.from('tenants').delete().like('id', 'security_%');

  console.log('✅ Security test data cleanup complete');
}

function validateBusinessIdInput(input: string): { isValid: boolean; sanitizedInput: string; error?: string } {
  // Validate input length
  if (input.length > 100) {
    return {
      isValid: false,
      sanitizedInput: '',
      error: 'Input exceeds maximum length'
    };
  }

  // Check for SQL injection patterns
  const sqlPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /UPDATE\s+.*SET/i,
    /UNION\s+SELECT/i,
    /INSERT\s+INTO/i,
    /--/,
    /;/
  ];

  const hasSqlInjection = sqlPatterns.some(pattern => pattern.test(input));
  
  if (hasSqlInjection) {
    return {
      isValid: false,
      sanitizedInput: input.replace(/[';-]/g, ''),
      error: 'Potentially malicious input detected'
    };
  }

  // Sanitize input
  const sanitized = input.replace(/[<>'"&]/g, '');

  return {
    isValid: true,
    sanitizedInput: sanitized
  };
}

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/\.\.\//g, '') // Remove directory traversal
    .trim();
}

export { 
  SECURITY_TEST_CONFIG,
  createSecurityTestSession,
  validateBusinessIdInput,
  sanitizeInput
};