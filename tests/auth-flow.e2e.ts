import { test, expect, chromium, Browser, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SIGNIN_URL = `${BASE_URL}/auth/signin`;
const DASHBOARD_URL = `${BASE_URL}/dashboard`;

// Test results tracking
const testResults = {
  serverStart: { status: 'pending', message: '' },
  pageLoad: { status: 'pending', message: '' },
  buttonVisible: { status: 'pending', message: '' },
  oauthRedirect: { status: 'pending', message: '' },
  dashboardRedirect: { status: 'pending', message: '' },
  sessionCookie: { status: 'pending', message: '' }
};

// Helper to log test results
function logResult(step: keyof typeof testResults, status: 'pass' | 'fail', message: string) {
  testResults[step] = { status, message };
  console.log(`[${status.toUpperCase()}] ${step}: ${message}`);
}

test.describe('Google OAuth Authentication Flow', () => {
  let browser: Browser;
  let page: Page;

  test.beforeAll(async () => {
    console.log('🚀 Starting authentication flow test...\n');
    
    // Check if dev server is running
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) {
        logResult('serverStart', 'pass', 'Development server is running');
      }
    } catch (error) {
      logResult('serverStart', 'fail', 'Development server not running. Please run "npm run dev" first');
      throw new Error('Server not running');
    }

    browser = await chromium.launch({ 
      headless: false, // Set to true for CI/CD
      slowMo: 500 // Slow down for visibility
    });
  });

  test.afterAll(async () => {
    await browser?.close();
    
    // Print final report
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('========================');
    Object.entries(testResults).forEach(([step, result]) => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
      console.log(`${icon} ${step}: ${result.message}`);
    });
  });

  test('Complete Google OAuth flow', async () => {
    const context = await browser.newContext({
      // Accept all cookies
      acceptDownloads: true,
      ignoreHTTPSErrors: true,
    });
    
    page = await context.newPage();

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // 1. Navigate to signin page
    console.log('\n1️⃣ Navigating to signin page...');
    try {
      await page.goto(SIGNIN_URL, { waitUntil: 'networkidle' });
      logResult('pageLoad', 'pass', `Successfully loaded ${SIGNIN_URL}`);
      
      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/signin-page.png' });
    } catch (error) {
      logResult('pageLoad', 'fail', `Failed to load signin page: ${error}`);
      throw error;
    }

    // 2. Check for Google OAuth button
    console.log('\n2️⃣ Looking for "Continue with Google" button...');
    try {
      const googleButton = page.locator('button:has-text("Continue with Google")');
      await expect(googleButton).toBeVisible({ timeout: 5000 });
      logResult('buttonVisible', 'pass', '"Continue with Google" button is visible');
      
      // Check if button is enabled
      const isDisabled = await googleButton.isDisabled();
      console.log(`   Button enabled: ${!isDisabled}`);
    } catch (error) {
      logResult('buttonVisible', 'fail', 'Google OAuth button not found or not visible');
      await page.screenshot({ path: 'tests/screenshots/button-error.png' });
      throw error;
    }

    // 3. Click Google OAuth button and intercept redirect
    console.log('\n3️⃣ Clicking Google OAuth button...');
    try {
      // Set up request interception to catch OAuth redirect
      let oauthUrl = '';
      
      page.on('request', request => {
        const url = request.url();
        if (url.includes('accounts.google.com') || url.includes('/api/auth/signin/google')) {
          oauthUrl = url;
          console.log(`   OAuth redirect detected: ${url}`);
        }
      });

      // Click the button
      const googleButton = page.locator('button:has-text("Continue with Google")');
      await googleButton.click();

      // Wait for navigation or OAuth redirect
      try {
        await page.waitForURL(/accounts\.google\.com|\/api\/auth\/signin\/google/, { 
          timeout: 5000 
        });
        
        const currentUrl = page.url();
        logResult('oauthRedirect', 'pass', `Redirected to OAuth: ${currentUrl}`);
        
        // Take screenshot of OAuth page
        await page.screenshot({ path: 'tests/screenshots/oauth-redirect.png' });
      } catch (timeoutError) {
        // Check if we're on a NextAuth intermediate page
        const currentUrl = page.url();
        if (currentUrl.includes('/api/auth/signin/google')) {
          logResult('oauthRedirect', 'pass', `NextAuth OAuth endpoint reached: ${currentUrl}`);
        } else {
          logResult('oauthRedirect', 'fail', `No OAuth redirect detected. Current URL: ${currentUrl}`);
          await page.screenshot({ path: 'tests/screenshots/no-redirect.png' });
        }
      }
    } catch (error) {
      logResult('oauthRedirect', 'fail', `Failed to click button or capture redirect: ${error}`);
      throw error;
    }

    // 4. Mock OAuth callback (since we can't automate real Google login)
    console.log('\n4️⃣ Simulating OAuth callback...');
    try {
      // For real Google OAuth, we'd need to handle the Google login form
      // Instead, we'll directly navigate to the callback URL with mock params
      
      const mockCallbackUrl = `${BASE_URL}/api/auth/callback/google?` + new URLSearchParams({
        code: 'mock_auth_code_12345',
        state: 'mock_state_67890',
        scope: 'openid email profile'
      });
      
      console.log(`   Navigating to mock callback: ${mockCallbackUrl}`);
      await page.goto(mockCallbackUrl, { waitUntil: 'networkidle' });
      
      // Wait for potential redirects
      await page.waitForTimeout(2000);
      
      const finalUrl = page.url();
      console.log(`   Final URL after callback: ${finalUrl}`);
      
      if (finalUrl.includes('/dashboard')) {
        logResult('dashboardRedirect', 'pass', 'Successfully redirected to dashboard');
        await page.screenshot({ path: 'tests/screenshots/dashboard.png' });
      } else if (finalUrl.includes('/auth/signin')) {
        logResult('dashboardRedirect', 'fail', 'Redirected back to signin (auth failed)');
        
        // Check for error messages
        const errorText = await page.locator('.text-red-400').textContent().catch(() => null);
        if (errorText) {
          console.log(`   Error message: ${errorText}`);
        }
      } else {
        logResult('dashboardRedirect', 'fail', `Unexpected redirect to: ${finalUrl}`);
      }
    } catch (error) {
      logResult('dashboardRedirect', 'fail', `OAuth callback simulation failed: ${error}`);
    }

    // 5. Check for session cookie
    console.log('\n5️⃣ Checking for NextAuth session cookie...');
    try {
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => 
        c.name === 'next-auth.session-token' || 
        c.name === '__Secure-next-auth.session-token'
      );
      
      if (sessionCookie) {
        logResult('sessionCookie', 'pass', `Session cookie found: ${sessionCookie.name}`);
        console.log(`   Cookie details: domain=${sessionCookie.domain}, httpOnly=${sessionCookie.httpOnly}, secure=${sessionCookie.secure}`);
      } else {
        logResult('sessionCookie', 'fail', 'No NextAuth session cookie found');
        console.log('   All cookies:', cookies.map(c => c.name).join(', '));
      }
    } catch (error) {
      logResult('sessionCookie', 'fail', `Failed to check cookies: ${error}`);
    }

    // Additional diagnostics
    console.log('\n🔍 Additional Diagnostics:');
    
    // Check NextAuth environment
    try {
      const response = await fetch(`${BASE_URL}/api/auth/providers`);
      const providers = await response.json();
      console.log('   Available auth providers:', Object.keys(providers));
    } catch (error) {
      console.log('   Failed to fetch auth providers:', error);
    }

    // Check for any console errors
    const jsErrors = await page.evaluate(() => {
      return (window as any).__errors || [];
    });
    if (jsErrors.length > 0) {
      console.log('   JavaScript errors detected:', jsErrors);
    }
  });
});

// Quick fix suggestions based on common issues
function suggestFixes() {
  console.log('\n💡 SUGGESTED FIXES:');
  
  if (testResults.serverStart.status === 'fail') {
    console.log('1. Start the dev server: npm run dev');
  }
  
  if (testResults.oauthRedirect.status === 'fail') {
    console.log('2. Ensure NEXTAUTH_URL is set correctly in .env.local');
    console.log('3. Check that Google OAuth credentials are configured');
    console.log('4. Verify the signIn() function is properly imported from next-auth/react');
  }
  
  if (testResults.dashboardRedirect.status === 'fail') {
    console.log('5. Check middleware.ts authentication logic');
    console.log('6. Ensure callbacks in auth-config.ts are working');
    console.log('7. Verify backend API endpoints are running');
  }
  
  if (testResults.sessionCookie.status === 'fail') {
    console.log('8. Ensure NEXTAUTH_SECRET is set in .env.local');
    console.log('9. Check cookie settings in auth-config.ts');
  }
}

// Run suggestions after all tests
test.afterAll(async () => {
  suggestFixes();
});