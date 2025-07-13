import * as fs from 'fs';
import * as path from 'path';

// Validation script to ensure React Query implementation meets all requirements

const validationResults: Array<{
  requirement: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
}> = [];

function checkFile(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function readFile(filePath: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
  } catch {
    return '';
  }
}

function addResult(requirement: string, status: 'pass' | 'fail' | 'warning', details: string) {
  validationResults.push({ requirement, status, details });
}

// Check 1: Query Client Configuration
const queryClientFile = readFile('lib/react-query.ts');
if (queryClientFile) {
  const hasStaleTime = queryClientFile.includes('staleTime: 5 * 60 * 1000');
  const hasRetryLogic = queryClientFile.includes('retry: (failureCount, error: any)');
  const hasExponentialBackoff = queryClientFile.includes('Math.pow(2, attemptIndex)');
  const hasQueryKeys = queryClientFile.includes('export const queryKeys');
  
  addResult(
    'Query Client Configuration',
    hasStaleTime && hasRetryLogic && hasExponentialBackoff && hasQueryKeys ? 'pass' : 'fail',
    'Checking staleTime, retry logic, exponential backoff, and query keys'
  );
} else {
  addResult('Query Client Configuration', 'fail', 'lib/react-query.ts not found');
}

// Check 2: Providers Setup
const providersFile = readFile('components/providers/SessionProvider.tsx');
if (providersFile) {
  const hasQueryProvider = providersFile.includes('QueryProvider');
  const hasToastContainer = providersFile.includes('ToastContainer');
  
  addResult(
    'Providers Integration',
    hasQueryProvider && hasToastContainer ? 'pass' : 'fail',
    'QueryProvider and ToastContainer should be in the providers tree'
  );
} else {
  addResult('Providers Integration', 'fail', 'Providers file not found');
}

// Check 3: Token Refresh Implementation
const apiClientFile = readFile('lib/api-client.ts');
if (apiClientFile) {
  const hasRefreshQueue = apiClientFile.includes('requestQueue');
  const hasIsRefreshing = apiClientFile.includes('isRefreshing');
  const has401Handling = apiClientFile.includes('response.status === 401');
  const hasRetryLogic = apiClientFile.includes('retryCount');
  
  addResult(
    'Token Refresh Mechanism',
    hasRefreshQueue && hasIsRefreshing && has401Handling && hasRetryLogic ? 'pass' : 'fail',
    'Thread-safe token refresh with request queue'
  );
} else {
  addResult('Token Refresh Mechanism', 'fail', 'API client file not found');
}

// Check 4: Required Hooks
const hooks = [
  { name: 'useStats', path: 'hooks/api/useStats.ts', required: true },
  { name: 'useCalls', path: 'hooks/api/useCalls.ts', required: true },
  { name: 'useBookings', path: 'hooks/api/useBookings.ts', required: true },
  { name: 'useSMS', path: 'hooks/api/useSMS.ts', required: false },
  { name: 'useBilling', path: 'hooks/api/useBilling.ts', required: false },
  { name: 'useConnectionStatus', path: 'hooks/useConnectionStatus.ts', required: true },
  { name: 'useToast', path: 'hooks/useToast.ts', required: true },
];

hooks.forEach(hook => {
  const exists = checkFile(hook.path);
  if (hook.required) {
    addResult(`Hook: ${hook.name}`, exists ? 'pass' : 'fail', hook.path);
  } else {
    addResult(`Hook: ${hook.name}`, exists ? 'pass' : 'warning', `${hook.path} (optional)`);
  }
});

// Check 5: Optimistic Updates
const bookingsHook = readFile('hooks/api/useBookings.ts');
if (bookingsHook) {
  const hasOptimisticUpdate = bookingsHook.includes('onMutate');
  const hasRollback = bookingsHook.includes('onError');
  const hasInvalidation = bookingsHook.includes('invalidateQueries');
  
  addResult(
    'Optimistic Updates',
    hasOptimisticUpdate && hasRollback && hasInvalidation ? 'pass' : 'fail',
    'Bookings mutations should have optimistic updates with rollback'
  );
}

// Check 6: Error Handling
const hasToastHook = checkFile('hooks/useToast.ts');
const hasToastComponent = checkFile('components/ui/Toast.tsx');
const hasConnectionStatus = checkFile('components/dashboard/ConnectionStatus.tsx');

addResult(
  'Error Handling Setup',
  hasToastHook && hasToastComponent && hasConnectionStatus ? 'pass' : 'fail',
  'Toast system and connection status components'
);

// Check 7: TypeScript Types
const statsHook = readFile('hooks/api/useStats.ts');
if (statsHook) {
  const hasTypes = statsHook.includes('interface StatsData');
  addResult(
    'TypeScript Types',
    hasTypes ? 'pass' : 'warning',
    'Hooks should have proper TypeScript types'
  );
}

// Check 8: Dashboard Integration
const dashboardClient = readFile('components/dashboard/DashboardClient.tsx');
if (dashboardClient) {
  const usesReactQuery = dashboardClient.includes('useStats');
  const hasLoadingStates = dashboardClient.includes('isLoading');
  const hasErrorStates = dashboardClient.includes('error');
  
  addResult(
    'Dashboard Integration',
    usesReactQuery && hasLoadingStates && hasErrorStates ? 'pass' : 'fail',
    'Dashboard should use React Query hooks with loading/error states'
  );
}

// Print results
console.log('\n🔍 React Query Implementation Validation Results\n');
console.log('=' .repeat(60));

const passed = validationResults.filter(r => r.status === 'pass').length;
const failed = validationResults.filter(r => r.status === 'fail').length;
const warnings = validationResults.filter(r => r.status === 'warning').length;

validationResults.forEach(result => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${result.requirement}`);
  console.log(`   ${result.details}`);
  console.log('');
});

console.log('=' .repeat(60));
console.log(`\nSummary: ${passed} passed, ${failed} failed, ${warnings} warnings`);

if (failed === 0) {
  console.log('\n✨ All requirements met! React Query integration is complete.');
} else {
  console.log('\n❗ Some requirements are not met. Please review the failures above.');
  process.exit(1);
}