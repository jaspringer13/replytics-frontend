# Dashboard V2 API Implementation

## Overview

This implementation provides a comprehensive backend API for the Replytics dashboard with real-time voice agent configuration capabilities. The key innovation is that voice agent settings update in real-time without requiring restarts.

## Architecture

### 1. **Real-Time Voice Agent Settings**
- Voice settings (voice ID, speed, pitch, style) update instantly via WebSocket
- Conversation rules (cancellations, rescheduling, no-show policies) propagate in real-time
- Voice agent subscribes to Supabase channels for hot-reload configuration

### 2. **API Structure**
```text
/api/v2/dashboard/
├── business/
│   ├── profile/         # GET/PATCH business info
│   ├── voice-settings/  # GET/PATCH voice configuration (real-time)
│   └── conversation-rules/ # GET/PATCH behavior rules (real-time)
├── services/
│   ├── route.ts         # GET/POST service management
│   ├── [id]/           # PATCH/DELETE individual services
│   └── reorder/        # POST reorder services
├── hours/              # GET/PATCH operating hours
├── analytics/
│   └── overview/       # GET comprehensive analytics
└── customers/          # GET customer list with segments
```

### 3. **Data Models** (`app/models/`)
- `dashboard.ts`: Business, Service, Customer, Analytics types
- `ai.ts`: AI assistant query and response types

### 4. **Real-Time Updates** (`app/websocket/`)
- `dashboard_handler.ts`: WebSocket subscriptions for live updates
- Channels: voice-settings, conversation-rules, services, business updates

### 5. **Service Layer** (`app/services/dashboard/`)
- `voice_settings_service.ts`: Business logic for voice configuration
- Validates settings, broadcasts updates, handles real-time sync

## Key Features

### Voice Agent Real-Time Updates
```typescript
// When settings change in dashboard:
1. API updates Supabase 'businesses' table
2. Broadcasts on channel: `voice-settings:{businessId}`
3. Voice agent receives update via subscription
4. Voice agent hot-reloads configuration without restart
```

### Customer Segmentation
- **VIP**: Top 20% by revenue, regular visits
- **At Risk**: Declining visit frequency
- **New**: First 90 days
- **Dormant**: No visit in 60+ days
- **Regular**: Active customers

### Analytics Overview
- Revenue trends with period comparison
- Service performance metrics
- Customer segment distribution
- Time-based patterns

## API Client Usage

```typescript
import { apiClient } from '@/lib/api-client';

// Get voice settings
const voiceSettings = await apiClient.getVoiceSettings();

// Update voice settings (triggers real-time update)
await apiClient.updateVoiceSettings({
  voiceId: 'new-voice-id',
  speed: 1.2,
  pitch: 0.9
});

// Get analytics
const analytics = await apiClient.getAnalyticsOverview('2024-01-01', '2024-01-31');

// Manage services
const services = await apiClient.getServices();
await apiClient.createService({
  name: 'Premium Haircut',
  duration: 60,
  price: 75
});
```

## WebSocket Subscriptions

```typescript
import { getRealtimeManager } from '@/app/websocket/dashboard_handler';

// Initialize real-time subscriptions
const realtimeManager = getRealtimeManager(businessId);

realtimeManager.startAll({
  onVoiceSettingsUpdate: (update) => {
    console.log('Voice settings changed:', update);
    // Update UI or notify user
  },
  onServiceUpdate: (update) => {
    console.log('Service changed:', update);
    // Refresh service list
  }
});

// Clean up on unmount
realtimeManager.stopAll();
```

## Database Schema

Run the migration file: `supabase/migrations/20240101_dashboard_v2_schema.sql`

Key tables:
- `businesses`: Extended with voice_settings, conversation_rules, sms_settings
- `services`: Service catalog with pricing and duration
- `operating_hours`: Business hours by day
- `appointments`: Booking records
- `dashboard_customers`: View combining caller_memory with analytics

## Security

- All endpoints require `X-Tenant-ID` header
- Endpoints must validate that the authenticated user belongs to the specified tenant
- Row Level Security (RLS) ensures data isolation
- Service role key used for server-side operations

**Important**: Using service role key bypasses RLS, so manual tenant ownership validation is required in each endpoint.

## Testing Voice Settings

1. Update voice settings via API
2. Monitor WebSocket channel for broadcast
3. Verify voice agent receives update
4. Test voice output with new settings

## Next Steps

1. Implement remaining endpoints (SMS templates, prompts, staff)
2. Add comprehensive error handling
3. Implement caching for analytics queries
4. Add rate limiting for API endpoints
5. Create integration tests