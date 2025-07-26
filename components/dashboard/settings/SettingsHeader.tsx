import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { useSettings, useSelectedPhone } from '@/contexts/SettingsContext';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PhoneNumberSelector } from './PhoneNumberSelector';

export function SettingsHeader() {
  const { realtimeConfig } = useSettings();
  const { selectedPhoneId, setSelectedPhoneId, phoneNumbers, loading } = useSelectedPhone();

  const handleAddPhone = () => {
    // TODO: Open modal to add new phone number
    console.log('Add new phone number');
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">Business Settings</h1>
        <ConnectionStatusBadge connected={realtimeConfig.connected} error={realtimeConfig.error} />
      </div>
      <p className="text-gray-400 mb-4">
        Manage your business configuration and AI voice agent settings
      </p>
      
      <div className="mt-4">
        <label className="text-sm text-gray-400 mb-2 block">Location / Phone Number</label>
        <PhoneNumberSelector
          phoneNumbers={phoneNumbers}
          selectedPhoneId={selectedPhoneId || ''}
          onPhoneSelect={setSelectedPhoneId}
          onAddPhone={handleAddPhone}
          loading={loading}
          className="max-w-md"
        />
        <p className="text-xs text-gray-500 mt-2">
          All settings below apply to the selected phone number
        </p>
      </div>
    </div>
  );
}

interface ConnectionStatusBadgeProps {
  connected: boolean;
  error: Error | null;
}

function ConnectionStatusBadge({ connected, error }: ConnectionStatusBadgeProps) {
  if (error) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        Connection Error
      </Badge>
    );
  }

  if (!connected) {
    return (
      <Badge variant="secondary" className="gap-1">
        <AlertCircle className="w-3 h-3" />
        Connecting...
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-green-500 border-green-500/20">
      <CheckCircle className="w-3 h-3" />
      Live Updates
    </Badge>
  );
}