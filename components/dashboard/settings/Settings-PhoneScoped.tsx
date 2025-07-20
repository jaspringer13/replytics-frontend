"use client"

import React from 'react';
import { Tabs } from '@/components/ui/tabs';
import { PhoneSettingsProvider, usePhoneSettings } from '@/contexts/PhoneSettingsContext';
import { PhoneNumberSelector } from './PhoneNumberSelector';
import { SettingsLoadingWrapper } from './SettingsLoadingWrapper';
import { SettingsHeader } from './SettingsHeader';
import { SettingsTabNavigation } from './SettingsTabNavigation';
import { SettingsTabContent } from './SettingsTabContent';
import { AddPhoneNumberDialog } from './AddPhoneNumberDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone } from 'lucide-react';

interface SettingsProps {
  businessId: string;
}

export function Settings({ businessId }: SettingsProps) {
  return (
    <PhoneSettingsProvider businessId={businessId}>
      <SettingsWithPhoneScope />
    </PhoneSettingsProvider>
  );
}

function SettingsWithPhoneScope() {
  const {
    phoneNumbers,
    selectedPhoneId,
    selectedPhone,
    setSelectedPhoneId,
    loadingPhones,
    phoneSettings,
  } = usePhoneSettings();
  
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const loading = loadingPhones || (selectedPhoneId && phoneSettings?.loading);
  const error = phoneSettings?.error;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <SettingsHeader />
      
      {/* Phone Number Selector - The Primary Navigation */}
      <PhoneNumberSelector
        phoneNumbers={phoneNumbers}
        selectedPhoneId={selectedPhoneId}
        onPhoneSelect={setSelectedPhoneId}
        onAddPhone={() => setShowAddDialog(true)}
        loading={loadingPhones}
      />

      {/* Warning if no phone is selected */}
      {!selectedPhoneId && phoneNumbers.length > 0 && (
        <Alert className="bg-yellow-900/20 border-yellow-700">
          <Phone className="h-4 w-4" />
          <AlertDescription>
            Please select a phone number above to configure its settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs - Only show when a phone is selected */}
      {selectedPhoneId && (
        <SettingsLoadingWrapper
          loading={loading || false}
          error={error || null}
          onRetry={() => phoneSettings?.refetch()}
        >
          <Tabs defaultValue="business-profile" className="space-y-6">
            <SettingsTabNavigation />
            
            {/* Display which phone's settings are being edited */}
            {selectedPhone && (
              <div className="bg-gray-800/30 border border-gray-700 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-400">
                  Configuring settings for: 
                  <span className="font-medium text-white ml-2">
                    {selectedPhone.displayName} ({formatPhoneNumber(selectedPhone.phoneNumber)})
                  </span>
                </p>
              </div>
            )}
            
            <SettingsTabContent />
          </Tabs>
        </SettingsLoadingWrapper>
      )}

      {/* Add Phone Number Dialog */}
      <AddPhoneNumberDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={async (phoneData) => {
          const { addPhoneNumber } = usePhoneSettings();
          await addPhoneNumber(phoneData);
          setShowAddDialog(false);
        }}
      />
    </div>
  );
}

// Helper function
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}