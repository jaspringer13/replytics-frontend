-- Database Initialization Script
-- /Users/jakespringer/Desktop/Replytics Website/scripts/init-db.sql

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic health check table
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'healthy',
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Insert initial health check record
INSERT INTO health_check (service_name, status, metadata) 
VALUES ('database', 'healthy', '{"initialized": true, "version": "1.0.0"}')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_check_service ON health_check(service_name);
CREATE INDEX IF NOT EXISTS idx_health_check_last_check ON health_check(last_check);

-- Create a simple function for health checks
CREATE OR REPLACE FUNCTION get_db_health()
RETURNS TABLE(
    service VARCHAR(50),
    status VARCHAR(20),
    uptime INTERVAL,
    connections INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'database'::VARCHAR(50) as service,
        'healthy'::VARCHAR(20) as status,
        NOW() - pg_postmaster_start_time() as uptime,
        (SELECT count(*) FROM pg_stat_activity)::INTEGER as connections;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your application)
-- This is a basic setup - you should create specific users and permissions for production
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO replytics;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO replytics;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO replytics;