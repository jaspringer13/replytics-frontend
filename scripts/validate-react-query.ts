import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

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
  } catch (error) {
    console.warn(`Failed to read file: ${filePath}`, error instanceof Error ? error.message : 'Unknown error');
    return '';
  }
}

function addResult(requirement: string, status: 'pass' | 'fail' | 'warning', details: string) {
  validationResults.push({ requirement, status, details });
}

// AST-based validation helpers
function parseFile(filePath: string): ts.SourceFile | null {
  const content = readFile(filePath);
  if (!content) return null;
  
  return ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );
}

function hasExport(sourceFile: ts.SourceFile, exportName: string): boolean {
  let found = false;
  
  function visit(node: ts.Node) {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      node.exportClause.elements.forEach(element => {
        if (element.name.text === exportName) {
          found = true;
        }
      });
    }
    
    if (ts.isVariableStatement(node) && 
        node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
      node.declarationList.declarations.forEach(decl => {
        if (ts.isIdentifier(decl.name) && decl.name.text === exportName) {
          found = true;
        }
      });
    }
    
    if (ts.isFunctionDeclaration(node) && 
        node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword) &&
        node.name?.text === exportName) {
      found = true;
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return found;
}

function hasCallExpression(sourceFile: ts.SourceFile, functionName: string): boolean {
  let found = false;
  
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === functionName) {
        found = true;
      }
    }
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return found;
}

function hasPropertyAccess(sourceFile: ts.SourceFile, objectName: string, propertyName: string): boolean {
  let found = false;
  
  function visit(node: ts.Node) {
    if (ts.isPropertyAccessExpression(node) && 
        ts.isIdentifier(node.expression) && 
        node.expression.text === objectName &&
        node.name.text === propertyName) {
      found = true;
    }
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return found;
}

function hasInterface(sourceFile: ts.SourceFile, interfaceName: string): boolean {
  let found = false;
  
  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      found = true;
    }
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return found;
}

function hasNumericLiteral(sourceFile: ts.SourceFile, value: number): boolean {
  let found = false;
  
  function visit(node: ts.Node) {
    if (ts.isNumericLiteral(node) && parseInt(node.text) === value) {
      found = true;
    }
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return found;
}

// Check 1: Query Client Configuration
const queryClientAST = parseFile('lib/react-query.ts');
if (queryClientAST) {
  const hasStaleTime = hasNumericLiteral(queryClientAST, 300000); // 5 * 60 * 1000
  const hasRetryLogic = hasPropertyAccess(queryClientAST, 'defaultOptions', 'retry');
  const hasQueryKeys = hasExport(queryClientAST, 'queryKeys');
  
  addResult(
    'Query Client Configuration',
    hasStaleTime && hasRetryLogic && hasQueryKeys ? 'pass' : 'fail',
    `Checking staleTime (${hasStaleTime}), retry logic (${hasRetryLogic}), and query keys (${hasQueryKeys})`
  );
} else {
  addResult('Query Client Configuration', 'fail', 'lib/react-query.ts not found');
}

// Check 2: Providers Setup
const providersAST = parseFile('components/providers/SessionProvider.tsx');
if (providersAST) {
  const hasQueryProvider = hasCallExpression(providersAST, 'QueryProvider');
  const hasToastContainer = hasCallExpression(providersAST, 'ToastContainer');
  
  addResult(
    'Providers Integration',
    hasQueryProvider && hasToastContainer ? 'pass' : 'fail',
    `QueryProvider (${hasQueryProvider}) and ToastContainer (${hasToastContainer}) should be in the providers tree`
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
const statsAST = parseFile('hooks/api/useStats.ts');
if (statsAST) {
  const hasStatsInterface = hasInterface(statsAST, 'StatsData');
  addResult(
    'TypeScript Types',
    hasStatsInterface ? 'pass' : 'warning',
    `StatsData interface found: ${hasStatsInterface}`
  );
}

// Check 8: Dashboard Integration
const dashboardAST = parseFile('components/dashboard/DashboardClient.tsx');
if (dashboardAST) {
  const usesStats = hasCallExpression(dashboardAST, 'useStats');
  const hasLoadingStates = hasPropertyAccess(dashboardAST, 'data', 'isLoading');
  const hasErrorStates = hasPropertyAccess(dashboardAST, 'data', 'error');
  
  addResult(
    'Dashboard Integration',
    usesStats && (hasLoadingStates || hasErrorStates) ? 'pass' : 'fail',
    `useStats hook (${usesStats}), loading states (${hasLoadingStates}), error states (${hasErrorStates})`
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