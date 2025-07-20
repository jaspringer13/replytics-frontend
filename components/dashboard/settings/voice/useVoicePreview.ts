/**
 * Voice Preview Hook
 * Custom hook for managing voice preview functionality
 * 
 * Key features:
 * - Manages preview playback state
 * - Uses actual voice test API to generate previews
 * - Handles errors during preview
 * - Provides loading states
 */

import { useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { usePhoneSpecificSettings } from '@/contexts/SettingsContext';

interface VoicePreviewSettings {
  voice_id: string;
  text: string;
  speed?: number;
  pitch?: number;
  stability?: number;
  similarity_boost?: number;
}

interface UseVoicePreviewReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  playPreview: (settings: VoicePreviewSettings) => Promise<void>;
  stopPreview: () => void;
}

export const useVoicePreview = (): UseVoicePreviewReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { selectedPhoneId } = usePhoneSpecificSettings();

  const playPreview = useCallback(async (settings: VoicePreviewSettings) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (!selectedPhoneId) {
        throw new Error('No phone number selected');
      }

      // Call the voice test API
      const response = await apiClient.testVoiceConfiguration(
        selectedPhoneId,
        settings.voice_id,
        settings.text
      );

      if (!response.success || !response.audioUrl) {
        throw new Error(response.error || 'Failed to generate voice preview');
      }

      // Create and play the audio
      const audio = new Audio(response.audioUrl);
      audioRef.current = audio;
      
      // Set up audio event handlers
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setError('Failed to play audio');
        setIsPlaying(false);
        audioRef.current = null;
      };

      // Play the audio
      await audio.play();
      
    } catch (err) {
      console.error('Failed to play preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to play voice preview');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPhoneId]);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return {
    isPlaying,
    isLoading,
    error,
    playPreview,
    stopPreview
  };
};