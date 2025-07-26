-- Create users table for authentication and business context
-- This table connects NextAuth users with business/tenant context

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with proper schema
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,  -- NextAuth user ID
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL,
  business_id UUID NOT NULL,
  external_id VARCHAR(255),  -- External service ID
  onboarding_step INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  roles TEXT[] DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_business_id ON users(business_id);
CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_users_tenant_business ON users(tenant_id, business_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Add foreign key constraint to businesses table
ALTER TABLE users 
ADD CONSTRAINT fk_users_business_id 
FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- Grant permissions
GRANT ALL ON users TO authenticated;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
CREATE POLICY "Users can only access their own tenant data"
  ON users FOR ALL
  USING (
    tenant_id::text = COALESCE(
      current_setting('app.current_tenant', true),
      'default'
    )
    OR current_setting('app.current_tenant', true) IS NULL
  );

-- Comment on table and columns
COMMENT ON TABLE users IS 'NextAuth users with business context for multi-tenant isolation';
COMMENT ON COLUMN users.id IS 'NextAuth user ID (primary key)';
COMMENT ON COLUMN users.email IS 'User email address';
COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN users.business_id IS 'Associated business ID';
COMMENT ON COLUMN users.external_id IS 'External service identifier';
COMMENT ON COLUMN users.onboarding_step IS 'Current onboarding progress (0-5)';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.roles IS 'User roles array';
COMMENT ON COLUMN users.permissions IS 'User permissions array';
COMMENT ON COLUMN users.last_login IS 'Last login timestamp';
COMMENT ON COLUMN users.created_at IS 'When the user was created';
COMMENT ON COLUMN users.updated_at IS 'When the user was last updated';