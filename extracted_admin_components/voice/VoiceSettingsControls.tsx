/**
 * Voice Settings Controls Component
 * Extracted from admin panel - provides advanced voice parameter controls
 * 
 * Key features:
 * - Speed control with slider (0.5x - 2.0x)
 * - Pitch control with slider (0.5x - 2.0x)
 * - Voice stability control (0-100%)
 * - Similarity boost control (0-100%)
 * - Speaker boost toggle for phone call optimization
 * - Real-time value display
 */

import React from 'react';
import { Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface VoiceSettings {
  speed: number;
  pitch: number;
  stability: number;
  similarity_boost: number;
  use_speaker_boost: boolean;
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
    <>
      {/* Speed Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Speaking Speed</Label>
          <span className="text-sm text-muted-foreground">{settings.speed}x</span>
        </div>
        <Slider
          value={[settings.speed || 1.0]}
          onValueChange={([value]) => onSettingChange('speed', value)}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Slower</span>
          <span>Faster</span>
        </div>
      </div>

      {/* Pitch Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Pitch</Label>
          <span className="text-sm text-muted-foreground">{settings.pitch}x</span>
        </div>
        <Slider
          value={[settings.pitch || 1.0]}
          onValueChange={([value]) => onSettingChange('pitch', value)}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Lower</span>
          <span>Higher</span>
        </div>
      </div>

      {/* Advanced Settings */}
      <Separator />
      
      <div className="space-y-4">
        <h3 className="font-medium flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Advanced Settings
        </h3>

        {/* Stability */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Voice Stability</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round((settings.stability || 0.5) * 100)}%
            </span>
          </div>
          <Slider
            value={[settings.stability || 0.5]}
            onValueChange={([value]) => onSettingChange('stability', value)}
            min={0}
            max={1}
            step={0.05}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Higher stability = more consistent voice, lower stability = more expressive
          </p>
        </div>

        {/* Similarity Boost */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Similarity Boost</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round((settings.similarity_boost || 0.75) * 100)}%
            </span>
          </div>
          <Slider
            value={[settings.similarity_boost || 0.75]}
            onValueChange={([value]) => onSettingChange('similarity_boost', value)}
            min={0}
            max={1}
            step={0.05}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Enhances similarity to the original voice
          </p>
        </div>

        {/* Speaker Boost */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Speaker Boost</Label>
            <p className="text-sm text-muted-foreground">
              Improve audio quality for phone calls
            </p>
          </div>
          <Switch
            checked={settings.use_speaker_boost || false}
            onCheckedChange={(checked) => onSettingChange('use_speaker_boost', checked)}
          />
        </div>
      </div>
    </>
  );
};