#!/bin/bash

echo "=== Settings Component Build Test ==="
echo

# Set up cleanup trap
cleanup() {
  rm -f test-imports.ts
}
trap cleanup EXIT INT TERM

# Check required dependencies
check_dependencies() {
  local missing_deps=()
  
  command -v npx >/dev/null 2>&1 || missing_deps+=("npx")
  
  # Check for tsc (global or local)
  if ! command -v tsc >/dev/null 2>&1 && ! [ -f "node_modules/.bin/tsc" ]; then
    missing_deps+=("tsc")
  fi
  
  if [ ${#missing_deps[@]} -ne 0 ]; then
    echo "❌ Missing required dependencies: ${missing_deps[*]}"
    exit 1
  fi
}

check_dependencies

# Test 1: Check TypeScript compilation for settings files
echo "1. TypeScript compilation check for settings files..."
FILES=(
  "components/dashboard/settings/Settings.tsx"
  "components/dashboard/settings/BusinessProfileTab.tsx"
  "components/dashboard/settings/SettingsHeader.tsx"
  "components/dashboard/settings/SettingsTabNavigation.tsx"
  "components/dashboard/settings/SettingsTabContent.tsx"
  "components/dashboard/settings/SettingsLoadingWrapper.tsx"
  "contexts/SettingsContext.tsx"
  "lib/hooks/useSettingsData.ts"
  "lib/hooks/useRealtimeConfig.ts"
)

TS_ERRORS=0
for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ⚠️  File not found: $file"
    continue
  fi
  echo -n "  Checking $file... "
  if npx tsc --noEmit "$file" 2>&1 | grep -q "error TS"; then
    echo "❌ Has errors"
    npx tsc --noEmit "$file" 2>&1 | grep "error TS" | head -5
    ((TS_ERRORS++))
  else
    echo "✅ OK"
  fi
done

echo
echo "2. Testing imports..."
# Create a temporary test file
if ! cat > test-imports.ts << 'EOF'
import { Settings } from './components/dashboard/settings/Settings';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { useSettingsData } from './lib/hooks/useSettingsData';
import { useRealtimeConfig } from './lib/hooks/useRealtimeConfig';

// Test that components are properly typed
const TestComponent = () => {
  const settings = <Settings businessId="test-123" />;
  return settings;
};

// Test context usage
const TestContextUsage = () => {
  const { businessId, activeTab, settingsData } = useSettings();
  return null;
};

console.log('All imports successful');
EOF
then
  echo "❌ Failed to create test file"
  exit 1
fi

echo -n "  Testing component imports... "
if npx tsc --noEmit test-imports.ts 2>&1 | grep -q "error"; then
  echo "❌ Import errors found"
  echo "  Details:"
  npx tsc --noEmit test-imports.ts 2>&1 | grep "error" | head -3
else
  echo "✅ All imports work"
fi

# Cleanup handled by trap

echo
echo "3. Next.js build test (partial)..."
# Test that the pages using settings will build
echo -n "  Testing settings page build... "
if [ ! -f "app/dashboard/settings/page.tsx" ]; then
  echo "⚠️  Settings page not found"
elif npx tsc --noEmit app/dashboard/settings/page.tsx 2>&1 | grep -q "error"; then
  echo "❌ Settings page has errors"
else
  echo "✅ Settings page OK"
fi

echo
echo "=== Summary ==="
if [ $TS_ERRORS -eq 0 ]; then
  echo "✅ All settings components compile without errors"
else
  echo "❌ Found $TS_ERRORS files with compilation errors"
fi

echo
echo "4. Checking for circular dependencies..."
npx madge --circular --extensions ts,tsx components/dashboard/settings contexts lib/hooks 2>/dev/null | grep -q "No circular" && echo "✅ No circular dependencies found" || echo "⚠️  Possible circular dependencies detected"