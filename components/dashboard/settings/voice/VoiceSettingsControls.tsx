/**
 * Voice Settings Controls Component
 * Simplified voice controls - provides only essential voice selection
 * 
 * Key features:
 * - Voice selection with radio buttons
 * - Voice preview functionality
 * - Minimal, user-friendly interface
 */

import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VOICE_OPTIONS } from '@/config/voice-options';

interface VoiceSettings {
  voiceId: string;
}

interface VoiceSettingsControlsProps {
  settings: VoiceSettings;
  onSettingChange: <K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K]
  ) => void;
}

export const VoiceSettingsControls: React.FC<VoiceSettingsControlsProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium mb-3 block">
          Select Voice
        </Label>
        <RadioGroup 
          value={settings.voiceId || 'kdmDKE6EkgrWrrykO9Qt'} 
          onValueChange={(value) => onSettingChange('voiceId', value)}
        >
          <div className="grid gap-3">
            {Object.entries(VOICE_OPTIONS).map(([voiceId, voiceName]) => (
              <div key={voiceId} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                <RadioGroupItem value={voiceId} id={voiceId} />
                <Label 
                  htmlFor={voiceId} 
                  className="cursor-pointer flex-1"
                >
                  {voiceName}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};