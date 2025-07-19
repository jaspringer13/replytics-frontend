-- Dashboard V2 Schema Migration
-- This migration adds all necessary tables and columns for the enhanced dashboard
-- with real-time voice agent settings

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add voice settings and conversation rules to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS voice_settings JSONB DEFAULT '{
  "voiceId": "kdmDKE6EkgrWrrykO9Qt",
  "speakingStyle": "friendly_professional",
  "speed": 1.0,
  "pitch": 1.0
}'::jsonb;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS conversation_rules JSONB DEFAULT '{
  "allowMultipleServices": true,
  "allowCancellations": true,
  "allowRescheduling": true,
  "noShowBlockEnabled": false,
  "noShowThreshold": 3
}'::jsonb;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS sms_settings JSONB DEFAULT '{
  "enabled": true,
  "remindersEnabled": true,
  "reminderHours": 24,
  "notifyOwnerBooking": true,
  "notifyOwnerCancellation": true
}'::jsonb;

-- Add address and timezone if they don't exist
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}'::jsonb;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York';

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL CHECK (duration >= 15 AND duration <= 480),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  description TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);

-- Create operating hours table
CREATE TABLE IF NOT EXISTS operating_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, day_of_week)
);

-- Create index for operating hours
CREATE INDEX IF NOT EXISTS idx_operating_hours_business_id ON operating_hours(business_id);

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_closed BOOLEAN DEFAULT true,
  special_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, date)
);

-- Create index for holidays
CREATE INDEX IF NOT EXISTS idx_holidays_business_id ON holidays(business_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Create special hours table
CREATE TABLE IF NOT EXISTS special_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, date)
);

-- Create index for special hours
CREATE INDEX IF NOT EXISTS idx_special_hours_business_id ON special_hours(business_id);
CREATE INDEX IF NOT EXISTS idx_special_hours_date ON special_hours(date);

-- Create SMS templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL,
  template TEXT NOT NULL,
  variables TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, template_type)
);

-- Create index for SMS templates
CREATE INDEX IF NOT EXISTS idx_sms_templates_business_id ON sms_templates(business_id);

-- Create staff members table
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'staff',
  services UUID[],
  availability JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for staff members
CREATE INDEX IF NOT EXISTS idx_staff_members_business_id ON staff_members(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_active ON staff_members(active);

-- Create appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id VARCHAR(255) NOT NULL,
  service_id UUID REFERENCES services(id),
  staff_id UUID REFERENCES staff_members(id),
  appointment_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_time ON appointments(appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Create customer aggregation view (using caller_memory as base)
CREATE OR REPLACE VIEW dashboard_customers AS
SELECT 
  cm.ani_hash as id,
  cm.tenant_id as business_id,
  cm.first_name,
  cm.last_name,
  cm.ani_hash as phone,
  cm.email,
  cm.flags,
  cm.preferences,
  cm.created_at as first_interaction,
  cm.updated_at as last_interaction,
  COALESCE(apt.total_appointments, 0) as total_appointments,
  COALESCE(apt.no_show_count, 0) as no_show_count,
  COALESCE(apt.lifetime_value, 0) as lifetime_value,
  CASE 
    WHEN apt.total_appointments > 0 
    THEN apt.lifetime_value / apt.total_appointments 
    ELSE 0 
  END as average_service_value,
  CASE
    WHEN DATE_PART('day', NOW() - cm.created_at) < 90 THEN 'new'
    WHEN DATE_PART('day', NOW() - cm.updated_at) > 60 THEN 'dormant'
    WHEN apt.lifetime_value > 2000 AND apt.total_appointments > 10 THEN 'vip'
    WHEN DATE_PART('day', NOW() - cm.updated_at) > 45 AND apt.total_appointments > 3 THEN 'at_risk'
    ELSE 'regular'
  END as segment
FROM caller_memory cm
LEFT JOIN (
  SELECT 
    customer_id,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show_count,
    SUM(price) FILTER (WHERE status = 'completed') as lifetime_value
  FROM appointments
  GROUP BY customer_id
) apt ON cm.ani_hash = apt.customer_id
WHERE cm.tenant_id = current_setting('app.current_tenant', true)::uuid;

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operating_hours_updated_at BEFORE UPDATE ON operating_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_special_hours_updated_at BEFORE UPDATE ON special_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for API access
GRANT ALL ON services TO authenticated;
GRANT ALL ON operating_hours TO authenticated;
GRANT ALL ON holidays TO authenticated;
GRANT ALL ON special_hours TO authenticated;
GRANT ALL ON sms_templates TO authenticated;
GRANT ALL ON staff_members TO authenticated;
GRANT ALL ON appointments TO authenticated;
GRANT SELECT ON dashboard_customers TO authenticated;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (businesses can only see their own data)
CREATE POLICY "Businesses can only see their own services"
  ON services FOR ALL
  USING (business_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "Businesses can only see their own operating hours"
  ON operating_hours FOR ALL
  USING (business_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "Businesses can only see their own holidays"
  ON holidays FOR ALL
  USING (business_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "Businesses can only see their own special hours"
  ON special_hours FOR ALL
  USING (business_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "Businesses can only see their own SMS templates"
  ON sms_templates FOR ALL
  USING (business_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "Businesses can only see their own staff"
  ON staff_members FOR ALL
  USING (business_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "Businesses can only see their own appointments"
  ON appointments FOR ALL
  USING (business_id = current_setting('app.current_tenant', true)::uuid);

-- Create function to get service performance analytics
CREATE OR REPLACE FUNCTION get_service_performance(
  p_business_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  service_id UUID,
  service_name VARCHAR(255),
  revenue DECIMAL,
  appointment_count BIGINT,
  average_price DECIMAL,
  utilization DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    COALESCE(SUM(a.price), 0) as revenue,
    COUNT(a.id) as appointment_count,
    CASE 
      WHEN COUNT(a.id) > 0 
      THEN SUM(a.price) / COUNT(a.id) 
      ELSE 0 
    END as average_price,
    0.0 as utilization -- Placeholder for utilization calculation
  FROM services s
  LEFT JOIN appointments a ON s.id = a.service_id
    AND a.appointment_time >= p_start_date
    AND a.appointment_time <= p_end_date
    AND a.status = 'completed'
  WHERE s.business_id = p_business_id
  GROUP BY s.id, s.name
  ORDER BY revenue DESC;
END;
$$ LANGUAGE plpgsql;