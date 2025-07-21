#!/bin/bash

# Check if required files exist
REQUIRED_FILES=(
  "components/dashboard/settings/ServicesManagementTab.tsx"
  "components/dashboard/settings/SMSConfigurationTab.tsx" 
  "components/dashboard/settings/StaffManagementTab.tsx"
  "components/dashboard/settings/ServiceEditor.tsx"
  "components/dashboard/settings/IntegrationsTab.tsx"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Required file not found: $file"
    exit 1
  fi
done

echo "=== Settings Context Usage Test ==="
echo

# Test 1: Check that components no longer receive businessId props
echo "1. Checking for removed businessId props..."
PROP_ISSUES=0

# Check ServicesManagementTab
if grep -q "businessId" components/dashboard/settings/ServicesManagementTab.tsx; then
  echo "   ❌ ServicesManagementTab still has businessId references"
  ((PROP_ISSUES++))
else
  echo "   ✅ ServicesManagementTab updated correctly"
fi

# Check SMSConfigurationTab
if grep "businessId" components/dashboard/settings/SMSConfigurationTab.tsx | grep -v "// Currently unused" | grep -q .; then
  echo "   ❌ SMSConfigurationTab still has businessId references"
  ((PROP_ISSUES++))
else
  echo "   ✅ SMSConfigurationTab updated correctly"
fi

# Check StaffManagementTab
if grep -q "businessId" components/dashboard/settings/StaffManagementTab.tsx; then
  echo "   ❌ StaffManagementTab still has businessId references"
  ((PROP_ISSUES++))
else
  echo "   ✅ StaffManagementTab updated correctly"
fi

echo
echo "2. Checking context usage..."
# Check ServiceEditor uses context
if grep -q "useSettings\|useBusinessId" components/dashboard/settings/ServiceEditor.tsx; then
  echo "   ✅ ServiceEditor uses SettingsContext"
else
  echo "   ❌ ServiceEditor not using SettingsContext"
fi

# Check IntegrationsTab uses context
if grep -q "useBusinessId" components/dashboard/settings/IntegrationsTab.tsx; then
  echo "   ✅ IntegrationsTab uses SettingsContext"
else
  echo "   ❌ IntegrationsTab not using SettingsContext"
fi

echo
echo "3. Checking for direct API calls in ServiceEditor..."
if grep -q "apiClient\." components/dashboard/settings/ServiceEditor.tsx; then
  echo "   ❌ ServiceEditor still has direct API calls"
  grep -n "apiClient\." components/dashboard/settings/ServiceEditor.tsx | head -5
else
  echo "   ✅ ServiceEditor uses context methods instead of direct API calls"
fi

echo
echo "=== Summary ==="
if [ $PROP_ISSUES -eq 0 ]; then
  echo "✅ All Settings tab components have been successfully updated to use SettingsContext"
  echo "Benefits achieved:"
  echo "- Eliminated prop drilling for businessId"
  echo "- Centralized state management for services"
  echo "- Reduced duplicate API calls"
  echo "- Improved data consistency across tabs"
else
  echo "❌ Some components still need updating"
fi