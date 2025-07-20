-- Migration: Create phone_numbers table and update schema for multi-phone support

-- Create phone_numbers table
CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Phone number details
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Twilio metadata
    twilio_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Location info
    address JSONB,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    
    -- Phone-specific settings
    voice_settings JSONB NOT NULL DEFAULT '{
        "voice_id": "kdmDKE6EkgrWrrykO9Qt"
    }'::jsonb,
    
    conversation_rules JSONB NOT NULL DEFAULT '{
        "allow_multiple_services": true,
        "allow_cancellations": true,
        "allow_rescheduling": true,
        "no_show_block_enabled": false,
        "no_show_threshold": 3
    }'::jsonb,
    
    operating_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Status and flags
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'released')),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    
    -- Staff assignment
    assigned_staff_ids UUID[] DEFAULT '{}',
    
    -- SMS settings
    sms_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_reminder_hours INTEGER DEFAULT 24,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT phone_numbers_business_primary_unique UNIQUE (business_id, is_primary) WHERE is_primary = true
);

-- Create indexes
CREATE INDEX idx_phone_numbers_business_id ON phone_numbers(business_id);
CREATE INDEX idx_phone_numbers_phone_number ON phone_numbers(phone_number);
CREATE INDEX idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX idx_phone_numbers_twilio_sid ON phone_numbers((twilio_metadata->>'sid'));

-- Add phone_number_id to related tables
ALTER TABLE operating_hours ADD COLUMN IF NOT EXISTS phone_number_id UUID REFERENCES phone_numbers(id);
ALTER TABLE services ADD COLUMN IF NOT EXISTS phone_number_id UUID REFERENCES phone_numbers(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone_number_id UUID REFERENCES phone_numbers(id);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS phone_number_id UUID REFERENCES phone_numbers(id);
ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS phone_number_id UUID REFERENCES phone_numbers(id);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_operating_hours_phone_number_id ON operating_hours(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_services_phone_number_id ON services(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_bookings_phone_number_id ON bookings(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_calls_phone_number_id ON calls(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_phone_number_id ON sms_messages(phone_number_id);

-- Add RLS policies
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Policy for business owners to manage their phone numbers
CREATE POLICY phone_numbers_business_owner ON phone_numbers
    FOR ALL
    USING (business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    ));

-- Policy for staff members to view phone numbers they're assigned to
CREATE POLICY phone_numbers_staff_view ON phone_numbers
    FOR SELECT
    USING (auth.uid() = ANY(assigned_staff_ids));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_phone_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER phone_numbers_updated_at
    BEFORE UPDATE ON phone_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_phone_numbers_updated_at();

-- Function to ensure only one primary phone per business
CREATE OR REPLACE FUNCTION ensure_single_primary_phone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE phone_numbers 
        SET is_primary = false 
        WHERE business_id = NEW.business_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single primary phone
CREATE TRIGGER maintain_single_primary_phone
    BEFORE INSERT OR UPDATE OF is_primary ON phone_numbers
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION ensure_single_primary_phone();

-- Grant permissions
GRANT ALL ON phone_numbers TO authenticated;
GRANT USAGE ON SEQUENCE phone_numbers_id_seq TO authenticated;