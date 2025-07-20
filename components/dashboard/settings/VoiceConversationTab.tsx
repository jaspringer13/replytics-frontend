"use client"

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Mic, Play, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { usePhoneSpecificSettings } from '@/contexts/SettingsContext';
import { apiClient } from '@/lib/api-client';
import { voiceSettingsService } from '@/app/services/dashboard/voice_settings_service';

// Available voices - keep it simple
const VOICE_OPTIONS = {
  'kdmDKE6EkgrWrrykO9Qt': 'Rachel - Professional Female',
  'pNInz6obpgDQGcFmaJgB': 'Adam - Friendly Male',
  'Yko7PKHZNXotIFUBG7I9': 'Sam - Professional Male',
  'VR6AewLTigWG4xSOukaG': 'Bella - Warm Female',
  'EXAVITQu4vr4xnSDxMaL': 'Sarah - Energetic Female',
  'ErXwobaYiN019PkySvjV': 'Antoni - Calm Male',
};

interface VoiceConversationTabProps {}

export function VoiceConversationTab({}: VoiceConversationTabProps) {
  const { phoneSettings, selectedPhoneId } = usePhoneSpecificSettings();
  const [testText, setTestText] = useState('Hello! Welcome to our business. How can I help you today?');
  const [selectedVoice, setSelectedVoice] = useState('kdmDKE6EkgrWrrykO9Qt');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Initialize selected voice from current settings
  useEffect(() => {
    if (phoneSettings?.data.voiceSettings?.voiceId) {
      setSelectedVoice(phoneSettings.data.voiceSettings.voiceId);
    }
  }, [phoneSettings?.data.voiceSettings?.voiceId]);

  const handleTestVoice = async () => {
    if (!selectedPhoneId) {
      setError('Please select a phone number first');
      return;
    }

    setIsPlaying(true);
    setError(null);

    try {
      // Stop any existing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      // For now, just simulate voice playback
      // In production, this would call the voice synthesis service
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOWKzn4bllHQ' +
                   'YzjtXuwX0wBS9+zPDeh0EQH2Ky56WfTw0YVqjb57dqHgU+mNn1wHkqBjGB1/fNey0FIHfH8N+RQAoQXrTt66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOWKzn4bllHQ';
      
      setAudioElement(audio);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        setError('Audio playback is simulated in demo mode');
        setIsPlaying(false);
      };
      
      await audio.play().catch(() => {
        // If autoplay is blocked, just show success
        setTimeout(() => setIsPlaying(false), 2000);
      });
    } catch (err) {
      console.error('Voice test error:', err);
      setError('Voice testing is simulated in demo mode');
      setIsPlaying(false);
    }
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
      await phoneSettings.updateVoiceSettings({ voiceId: selectedVoice });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save voice settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save voice settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
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

          {/* Test Text Input */}
          <div>
            <Label htmlFor="test-text" className="text-gray-300 mb-2 block">
              Test Script
            </Label>
            <Textarea
              id="test-text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Type what you want the AI to say..."
              className="min-h-[100px] bg-gray-900 border-gray-700 text-white placeholder-gray-500"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {testText.length}/500 characters
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

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Voice settings saved successfully!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleTestVoice}
              disabled={isPlaying || !testText.trim() || !selectedPhoneId}
              variant="outline"
              className="flex-1"
            >
              {isPlaying ? (
                <>
                  <Mic className="w-4 h-4 mr-2 animate-pulse" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test Voice
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSaveVoice}
              disabled={isSaving || !selectedPhoneId}
              className="flex-1"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Voice
                </>
              )}
            </Button>
          </div>

          {!selectedPhoneId && (
            <p className="text-center text-gray-500 text-sm">
              Select a phone number at the top of the page to configure voice settings
            </p>
          )}
        </div>
      </Card>

      {/* Conversation Rules Card */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">
          Conversation Rules
        </h3>
        <p className="text-gray-400">
          Configure how your AI handles bookings, cancellations, and customer interactions.
        </p>
        {/* Conversation rules component will be added here */}
      </Card>
    </div>
  );
}