-- =====================================================
-- Weekend Availability RPC
-- Returns approved properties that have at least ONE
-- Thursday, Friday, or Saturday in the next 30 days
-- that is NOT covered by a confirmed booking or a
-- host manual block.
-- =====================================================

CREATE OR REPLACE FUNCTION get_weekend_available_properties(
    p_limit      INT  DEFAULT 6,
    p_category   TEXT DEFAULT NULL
)
RETURNS SETOF properties
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    WITH weekend_dates AS (
        -- Generate every Thu (DOW=4), Fri (DOW=5), Sat (DOW=6) in the next 30 days
        SELECT d::DATE AS day
        FROM generate_series(
            NOW()::DATE,
            NOW()::DATE + INTERVAL '30 days',
            '1 day'::INTERVAL
        ) AS d
        WHERE EXTRACT(DOW FROM d) IN (4, 5, 6)
    )
    SELECT p.*
    FROM properties p
    WHERE p.status = 'approved'
      AND (p_category IS NULL OR p.category = p_category)
      -- A property qualifies if at least ONE weekend day is free
      AND EXISTS (
          SELECT 1
          FROM weekend_dates w
          WHERE
              -- No confirmed booking covers this specific day
              NOT EXISTS (
                  SELECT 1 FROM bookings b
                  WHERE b.property_id = p.id
                    AND b.status      = 'confirmed'
                    AND b.start_date <= w.day
                    AND b.end_date   >  w.day
              )
              -- No manual host block covers this specific day
              AND NOT EXISTS (
                  SELECT 1 FROM availability a
                  WHERE a.property_id = p.id
                    AND a.start_date <= w.day
                    AND a.end_date   >  w.day
              )
      )
    ORDER BY p.created_at DESC
    LIMIT p_limit;
$$;

-- Grant access to both anonymous visitors and logged-in users
GRANT EXECUTE ON FUNCTION get_weekend_available_properties(INT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_weekend_available_properties(INT, TEXT) TO authenticated;
