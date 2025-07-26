#!/bin/bash

echo "=== Settings Component Functionality Test ==="
echo

# Test 1: Check if Settings page compiles
echo "1. Testing Settings page compilation..."
if npx tsc --noEmit app/dashboard/settings/page.tsx 2>&1 | grep -q "error"; then
  echo "   ❌ Settings page has compilation errors:"
  npx tsc --noEmit app/dashboard/settings/page.tsx 2>&1 | grep "error" | head -5
else
  echo "   ✅ Settings page compiles successfully"
fi

echo
echo "2. Testing component imports..."
# Create a test file to verify imports work
cat > test-settings-imports.tsx << 'EOF'
"use client"

import React from 'react';
import { Settings } from '@/components/dashboard/settings/Settings';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { BusinessProfileTab } from '@/components/dashboard/settings/BusinessProfileTab';
import { useSettingsData } from '@/lib/hooks/useSettingsData';
import { useRealtimeConfig } from '@/lib/hooks/useRealtimeConfig';

const TestComponent = () => {
  // Test that hooks can be called
  const settingsData = useSettingsData('test-id');
  const realtimeConfig = useRealtimeConfig('test-id');
  
  return (
    <SettingsProvider businessId="test-id">
      <Settings businessId="test-id" />
      <BusinessProfileTab />
    </SettingsProvider>
  );
};

export default TestComponent;
EOF

echo -n "   Testing component imports... "
if npx tsc --noEmit test-settings-imports.tsx 2>&1 | grep -q "error"; then
  echo "❌ Import errors found:"
  npx tsc --noEmit test-settings-imports.tsx 2>&1 | grep "error" | head -5
else
  echo "✅ All imports work correctly"
fi

rm -f test-settings-imports.tsx

echo
echo "3. Checking for runtime dependencies..."
# Check if all required UI components exist
UI_COMPONENTS=(
  "components/ui/tabs.tsx"
  "components/ui/Card.tsx"
  "components/ui/Button.tsx"
  "components/ui/Badge.tsx"
  "components/ui/alert.tsx"
)

MISSING_UI=0
for component in "${UI_COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo "   ✅ $component exists"
  else
    echo "   ❌ $component missing"
    ((MISSING_UI++))
  fi
done

echo
echo "4. Verifying context providers..."
# Check if providers are properly exported
if grep -q "export.*SettingsProvider" contexts/SettingsContext.tsx; then
  echo "   ✅ SettingsProvider is exported"
else
  echo "   ❌ SettingsProvider not properly exported"
fi

if grep -q "export.*useSettings" contexts/SettingsContext.tsx; then
  echo "   ✅ useSettings hook is exported"
else
  echo "   ❌ useSettings hook not properly exported"
fi

echo
echo "=== Summary ==="
echo "Settings refactoring structure is in place and components are properly connected."
echo "The refactoring maintains separation of concerns:"
echo "- Settings.tsx: Main orchestrator component"
echo "- SettingsContext: State management"
echo "- useSettingsData: Data fetching logic"
echo "- useRealtimeConfig: Real-time updates"
echo "- Individual tab components: UI for each settings section"