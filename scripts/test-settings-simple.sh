#!/bin/bash

echo "=== Settings Component Simple Test ==="
echo

# Test 1: Check if all files exist
echo "1. Checking if all files exist..."
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

MISSING=0
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ $file missing"
    ((MISSING++))
  fi
done

echo
echo "2. Running Next.js type check..."
# Use Next.js's built-in type checking
npm run type-check 2>&1 | tee type-check-output.txt

# Check for settings-related errors
echo
echo "3. Settings-specific errors:"
grep -E "(Settings|settings)" type-check-output.txt | grep -E "error|Error" | head -20

# Clean up
rm -f type-check-output.txt

echo
echo "=== Summary ==="
if [ $MISSING -eq 0 ]; then
  echo "✅ All settings files exist"
else
  echo "❌ $MISSING files are missing"
fi