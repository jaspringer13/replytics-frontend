/** @type {import('jest').Config} */
module.exports = {
  // Use Next.js Jest preset
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Environment variables for tests
  setupFiles: ['<rootDir>/jest.env.js'],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    
    // Mock CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Mock static assets
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
      },
      isolatedModules: true,
    }],
  },
  
  // Transform ignore patterns - allow NextAuth and related ES modules to be transformed
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|jose|preact-render-to-string|oauth|openid-client|@supabase|isows|ws|@websocket|realtime-js)/)',
  ],
  
  // Test match patterns - Only include Jest tests, exclude Playwright
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/tests/**/*.test.(ts|tsx|js)',
    '!**/tests/**/*.spec.(ts|tsx|js)', // Exclude Playwright spec files
    '!**/tests/**/e2e-*.test.(ts|tsx|js)', // Exclude E2E test files
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    'app/services/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './components/dashboard/settings/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './app/services/dashboard/voice_settings_service.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/out/',
    '/build/',
    'tests/.*\\.spec\\.ts$', // Exclude Playwright tests
    'tests/auth/e2e-auth-journey\\.test\\.ts$', // Exclude specific E2E test
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};