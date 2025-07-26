// Jest environment setup - Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-for-ci-cd-testing-only';

// Use environment variables if available, otherwise use safe test defaults
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-supabase-anon-key';

// Mock crypto for Node.js environment
global.crypto = require('crypto').webcrypto || require('crypto');

// Mock window for browser-specific tests
if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        pathname: '/',
      },
      writable: true,
    });
  } catch (e) {
    // Location already defined, skip mocking
  }
}