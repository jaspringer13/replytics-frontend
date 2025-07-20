# Frontend Migration Guide for Multi-Tenant Supabase Architecture

## Overview

This guide outlines the required frontend changes to support the new multi-tenant PostgreSQL/Supabase architecture based on the backend migration.

## Current State Analysis

### ✅ Already Implemented
1. **Phone Number Management**: Complete UI for managing multiple phone numbers per business
2. **Phone-Scoped Settings**: Settings hierarchy with phone-level overrides
3. **API Client Structure**: V2 endpoints already implemented for phone management
4. **Multi-Location Support**: Basic architecture in place with PhoneNumber model

### ⚠️ Key Gaps Identified

#### 1. Authentication & Business Context
**Current Implementation:**
- JWT tokens stored but no business_id in metadata
- Tenant ID used but not current_business_id
- Mixed auth approach (NextAuth + custom JWT)

**Required Changes:**
```typescript
// JWT payload must include:
{
  "sub": "user_id",
  "metadata": {
    "current_business_id": "22222222-2222-2222-2222-222222222222"
  }
}
```

#### 2. API Endpoint Updates
**Missing Endpoints:**
- `POST /api/v2/dashboard/phone-numbers/{id}/calendars` - Calendar assignment
- `GET /api/v2/dashboard/phone-numbers/{id}/settings` - Effective settings (merged)
- `GET /api/v2/dashboard/business` - Current business details
- `PATCH /api/v2/dashboard/business` - Update business settings

#### 3. Phone Number Isolation
**Current**: Phone numbers managed but no clear isolation boundary
**Required**: Complete data isolation per phone number:
- Caller memory per phone
- Settings cascade from business → phone
- Independent metrics per location

## Migration Tasks

### Phase 1: Authentication Updates (Critical)

#### 1.1 Update JWT Token Structure
```typescript
// lib/api-client.ts - Update token handling
interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  metadata: {
    current_business_id: string;
  };
  expires_at?: string;
}

// Store business ID alongside token
private businessId: string | null = null;

private initializeFromStorage() {
  // ... existing code ...
  this.businessId = localStorage.getItem('current_business_id');
}

// Add business context to headers
if (this.businessId) {
  headers['X-Business-ID'] = this.businessId;
}
```

#### 1.2 Update Auth Context
```typescript
// contexts/AuthContext.tsx
interface AuthContextValue {
  // ... existing properties ...
  businessId: string | null;
  switchBusiness: (businessId: string) => Promise<void>;
}
```

### Phase 2: API Client Updates

#### 2.1 Add Missing Endpoints
```typescript
// lib/api-client.ts - Add new methods

// Calendar Management
async assignPhoneCalendars(phoneId: string, calendars: Array<{
  calendar_provider: string;
  calendar_id: string;
  priority: number;
}>): Promise<void> {
  return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/calendars`, {
    method: 'POST',
    body: JSON.stringify({ calendars }),
  });
}

// Get effective settings (merged business + phone overrides)
async getPhoneEffectiveSettings(phoneId: string): Promise<{
  voice_settings: VoiceSettings;
  conversation_settings: ConversationRules;
  sms_settings: SMSSettings;
}> {
  return this.request(`/api/v2/dashboard/phone-numbers/${phoneId}/settings`);
}

// Business Management
async getCurrentBusiness(): Promise<BusinessProfile> {
  return this.request('/api/v2/dashboard/business');
}

