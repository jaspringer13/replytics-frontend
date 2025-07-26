/**
 * E2E AUTHENTICATION JOURNEY - BULLETPROOF USER FLOW TESTS
 * 
 * Senior Engineering Standard Tests for Complete User Authentication Journey
 * 
 * TEST PHILOSOPHY: "Either the test is flawed or the code is - both can't be true"
 * - These tests validate the complete user journey from login to dashboard usage
 * - Any test failure indicates a critical user experience or security issue
 * - NEVER simplify tests to meet failing code - fix the end-to-end experience
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// Helper function to mock NextAuth responses
const mockNextAuthFlow = async (page: Page, userType: 'new' | 'existing') => {
  // Mock the Google OAuth redirect
  await page.route('**/api/auth/signin/google**', async (route) => {
    await route.fulfill({
      status: 302,
      headers: {
        'Location': '/api/auth/callback/google?code=mock-auth-code&state=mock-state'
      }
    })
  })

  // Mock the OAuth callback
  await page.route('**/api/auth/callback/google**', async (route) => {
    const mockSession = userType === 'new' ? {
      user: {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
        tenantId: '', // New user - no business context
        businessId: '',
        onboardingStep: 0,
        isActive: true,
        roles: [],
        permissions: []
      },
      expires: '2025-12-31T23:59:59.999Z'
    } : {
      user: {
        id: 'existing-user-456',
        email: 'existing@example.com',
        name: 'Existing User',
        tenantId: 'tenant-789',
        businessId: 'business-123',
        onboardingStep: 5,
        isActive: true,
        roles: ['admin', 'user'],
        permissions: ['read', 'write', 'delete']
      },
      expires: '2025-12-31T23:59:59.999Z'
    }

    await route.fulfill({
      status: 302,
      headers: {
        'Location': '/dashboard',
        'Set-Cookie': `next-auth.session-token=mock-jwt-token; Path=/; HttpOnly; SameSite=lax`
      }
    })
  })

  // Mock NextAuth session endpoint
  await page.route('**/api/auth/session**', async (route) => {
    const mockSession = userType === 'new' ? {
      user: {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
        tenantId: '',
        businessId: '',
        onboardingStep: 0,
        isActive: true,
        roles: [],
        permissions: []
      },
      expires: '2025-12-31T23:59:59.999Z'
    } : {
      user: {
        id: 'existing-user-456',
        email: 'existing@example.com',
        name: 'Existing User',
        tenantId: 'tenant-789',
        businessId: 'business-123',
        onboardingStep: 5,
        isActive: true,
        roles: ['admin', 'user'],
        permissions: ['read', 'write', 'delete']
      },
      expires: '2025-12-31T23:59:59.999Z'
    }

    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockSession)
    })
  })
}

