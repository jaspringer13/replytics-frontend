/**
 * Voice Preview Section Component
 * Extracted from admin panel - provides voice preview UI with play/pause functionality
 * 
 * Key features:
 * - Visual preview section with play/pause button
 * - Shows current voice selection
 * - Sample text display
 * - Loading/playing states
 */

import React from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface VoicePreviewSectionProps {
  testText: string;
  onTextChange: (text: string) => void;
  voiceName: string;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onStop: () => void;
  className?: string;
}

export const VoicePreviewSection: React.FC<VoicePreviewSectionProps> = ({
  testText,
  onTextChange,
  voiceName,
  isPlaying,
  isLoading,
  onPlay,
  onStop,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label htmlFor="test-text" className="text-gray-300 mb-2 block">
          Test Script
        </Label>
        <Textarea
          id="test-text"
          value={testText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type what you want the AI to say..."
          className="min-h-[100px] bg-gray-900 border-gray-700 text-white placeholder-gray-500"
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {testText.length}/500 characters
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-gray-900/50 border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center text-gray-300">
            <Volume2 className="w-4 h-4 mr-2" />
            Voice Preview
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={isPlaying ? onStop : onPlay}
            disabled={isLoading || !testText.trim()}
            className="border-gray-600 hover:bg-gray-700 text-gray-300"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                Loading...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Preview
              </>
            )}
          </Button>
        </div>
        
        <p className="text-sm text-gray-400 italic">
          "{testText || 'Enter text above to preview...'}"
        </p>
        
        {voiceName && (
          <div className="mt-3 text-xs text-gray-500">
            Current voice: {voiceName}
          </div>
        )}
      </div>
    </div>
  );
};