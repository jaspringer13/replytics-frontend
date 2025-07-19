-- Create a materialized view for customer segments to enable server-side filtering
-- This improves performance by pre-calculating segments and avoiding client-side filtering

-- First, create a function to calculate customer segments
CREATE OR REPLACE FUNCTION calculate_customer_segment(
  first_visit_date TIMESTAMP,
  last_visit_date TIMESTAMP,
  total_appointments INTEGER,
  total_revenue DECIMAL,
  no_show_count INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  days_since_last_visit INTEGER;
  days_since_first_visit INTEGER;
BEGIN
  -- Calculate days since visits
  days_since_last_visit := CASE 
    WHEN last_visit_date IS NULL THEN 99999
    ELSE EXTRACT(EPOCH FROM (NOW() - last_visit_date)) / 86400
  END;
  
  days_since_first_visit := CASE 
    WHEN first_visit_date IS NULL THEN 0
    ELSE EXTRACT(EPOCH FROM (NOW() - first_visit_date)) / 86400
  END;
  
  -- Apply segmentation logic
  -- VIP: High lifetime value and regular visits (check first to preserve VIP status)
  IF total_revenue > 2000 AND total_appointments > 10 THEN
    RETURN 'vip';
  END IF;
  
  -- Dormant: No visit in 60+ days (but not VIP)
  IF days_since_last_visit > 60 THEN
    RETURN 'dormant';
  END IF;
  
  -- At risk: Declining frequency
  IF days_since_last_visit > 45 AND total_appointments > 3 THEN
    RETURN 'at_risk';
  END IF;
  
  -- New customer: First visit within 90 days
  IF days_since_first_visit < 90 THEN
    RETURN 'new';
  END IF;
  
  RETURN 'regular';
END;
$$;

-- Create materialized view with customer segments
CREATE MATERIALIZED VIEW customer_segments AS
SELECT 
  cm.ani_hash,
  cm.tenant_id,
  cm.first_name,
  cm.last_name,
  cm.email,
  cm.preferences,
  cm.flags,
  cm.created_at,
  cm.updated_at,
  COALESCE(a.total_appointments, 0) as total_appointments,
  COALESCE(a.no_show_count, 0) as no_show_count,
  COALESCE(a.total_revenue, 0) as total_revenue,
  COALESCE(a.average_service_value, 0) as average_service_value,
  a.first_visit,
  a.last_visit,
  calculate_customer_segment(
    a.first_visit,
    a.last_visit,
    COALESCE(a.total_appointments, 0),
    COALESCE(a.total_revenue, 0),
    COALESCE(a.no_show_count, 0)
  ) as segment
FROM caller_memory cm
LEFT JOIN (
  SELECT 
    customer_id,
    business_id,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show_count,
    SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) as total_revenue,
    AVG(CASE WHEN status = 'completed' THEN price ELSE NULL END) as average_service_value,
    MIN(appointment_time) as first_visit,
    MAX(appointment_time) as last_visit
  FROM appointments
  GROUP BY customer_id, business_id
) a ON cm.ani_hash = a.customer_id AND cm.tenant_id = a.business_id;

-- Create unique index for efficient lookups
CREATE UNIQUE INDEX idx_customer_segments_pk 
ON customer_segments (ani_hash, tenant_id);

-- Create indexes for filtering
CREATE INDEX idx_customer_segments_tenant_segment 
ON customer_segments (tenant_id, segment);

CREATE INDEX idx_customer_segments_search 
ON customer_segments USING gin(
  to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(ani_hash, ''))
);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_customer_segments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY customer_segments;
END;
$$;

-- Grant permissions
GRANT SELECT ON customer_segments TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_customer_segments() TO authenticated;