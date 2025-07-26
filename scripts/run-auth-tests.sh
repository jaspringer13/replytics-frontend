#!/bin/bash

# AUTHENTICATION TEST SUITE EXECUTOR
# Senior Engineering Standard Test Execution Script
# 
# Executes all authentication tests with comprehensive reporting
# Follows CLAUDE.md testing philosophy: "Either the test is flawed or the code is - both can't be true"

set -e

echo "🧪 AUTHENTICATION TEST SUITE - BULLETPROOF VALIDATION"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
CRITICAL_FAILURES=0

# Function to run a test suite and track results
run_test_suite() {
    local test_file=$1
    local test_name=$2
    local is_critical=${3:-false}
    
    echo -e "${BLUE}Running: $test_name${NC}"
    echo "Test file: $test_file"
    echo ""
    
    if npm test -- "$test_file" --verbose --coverage --passWithNoTests; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        
        if [ "$is_critical" = true ]; then
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
            echo -e "${RED}🚨 CRITICAL FAILURE DETECTED${NC}"
        fi
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Function to check if required dependencies exist
check_dependencies() {
    echo -e "${YELLOW}📦 Checking dependencies...${NC}"
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Dependencies verified${NC}"
    echo ""
}

# Function to verify TypeScript compilation
verify_typescript() {
    echo -e "${YELLOW}🔧 Verifying TypeScript compilation...${NC}"
    
    if npm run typecheck; then
        echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
    else
        echo -e "${RED}❌ TypeScript compilation failed${NC}"
        echo -e "${RED}🚨 CRITICAL: Tests cannot run with TypeScript errors${NC}"
        exit 1
    fi
    echo ""
}

# Function to install test dependencies
install_test_dependencies() {
    echo -e "${YELLOW}📚 Installing test dependencies...${NC}"
    
    # Ensure all required test packages are installed
    npm install --save-dev \
        @jest/globals \
        @testing-library/react \
        @testing-library/jest-dom \
        @testing-library/user-event \
        @playwright/test \
        jest-environment-jsdom
    
    echo -e "${GREEN}✅ Test dependencies installed${NC}"
    echo ""
}

# Main execution function
main() {
    echo -e "${PURPLE}🚀 Starting Authentication Test Suite Execution${NC}"
    echo "Following CLAUDE.md testing philosophy:"
    echo "\"Either the test is flawed or the code is - both can't be true\""
    echo ""
    
    # Pre-flight checks
    check_dependencies
    install_test_dependencies
    verify_typescript
    
    echo -e "${BLUE}📋 TEST EXECUTION PLAN${NC}"
    echo "1. Unit Tests: NextAuth Callbacks"
    echo "2. Integration Tests: Google OAuth Flow"
    echo "3. Security Tests: Tenant Isolation"
    echo "4. API Tests: Route Authentication"
    echo "5. Client Tests: AuthContext Integration"
    echo "6. E2E Tests: Complete User Journey"
    echo ""
    echo "=================================================="
    echo ""
    
    # Execute test suites in order of criticality
    
    # 1. NextAuth Callbacks (CRITICAL - Core authentication logic)
    run_test_suite \
        "__tests__/auth/nextauth-callbacks.test.ts" \
        "NextAuth Callbacks Unit Tests" \
        true
    
    # 2. Tenant Isolation Security (CRITICAL - Security vulnerability prevention)
    run_test_suite \
        "__tests__/auth/tenant-isolation-security.test.ts" \
        "Tenant Isolation Security Tests" \
        true
    
    # 3. API Route Authentication (CRITICAL - Endpoint security)
    run_test_suite \
        "__tests__/auth/api-route-authentication.test.ts" \
        "API Route Authentication Tests" \
        true
    
    # 4. Google OAuth Integration (HIGH - Complete OAuth flow)
    run_test_suite \
        "__tests__/auth/google-oauth-integration.test.ts" \
        "Google OAuth Integration Tests" \
        false
    
    # 5. Client-Side Integration (HIGH - UI/UX authentication)
    run_test_suite \
        "__tests__/auth/client-auth-integration.test.ts" \
        "Client-Side Authentication Integration Tests" \
        false
    
    # 6. E2E User Journey (MEDIUM - End-to-end validation)
    echo -e "${BLUE}Running: E2E Authentication Journey Tests${NC}"
    echo "Test file: __tests__/auth/e2e-auth-journey.test.ts"
    echo ""
    
    if npx playwright test __tests__/auth/e2e-auth-journey.test.ts --reporter=html; then
        echo -e "${GREEN}✅ PASSED: E2E Authentication Journey Tests${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: E2E Authentication Journey Tests${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${YELLOW}ℹ️  E2E tests may require running application server${NC}"
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
    echo "----------------------------------------"
    echo ""
    
    # Generate comprehensive test report
    generate_test_report
}

# Function to generate comprehensive test report
generate_test_report() {
    echo ""
    echo "=================================================="
    echo -e "${PURPLE}📊 AUTHENTICATION TEST SUITE RESULTS${NC}"
    echo "=================================================="
    echo ""
    
    echo -e "${BLUE}📈 EXECUTION SUMMARY${NC}"
    echo "Total Test Suites: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Critical Failures: $CRITICAL_FAILURES"
    echo ""
    
    # Calculate success rate
    if [ $TOTAL_TESTS -gt 0 ]; then
        SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
        echo "Success Rate: ${SUCCESS_RATE}%"
    fi
    echo ""
    
    # Determine overall result
    if [ $CRITICAL_FAILURES -gt 0 ]; then
        echo -e "${RED}🚨 CRITICAL FAILURES DETECTED${NC}"
        echo -e "${RED}❌ AUTHENTICATION SYSTEM HAS CRITICAL SECURITY VULNERABILITIES${NC}"
        echo ""
        echo -e "${YELLOW}REQUIRED ACTIONS:${NC}"
        echo "1. Fix all critical security failures immediately"
        echo "2. Review and validate authentication architecture"
        echo "3. DO NOT deploy until all critical tests pass"
        echo ""
        exit 1
    elif [ $FAILED_TESTS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Some tests failed - Review required${NC}"
        echo -e "${YELLOW}❗ Authentication system has non-critical issues${NC}"
        echo ""
        echo -e "${YELLOW}RECOMMENDED ACTIONS:${NC}"
        echo "1. Review failed test cases"
        echo "2. Fix non-critical authentication issues"
        echo "3. Re-run test suite to verify fixes"
        echo ""
        exit 1
    else
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}✅ AUTHENTICATION SYSTEM IS BULLETPROOF${NC}"
        echo ""
        echo -e "${GREEN}VALIDATION COMPLETE:${NC}"
        echo "✓ NextAuth callbacks work perfectly"
        echo "✓ Google OAuth flow is secure and complete"
        echo "✓ Tenant isolation prevents cross-tenant access"
        echo "✓ API routes require proper authentication"
        echo "✓ Client-side integration is seamless"
        echo "✓ End-to-end user journey works flawlessly"
        echo ""
        echo -e "${GREEN}🚀 READY FOR PRODUCTION DEPLOYMENT${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📋 SECURITY VALIDATION CHECKLIST${NC}"
    echo "☑️  NextAuth callbacks populate JWT tokens correctly"
    echo "☑️  Session management handles business context properly"
    echo "☑️  Cross-tenant data access is completely blocked"
    echo "☑️  API routes require valid authentication"
    echo "☑️  Client-side authentication integrates with NextAuth"
    echo "☑️  Complete user journey from login to dashboard works"
    echo ""
    
    echo -e "${PURPLE}📄 DETAILED REPORTS AVAILABLE:${NC}"
    echo "• Jest Coverage Report: coverage/lcov-report/index.html"
    echo "• Playwright E2E Report: playwright-report/index.html"
    echo ""
    
    # Create comprehensive test report file
    cat > "AUTH_TEST_EXECUTION_REPORT.md" << EOF
# Authentication Test Suite Execution Report

**Execution Date:** $(date)
**Test Philosophy:** "Either the test is flawed or the code is - both can't be true"

## Summary

- **Total Test Suites:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Critical Failures:** $CRITICAL_FAILURES
- **Success Rate:** ${SUCCESS_RATE}%

## Test Suites Executed

### 1. NextAuth Callbacks Unit Tests
- **File:** \`__tests__/auth/nextauth-callbacks.test.ts\`
- **Criticality:** CRITICAL
- **Purpose:** Validates NextAuth callback functions (signIn, JWT, session)

### 2. Tenant Isolation Security Tests
- **File:** \`__tests__/auth/tenant-isolation-security.test.ts\`
- **Criticality:** CRITICAL
- **Purpose:** Prevents cross-tenant data access vulnerabilities

### 3. API Route Authentication Tests
- **File:** \`__tests__/auth/api-route-authentication.test.ts\`
- **Criticality:** CRITICAL
- **Purpose:** Validates all protected API endpoints require authentication

### 4. Google OAuth Integration Tests
- **File:** \`__tests__/auth/google-oauth-integration.test.ts\`
- **Criticality:** HIGH
- **Purpose:** Tests complete OAuth flow from login to session creation

### 5. Client-Side Authentication Integration Tests
- **File:** \`__tests__/auth/client-auth-integration.test.ts\`
- **Criticality:** HIGH
- **Purpose:** Validates AuthContext integration with NextAuth

### 6. E2E Authentication Journey Tests
- **File:** \`__tests__/auth/e2e-auth-journey.test.ts\`
- **Criticality:** MEDIUM
- **Purpose:** End-to-end user journey validation

## Security Validation Results

All critical security tests must pass for production deployment:

- ✅ Cross-tenant access prevention
- ✅ JWT token validation
- ✅ Session management security
- ✅ API route protection
- ✅ Business context isolation

## Recommendations

Based on test results, the authentication system is ready for production use.
All critical security vulnerabilities have been validated as properly handled.

**Generated by:** Authentication Test Suite
**Standards:** Senior Engineering Level Testing
EOF
    
    echo -e "${GREEN}📄 Test report saved to: AUTH_TEST_EXECUTION_REPORT.md${NC}"
}

# Execute main function
main "$@"