async updateBusiness(updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
  return this.request('/api/v2/dashboard/business', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}
```

#### 2.2 Update Phone Number Methods
```typescript
// Remove businessId parameter - it comes from auth context
async getPhoneNumbers(): Promise<PhoneNumber[]> {
  return this.request('/api/v2/dashboard/phone-numbers');
}

async provisionPhoneNumber(data: {
  displayName: string;
  areaCode?: string;
  timezone?: string;
  description?: string;
}): Promise<PhoneNumber> {
  return this.request('/api/v2/dashboard/phone-numbers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

### Phase 3: UI Component Updates

#### 3.1 Phone Number List Enhancement
```typescript
// app/dashboard/phone-numbers/page.tsx
// Update to show new fields from backend

interface PhoneNumberWithCalendars extends PhoneNumber {
  calendars: Array<{
    id: string;
    calendar_provider: string;
    calendar_id: string;
    priority: number;
  }>;
  settings_override: Record<string, any>;
  features: {
    appointment_booking: boolean;
    sms_enabled: boolean;
  };
  call_count: number;
  sms_count: number;
}
```

#### 3.2 Create Calendar Assignment Component
```typescript
// components/dashboard/phone-numbers/CalendarAssignment.tsx
export function CalendarAssignment({ phoneId }: { phoneId: string }) {
  const [calendars, setCalendars] = useState([]);
  
  const assignCalendar = async (calendar: CalendarInput) => {
    await apiClient.assignPhoneCalendars(phoneId, [calendar]);
  };
  
  // UI for managing calendar assignments with priority
}
```

#### 3.3 Settings Hierarchy Display
```typescript
// components/dashboard/settings/SettingsHierarchy.tsx
export function SettingsHierarchy({ phoneId }: { phoneId: string }) {
  const [effectiveSettings, setEffectiveSettings] = useState(null);
  const [businessDefaults, setBusinessDefaults] = useState(null);
  const [phoneOverrides, setPhoneOverrides] = useState(null);
  
  // Visual display showing inherited vs overridden settings
  // Allow editing overrides at phone level
}
```

### Phase 4: Data Fetching Updates

#### 4.1 Update Hooks for Phone Context
```typescript
// lib/hooks/usePhoneContext.ts
export function usePhoneContext() {
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  
  // Add to all API calls requiring phone context
  const contextHeaders = {
    'X-Phone-Number-Id': selectedPhoneId
  };
  
  return {
    selectedPhoneId,
    setSelectedPhoneId,
    contextHeaders
  };
}
```

#### 4.2 Update SMS Context
```typescript
// All SMS operations must include phone context
async sendSMS(phoneId: string, data: SMSPayload) {
  return this.request('/api/v2/dashboard/sms', {
    method: 'POST',
    headers: {
      'X-Phone-Number-Id': phoneId
    },
    body: JSON.stringify(data),
  });
}
```

### Phase 5: Analytics Updates

#### 5.1 Per-Location Analytics
```typescript
// components/dashboard/analytics/LocationAnalytics.tsx
export function LocationAnalytics() {
  const { selectedPhoneId } = usePhoneContext();
  
  // Fetch analytics scoped to selected phone number
  // Show location-specific metrics
  // Option to view aggregate across all locations
}
```

## Breaking Changes to Handle

### 1. API Response Structure
Update interfaces to match new structure:
```typescript
interface PhoneNumberResponse {
  id: string;
  phone_number: string; // Note: snake_case from backend
  friendly_name: string;
  settings_override: Record<string, any>;
  features: {
    appointment_booking: boolean;
    sms_enabled: boolean;
  };
  calendars: Calendar[];
  // Usage metrics
  call_count: number;
  sms_count: number;
}
```

### 2. Remove BUSINESS_ID Dependencies
Search and replace all references to environment BUSINESS_ID:
```typescript
// Before
const businessId = process.env.NEXT_PUBLIC_BUSINESS_ID;

// After
const { businessId } = useAuth(); // From JWT metadata
```

## Testing Strategy

### 1. Multi-Location Test Scenarios
```typescript
// __tests__/multi-location.test.ts
describe('Multi-Location Support', () => {
  test('Phone number isolation', async () => {
    // Create 2 phone numbers
    // Verify caller memory is separate
    // Verify settings override works
  });
  
  test('Location switching', async () => {
    // Switch between phone numbers
    // Verify data updates correctly
    // Check analytics scope changes
  });
});
```

### 2. Migration Testing
- Test existing single-location businesses
- Verify backward compatibility
- Check data migration integrity

## Implementation Checklist

- [ ] Update AuthContext to store business_id from JWT
- [ ] Modify API client to remove businessId parameters
- [ ] Add missing API endpoints (calendars, effective settings)
- [ ] Update PhoneNumber interfaces to match backend
- [ ] Create calendar assignment UI
- [ ] Implement settings hierarchy display
- [ ] Add phone context to all relevant API calls
- [ ] Update analytics for per-location views
- [ ] Remove BUSINESS_ID environment dependencies
- [ ] Add comprehensive tests for multi-location scenarios
- [ ] Update documentation

## Security Considerations

1. **Phone Number Validation**: Backend validates ownership, frontend should handle errors gracefully
2. **Data Isolation**: Never mix data between phone numbers on frontend
3. **Context Headers**: Always include proper context headers for phone-scoped operations
4. **Token Management**: Ensure business_id is properly extracted from JWT

## Performance Optimizations

1. **Lazy Loading**: Load phone-specific data only when location is selected
2. **Caching**: Cache phone settings to reduce API calls
3. **Batch Operations**: Use batch APIs where available for multiple phone updates
4. **WebSocket Connections**: One connection per active phone number, not all

## Next Steps

1. **Immediate**: Update authentication to include business_id
2. **High Priority**: Add missing API endpoints
3. **Medium Priority**: Enhance UI for multi-location support
4. **Future**: Advanced features like bulk import, cross-location reporting