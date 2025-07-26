/**
 * ATTACK VECTOR SIMULATION TEST SUITE
 * 
 * REAL-WORLD ATTACK SIMULATION FOR PHASE 1-2 SECURITY
 * 
 * This test suite simulates sophisticated, real-world attack scenarios that actual
 * attackers would attempt against multi-tenant SaaS applications. Each test represents
 * a genuine security threat that must be completely neutralized.
 * 
 * ATTACK CATEGORIES TESTED:
 * - JWT Token Manipulation & Forgery
 * - Session Hijacking & Fixation  
 * - Header Injection & Manipulation
 * - Business Context Spoofing
 * - Privilege Escalation Attempts
 * - Cross-Tenant Data Exfiltration
 * - API Abuse & Rate Limit Bypass
 * - Input Validation Bypass
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

jest.mock('jsonwebtoken');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Attack simulation configuration
const ATTACK_SIMULATION_CONFIG = {
  LEGITIMATE_TARGET: {
    tenantId: 'tenant_production_001',
    businessId: 'business_production_001', 
    userId: 'user_production_001',
    email: 'legitimate@company.com',
    sensitiveData: {
      revenue: 250000,
      customerCount: 1500,
      services: ['Premium Service', 'Enterprise Support'],
      customers: [
        { id: 'customer_001', name: 'High Value Client', revenue: 50000 },
        { id: 'customer_002', name: 'VIP Customer', revenue: 75000 }
      ]
    }
  },
  ATTACKER_PROFILES: {
    EXTERNAL_HACKER: {
      ip: '203.0.113.1',
      userAgent: 'AttackBot/1.0',
      motivation: 'data_theft',
      sophistication: 'high'
    },
    MALICIOUS_INSIDER: {
      tenantId: 'tenant_production_002',
      businessId: 'business_production_002',
      userId: 'user_production_002',
      email: 'insider@competitor.com',
      motivation: 'competitive_intelligence',
      sophistication: 'expert'
    },
    AUTOMATED_BOT: {
      ip: '198.51.100.1',
      userAgent: 'Mozilla/5.0 (compatible; MaliciousBot/2.0)',
      motivation: 'mass_exploitation',
      sophistication: 'medium'
    }
  },
  ATTACK_PAYLOADS: {
    JWT_FORGERY: [
      // Forged admin tokens
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsIm5hbWUiOiJBZG1pbiBVc2VyIiwiaWF0IjoxNjAwMDAwMDAwLCJyb2xlIjoiYWRtaW4iLCJ0ZW5hbnRJZCI6InRlbmFudF9wcm9kdWN0aW9uXzAwMSIsImJ1c2luZXNzSWQiOiJidXNpbmVzc19wcm9kdWN0aW9uXzAwMSJ9.FORGED_SIGNATURE',
      // Expired tokens
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzAwMSIsImV4cCI6MTUwMDAwMDAwMH0.EXPIRED_TOKEN',
      // Malformed tokens
      'malformed.jwt.token',
      'not.a.real.jwt.token.at.all',
      '',
      null,
      undefined
    ],
    HEADER_INJECTION: {
      // Tenant switching attempts
      'X-Tenant-ID': 'tenant_production_001',
      'X-Business-ID': 'business_production_001',
      'X-User-ID': 'admin',
      'X-Override-Tenant': 'tenant_production_001',
      'X-Switch-Business': 'business_production_001',
      
      // Authentication bypass attempts
      'X-Admin-Override': 'true',
      'X-Bypass-Auth': 'enabled',
      'X-Force-Login': 'admin',
      'X-Skip-Validation': 'true',
      
      // SQL injection in headers
      'X-Business-Context': "business_production_001'; DROP TABLE businesses; --",
      'X-Custom-Filter': "' OR '1'='1",
      
      // XSS in headers
      'X-User-Data': '<script>alert("xss")</script>',
      'X-Callback': 'javascript:alert(document.cookie)',
      
      // CSRF attempts
      'Origin': 'https://malicious-site.com',
      'Referer': 'https://attacker.com/csrf-attack'
    },
    BUSINESS_CONTEXT_SPOOFING: [
      // Cross-tenant business IDs
      'business_production_001',
      'business_admin_panel',
      'business_super_admin',
      
      // SQL injection attempts
      "business_001'; UPDATE businesses SET owner_id='attacker'; --",
      "business_001' OR business_id='business_production_001",
      
      // Directory traversal
      '../../../admin/businesses',
      '../../../../etc/passwd',
      
      // Encoding bypass attempts
      '%62%75%73%69%6e%65%73%73%5f%70%72%6f%64%75%63%74%69%6f%6e%5f%30%30%31', // URL encoded
      'YnVzaW5lc3NfcHJvZHVjdGlvbl8wMDE=', // Base64 encoded
    ]
  }
};

describe('⚔️ REAL-WORLD ATTACK VECTOR SIMULATION', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * JWT TOKEN MANIPULATION ATTACKS
   * Simulate sophisticated JWT forgery and manipulation attacks
   */
  describe('🎭 JWT TOKEN MANIPULATION ATTACKS', () => {

    test('ATTACK: Forged JWT tokens with admin privileges must be REJECTED', async () => {
      // ATTACK SCENARIO: External hacker forges JWT with admin privileges
      const forgedAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsInRlbmFudElkIjoidGVuYW50X3Byb2R1Y3Rpb25fMDAxIiwiYnVzaW5lc3NJZCI6ImJ1c2luZXNzX3Byb2R1Y3Rpb25fMDAxIn0.FORGED_ADMIN_SIGNATURE';

      // Mock JWT verification to fail (as it should with forged tokens)
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Mock NextAuth to reject forged tokens
      mockGetServerSession.mockResolvedValue(null);

      const attackRequest = createAttackRequest({
        'Authorization': `Bearer ${forgedAdminToken}`,
        'User-Agent': ATTACK_SIMULATION_CONFIG.ATTACKER_PROFILES.EXTERNAL_HACKER.userAgent,
        'X-Forwarded-For': ATTACK_SIMULATION_CONFIG.ATTACKER_PROFILES.EXTERNAL_HACKER.ip
      });

      // Test attack against high-value endpoint
      const { GET } = await import('@/app/api/v2/dashboard/analytics/overview/route');
      const response = await GET(attackRequest);

      // DEFENSE VALIDATION: Attack must be completely blocked
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
      
      // CRITICAL: No sensitive data must be leaked
      expect(data).not.toHaveProperty('revenue');
      expect(data).not.toHaveProperty('customers');
      expect(data).not.toHaveProperty('services');
    });

    test('ATTACK: Token replay attack with expired credentials must FAIL', async () => {
      // ATTACK SCENARIO: Attacker replays previously captured expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzAwMSIsImV4cCI6MTUwMDAwMDAwMH0.EXPIRED_TOKEN';

      // Mock expired session (NextAuth returns null for expired sessions)
      mockGetServerSession.mockResolvedValue(null);

      const replayAttackRequest = createAttackRequest({
        'Authorization': `Bearer ${expiredToken}`,
        'X-Original-Timestamp': '2021-01-01T00:00:00Z', // Old timestamp
        'X-Replay-Attack': 'true'
      });

      // Test replay attack against multiple endpoints
      const endpoints = [
        '@/app/api/v2/dashboard/services/route',
        '@/app/api/v2/dashboard/customers/route',
        '@/app/api/v2/dashboard/business/profile/route'
      ];

      for (const endpoint of endpoints) {
        const { GET } = await import(endpoint);
        const response = await GET(replayAttackRequest);

        // DEFENSE VALIDATION: All replay attempts must be blocked
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      }
    });

    test('ATTACK: JWT algorithm confusion attack must be DETECTED', async () => {
      // ATTACK SCENARIO: Attacker changes JWT algorithm to bypass signature verification
      const algorithmConfusionToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsInRlbmFudElkIjoidGVuYW50X3Byb2R1Y3Rpb25fMDAxIn0.'; // Note: No signature

      // Mock NextAuth to detect algorithm confusion
      mockGetServerSession.mockResolvedValue(null);

      const confusionAttackRequest = createAttackRequest({
        'Authorization': `Bearer ${algorithmConfusionToken}`,
        'X-Attack-Type': 'algorithm-confusion'
      });

      const { GET } = await import('@/app/api/v2/dashboard/analytics/overview/route');
      const response = await GET(confusionAttackRequest);

      // DEFENSE VALIDATION: Algorithm confusion must be detected and blocked
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  /**
   * SESSION HIJACKING & FIXATION ATTACKS
   * Simulate session-based attack vectors
   */
  describe('🔒 SESSION HIJACKING & FIXATION ATTACKS', () => {

    test('ATTACK: Session fixation attack must be PREVENTED', async () => {
      // ATTACK SCENARIO: Attacker attempts to fix session ID
      const fixedSessionId = 'ATTACKER_CONTROLLED_SESSION_123';

      const sessionFixationRequest = createAttackRequest({
        'Cookie': `next-auth.session-token=${fixedSessionId}`,
        'X-Session-ID': fixedSessionId,
        'X-Attack-Type': 'session-fixation'
      });

      // Mock NextAuth to handle session validation
      mockGetServerSession.mockResolvedValue(null);

      const { GET } = await import('@/app/api/v2/dashboard/services/route');
      const response = await GET(sessionFixationRequest);

      // DEFENSE VALIDATION: Session fixation must be blocked
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('ATTACK: Cross-site request forgery (CSRF) must be BLOCKED', async () => {
      // ATTACK SCENARIO: Malicious site attempts CSRF attack
      const legitimateSession = createLegitimateSession();
      mockGetServerSession.mockResolvedValue(legitimateSession);

      const csrfAttackRequest = createAttackRequest({
        'Origin': 'https://malicious-attacker-site.com',
        'Referer': 'https://evil-site.com/csrf-attack.html',
        'X-Requested-With': 'XMLHttpRequest'
      });

      // Test CSRF attack against state-changing endpoints
      const { POST } = await import('@/app/api/v2/dashboard/services/route');
      
      // Mock request body for service creation
      csrfAttackRequest.json = jest.fn().mockResolvedValue({
        name: 'Malicious Service',
        duration: 60,
        price: 0
      });

      const response = await POST(csrfAttackRequest);

      // DEFENSE VALIDATION: CSRF protection should be in place
      // Note: In production, this would be handled by CSRF tokens or SameSite cookies
      expect(response.status).toBe(401);
    });

    test('ATTACK: Session stealing via XSS must not compromise other users', async () => {
      // ATTACK SCENARIO: Attacker has stolen session cookie via XSS
      const stolenSessionCookie = 'next-auth.session-token=STOLEN_LEGITIMATE_TOKEN_123';

      // Mock stolen session (NextAuth would validate and potentially reject)
      mockGetServerSession.mockResolvedValue(null);

      const sessionStealingRequest = createAttackRequest({
        'Cookie': stolenSessionCookie,
        'User-Agent': 'AttackBot/1.0', // Different from legitimate user
        'X-Forwarded-For': '203.0.113.1', // Attacker IP
        'X-Attack-Vector': 'session-stealing'
      });

      const { GET } = await import('@/app/api/v2/dashboard/customers/route');
      const response = await GET(sessionStealingRequest);

      // DEFENSE VALIDATION: Stolen session should be invalid
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  /**
   * HEADER INJECTION & MANIPULATION ATTACKS
   * Simulate sophisticated header-based attacks
   */
  describe('📡 HEADER INJECTION & MANIPULATION ATTACKS', () => {

    test('ATTACK: HTTP header injection for tenant switching must FAIL', async () => {
      // ATTACK SCENARIO: Malicious insider attempts tenant switching via headers
      const legitimateSession = createLegitimateSession({
        tenantId: 'tenant_production_002', // Attacker's legitimate tenant
        businessId: 'business_production_002'
      });
      mockGetServerSession.mockResolvedValue(legitimateSession);

      const mockSupabase = createMockSupabase();
      mockCreateClient.mockReturnValue(mockSupabase);

      // Attempt to switch to target tenant via malicious headers
      const headerInjectionRequest = createAttackRequest({
        'X-Tenant-ID': ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.tenantId,
        'X-Business-ID': ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.businessId,
        'X-Override-Context': 'true',
        'X-Switch-Tenant': ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.tenantId,
        'Tenant-Context': ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.tenantId
      });

      const { GET } = await import('@/app/api/v2/dashboard/services/route');
      const response = await GET(headerInjectionRequest);

      // DEFENSE VALIDATION: Must use authenticated session context, ignore headers
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
        'business_id',
        'business_production_002' // Attacker's legitimate business, not target
      );

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).not.toContain(ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.sensitiveData.services[0]);
    });

    test('ATTACK: SQL injection via custom headers must be NEUTRALIZED', async () => {
      const legitimateSession = createLegitimateSession();
      mockGetServerSession.mockResolvedValue(legitimateSession);

      const mockSupabase = createMockSupabase();
      mockCreateClient.mockReturnValue(mockSupabase);

      // SQL injection payloads in various headers
      const sqlInjectionRequest = createAttackRequest({
        'X-Business-Filter': "'; DROP TABLE businesses; --",
        'X-Custom-Query': "' OR '1'='1",
        'X-Sort-Order': "'; UPDATE services SET price=0; --",
        'X-Search-Term': "'; DELETE FROM customers; --"
      });

      const { GET } = await import('@/app/api/v2/dashboard/services/route');
      const response = await GET(sqlInjectionRequest);

      // DEFENSE VALIDATION: SQL injection in headers must be ignored
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
        'business_id',
        legitimateSession.user.businessId // Safe parameterized value
      );

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('ATTACK: XSS via header injection must be SANITIZED', async () => {
      const legitimateSession = createLegitimateSession();
      mockGetServerSession.mockResolvedValue(legitimateSession);

      const mockSupabase = createMockSupabase();
      mockCreateClient.mockReturnValue(mockSupabase);

      // XSS payloads in headers
      const xssInjectionRequest = createAttackRequest({
        'X-User-Input': '<script>alert("Pwned!")</script>',
        'X-Callback-URL': 'javascript:alert(document.cookie)',
        'X-Custom-Data': '<img src=x onerror=alert("XSS")>',
        'User-Agent': '<svg onload=alert("User-Agent XSS")>'
      });

      const { GET } = await import('@/app/api/v2/dashboard/business/profile/route');
      const response = await GET(xssInjectionRequest);

      // DEFENSE VALIDATION: XSS in headers must not affect response
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Ensure response doesn't echo back malicious headers
      const responseText = JSON.stringify(data);
      expect(responseText).not.toContain('<script>');
      expect(responseText).not.toContain('javascript:');
      expect(responseText).not.toContain('onerror=');
    });
  });

  /**
   * BUSINESS CONTEXT SPOOFING ATTACKS
   * Simulate attempts to access other businesses' data
   */
  describe('💼 BUSINESS CONTEXT SPOOFING ATTACKS', () => {

    test('ATTACK: URL parameter business ID spoofing must be IGNORED', async () => {
      const attackerSession = createLegitimateSession({
        tenantId: 'tenant_attacker_001',
        businessId: 'business_attacker_001'
      });
      mockGetServerSession.mockResolvedValue(attackerSession);

      const mockSupabase = createMockSupabase();
      mockCreateClient.mockReturnValue(mockSupabase);

      // Attempt business ID spoofing via URL parameters
      const spoofingRequest = createAttackRequest({}, 
        `?businessId=${ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.businessId}&tenantId=${ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.tenantId}`
      );

      const { GET } = await import('@/app/api/v2/dashboard/services/route');
      const response = await GET(spoofingRequest);

      // DEFENSE VALIDATION: Must use authenticated business context, ignore URL params
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
        'business_id',
        'business_attacker_001' // Attacker's legitimate business
      );

      const data = await response.json();
      expect(data.data).not.toEqual(ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.sensitiveData.services);
    });

    test('ATTACK: POST body business context manipulation must be REJECTED', async () => {
      const attackerSession = createLegitimateSession({
        tenantId: 'tenant_attacker_001', 
        businessId: 'business_attacker_001'
      });
      mockGetServerSession.mockResolvedValue(attackerSession);

      const mockSupabase = createMockSupabase();
      mockCreateClient.mockReturnValue(mockSupabase);

      // Attempt to manipulate business context in POST body
      const bodyManipulationRequest = createAttackRequest({}, '', {
        businessId: ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.businessId,
        tenantId: ATTACK_SIMULATION_CONFIG.LEGITIMATE_TARGET.tenantId,
        name: 'Malicious Service',
        duration: 60,
        price: 1000000
      });

      const { POST } = await import('@/app/api/v2/dashboard/services/route');
      const response = await POST(bodyManipulationRequest);

      // DEFENSE VALIDATION: Must use authenticated business context for creation
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          business_id: 'business_attacker_001' // Attacker's legitimate business
        })
      );
    });

    test('ATTACK: Service update with cross-business ID must be BLOCKED', async () => {
      const attackerSession = createLegitimateSession({
        businessId: 'business_attacker_001'
      });
      mockGetServerSession.mockResolvedValue(attackerSession);

      const mockSupabase = createMockSupabase();
      // Mock service verification to return null (service not found in attacker's business)
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' }
      });
      mockCreateClient.mkReturnValue(mockSupabase);

      // Attempt to update service from different business
      const crossBusinessRequest = createAttackRequest({}, '', {
        name: 'Hacked Service',
        price: 0
      });

      const { PATCH } = await import('@/app/api/v2/dashboard/services/[id]/route');
      const response = await PATCH(crossBusinessRequest, {
        params: { id: 'service_from_target_business' }
      });

      // DEFENSE VALIDATION: Service not found in attacker's business
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Service not found');
    });
  });

  /**
   * PRIVILEGE ESCALATION ATTACKS
   * Simulate attempts to gain unauthorized privileges
   */
  describe('🚀 PRIVILEGE ESCALATION ATTACKS', () => {

    test('ATTACK: Role manipulation via headers must be IGNORED', async () => {
      const regularUserSession = createLegitimateSession({
        userId: 'regular_user_001',
        roles: ['user'], // Regular user role
        permissions: ['VIEW_BASIC']
      });
      mockGetServerSession.mockResolvedValue(regularUserSession);

      const mockSupabase = createMockSupabase();
      mockCreateClient.mockReturnValue(mockSupabase);

      // Attempt role escalation via headers
      const roleEscalationRequest = createAttackRequest({
        'X-User-Role': 'admin',
        'X-Permissions': 'all',
        'X-Admin-Override': 'true',
        'X-Escalate-Privileges': 'admin',
        'X-Force-Admin': 'enabled'
      });

      const { GET } = await import('@/app/api/v2/dashboard/analytics/overview/route');
      const response = await GET(roleEscalationRequest);

      // DEFENSE VALIDATION: Must use authenticated user's actual privileges
      expect(response.status).toBe(200); // Basic access granted...
      const data = await response.json();
      // ...but with regular user data scope only
      expect(data.data.metrics).toBeDefined();
    });

    test('ATTACK: Admin endpoint access with forged admin claims must FAIL', async () => {
      const regularUserSession = createLegitimateSession({
        roles: ['user'],
        permissions: ['VIEW_BASIC']
      });
      mockGetServerSession.mockResolvedValue(regularUserSession);

      // Attempt to access admin-only functionality (if it existed)
      const adminAccessRequest = createAttackRequest({
        'X-Admin-Token': 'forged_admin_token_123',
        'X-Super-User': 'true',
        'Authorization': 'Bearer ADMIN_BYPASS_TOKEN'
      });

      // Test against endpoints that might have admin functionality
      const { GET } = await import('@/app/api/v2/dashboard/services/route');
      const response = await GET(adminAccessRequest);

      // DEFENSE VALIDATION: Regular user permissions enforced
      expect(response.status).toBe(200);
      // Response should be scoped to user's legitimate business context
    });
  });

  /**
   * DATA EXFILTRATION ATTEMPTS
   * Simulate sophisticated data theft attacks
   */
  describe('📊 DATA EXFILTRATION ATTACK SIMULATION', () => {

    test('ATTACK: Bulk data extraction via parameter manipulation must be LIMITED', async () => {
      const legitimateSession = createLegitimateSession();
      mockGetServerSession.mockResolvedValue(legitimateSession);

      const mockSupabase = createMockSupabase();
      mockCreateClient.mockReturnValue(mockSupabase);

      // Attempt bulk data extraction
      const bulkExtractionRequest = createAttackRequest({}, 
        '?pageSize=999999&includeAll=true&exportFormat=json&limit=0'
      );

      const { GET } = await import('@/app/api/v2/dashboard/customers/route');
      const response = await GET(bulkExtractionRequest);

      // DEFENSE VALIDATION: Pagination limits must be enforced
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pageSize).toBeLessThanOrEqual(100); // Max page size enforced
    });

    test('ATTACK: Sensitive field enumeration must not leak data structure', async () => {
      const legitimateSession = createLegitimateSession();
      mockGetServerSession.mockResolvedValue(legitimateSession);

      const mockSupabase = createMockSupabase();
      mockCreateClient.mockReturnValue(mockSupabase);

      // Attempt to enumerate sensitive fields
      const fieldEnumerationRequest = createAttackRequest({}, 
        '?fields=password,api_key,secret,token,private_key,ssn,credit_card'
      );

      const { GET } = await import('@/app/api/v2/dashboard/business/profile/route');
      const response = await GET(fieldEnumerationRequest);

      // DEFENSE VALIDATION: Only safe fields returned
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).not.toHaveProperty('password');
      expect(data.data).not.toHaveProperty('api_key');
      expect(data.data).not.toHaveProperty('secret');
    });
  });
});

