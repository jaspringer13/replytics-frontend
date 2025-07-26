-- Create businesses table if it doesn't exist
-- This is the core table for multi-tenant business management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create businesses table with proper schema
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_owner_email ON businesses(owner_email);
CREATE INDEX IF NOT EXISTS idx_businesses_tenant_id ON businesses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_businesses_external_id ON businesses(external_id);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(active);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_businesses_email_active ON businesses(owner_email, active);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_businesses_updated_at_trigger
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_businesses_updated_at();

-- Grant permissions
GRANT ALL ON businesses TO authenticated;

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
CREATE POLICY "Businesses can only access their own tenant data"
  ON businesses FOR ALL
  USING (
    tenant_id = COALESCE(
      current_setting('app.current_tenant', true),
      'default'
    )
    OR current_setting('app.current_tenant', true) IS NULL
  );

-- Comment on table and columns
COMMENT ON TABLE businesses IS 'Multi-tenant businesses table with proper isolation';
COMMENT ON COLUMN businesses.id IS 'Primary key UUID for the business';
COMMENT ON COLUMN businesses.external_id IS 'External identifier for voice-bot integration';
COMMENT ON COLUMN businesses.name IS 'Business name';
COMMENT ON COLUMN businesses.owner_email IS 'Email of the business owner (used for authentication)';
COMMENT ON COLUMN businesses.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN businesses.active IS 'Whether the business is active';
COMMENT ON COLUMN businesses.created_at IS 'When the business was created';
COMMENT ON COLUMN businesses.updated_at IS 'When the business was last updated';