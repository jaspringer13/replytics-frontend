-- Add tenant_id to businesses table if it doesn't exist
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT uuid_generate_v4();

-- Create phone_numbers table for mapping Twilio numbers to businesses
CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  twilio_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_business_id ON phone_numbers(business_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_twilio_number ON phone_numbers(twilio_number);

-- Enable Row Level Security
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
-- This policy ensures businesses can only see phone numbers that belong to them
-- It works by joining through the businesses table to check tenant_id
CREATE POLICY "Businesses can only see their own phone numbers"
  ON phone_numbers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = phone_numbers.business_id
      AND businesses.id = COALESCE(
        current_setting('app.current_tenant', true)::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid
      )
    )
  );

-- Grant permissions for authenticated users
GRANT ALL ON phone_numbers TO authenticated;

-- Create updated_at trigger
CREATE TRIGGER update_phone_numbers_updated_at 
  BEFORE UPDATE ON phone_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();