test.describe('Complete Authentication Journey - End-to-End Tests', () => {

  test.describe('New User Registration Flow', () => {
    
    test('should complete full new user journey from landing to dashboard', async ({ page }) => {
      // RIGOROUS E2E TEST: Complete new user flow with business context creation
      
      // Stage 1: Landing page access
      await page.goto('/')
      
      // Should show unauthenticated landing page
      await expect(page.locator('text=Sign In')).toBeVisible()
      
      // Stage 2: Navigate to sign-in page
      await page.click('text=Sign In')
      await expect(page).toHaveURL('/auth/signin')
      
      // Should show Google OAuth option
      await expect(page.locator('text=Continue with Google')).toBeVisible()
      
      // Stage 3: Mock OAuth flow for new user
      await mockNextAuthFlow(page, 'new')
      
      // Initiate Google OAuth
      await page.click('text=Continue with Google')
      
      // Should redirect to dashboard after successful OAuth
      await page.waitForURL('/dashboard')
      
      // Stage 4: Verify dashboard loads with new user state
      // New users should see onboarding prompts
      await expect(page.locator('[data-testid="onboarding-banner"]')).toBeVisible()
      
      // Should show user is authenticated but needs onboarding
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      await expect(page.locator('text=Complete Setup')).toBeVisible()
      
      // Stage 5: Business context should be empty for new user
      await page.click('[data-testid="user-menu"]')
      await expect(page.locator('text=newuser@example.com')).toBeVisible()
      
      // Stage 6: Verify protected API calls work with session
      // Mock dashboard analytics API
      await page.route('**/api/v2/dashboard/analytics/overview**', async (route) => {
        const request = route.request()
        const cookies = request.headers()['cookie']
        
        // Should include session cookie
        expect(cookies).toContain('next-auth.session-token')
        
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callsCount: 0,
            revenue: 0,
            avgCallDuration: 0,
            noShowRate: 0
          })
        })
      })
      
      // Navigate to analytics to trigger API call
      await page.click('text=Analytics')
      await page.waitForURL('/dashboard/analytics')
      
      // Should show analytics page for new user (with zero data)
      await expect(page.locator('text=Total Calls')).toBeVisible()
      await expect(page.locator('text=0')).toBeVisible() // Zero calls for new user
    })
    
    test('should handle onboarding completion and business context creation', async ({ page }) => {
      await page.goto('/auth/signin')
      await mockNextAuthFlow(page, 'new')
      
      // Complete OAuth flow
      await page.click('text=Continue with Google')
      await page.waitForURL('/dashboard')
      
      // Start onboarding process
      await page.click('text=Complete Setup')
      await page.waitForURL('/onboarding')
      
      // Mock onboarding API calls
      await page.route('**/api/v2/onboarding/**', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            tenantId: 'new-tenant-456',
            businessId: 'new-business-789'
          })
        })
      })
      
      // Complete onboarding steps
      await page.fill('[data-testid="business-name"]', 'Test Business')
      await page.fill('[data-testid="business-phone"]', '+1234567890')
      await page.click('text=Continue')
      
      // Should update session with business context
      await page.route('**/api/auth/session**', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: {
              id: 'new-user-123',
              email: 'newuser@example.com',
              name: 'New User',
              tenantId: 'new-tenant-456', // Now has business context
              businessId: 'new-business-789',
              onboardingStep: 3, // Completed onboarding
              isActive: true,
              roles: ['owner'],
              permissions: ['admin']
            },
            expires: '2025-12-31T23:59:59.999Z'
          })
        })
      })
      
      // Complete final onboarding step
      await page.click('text=Finish Setup')
      
      // Should redirect to dashboard with full business context
      await page.waitForURL('/dashboard')
      await expect(page.locator('[data-testid="business-name"]')).toContainText('Test Business')
    })
  })

  test.describe('Existing User Login Flow', () => {
    
    test('should complete existing user login with immediate dashboard access', async ({ page }) => {
      // RIGOROUS E2E TEST: Existing user should have immediate access to business data
      
      await page.goto('/auth/signin')
      await mockNextAuthFlow(page, 'existing')
      
      // Mock dashboard data for existing user
      await page.route('**/api/v2/dashboard/analytics/overview**', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callsCount: 150,
            revenue: 12500,
            avgCallDuration: 8.5,
            noShowRate: 0.12
          })
        })
      })
      
      // Complete OAuth flow
      await page.click('text=Continue with Google')
      await page.waitForURL('/dashboard')
      
      // Should show full dashboard immediately (no onboarding)
      await expect(page.locator('[data-testid="onboarding-banner"]')).not.toBeVisible()
      
      // Should show business data
      await expect(page.locator('text=150')).toBeVisible() // Call count
      await expect(page.locator('text=$12,500')).toBeVisible() // Revenue
      
      // Should show user with complete business context
      await page.click('[data-testid="user-menu"]')
      await expect(page.locator('text=existing@example.com')).toBeVisible()
      await expect(page.locator('text=Admin')).toBeVisible() // User role
      
      // Should have access to all dashboard features
      await page.click('text=Settings')
      await page.waitForURL('/dashboard/settings')
      await expect(page.locator('text=Business Profile')).toBeVisible()
    })
    
    test('should maintain session across page refreshes', async ({ page }) => {
      await page.goto('/auth/signin')
      await mockNextAuthFlow(page, 'existing')
      
      // Complete login
      await page.click('text=Continue with Google')
      await page.waitForURL('/dashboard')
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      
      // Refresh page
      await page.reload()
      
      // Should remain logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      await expect(page).toHaveURL('/dashboard')
      
      // Session should be maintained
      await page.click('[data-testid="user-menu"]')
      await expect(page.locator('text=existing@example.com')).toBeVisible()
    })
  })

  test.describe('Session Security and Tenant Isolation', () => {
    
    test('should prevent cross-tenant data access through URL manipulation', async ({ page }) => {
      await page.goto('/auth/signin')
      await mockNextAuthFlow(page, 'existing')
      
      // Complete login as user in tenant-789
      await page.click('text=Continue with Google')
      await page.waitForURL('/dashboard')
      
      // Mock API to reject cross-tenant access
      await page.route('**/api/v2/dashboard/**', async (route) => {
        const url = new URL(route.request().url())
        const requestedTenant = url.searchParams.get('tenantId')
        
        if (requestedTenant && requestedTenant !== 'tenant-789') {
          await route.fulfill({
            status: 403,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Cross-tenant access denied',
              code: 'TENANT_MISMATCH'
            })
          })
        } else {
          await route.fulfill({
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true })
          })
        }
      })
      
      // Attempt cross-tenant access via URL manipulation
      await page.goto('/dashboard/analytics?tenantId=malicious-tenant-999')
      
      // Should show access denied error
      await expect(page.locator('text=Access Denied')).toBeVisible()
      
      // Valid tenant access should work
      await page.goto('/dashboard/analytics?tenantId=tenant-789')
      await expect(page.locator('text=Analytics')).toBeVisible()
    })
    
    test('should handle session expiration gracefully', async ({ page, context }) => {
      await page.goto('/auth/signin')
      await mockNextAuthFlow(page, 'existing')
      
      // Complete login
      await page.click('text=Continue with Google')
      await page.waitForURL('/dashboard')
      
      // Mock session expiration
      await page.route('**/api/auth/session**', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}) // Empty session (expired)
        })
      })
      
      // Mock API calls to return 401 for expired session
      await page.route('**/api/v2/dashboard/**', async (route) => {
        await route.fulfill({
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Session expired',
            code: 'SESSION_EXPIRED'
          })
        })
      })
      
      // Trigger a page that requires authentication
      await page.reload()
      
      // Should redirect to sign-in page
      await page.waitForURL('/auth/signin')
      await expect(page.locator('text=Session expired')).toBeVisible()
    })
  })

  test.describe('API Integration and Data Flow', () => {
    
    test('should make authenticated API calls with correct headers and session', async ({ page }) => {
      await page.goto('/auth/signin')
      await mockNextAuthFlow(page, 'existing')
      
      // Track API calls to verify authentication
      const apiCalls: string[] = []
      
      await page.route('**/api/v2/dashboard/**', async (route) => {
        const request = route.request()
        apiCalls.push(request.url())
        
        // Verify authentication headers
        const cookies = request.headers()['cookie']
        expect(cookies).toContain('next-auth.session-token')
        
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: `Response for ${request.url()}`,
            timestamp: new Date().toISOString()
          })
        })
      })
      
      // Complete login
      await page.click('text=Continue with Google')
      await page.waitForURL('/dashboard')
      
      // Navigate through different sections
      await page.click('text=Analytics')
      await page.waitForURL('/dashboard/analytics')
      
      await page.click('text=Customers')
      await page.waitForURL('/dashboard/customers')
      
      await page.click('text=Settings')
      await page.waitForURL('/dashboard/settings')
      
      // Verify all API calls were made with authentication
      expect(apiCalls.length).toBeGreaterThan(0)
      apiCalls.forEach(url => {
        expect(url).toContain('/api/v2/dashboard/')
      })
    })
    
    test('should handle API errors gracefully without breaking authentication', async ({ page }) => {
      await page.goto('/auth/signin')
      await mockNextAuthFlow(page, 'existing')
      
      // Complete login
      await page.click('text=Continue with Google')
      await page.waitForURL('/dashboard')
      
      // Mock API failures
      await page.route('**/api/v2/dashboard/analytics/**', async (route) => {
        await route.fulfill({
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
          })
        })
      })
      
      // Navigate to analytics
      await page.click('text=Analytics')
      await page.waitForURL('/dashboard/analytics')
      
      // Should show error message but remain authenticated
      await expect(page.locator('text=Error loading analytics')).toBeVisible()
      
      // User should still be authenticated
      await page.click('[data-testid="user-menu"]')
      await expect(page.locator('text=existing@example.com')).toBeVisible()
      
      // Other sections should still work
      await page.click('text=Dashboard')
      await page.waitForURL('/dashboard')
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    })
  })

  test.describe('Logout and Session Cleanup', () => {
    
    test('should complete logout flow and clear session', async ({ page }) => {
      await page.goto('/auth/signin')
      await mockNextAuthFlow(page, 'existing')
      
      // Complete login
      await page.click('text=Continue with Google')
      await page.waitForURL('/dashboard')
      
      // Mock logout endpoint
      await page.route('**/api/auth/signout**', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': 'next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax'
          },
          body: JSON.stringify({ url: '/' })
        })
      })
      
      // Initiate logout
      await page.click('[data-testid="user-menu"]')
      await page.click('text=Sign Out')
      
      // Should redirect to home page
      await page.waitForURL('/')
      
      // Should show unauthenticated state
      await expect(page.locator('text=Sign In')).toBeVisible()
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
      
      // Attempting to access protected pages should redirect to sign-in
      await page.goto('/dashboard')
      await page.waitForURL('/auth/signin')
      
      // Should show sign-in page
      await expect(page.locator('text=Continue with Google')).toBeVisible()
    })
  })

  test.describe('Error Scenarios and Edge Cases', () => {
    
    test('should handle OAuth errors gracefully', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Mock OAuth error
      await page.route('**/api/auth/signin/google**', async (route) => {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': '/auth/error?error=OAuthCallback&message=OAuth+callback+failed'
          }
        })
      })
      
      // Attempt to sign in
      await page.click('text=Continue with Google')
      
      // Should redirect to error page
      await page.waitForURL('/auth/error*')
      await expect(page.locator('text=Authentication Error')).toBeVisible()
      await expect(page.locator('text=OAuth callback failed')).toBeVisible()
      
      // Should provide way to try again
      await expect(page.locator('text=Try Again')).toBeVisible()
    })
    
    test('should handle network failures during authentication', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Mock network failure
      await page.route('**/api/auth/**', async (route) => {
        await route.abort('failed')
      })
      
      // Attempt to sign in
      await page.click('text=Continue with Google')
      
      // Should handle network error gracefully
      await expect(page.locator('text=Connection Error')).toBeVisible()
      await expect(page.locator('text=Please check your internet connection')).toBeVisible()
    })
    
    test('should prevent session fixation attacks', async ({ page, context }) => {
      // Create a new browser context to simulate fresh session
      const newContext = await context.browser()?.newContext()
      const newPage = await newContext?.newPage()
      if (!newPage) return
      
      await newPage.goto('/auth/signin')
      await mockNextAuthFlow(newPage, 'existing')
      
      // Complete login in new context
      await newPage.click('text=Continue with Google')
      await newPage.waitForURL('/dashboard')
      
      // Get the session cookie
      const cookies = await newContext.cookies()
      const sessionCookie = cookies.find(cookie => cookie.name.includes('session-token'))
      
      // Try to use the session cookie in original context
      if (sessionCookie) {
        await context.addCookies([sessionCookie])
      }
      
      await page.goto('/dashboard')
      
      // Should not be authenticated in original context
      await page.waitForURL('/auth/signin')
      
      await newContext.close()
    })
  })
})