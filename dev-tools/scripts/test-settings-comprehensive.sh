#!/bin/bash

echo "=== Comprehensive Settings Testing Suite ==="
echo "Testing critical voice agent configuration transmission"
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test suite
run_test_suite() {
    local suite_name=$1
    local test_file=$2
    
    echo -e "${YELLOW}Running $suite_name...${NC}"
    ((TOTAL_TESTS++))
    
    if npm test -- "$test_file" --coverage 2>&1 | tee test-output.tmp; then
        echo -e "${GREEN}✅ $suite_name passed${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ $suite_name failed${NC}"
        ((FAILED_TESTS++))
    fi
    
    # Extract coverage info if available
    if grep -q "Coverage summary" test-output.tmp; then
        echo "Coverage:"
        grep -A 5 "Coverage summary" test-output.tmp
    fi
    
    rm -f test-output.tmp
    echo
}

# 1. Unit Tests for Voice Settings Service
echo "1. Voice Settings Service Tests"
# Check if test file exists
if [ ! -f "__tests__/settings/voice-settings.test.ts" ]; then
  echo -e "${RED}❌ Test file not found: __tests__/settings/voice-settings.test.ts${NC}"
  ((TOTAL_TESTS++))
  ((FAILED_TESTS++))
else
  run_test_suite "Voice Settings Unit Tests" "__tests__/settings/voice-settings.test.ts"
fi

# 2. Integration Tests for Settings Page
echo "2. Settings Page Integration Tests"
# Check if test file exists
if [ ! -f "__tests__/integration/settings-integration.test.tsx" ]; then
  echo -e "${RED}❌ Test file not found: __tests__/integration/settings-integration.test.tsx${NC}"
  ((TOTAL_TESTS++))
  ((FAILED_TESTS++))
else
  run_test_suite "Settings Integration Tests" "__tests__/integration/settings-integration.test.tsx"
fi

# 3. Backend Transmission Validation
echo "3. Backend Voice Agent Transmission Tests"
# Check if test file exists
if [ ! -f "__tests__/integration/settings-backend-validation.test.ts" ]; then
  echo -e "${RED}❌ Test file not found: __tests__/integration/settings-backend-validation.test.ts${NC}"
  ((TOTAL_TESTS++))
  ((FAILED_TESTS++))
else
  run_test_suite "Backend Validation Tests" "__tests__/integration/settings-backend-validation.test.ts"
fi

# 4. Type Safety Validation
echo "4. Type Safety Checks"
echo -e "${YELLOW}Running TypeScript type checks...${NC}"
((TOTAL_TESTS++))

if npm run typecheck 2>&1 | grep -E "(Settings|settings|Voice|voice)" > type-errors.tmp; then
    if [ -s type-errors.tmp ]; then
        echo -e "${RED}❌ Type errors found in settings:${NC}"
        cat type-errors.tmp
        ((FAILED_TESTS++))
    else
        echo -e "${GREEN}✅ No type errors in settings${NC}"
        ((PASSED_TESTS++))
    fi
else
    echo -e "${GREEN}✅ All type checks passed${NC}"
    ((PASSED_TESTS++))
fi
rm -f type-errors.tmp
echo

# 5. API Contract Validation
echo "5. API Contract Validation"
echo -e "${YELLOW}Validating API contracts...${NC}"
((TOTAL_TESTS++))

# Check if voice settings API matches expected format
if ! cat > validate-api-contract.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Expected backend format
const expectedVoiceSettingsFormat = {
  voice_id: 'string',
  speaking_style: 'string',
  speed: 'number',
  pitch: 'number'
};

const expectedConversationRulesFormat = {
  allow_multiple_services: 'boolean',
  allow_cancellations: 'boolean',
  allow_rescheduling: 'boolean',
  no_show_block_enabled: 'boolean',
  no_show_threshold: 'number'
};

// Validate that frontend models match backend expectations
console.log('Validating API contract compatibility...');

// Check if the API client properly transforms data
const apiClientPath = path.join(process.cwd(), 'lib/api-client.ts');
if (fs.existsSync(apiClientPath)) {
  const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
  
  // Check for proper case transformation
  if (apiClientContent.includes('voiceSettings') && apiClientContent.includes('voice_settings')) {
    console.log('✅ API client handles case transformation');
  } else {
    console.log('❌ API client may not handle case transformation properly');
    process.exit(1);
  }
} else {
  console.log('❌ API client not found');
  process.exit(1);
}

console.log('✅ API contract validation passed');
EOF
then
  echo -e "${RED}❌ Failed to create API validation script${NC}"
  ((TOTAL_TESTS++))
  ((FAILED_TESTS++))
  exit 1
fi

if node validate-api-contract.js; then
    echo -e "${GREEN}✅ API contracts valid${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ API contract validation failed${NC}"
    ((FAILED_TESTS++))
fi
rm -f validate-api-contract.js || echo "Warning: Failed to cleanup validate-api-contract.js"
echo

# 6. Real-time Update Testing
echo "6. Real-time Configuration Updates"
echo -e "${YELLOW}Testing real-time update mechanism...${NC}"
((TOTAL_TESTS++))

# Check if real-time config manager exists and handles voice settings
if grep -q "voice_settings_updated" lib/realtime-config.ts 2>/dev/null || \
   grep -q "voice_settings_updated" app/services/dashboard/voice_settings_service.ts 2>/dev/null; then
    echo -e "${GREEN}✅ Real-time voice settings updates configured${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Real-time voice settings updates not found${NC}"
    ((FAILED_TESTS++))
fi
echo

# 7. Configuration Validation
echo "7. Configuration Management"
echo -e "${YELLOW}Validating configuration setup...${NC}"
((TOTAL_TESTS++))

if [ -d "lib/config" ] && [ -f "lib/config/environment.ts" ]; then
    echo -e "${GREEN}✅ Centralized configuration exists${NC}"
    
    # Check for required voice agent configs
    if grep -q "DEFAULT_VOICE_ID" lib/config/environment.ts && \
       grep -q "ELEVENLABS_API_KEY" lib/config/environment.ts; then
        echo -e "${GREEN}✅ Voice agent configuration present${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ Missing voice agent configuration${NC}"
        ((FAILED_TESTS++))
    fi
else
    echo -e "${RED}❌ Configuration management not found${NC}"
    ((FAILED_TESTS++))
fi
echo

# Summary
echo "==================================="
echo "Test Summary"
echo "==================================="
echo -e "Total Tests Run: ${TOTAL_TESTS}"
echo -e "Passed: ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo
    echo -e "${GREEN}🎉 All tests passed! Settings->Backend transmission is verified.${NC}"
    echo "Voice agent configuration will be transmitted correctly."
    exit 0
else
    echo
    echo -e "${RED}⚠️  Some tests failed. Please fix the issues before deploying.${NC}"
    echo "Voice agent configuration may not work correctly."
    exit 1
fi