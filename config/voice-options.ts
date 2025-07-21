/**
 * Voice configuration options
 * Centralized configuration for available voice options
 * 
 * IMPORTANT: These are ElevenLabs voice IDs. Voice IDs are stable for production
 * use as long as the voice isn't deleted or significantly modified. However,
 * they may be affected by model upgrades or account-level changes.
 * 
 * Best practices:
 * - Monitor ElevenLabs release notes for model changes
 * - Implement error handling for missing/changed voice IDs
 * - Cache voice metadata locally to reduce API calls
 * - Lock to specific model versions when possible
 */

export interface VoiceOption {
  id: string;
  name: string;
  provider: 'elevenlabs';
  model?: string;
  gender: 'male' | 'female';
  personality: string;
  lastValidated?: string;
}

// ElevenLabs Voice IDs - Verified as of 2024
export const VOICE_OPTIONS_METADATA: Record<string, VoiceOption> = {
  'kdmDKE6EkgrWrrykO9Qt': {
    id: 'kdmDKE6EkgrWrrykO9Qt',
    name: 'Rachel - Professional Female',
    provider: 'elevenlabs',
    gender: 'female',
    personality: 'professional',
    lastValidated: '2024-12'
  },
  'pNInz6obpgDQGcFmaJgB': {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam - Friendly Male',
    provider: 'elevenlabs',
    gender: 'male',
    personality: 'friendly',
    lastValidated: '2024-12'
  },
  'Yko7PKHZNXotIFUBG7I9': {
    id: 'Yko7PKHZNXotIFUBG7I9',
    name: 'Bella - Warm Female',
    provider: 'elevenlabs',
    gender: 'female',
    personality: 'warm',
    lastValidated: '2024-12'
  },
  'VR6AewLTigWG4xSOukaG': {
    id: 'VR6AewLTigWG4xSOukaG',
    name: 'Nicole - Clear Female',
    provider: 'elevenlabs',
    gender: 'female',
    personality: 'clear',
    lastValidated: '2024-12'
  },
  'EXAVITQu4vr4xnSDxMaL': {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Chris - Conversational Male',
    provider: 'elevenlabs',
    gender: 'male',
    personality: 'conversational',
    lastValidated: '2024-12'
  },
  'ErXwobaYiN019PkySvjV': {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Jessica - Energetic Female',
    provider: 'elevenlabs',
    gender: 'female',
    personality: 'energetic',
    lastValidated: '2024-12'
  }
};

// Legacy format for backward compatibility
export const VOICE_OPTIONS: Record<string, string> = Object.fromEntries(
  Object.values(VOICE_OPTIONS_METADATA).map(voice => [voice.id, voice.name])
);

export const DEFAULT_VOICE_ID = 'kdmDKE6EkgrWrrykO9Qt';

/**
 * Validates if a voice ID exists in our configuration
 */
export function isValidVoiceId(voiceId: string): boolean {
  return voiceId in VOICE_OPTIONS_METADATA;
}

/**
 * Gets voice metadata by ID with fallback to default
 */
export function getVoiceMetadata(voiceId: string): VoiceOption {
  return VOICE_OPTIONS_METADATA[voiceId] || VOICE_OPTIONS_METADATA[DEFAULT_VOICE_ID];
}

/**
 * Gets all available voice options as array
 */
export function getAllVoiceOptions(): VoiceOption[] {
  return Object.values(VOICE_OPTIONS_METADATA);
}