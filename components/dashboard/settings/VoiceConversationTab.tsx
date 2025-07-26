"use client"

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { usePhoneSpecificSettings } from '@/contexts/SettingsContext';
import { VoicePreviewSection } from './voice/VoicePreviewSection';
import { useVoicePreview } from './voice/useVoicePreview';
import { VOICE_OPTIONS } from '@/config/voice-options';


// Default test script
const DEFAULT_TEST_SCRIPT = 'Hello! Welcome to our business. How can I help you today?';

export function VoiceConversationTab() {
  const { phoneSettings, selectedPhoneId } = usePhoneSpecificSettings();
  const { isPlaying, isLoading, error: previewError, playPreview, stopPreview } = useVoicePreview();
  
  // Voice settings state
  const [selectedVoice, setSelectedVoice] = useState('kdmDKE6EkgrWrrykO9Qt');
  const [testText, setTestText] = useState(DEFAULT_TEST_SCRIPT);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize selected voice from current settings
  useEffect(() => {
    if (phoneSettings?.data.voiceSettings?.voiceId) {
      setSelectedVoice(phoneSettings.data.voiceSettings.voiceId);
    }
  }, [phoneSettings?.data.voiceSettings?.voiceId]);

  const handlePreview = async () => {
    if (!selectedPhoneId) {
      setError('Please select a phone number first');
      return;
    }

    setError(null);
    
    await playPreview({
      voice_id: selectedVoice,
      text: testText,
    });
  };

  const handleSaveVoice = async () => {
    if (!selectedPhoneId || !phoneSettings) {
      setError('Please select a phone number first');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await phoneSettings.updateVoiceSettings({ 
        voiceId: selectedVoice,
        // Note: Additional voice parameters would need API support
        // speed: voiceSpeed,
        // pitch: voicePitch,
        // stability: voiceStability,
        // similarityBoost: similarityBoost,
        // speakerBoost: speakerBoost
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save voice settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save voice settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedVoice('kdmDKE6EkgrWrrykO9Qt');
    setTestText(DEFAULT_TEST_SCRIPT);
  };

  return (
    <div className="space-y-6">
      {/* Voice Selection Card */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              AI Voice Selection
            </h3>
            <p className="text-gray-400">
              Choose the voice that best represents your business. Test each voice before making your selection.
            </p>
          </div>

          {/* Voice Selection */}
          <div>
            <Label className="text-gray-300 mb-3 block">
              Select Voice
            </Label>
            <RadioGroup value={selectedVoice} onValueChange={setSelectedVoice}>
              <div className="grid gap-3">
                {Object.entries(VOICE_OPTIONS).map(([voiceId, voiceName]) => (
                  <div key={voiceId} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                    <RadioGroupItem value={voiceId} id={voiceId} />
                    <Label 
                      htmlFor={voiceId} 
                      className="text-gray-300 cursor-pointer flex-1"
                    >
                      {voiceName}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Voice Preview Section */}
          <VoicePreviewSection
            testText={testText}
            onTextChange={setTestText}
            voiceName={VOICE_OPTIONS[selectedVoice as keyof typeof VOICE_OPTIONS] || 'Unknown Voice'}
            isPlaying={isPlaying}
            isLoading={isLoading}
            onPlay={handlePreview}
            onStop={stopPreview}
          />


          {/* Error Display */}
          {(error || previewError) && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error || previewError}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-sm text-green-400">Voice settings saved successfully!</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSaveVoice}
              disabled={isSaving || !selectedPhoneId}
              variant="default"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Voice Settings'}
            </Button>
            <Button
              onClick={handleReset}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </Card>

      {/* Conversation Rules Card */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Conversation Rules
            </h3>
            <p className="text-gray-400">
              Configure how your AI assistant handles conversations and bookings.
            </p>
          </div>
          
          {/* Note: Conversation rules UI can be added here */}
          <p className="text-sm text-gray-500 italic">
            Conversation rules can be configured in the business settings.
          </p>
        </div>
      </Card>
    </div>
  );
}