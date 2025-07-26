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
# Use Next.js's built-in type checking and capture exit status
npm run type-check 2>&1 | tee type-check-output.txt
TYPE_CHECK_STATUS=$?

# Check for settings-related errors
echo
echo "3. Settings-specific errors:"
SETTINGS_ERRORS=$(grep -E "(Settings|settings)" type-check-output.txt | grep -E "error|Error" | head -20)
if [ -n "$SETTINGS_ERRORS" ]; then
  echo "$SETTINGS_ERRORS"
  SETTINGS_ERROR_COUNT=$(echo "$SETTINGS_ERRORS" | wc -l | xargs)
else
  echo "  No settings-specific errors found"
  SETTINGS_ERROR_COUNT=0
fi

# Clean up
rm -f type-check-output.txt

echo
echo "=== Summary ==="
if [ $MISSING -eq 0 ] && [ $TYPE_CHECK_STATUS -eq 0 ]; then
  echo "✅ All settings files exist and type check passed"
  exit 0
elif [ $MISSING -gt 0 ] && [ $TYPE_CHECK_STATUS -eq 0 ]; then
  echo "❌ $MISSING files are missing but type check passed"
  exit 1
elif [ $MISSING -eq 0 ] && [ $TYPE_CHECK_STATUS -ne 0 ]; then
  echo "❌ All files exist but type check failed (exit code: $TYPE_CHECK_STATUS)"
  if [ $SETTINGS_ERROR_COUNT -gt 0 ]; then
    echo "   Found $SETTINGS_ERROR_COUNT settings-related errors"
  fi
  exit 1
else
  echo "❌ $MISSING files missing AND type check failed (exit code: $TYPE_CHECK_STATUS)"
  if [ $SETTINGS_ERROR_COUNT -gt 0 ]; then
    echo "   Found $SETTINGS_ERROR_COUNT settings-related errors"
  fi
  exit 1
fi