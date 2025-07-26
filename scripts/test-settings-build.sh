#!/bin/bash

echo "=== Settings Component Build Test ==="
echo

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
  echo -n "  Checking $file... "
  if npx tsc --noEmit --project . "$file" 2>&1 | grep -q "error TS"; then
    echo "❌ Has errors"
    npx tsc --noEmit --project . "$file" 2>&1 | grep "error TS" | head -5
    ((TS_ERRORS++))
  else
    echo "✅ OK"
  fi
done

echo
echo "2. Testing imports..."
# Create a temporary test file
cat > test-imports.ts << 'EOF'
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

echo -n "  Testing component imports... "
if npx tsc --noEmit test-imports.ts 2>&1 | grep -q "error"; then
  echo "❌ Import errors found"
else
  echo "✅ All imports work"
fi

rm -f test-imports.ts

echo
echo "3. Next.js build test (partial)..."
# Test that the pages using settings will build
echo -n "  Testing settings page build... "
if npx tsc --noEmit app/dashboard/settings/page.tsx 2>&1 | grep -q "error"; then
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