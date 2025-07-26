-- SQL function for atomic bulk upsert of operating hours
-- This ensures all updates happen within a single transaction

CREATE OR REPLACE FUNCTION upsert_operating_hours(
  p_business_id TEXT,
  p_hours_data JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  hour_record JSONB;
BEGIN
  -- Start transaction is implicit in stored procedures
  
  -- Loop through each hour record in the input data
  FOR hour_record IN SELECT * FROM jsonb_array_elements(p_hours_data)
  LOOP
    -- Use INSERT ... ON CONFLICT to handle upsert atomically
    INSERT INTO operating_hours (
      business_id,
      day_of_week,
      open_time,
      close_time,
      is_closed,
      created_at,
      updated_at
    )
    VALUES (
      p_business_id,
      CASE 
        WHEN (hour_record->>'day_of_week')::INTEGER BETWEEN 0 AND 6 
        THEN (hour_record->>'day_of_week')::INTEGER
        ELSE RAISE EXCEPTION 'Invalid day_of_week: must be between 0-6, got %', hour_record->>'day_of_week'
      END,
      hour_record->>'open_time',
      hour_record->>'close_time',
      COALESCE((hour_record->>'is_closed')::BOOLEAN, false),
      NOW(),
      NOW()
    )
    ON CONFLICT (business_id, day_of_week)
    DO UPDATE SET
      open_time = EXCLUDED.open_time,
      close_time = EXCLUDED.close_time,
      is_closed = EXCLUDED.is_closed,
      updated_at = NOW();
  END LOOP;
  
  -- Transaction commits automatically if no exceptions
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will cause automatic rollback
    RAISE EXCEPTION 'Failed to update operating hours: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_operating_hours(TEXT, JSONB) TO authenticated;