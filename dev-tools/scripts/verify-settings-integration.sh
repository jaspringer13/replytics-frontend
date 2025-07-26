#!/bin/bash

echo "=== Settings Refactoring Integration Verification ==="
echo

# Check if all new files exist
echo "1. Checking new file structure..."
FILES=(
  "contexts/SettingsContext.tsx"
  "lib/hooks/useSettingsData.ts"
  "lib/hooks/useRealtimeConfig.ts"
  "components/dashboard/settings/SettingsHeader.tsx"
  "components/dashboard/settings/SettingsTabNavigation.tsx"
  "components/dashboard/settings/SettingsTabContent.tsx"
  "components/dashboard/settings/SettingsLoadingWrapper.tsx"
  "components/dashboard/settings/settingsTabConfig.ts"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file exists"
  else
    echo "✗ $file is missing"
    ALL_EXIST=false
  fi
done

echo
echo "2. Checking imports in Settings.tsx..."
if [ -f "components/dashboard/settings/Settings.tsx" ]; then
  grep -q "SettingsProvider" components/dashboard/settings/Settings.tsx && echo "✓ Uses SettingsProvider" || echo "✗ Missing SettingsProvider"
  grep -q "SettingsLoadingWrapper" components/dashboard/settings/Settings.tsx && echo "✓ Uses SettingsLoadingWrapper" || echo "✗ Missing SettingsLoadingWrapper"
  grep -q "SettingsHeader" components/dashboard/settings/Settings.tsx && echo "✓ Uses SettingsHeader" || echo "✗ Missing SettingsHeader"
else
  echo "✗ Settings.tsx file not found"
fi

echo
echo "3. Checking BusinessProfileTab uses context..."
if [ -f "components/dashboard/settings/BusinessProfileTab.tsx" ]; then
  grep -q "useSettings" components/dashboard/settings/BusinessProfileTab.tsx && echo "✓ BusinessProfileTab uses useSettings hook" || echo "✗ BusinessProfileTab doesn't use context"
else
  echo "✗ BusinessProfileTab.tsx file not found"
fi

echo
echo "4. Running TypeScript check on Settings files..."
errors=$(npx tsc --noEmit components/dashboard/settings/Settings.tsx 2>&1 | grep -c "error TS" || echo "0")
if [ "$errors" = "0" ]; then
  echo "✓ No TypeScript errors in Settings.tsx"
else
  echo "✗ Found $errors TypeScript errors in Settings.tsx"
fi

echo
echo "5. Checking for removed code patterns..."
if [ -f "components/dashboard/settings/Settings.tsx" ]; then
  # Should not have useState for loading/error in Settings.tsx
  if grep -q "useState.*loading\|useState.*error" components/dashboard/settings/Settings.tsx; then
    echo "✗ Settings.tsx still has local loading/error state"
  else
    echo "✓ Loading/error state properly extracted"
  fi

  # Should not have useEffect for data fetching in Settings.tsx
  if grep -q "apiClient\." components/dashboard/settings/Settings.tsx; then
    echo "✗ Settings.tsx still has direct API calls"
  else
    echo "✓ API calls properly extracted"
  fi
else
  echo "✗ Cannot check code patterns - Settings.tsx file not found"
fi

echo
echo "=== Summary ==="
if [ "$ALL_EXIST" = true ]; then
  echo "✅ All required files exist"
else
  echo "❌ Some files are missing"
fi

echo
echo "Next steps:"
echo "1. Start the dev server and navigate to /dashboard/settings"
echo "2. Verify all tabs load correctly"
echo "3. Test BusinessProfile form submission"
echo "4. Check that real-time connection status displays"
echo "5. Verify loading and error states work properly"