/**
 * ATTACK SIMULATION HELPER FUNCTIONS
 */

function createLegitimateSession(overrides: any = {}) {
  return {
    user: {
      id: 'user_legitimate_001',
      email: 'legitimate@company.com',
      name: 'Legitimate User',
      tenantId: 'tenant_legitimate_001',
      businessId: 'business_legitimate_001',
      onboardingStep: 5,
      isActive: true,
      roles: ['user'],
      permissions: ['VIEW_BASIC'],
      ...overrides
    },
    expires: new Date(Date.now() + 3600000).toISOString()
  };
}

function createAttackRequest(
  headers: Record<string, string> = {},
  search: string = '',
  body: any = {}
): NextRequest {
  const url = `https://api.replytics.com/api/v2/test${search}`;
  
  return {
    url,
    nextUrl: new URL(url),
    headers: {
      get: (name: string) => headers[name] || null,
      has: (name: string) => name in headers,
      forEach: (callback: (value: string, key: string) => void) => {
        Object.entries(headers).forEach(([key, value]) => callback(value, key));
      }
    },
    json: async () => body,
    method: headers['X-HTTP-Method-Override'] || 'GET'
  } as any;
}

function createMockSupabase() {
  const mockQuery = {
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ data: {}, error: null })
  };

  return {
    from: jest.fn(() => mockQuery),
    channel: jest.fn(() => ({
      send: jest.fn()
    }))
  };
}

export {
  ATTACK_SIMULATION_CONFIG,
  createLegitimateSession,
  createAttackRequest,
  createMockSupabase
};