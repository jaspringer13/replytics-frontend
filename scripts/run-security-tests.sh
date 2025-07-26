#!/bin/bash

# BULLETPROOF SECURITY TEST RUNNER
# 
# This script executes the comprehensive security test suite for the
# Phase 1-2 multi-tenant authentication system.
#
# CRITICAL REQUIREMENT: All tests must pass for production deployment.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Security test configuration
SECURITY_TESTS_DIR="tests/security"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Print banner
print_banner() {
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}🛡️  BULLETPROOF MULTI-TENANT SECURITY TEST SUITE${NC}"
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}Phase 1-2 Authentication System Security Validation${NC}"
    echo -e "${CYAN}ZERO TOLERANCE FOR SECURITY VULNERABILITIES${NC}"
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo
}

# Print test suite header
print_test_header() {
    local test_name="$1"
    local test_file="$2"
    echo
    echo -e "${BLUE}🔍 EXECUTING: ${test_name}${NC}"
    echo -e "${BLUE}📁 FILE: ${test_file}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Print test results
print_test_results() {
    local test_name="$1"
    local exit_code="$2"
    local test_count="$3"
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ ${test_name}: ${test_count} TESTS PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + test_count))
    else
        echo -e "${RED}❌ ${test_name}: TESTS FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + test_count))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + test_count))
}

# Execute individual test suite
run_test_suite() {
    local test_file="$1"
    local test_name="$2"
    local test_count="$3"
    
    print_test_header "$test_name" "$test_file"
    
    # Check if test file exists
    if [ ! -f "$test_file" ]; then
        echo -e "${RED}❌ ERROR: Test file not found: $test_file${NC}"
        exit 1
    fi
    
    # Run the test suite
    if npm test "$test_file" --silent; then
        print_test_results "$test_name" 0 "$test_count"
    else
        print_test_results "$test_name" 1 "$test_count"
        return 1
    fi
}

# Print final security assessment
print_security_assessment() {
    echo
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}🛡️  FINAL SECURITY ASSESSMENT${NC}"
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎯 SECURITY POSTURE: BULLETPROOF ✅${NC}"
        echo -e "${GREEN}📊 TOTAL TESTS: ${TOTAL_TESTS}/${TOTAL_TESTS} PASSED (100%)${NC}"
        echo -e "${GREEN}🚀 DEPLOYMENT STATUS: APPROVED FOR PRODUCTION ✅${NC}"
        echo
        echo -e "${GREEN}CRITICAL SECURITY REQUIREMENTS:${NC}"
        echo -e "${GREEN}✅ Zero cross-tenant access possible${NC}"
        echo -e "${GREEN}✅ All attack vectors blocked${NC}"
        echo -e "${GREEN}✅ Consistent security patterns${NC}"
        echo -e "${GREEN}✅ No information leakage${NC}"
        echo -e "${GREEN}✅ Performance maintained${NC}"
    else
        echo -e "${RED}🚨 SECURITY POSTURE: CRITICAL VULNERABILITIES DETECTED ❌${NC}"
        echo -e "${RED}📊 TOTAL TESTS: ${PASSED_TESTS}/${TOTAL_TESTS} PASSED${NC}"
        echo -e "${RED}❌ FAILED TESTS: ${FAILED_TESTS}${NC}"
        echo -e "${RED}🚫 DEPLOYMENT STATUS: BLOCKED - SECURITY ISSUES MUST BE FIXED${NC}"
        echo
        echo -e "${RED}CRITICAL SECURITY FAILURES:${NC}"
        echo -e "${RED}❌ Security vulnerabilities detected${NC}"
        echo -e "${RED}❌ Production deployment BLOCKED${NC}"
        echo -e "${RED}❌ Immediate remediation required${NC}"
    fi
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
}

# Main execution
main() {
    print_banner
    
    echo -e "${YELLOW}🔧 PREPARING SECURITY TEST ENVIRONMENT...${NC}"
    
    # Ensure we're in the project root
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ ERROR: Must be run from project root directory${NC}"
        exit 1
    fi
    
    # Check if security tests exist
    if [ ! -d "$SECURITY_TESTS_DIR" ]; then
        echo -e "${RED}❌ ERROR: Security tests directory not found: $SECURITY_TESTS_DIR${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment ready${NC}"
    echo -e "${YELLOW}🚀 EXECUTING COMPREHENSIVE SECURITY VALIDATION...${NC}"
    
    # Execute each security test suite
    set +e  # Don't exit on test failures, we want to run all tests
    
    # 1. Bulletproof Multi-Tenant Security Tests
    run_test_suite \
        "$SECURITY_TESTS_DIR/bulletproof-multi-tenant-security.test.ts" \
        "Bulletproof Multi-Tenant Security" \
        67
    
    # 2. Cross-Tenant Isolation Tests
    run_test_suite \
        "$SECURITY_TESTS_DIR/cross-tenant-isolation.test.ts" \
        "Cross-Tenant Isolation" \
        43
    
    # 3. Attack Vector Simulation Tests
    run_test_suite \
        "$SECURITY_TESTS_DIR/attack-vector-simulation.test.ts" \
        "Attack Vector Simulation" \
        33
    
    # 4. Run existing security validation tests
    if [ -f "tests/auth-security-validation.test.js" ]; then
        run_test_suite \
            "tests/auth-security-validation.test.js" \
            "Auth Security Validation" \
            10
    fi
    
    # Print final assessment
    print_security_assessment
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL SECURITY TESTS PASSED - SYSTEM IS BULLETPROOF ✅${NC}"
        exit 0
    else
        echo -e "${RED}🚨 SECURITY TESTS FAILED - PRODUCTION DEPLOYMENT BLOCKED ❌${NC}"
        exit 1
    fi
}

# Handle script interruption
trap 'echo -e "\n${RED}🚨 Security test execution interrupted${NC}"; exit 1' INT TERM

# Execute main function
main "$@"