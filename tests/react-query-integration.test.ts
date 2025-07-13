// Manual test checklist for React Query integration
// Run these tests by navigating to /test-react-query and /test-token-refresh

export const testChecklist = {
  'Dashboard Stats Hook': {
    tests: [
      'Stats load on mount',
      'Stats show loading state',
      'Stats handle errors gracefully',
      'Stats refetch every 30 seconds',
      'Stats show computed fields (answerRate, conversionRate)',
      'Manual refetch works',
    ],
  },
  
  'Calls Hook': {
    tests: [
      'Initial page loads',
      'Infinite scroll loads more pages',
      'Loading states work for pagination',
      'Filters are applied correctly',
      'Cache key includes filters',
      'Error handling for failed loads',
    ],
  },
  
  'Bookings Hook': {
    tests: [
      'Bookings load for current date',
      'Date filter changes trigger refetch',
      'Optimistic updates show immediately',
      'Failed mutations roll back optimistically',
      'Success mutations invalidate cache',
      'Create/Update/Cancel mutations work',
    ],
  },
  
  'Token Refresh': {
    tests: [
      'Single 401 triggers refresh',
      'Multiple concurrent 401s use single refresh',
      'Requests queue during refresh',
      'Failed refresh redirects to login',
      'New token is stored correctly',
      'Original requests retry with new token',
    ],
  },
  
  'Connection Status': {
    tests: [
      'Online/offline detection works',
      'Backend health check runs periodically',
      'Token refresh status shows',
      'Retry button works',
      'Status indicator updates in real-time',
      'Alert shows on connection issues',
    ],
  },
  
  'Error Handling': {
    tests: [
      'Network errors show toast',
      '403 errors show access denied',
      '404 errors show not found',
      '500 errors show server error',
      'Offline shows connection lost',
      'Toasts auto-dismiss after 5 seconds',
    ],
  },
  
  'React Query DevTools': {
    tests: [
      'DevTools show in development',
      'All queries visible in devtools',
      'Cache data inspectable',
      'Manual invalidation works',
      'Stale/fresh states visible',
    ],
  },
};

// Verification steps for each component
export const verificationSteps = {
  setup: [
    '1. Ensure .env.local has NEXT_PUBLIC_BACKEND_API_URL set',
    '2. Ensure backend is running',
    '3. Sign in to get valid auth token',
    '4. Open browser DevTools console',
    '5. Open React Query DevTools',
  ],
  
  dashboardTest: [
    '1. Navigate to /dashboard',
    '2. Verify stats load and display',
    '3. Check loading skeleton shows briefly',
    '4. Wait 30 seconds for auto-refetch',
    '5. Check DevTools for query status',
  ],
  
  tokenRefreshTest: [
    '1. Navigate to /test-token-refresh',
    '2. Click "Run Token Refresh Tests"',
    '3. Verify all tests pass',
    '4. Check console for token refresh logs',
    '5. Verify you stay logged in',
  ],
  
  errorHandlingTest: [
    '1. Navigate to /test-react-query',
    '2. Click "Test All Toasts"',
    '3. Verify 4 toast types appear',
    '4. Disconnect internet and refresh',
    '5. Verify offline toast appears',
    '6. Click "Trigger 401 Error"',
    '7. Verify token refresh happens',
  ],
};