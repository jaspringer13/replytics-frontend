/**
 * Simple Voice Configuration Form Component
 * 
 * Key features:
 * - Voice selection dropdown
 * - Voice preview with real-time playback
 * - Save/reset functionality
 * - Real-time updates via WebSocket
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { VoicePreviewSection } from './VoicePreviewSection';
import { useVoicePreview } from './useVoicePreview';

interface VoiceOption {
  id: string;
  name: string;
  gender?: string;
  accent?: string;
  description?: string;
}

interface VoiceConfiguration {
  voice_id: string;
}

interface VoiceConfigurationFormProps {
  businessId: string;
  availableVoices?: VoiceOption[];
  initialSettings?: Partial<VoiceConfiguration>;
  onSave?: (settings: VoiceConfiguration) => Promise<void>;
  onRealtimeUpdate?: (handler: (settings: VoiceConfiguration) => void) => () => void;
}

const DEFAULT_SETTINGS: VoiceConfiguration = {
  voice_id: 'kdmDKE6EkgrWrrykO9Qt',
};


// Default voices if none provided
const DEFAULT_VOICES: VoiceOption[] = [
  { id: 'kdmDKE6EkgrWrrykO9Qt', name: 'Sarah', gender: 'Female', description: 'Professional and clear' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Matthew', gender: 'Male', description: 'Warm and friendly' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'Male', description: 'British accent' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Lily', gender: 'Female', description: 'Energetic and upbeat' },
];

export const VoiceConfigurationForm: React.FC<VoiceConfigurationFormProps> = ({
  businessId,
  availableVoices = DEFAULT_VOICES,
  initialSettings = {},
  onSave,
  onRealtimeUpdate,
}) => {
  const [settings, setSettings] = useState<VoiceConfiguration>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { isPlaying, playPreview, stopPreview } = useVoicePreview();

  // Sample text for voice preview
  const [previewText, setPreviewText] = useState("Hi there! Welcome to our business. I'm your AI assistant. How can I help you today?");

  // Setup real-time updates if handler provided
  useEffect(() => {
    if (!onRealtimeUpdate) return;

    const unsubscribe = onRealtimeUpdate((updatedSettings: VoiceConfiguration) => {
      setSettings(updatedSettings);
      setHasChanges(false);
    });

    return unsubscribe;
  }, [onRealtimeUpdate]);

  const handleSettingChange = (voice_id: string) => {
    setSettings(prev => ({ ...prev, voice_id }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!onSave) return;

    try {
      setSaving(true);
      setError(null);
      
      await onSave(settings);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save voice settings:', err);
      setError('Failed to save voice settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    await playPreview({
      voice_id: settings.voice_id,
      text: previewText,
    });
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  const selectedVoice = availableVoices.find(v => v.id === settings.voice_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Configuration</CardTitle>
        <CardDescription>
          Choose your AI assistant's voice
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Voice Preview Section */}
        <VoicePreviewSection
          testText={previewText}
          onTextChange={(text) => setPreviewText(text)}
          voiceName={selectedVoice?.name || 'No voice selected'}
          isPlaying={isPlaying}
          isLoading={saving}
          onPlay={handlePreview}
          onStop={stopPreview}
        />

        <Separator />

        {/* Voice Selection */}
        <div className="space-y-3">
          <Label>Voice Selection</Label>
          <Select 
            value={settings.voice_id} 
            onValueChange={handleSettingChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {availableVoices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                  {voice.description && (
                    <span className="text-muted-foreground ml-2">
                      - {voice.description}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <span className="text-sm text-muted-foreground">
                You have unsaved changes
              </span>
            )}
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || saving || !onSave}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};