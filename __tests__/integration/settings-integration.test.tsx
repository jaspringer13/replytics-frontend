/**
 * Settings Page Integration Tests
 * End-to-end testing of settings configuration and transmission
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Settings } from '@/components/dashboard/settings/Settings';
import { apiClient } from '@/lib/api-client';
import { realtimeConfigManager } from '@/lib/realtime-config';
import { voiceSynthesisService } from '@/lib/voice-synthesis';

// Mock all external dependencies
jest.mock('@/lib/api-client');
jest.mock('@/lib/realtime-config');
jest.mock('@/lib/voice-synthesis');
jest.mock('@/hooks/useUserTenant', () => ({
  useUserTenant: () => ({ tenantId: 'test-business-id' })
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockRealtimeConfig = realtimeConfigManager as jest.Mocked<typeof realtimeConfigManager>;
const mockVoiceSynthesis = voiceSynthesisService as jest.Mocked<typeof voiceSynthesisService>;

describe('Settings Page Integration', () => {
  const testBusinessId = 'test-business-id';
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses by default
    mockApiClient.getBusinessProfile.mockResolvedValue({
      id: testBusinessId,
      name: 'Test Business',
      email: 'test@business.com',
      phone: '+1234567890',
      address: { street: '123 Main St' },
      timezone: 'America/New_York',
      voiceSettings: {
        voiceId: 'kdmDKE6EkgrWrrykO9Qt',
        speakingStyle: 'friendly_professional',
        speed: 1.0,
        pitch: 1.0,
      },
      conversationRules: {
        allowMultipleServices: true,
        allowCancellations: true,
        allowRescheduling: true,
        noShowBlockEnabled: false,
        noShowThreshold: 3,
      },
    });

    mockApiClient.getServices.mockResolvedValue([
      {
        id: 'service-1',
        name: 'Haircut',
        duration: 30,
        price: 50,
        description: 'Professional haircut',
        active: true,
        displayOrder: 0,
      },
    ]);

    mockApiClient.getBusinessHours.mockResolvedValue([
      { dayOfWeek: 0, openTime: '10:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00', isClosed: false },
      // ... other days
    ]);

    mockRealtimeConfig.initialize.mockResolvedValue(undefined);
    mockRealtimeConfig.subscribe.mockReturnValue(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Settings Page Rendering', () => {
    it('should render all settings tabs', async () => {
      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Business Settings')).toBeInTheDocument();
      });

      // Check all tabs are present
      expect(screen.getByRole('tab', { name: /Business Profile/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Services/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Hours/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Voice & Conversation/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /SMS Settings/i })).toBeInTheDocument();
    });

    it('should load and display business data correctly', async () => {
      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(mockApiClient.getBusinessProfile).toHaveBeenCalled();
        expect(mockApiClient.getServices).toHaveBeenCalled();
        expect(mockApiClient.getBusinessHours).toHaveBeenCalled();
      });

      // Verify data is displayed
      const businessNameInput = await screen.findByDisplayValue('Test Business');
      expect(businessNameInput).toBeInTheDocument();
    });
  });

  describe('Voice Settings Configuration', () => {
    it('should update voice settings and broadcast changes', async () => {
      mockApiClient.updateBusinessProfile.mockResolvedValue({
        ...await mockApiClient.getBusinessProfile(),
        voiceSettings: {
          voiceId: 'pNInz6obpgDQGcFmaJgB',
          speakingStyle: 'casual',
          speed: 1.2,
          pitch: 0.8,
        },
      });

      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      // Navigate to Voice & Conversation tab
      const voiceTab = await screen.findByRole('tab', { name: /Voice & Conversation/i });
      await user.click(voiceTab);

      // Wait for voice settings to load
      await waitFor(() => {
        expect(screen.getByText(/Voice Configuration/i)).toBeInTheDocument();
      });

      // Change voice settings
      const voiceSelect = screen.getByLabelText(/Voice Selection/i);
      await user.selectOptions(voiceSelect, 'pNInz6obpgDQGcFmaJgB');

      const styleSelect = screen.getByLabelText(/Speaking Style/i);
      await user.selectOptions(styleSelect, 'casual');

      // Adjust speed slider
      const speedSlider = screen.getByLabelText(/Speed/i);
      fireEvent.change(speedSlider, { target: { value: '1.2' } });

      // Save changes
      const saveButton = screen.getByRole('button', { name: /Save Voice Settings/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.updateBusinessProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            voiceSettings: expect.objectContaining({
              voiceId: 'pNInz6obpgDQGcFmaJgB',
              speakingStyle: 'casual',
              speed: 1.2,
            })
          })
        );
      });

      // Verify success message
      expect(await screen.findByText(/Voice settings updated successfully/i)).toBeInTheDocument();
    });

    it('should test voice configuration before saving', async () => {
      mockVoiceSynthesis.synthesizeVoice.mockResolvedValue({
        success: true,
        audioUrl: 'https://example.com/test-voice.mp3',
        duration: 2.5,
      });

      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      // Navigate to Voice & Conversation tab
      const voiceTab = await screen.findByRole('tab', { name: /Voice & Conversation/i });
      await user.click(voiceTab);

      // Click test voice button
      const testButton = await screen.findByRole('button', { name: /Test Voice/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(mockVoiceSynthesis.synthesizeVoice).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.any(String),
            settings: expect.objectContaining({
              voiceId: 'kdmDKE6EkgrWrrykO9Qt',
              speed: 1.0,
              pitch: 1.0,
            }),
            tenantId: testBusinessId,
          })
        );
      });

      // Verify audio player appears
      expect(await screen.findByTestId('voice-test-audio')).toBeInTheDocument();
    });

    it('should validate voice settings before submission', async () => {
      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      // Navigate to Voice & Conversation tab
      const voiceTab = await screen.findByRole('tab', { name: /Voice & Conversation/i });
      await user.click(voiceTab);

      // Try to set invalid speed
      const speedSlider = screen.getByLabelText(/Speed/i);
      fireEvent.change(speedSlider, { target: { value: '3.0' } }); // Max is 2.0

      // Verify validation error
      expect(await screen.findByText(/Speed must be between 0.5 and 2.0/i)).toBeInTheDocument();

      // Save button should be disabled
      const saveButton = screen.getByRole('button', { name: /Save Voice Settings/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Conversation Rules Configuration', () => {
    it('should update conversation rules correctly', async () => {
      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      // Navigate to Voice & Conversation tab
      const voiceTab = await screen.findByRole('tab', { name: /Voice & Conversation/i });
      await user.click(voiceTab);

      // Find conversation rules section
      const rulesSection = screen.getByTestId('conversation-rules-section');

      // Toggle switches
      const multipleServicesSwitch = within(rulesSection).getByLabelText(/Allow Multiple Services/i);
      await user.click(multipleServicesSwitch);

      const noShowBlockSwitch = within(rulesSection).getByLabelText(/Enable No-Show Blocking/i);
      await user.click(noShowBlockSwitch);

      // Update threshold
      const thresholdInput = within(rulesSection).getByLabelText(/No-Show Threshold/i);
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '5');

      // Save changes
      const saveButton = within(rulesSection).getByRole('button', { name: /Save Rules/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.updateBusinessProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            conversationRules: expect.objectContaining({
              allowMultipleServices: false,
              noShowBlockEnabled: true,
              noShowThreshold: 5,
            })
          })
        );
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should reflect real-time voice settings updates', async () => {
      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(mockRealtimeConfig.initialize).toHaveBeenCalledWith(testBusinessId);
      });

      // Simulate real-time update
      const mockCallback = mockRealtimeConfig.subscribe.mock.calls[0][1];
      mockCallback({
        type: 'voice_settings',
        payload: {
          voiceId: 'new-voice-id',
          speed: 1.5,
        },
      });

      // Verify UI updates
      await waitFor(() => {
        const voiceSelect = screen.getByLabelText(/Voice Selection/i);
        expect(voiceSelect).toHaveValue('new-voice-id');
      });
    });

    it('should show connection status indicator', async () => {
      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      // Initially connecting
      expect(screen.getByText(/Connecting.../i)).toBeInTheDocument();

      // Simulate successful connection
      await waitFor(() => {
        expect(screen.getByText(/Live Updates/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockApiClient.getBusinessProfile.mockRejectedValue(new Error('Network error'));

      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Error Loading Settings/i)).toBeInTheDocument();
      });

      // Retry button should be available
      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      expect(retryButton).toBeInTheDocument();

      // Click retry
      mockApiClient.getBusinessProfile.mockResolvedValue({
        id: testBusinessId,
        name: 'Test Business',
        // ... rest of profile
      });

      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText(/Error Loading Settings/i)).not.toBeInTheDocument();
      });
    });

    it('should show specific error messages for failed updates', async () => {
      mockApiClient.updateBusinessProfile.mockRejectedValue(
        new Error('Voice ID not found')
      );

      render(
        <SettingsProvider businessId={testBusinessId}>
          <Settings businessId={testBusinessId} />
        </SettingsProvider>
      );

      // Navigate to Voice & Conversation tab and make changes
      const voiceTab = await screen.findByRole('tab', { name: /Voice & Conversation/i });
      await user.click(voiceTab);

      const saveButton = screen.getByRole('button', { name: /Save Voice Settings/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Voice ID not found/i)).toBeInTheDocument();
      });
    });
  });
});