-- =====================================================
-- BOOKING LOGIC UPDATE
-- Pending bookings no longer block calendar dates.
-- Multiple guests may hold pending requests on overlapping dates.
-- When a booking is confirmed, all overlapping pending requests
-- are automatically cancelled via trigger.
-- =====================================================


-- =====================================================
-- 1. UPDATE get_property_blocked_dates
--    Remove pending bookings - only confirmed + manual blocks
-- =====================================================

DROP FUNCTION IF EXISTS get_property_blocked_dates(UUID);

CREATE OR REPLACE FUNCTION get_property_blocked_dates(p_property_id UUID)
RETURNS TABLE (
    start_date DATE,
    end_date   DATE,
    block_type TEXT,
    block_id   UUID,
    status     TEXT
) AS $$
BEGIN
    RETURN QUERY

    -- Confirmed bookings only (pending no longer blocks dates)
    SELECT
        b.start_date::DATE,
        b.end_date::DATE,
        'booking'::TEXT   AS block_type,
        b.id              AS block_id,
        'confirmed'::TEXT AS status
    FROM bookings b
    WHERE b.property_id = p_property_id
      AND b.status = 'confirmed'

    UNION ALL

    -- Host manual blocks (availability table)
    SELECT
        a.start_date,
        a.end_date,
        'manual_block'::TEXT AS block_type,
        a.id                 AS block_id,
        'blocked'::TEXT      AS status
    FROM availability a
    WHERE a.property_id = p_property_id

    ORDER BY start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_property_blocked_dates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_blocked_dates(UUID) TO anon;


-- =====================================================
-- 2. UPDATE check_booking_overlap
--    Remove pending check - only confirmed + manual blocks
-- =====================================================

CREATE OR REPLACE FUNCTION check_booking_overlap(
    p_property_id UUID,
    p_start_date  DATE,
    p_end_date    DATE,
    p_booking_id  UUID DEFAULT NULL
)
RETURNS TABLE (
    has_overlap     BOOLEAN,
    overlap_type    TEXT,
    overlap_details JSONB
) AS $$
DECLARE
    overlap_found BOOLEAN := FALSE;
    overlap_info  JSONB   := '[]'::JSONB;
BEGIN
    -- Check confirmed bookings only
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE property_id = p_property_id
          AND status = 'confirmed'
          AND (p_booking_id IS NULL OR id != p_booking_id)
          AND start_date::DATE < p_end_date
          AND end_date::DATE   > p_start_date
    ) THEN
        overlap_found := TRUE;
        overlap_info  := overlap_info || jsonb_build_object(
            'type',    'confirmed_booking',
            'message', 'التواريخ محجوزة بالفعل'
        );
    END IF;

    -- Check manual availability blocks
    IF EXISTS (
        SELECT 1 FROM availability
        WHERE property_id = p_property_id
          AND start_date < p_end_date
          AND end_date   > p_start_date
    ) THEN
        overlap_found := TRUE;
        overlap_info  := overlap_info || jsonb_build_object(
            'type',    'manual_block',
            'message', 'التواريخ محظورة من قبل المضيف'
        );
    END IF;

    RETURN QUERY
    SELECT
        overlap_found,
        CASE WHEN overlap_found THEN 'التواريخ المحددة غير متاحة' ELSE NULL END,
        overlap_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_booking_overlap(UUID, DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_overlap(UUID, DATE, DATE, UUID) TO anon;


-- =====================================================
-- 3. TRIGGER: When any booking becomes confirmed,
--    cancel all overlapping pending bookings on the
--    same property.
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_overlapping_pending_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire when transitioning INTO confirmed status
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        UPDATE bookings
        SET status = 'cancelled'
        WHERE property_id    = NEW.property_id
          AND id             != NEW.id
          AND status          = 'pending'
          AND start_date::DATE < NEW.end_date::DATE
          AND end_date::DATE   > NEW.start_date::DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_confirmed ON bookings;

CREATE TRIGGER on_booking_confirmed
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION cancel_overlapping_pending_on_confirm();
