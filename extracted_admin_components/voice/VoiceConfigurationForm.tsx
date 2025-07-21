/**
 * Complete Voice Configuration Form Component
 * Extracted and enhanced from admin panel
 * 
 * Key features:
 * - Voice selection dropdown
 * - Speaking style selection
 * - Voice preview with real-time playback
 * - Advanced voice parameter controls
 * - Save/reset functionality
 * - Real-time updates via WebSocket
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { VoicePreviewSection } from './VoicePreviewSection';
import { VoiceSettingsControls } from './VoiceSettingsControls';
import { useVoicePreview } from './useVoicePreview';

interface VoiceOption {
  id: string;
  name: string;
  gender?: string;
  accent?: string;
  description?: string;
}

interface VoiceSettings {
  voice_id: string;
  speaking_style: string;
  speed: number;
  pitch: number;
  stability: number;
  similarity_boost: number;
  use_speaker_boost: boolean;
}

interface VoiceConfigurationFormProps {
  businessId: string;
  availableVoices?: VoiceOption[];
  initialSettings?: Partial<VoiceSettings>;
  onSave?: (settings: VoiceSettings) => Promise<void>;
  onRealtimeUpdate?: (handler: (settings: VoiceSettings) => void) => () => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  voice_id: 'kdmDKE6EkgrWrrykO9Qt',
  speaking_style: 'professional',
  speed: 1.0,
  pitch: 1.0,
  stability: 0.5,
  similarity_boost: 0.75,
  use_speaker_boost: false,
};

const SPEAKING_STYLES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'calm', label: 'Calm' },
];

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
  const [settings, setSettings] = useState<VoiceSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { isPlaying, playPreview } = useVoicePreview();

  // Sample text for voice preview
  const previewText = "Hi there! Welcome to our business. I'm your AI assistant. How can I help you today?";

  // Setup real-time updates if handler provided
  useEffect(() => {
    if (!onRealtimeUpdate) return;

    const unsubscribe = onRealtimeUpdate((updatedSettings) => {
      setSettings(updatedSettings);
      setHasChanges(false);
    });

    return unsubscribe;
  }, [onRealtimeUpdate]);

  const handleSettingChange = <K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
      speed: settings.speed,
      pitch: settings.pitch,
      stability: settings.stability,
      similarity_boost: settings.similarity_boost,
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
          Customize your AI assistant's voice and speaking style
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
          isPlaying={isPlaying}
          onPreview={handlePreview}
          previewText={previewText}
          selectedVoiceName={selectedVoice?.name}
        />

        <Separator />

        {/* Voice Selection */}
        <div className="space-y-3">
          <Label>Voice Selection</Label>
          <Select 
            value={settings.voice_id} 
            onValueChange={(value) => handleSettingChange('voice_id', value)}
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

        {/* Speaking Style */}
        <div className="space-y-3">
          <Label>Speaking Style</Label>
          <Select 
            value={settings.speaking_style} 
            onValueChange={(value) => handleSettingChange('speaking_style', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEAKING_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice Settings Controls */}
        <VoiceSettingsControls
          settings={settings}
          onSettingChange={handleSettingChange}
        />

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