# Voice Preview Components

This directory contains extracted voice preview functionality from the admin panel. These components provide a comprehensive voice configuration and preview system.

## Components

### 1. VoicePreviewSection
A visual preview section with play/pause functionality for testing voice settings.

**Features:**
- Play/pause button with loading states
- Display of preview text
- Shows currently selected voice
- Clean, minimal UI design

### 2. VoiceSettingsControls
Advanced voice parameter controls for fine-tuning voice output.

**Parameters:**
- **Speed**: 0.5x to 2.0x speaking rate
- **Pitch**: 0.5x to 2.0x voice pitch
- **Stability**: 0-100% (consistency vs expressiveness)
- **Similarity Boost**: 0-100% (voice similarity enhancement)
- **Speaker Boost**: Toggle for phone call optimization

### 3. useVoicePreview Hook
Custom React hook for managing voice preview functionality.

**Features:**
- Manages playback state
- Handles loading and error states
- Simulated preview (ready for ElevenLabs API integration)
- Audio context management

### 4. VoiceConfigurationForm
Complete voice configuration form combining all components.

**Features:**
- Voice selection dropdown
- Speaking style selection
- Real-time voice preview
- Advanced settings panel
- Save/reset functionality
- Real-time updates support

## Usage Example

```tsx
import { VoiceConfigurationForm } from './voice/VoiceConfigurationForm';

function VoiceSettings() {
  const handleSave = async (settings) => {
    // Save to your API
    await api.updateVoiceSettings(settings);
  };

  return (
    <VoiceConfigurationForm
      businessId="123"
      onSave={handleSave}
      availableVoices={[
        { id: '1', name: 'Sarah', description: 'Professional voice' },
        { id: '2', name: 'John', description: 'Friendly voice' }
      ]}
    />
  );
}
```

## Integration Notes

### ElevenLabs API Integration
The `useVoicePreview` hook contains a TODO section for ElevenLabs integration:

```typescript
// Replace the simulated preview with:
const response = await fetch('/api/voice/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    voice_id: settings.voice_id,
    text: settings.text,
    voice_settings: {
      stability: settings.stability,
      similarity_boost: settings.similarity_boost,
      style: settings.style,
      use_speaker_boost: settings.use_speaker_boost
    }
  })
});
```

### Real-time Updates
The components support real-time updates through the `onRealtimeUpdate` prop, which can be connected to WebSocket or other real-time systems.

## Styling
All components use shadcn/ui components and follow the existing design system. Make sure to have these UI components available:
- Card
- Button
- Label
- Select
- Slider
- Switch
- Alert
- Separator

## Voice Options
Default voices included:
- Sarah: Professional and clear (Female)
- Matthew: Warm and friendly (Male)
- Daniel: British accent (Male)
- Lily: Energetic and upbeat (Female)

## Speaking Styles
- Professional
- Friendly
- Casual
- Energetic
- Calm