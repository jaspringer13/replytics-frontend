import { VoiceSettings } from '../app/models/dashboard';

// Helper types for working with branded types
type VoiceSpeed = number & { __brand: 'VoiceSpeed' };
type VoicePitch = number & { __brand: 'VoicePitch' };

interface VoiceSynthesisOptions {
  text: string;
  settings: VoiceSettings;
  tenantId: string;
}

interface VoiceSynthesisResult {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
}

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Voice ID mapping for ElevenLabs
const VOICE_ID_MAPPING: Record<string, string> = {
  'kdmDKE6EkgrWrrykO9Qt': 'Rachel', // Professional Female
  'pNInz6obpgDQGcFmaJgB': 'Adam',   // Friendly Male
  'Yko7PKHZNXotIFUBG7I9': 'Sam',    // Professional Male
  'VR6AewLTigWG4xSOukaG': 'Bella'   // Warm Female
};

// Style to stability/similarity_boost mapping
const STYLE_MAPPING = {
  'friendly_professional': { stability: 0.75, similarity_boost: 0.8, style: 0.4 },
  'casual': { stability: 0.5, similarity_boost: 0.75, style: 0.6 },
  'formal': { stability: 0.9, similarity_boost: 0.9, style: 0.2 },
  'enthusiastic': { stability: 0.3, similarity_boost: 0.7, style: 0.8 }
};

export class VoiceSynthesisService {
  private static instance: VoiceSynthesisService;
  
  static getInstance(): VoiceSynthesisService {
    if (!VoiceSynthesisService.instance) {
      VoiceSynthesisService.instance = new VoiceSynthesisService();
    }
    return VoiceSynthesisService.instance;
  }

  async synthesizeVoice(options: VoiceSynthesisOptions): Promise<VoiceSynthesisResult> {
    const { text, settings, tenantId } = options;

    // Check if ElevenLabs is configured
    if (!ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs API key not configured, using fallback');
      return this.generateFallbackAudio(text, settings, tenantId);
    }

    try {
      // Prepare voice synthesis parameters
      const voiceParams = this.buildVoiceParameters(settings);
      const voiceId = settings.voiceId || 'kdmDKE6EkgrWrrykO9Qt';

      // Call ElevenLabs API
      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: voiceParams
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      // Get audio buffer and content type
      const audioBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      
      // Store audio file (you might want to use cloud storage in production)
      const audioUrl = await this.storeAudioFile(audioBuffer, tenantId, contentType);
      
      // Estimate duration (rough calculation: ~150 words per minute)
      const wordCount = text.split(' ').length;
      const estimatedDuration = (wordCount / 150) * 60;

      return {
        success: true,
        audioUrl,
        duration: estimatedDuration
      };

    } catch (error) {
      console.error('Voice synthesis error:', error);
      
      // Fallback to mock response if synthesis fails
      return this.generateFallbackAudio(text, settings, tenantId);
    }
  }

  private buildVoiceParameters(settings: VoiceSettings) {
    const styleConfig = STYLE_MAPPING[settings.speakingStyle] || STYLE_MAPPING['friendly_professional'];
    
    return {
      stability: styleConfig.stability,
      similarity_boost: styleConfig.similarity_boost,
      style: styleConfig.style,
      use_speaker_boost: true
    };
  }

  private async storeAudioFile(audioBuffer: ArrayBuffer, tenantId: string, contentType: string = 'audio/mpeg'): Promise<string> {
    // In production, you'd typically store this in cloud storage (S3, Supabase Storage, etc.)
    // For now, create a temporary URL that references our API endpoint
    const audioId = `${tenantId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in memory temporarily (in production, use proper storage)
    this.temporaryAudioStore.set(audioId, audioBuffer);
    this.audioFormatStore.set(audioId, contentType);
    
    // Clean up after 10 minutes
    setTimeout(() => {
      this.temporaryAudioStore.delete(audioId);
      this.audioFormatStore.delete(audioId);
    }, 10 * 60 * 1000);

    return `/api/v2/dashboard/business/voice-settings/audio/${audioId}`;
  }

  private temporaryAudioStore = new Map<string, ArrayBuffer>();
  private audioFormatStore = new Map<string, string>();

  getStoredAudio(audioId: string): ArrayBuffer | null {
    return this.temporaryAudioStore.get(audioId) || null;
  }

  getAudioFormat(audioId: string): string | null {
    return this.audioFormatStore.get(audioId) || null;
  }

  private generateFallbackAudio(text: string, settings: VoiceSettings, tenantId: string): VoiceSynthesisResult {
    // Fallback when ElevenLabs is not available
    const wordCount = text.split(' ').length;
    const estimatedDuration = (wordCount / 150) * 60;
    
    return {
      success: true,
      audioUrl: `/api/v2/dashboard/business/voice-settings/test-audio?voice=${encodeURIComponent(settings.voiceId || 'default')}&text=${encodeURIComponent(text)}`,
      duration: estimatedDuration
    };
  }

  async validateVoiceId(voiceId: string): Promise<boolean> {
    if (!ELEVENLABS_API_KEY) {
      // If no API key, just check against our known voices
      return Object.keys(VOICE_ID_MAPPING).includes(voiceId);
    }

    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating voice ID:', error);
      return false;
    }
  }

  async getAvailableVoices(): Promise<Record<string, string>> {
    if (!ELEVENLABS_API_KEY) {
      return VOICE_ID_MAPPING;
    }

    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      const voices: Record<string, string> = {};
      
      data.voices?.forEach((voice: any) => {
        voices[voice.voice_id] = voice.name;
      });

      return Object.keys(voices).length > 0 ? voices : VOICE_ID_MAPPING;
    } catch (error) {
      console.error('Error fetching available voices:', error);
      return VOICE_ID_MAPPING;
    }
  }
}

export const voiceSynthesisService = VoiceSynthesisService.getInstance();