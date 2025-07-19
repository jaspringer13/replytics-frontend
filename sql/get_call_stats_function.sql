-- SQL function for efficient call statistics aggregation
-- This function reduces 6 database queries to 1 for better performance

CREATE OR REPLACE FUNCTION get_call_stats(
    business_id_param UUID,
    today_param DATE,
    week_ago_param DATE
)
RETURNS TABLE (
    today_total BIGINT,
    today_answered BIGINT,
    today_missed BIGINT,
    week_total BIGINT,
    week_answered BIGINT,
    week_missed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE created_at::date >= today_param) as today_total,
        COUNT(*) FILTER (WHERE created_at::date >= today_param AND status = 'completed') as today_answered,
        COUNT(*) FILTER (WHERE created_at::date >= today_param AND status = 'missed') as today_missed,
        COUNT(*) FILTER (WHERE created_at::date >= week_ago_param) as week_total,
        COUNT(*) FILTER (WHERE created_at::date >= week_ago_param AND status = 'completed') as week_answered,
        COUNT(*) FILTER (WHERE created_at::date >= week_ago_param AND status = 'missed') as week_missed
    FROM calls 
    WHERE business_id = business_id_param;
END;
$$ LANGUAGE plpgsql;