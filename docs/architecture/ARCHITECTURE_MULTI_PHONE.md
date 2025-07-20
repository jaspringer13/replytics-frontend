# Multi-Phone Number Architecture

## Overview
The system needs to support businesses with multiple locations, each with its own phone number and configuration. This is a fundamental architectural change that affects data models, API design, and the entire settings flow.

## Data Hierarchy

```text
Business (Tenant)
├── Phone Numbers (Locations)
│   ├── Phone-Specific Settings
│   │   ├── Voice Settings (voice agent config)
│   │   ├── Conversation Rules
│   │   ├── Operating Hours
│   │   └── SMS Settings
│   ├── Location Info
│   │   ├── Display Name
│   │   ├── Address
│   │   └── Timezone
│   └── Staff Assignments
└── Business-Level Settings
    ├── Billing/Subscription
    ├── Default Settings (template for new phones)
    ├── Integrations
    └── Company Profile
```

## Key Architectural Changes

### 1. Database Schema
```sql
-- New phone_numbers table
CREATE TABLE phone_numbers (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    address JSONB,
    timezone VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    
    -- Phone-specific settings
    voice_settings JSONB,
    conversation_rules JSONB,
    sms_settings JSONB,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Ensure only one primary phone per business (no constraint on non-primary phones)
    -- Note: Partial unique index should be created separately
);

-- Move operating_hours to be phone-specific
-- First add the column as nullable for migration
ALTER TABLE operating_hours ADD COLUMN phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE CASCADE;

-- After backfilling data, make it NOT NULL (operating hours must belong to a phone)
-- ALTER TABLE operating_hours ALTER COLUMN phone_number_id SET NOT NULL;

-- Services can be phone-specific or business-wide
-- NULL phone_number_id means business-wide service
-- NON-NULL phone_number_id means phone-specific service
ALTER TABLE services ADD COLUMN phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE CASCADE;

-- Constraint: Only one primary phone per business
CREATE UNIQUE INDEX uniq_primary_phone_per_business 
    ON phone_numbers(business_id) 
    WHERE is_primary = true;

-- Indexes for performance
CREATE INDEX idx_phone_numbers_business_id ON phone_numbers(business_id);
CREATE INDEX idx_phone_numbers_active ON phone_numbers(is_active) WHERE is_active = true;
CREATE INDEX idx_operating_hours_phone_id ON operating_hours(phone_number_id);
CREATE INDEX idx_services_phone_id ON services(phone_number_id);
```

### 2. API Route Structure
```text
/api/v2/businesses/{business_id}
    /phone-numbers
        GET    - List all phone numbers
        POST   - Add new phone number
    /phone-numbers/{phone_id}
        GET    - Get phone details
        PUT    - Update phone settings
        DELETE - Remove phone number
        /settings
            /voice      - Voice agent settings
            /rules      - Conversation rules
            /hours      - Operating hours
            /sms        - SMS settings
        /staff         - Staff assignments
        /services      - Location-specific services
```

### 3. Real-time Channels
```text
business:{business_id}           - Business-wide updates
phone:{phone_id}:settings       - Phone-specific settings
phone:{phone_id}:voice          - Voice configuration updates
phone:{phone_id}:hours          - Operating hours changes
```

### 4. Frontend State Management
The Settings context needs to manage:
- Current business ID
- List of phone numbers
- Selected phone ID
- Phone-specific settings

### 5. Voice Agent Integration
Each voice agent instance must:
- Know which phone number it's handling
- Load settings specific to that phone number
- Fall back to business defaults if needed

## Implementation Plan

### Phase 1: Backend Infrastructure
1. Create phone_numbers domain in backend
2. Implement phone numbers repository and service
3. Update existing domains to be phone-aware
4. Create migration scripts
5. **Migrate existing phone numbers from businesses table**
6. **Set default primary phone for existing businesses**

### Migration Strategy
```sql
-- Step 1: Create phone_numbers table (already defined above)

-- Step 2: Migrate existing data from businesses to phone_numbers
-- Create primary phone number for each existing business
INSERT INTO phone_numbers (
  id, business_id, phone_number, display_name, 
  address, timezone, is_active, is_primary,
  voice_settings, conversation_rules, sms_settings,
  created_at, updated_at
)
SELECT 
  uuid_generate_v4(),
  b.id,
  COALESCE(b.phone_number, '+1-555-0000'), -- Use existing or placeholder
  COALESCE(b.name || ' Main Location', 'Main Location'),
  b.address,
  COALESCE(b.timezone, 'America/New_York'),
  true,
  true, -- Set as primary
  b.voice_settings,
  b.conversation_rules,
  b.sms_settings,
  b.created_at,
  b.updated_at
FROM businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM phone_numbers pn WHERE pn.business_id = b.id
);

-- Step 3: Backfill operating_hours with phone_number_id
-- Link existing operating hours to the primary phone of each business
UPDATE operating_hours 
SET phone_number_id = (
  SELECT pn.id 
  FROM phone_numbers pn 
  WHERE pn.business_id = operating_hours.business_id 
    AND pn.is_primary = true
  LIMIT 1
)
WHERE phone_number_id IS NULL;

-- Step 4: After backfill, enforce NOT NULL constraint
ALTER TABLE operating_hours ALTER COLUMN phone_number_id SET NOT NULL;

-- Step 5: Services remain business-wide by default (phone_number_id stays NULL)
-- No backfill needed for services as NULL means business-wide
```

### Phase 2: API Updates
1. Create phone-scoped API routes
2. Update existing endpoints to accept phone_id
3. Modify real-time broadcast to include phone_id
4. Update webhook handlers

### Phase 3: Frontend Refactoring
1. Update data models
2. Extend SettingsContext for phone selection
3. Add phone selector UI component
4. Update all settings components to use selected phone

### Phase 4: Voice Agent Updates
1. Modify voice agent to receive phone_id
2. Update configuration loading logic
3. Test phone-specific settings transmission

## Benefits
- **Scalability**: Businesses can add unlimited locations
- **Flexibility**: Each location has independent configuration
- **Clarity**: Clear separation between business and location settings
- **Maintainability**: Consistent pattern throughout the system