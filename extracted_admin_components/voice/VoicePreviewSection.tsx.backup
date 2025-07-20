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
import { Button } from '@/components/ui/button';

interface VoicePreviewSectionProps {
  isPlaying: boolean;
  onPreview: () => void;
  previewText: string;
  selectedVoiceName?: string;
  className?: string;
}

export const VoicePreviewSection: React.FC<VoicePreviewSectionProps> = ({
  isPlaying,
  onPreview,
  previewText,
  selectedVoiceName,
  className = ''
}) => {
  return (
    <div className={`border rounded-lg p-4 bg-muted/50 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center">
          <Volume2 className="w-4 h-4 mr-2" />
          Voice Preview
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          disabled={isPlaying}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Playing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Preview
            </>
          )}
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground italic">
        "{previewText}"
      </p>
      
      {selectedVoiceName && (
        <div className="mt-3 text-xs text-muted-foreground">
          Current voice: {selectedVoiceName}
        </div>
      )}
    </div>
  );
};