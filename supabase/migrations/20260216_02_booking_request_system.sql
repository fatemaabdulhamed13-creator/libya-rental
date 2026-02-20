-- Booking Request System Migration - Part 2
-- Adds booking_code, num_guests, expires_at fields
-- Creates overlap prevention and updated blocking logic
--
-- IMPORTANT: Run 20260216_01_add_expired_enum.sql FIRST!
-- This is required because ALTER TYPE ADD VALUE cannot be in the same transaction

-- =====================================================
-- 1. ADD NEW COLUMNS TO BOOKINGS TABLE
-- =====================================================

-- Add booking_code (unique, format BK-XXXX1234)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_code TEXT UNIQUE;

-- Add num_guests
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1;

-- Add expires_at (48 hours from created_at for pending bookings)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for overlap checking (property + status + date range)
CREATE INDEX IF NOT EXISTS idx_bookings_overlap_check
ON bookings(property_id, status, start_date, end_date)
WHERE status IN ('pending', 'confirmed');

-- Index for expiry checks
CREATE INDEX IF NOT EXISTS idx_bookings_expiry
ON bookings(expires_at, status)
WHERE status = 'pending' AND expires_at IS NOT NULL;

-- Index for booking code lookups
CREATE INDEX IF NOT EXISTS idx_bookings_code
ON bookings(booking_code);

-- =====================================================
-- 3. CREATE BOOKING CODE GENERATOR FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate BK-XXXX1234 (8 random alphanumeric chars)
        code := 'BK-' || upper(substring(md5(random()::text) from 1 for 8));

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_code = code) INTO exists;

        -- If unique, return it
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGER TO AUTO-GENERATE BOOKING CODE
-- =====================================================

CREATE OR REPLACE FUNCTION set_booking_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate booking code if not provided
    IF NEW.booking_code IS NULL THEN
        NEW.booking_code := generate_booking_code();
    END IF;

    -- Set expires_at to 48 hours from now for pending bookings
    IF NEW.status = 'pending' AND NEW.expires_at IS NULL THEN
        NEW.expires_at := NOW() + INTERVAL '48 hours';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_booking_insert
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_defaults();

-- =====================================================
-- 5. CREATE OVERLAP PREVENTION FUNCTION
-- =====================================================

-- Check if date range overlaps with confirmed, pending, or manual blocks
CREATE OR REPLACE FUNCTION check_booking_overlap(
    p_property_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
    has_overlap BOOLEAN,
    overlap_type TEXT,
    overlap_details JSONB
) AS $$
DECLARE
    overlap_found BOOLEAN := FALSE;
    overlap_info JSONB := '[]'::JSONB;
BEGIN
    -- Check confirmed bookings
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE property_id = p_property_id
          AND status = 'confirmed'
          AND (p_booking_id IS NULL OR id != p_booking_id)
          AND (
              (start_date::DATE <= p_end_date AND end_date::DATE >= p_start_date)
          )
    ) THEN
        overlap_found := TRUE;
        overlap_info := overlap_info || jsonb_build_object(
            'type', 'confirmed_booking',
            'message', 'التواريخ محجوزة بالفعل'
        );
    END IF;

    -- Check pending bookings
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE property_id = p_property_id
          AND status = 'pending'
          AND (p_booking_id IS NULL OR id != p_booking_id)
          AND expires_at > NOW()  -- Only check non-expired pending bookings
          AND (
              (start_date::DATE <= p_end_date AND end_date::DATE >= p_start_date)
          )
    ) THEN
        overlap_found := TRUE;
        overlap_info := overlap_info || jsonb_build_object(
            'type', 'pending_booking',
            'message', 'يوجد طلب حجز معلق لهذه التواريخ'
        );
    END IF;

    -- Check manual availability blocks
    IF EXISTS (
        SELECT 1 FROM availability
        WHERE property_id = p_property_id
          AND (
              (start_date <= p_end_date AND end_date >= p_start_date)
          )
    ) THEN
        overlap_found := TRUE;
        overlap_info := overlap_info || jsonb_build_object(
            'type', 'manual_block',
            'message', 'التواريخ محظورة من قبل المضيف'
        );
    END IF;

    RETURN QUERY SELECT overlap_found,
                        CASE WHEN overlap_found THEN 'التواريخ المحددة غير متاحة' ELSE NULL END,
                        overlap_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_booking_overlap(UUID, DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_overlap(UUID, DATE, DATE, UUID) TO anon;

-- =====================================================
-- 6. UPDATE get_property_blocked_dates() TO INCLUDE PENDING
-- =====================================================

-- Drop the old function
DROP FUNCTION IF EXISTS get_property_blocked_dates(UUID);

-- Recreate with pending bookings included
CREATE OR REPLACE FUNCTION get_property_blocked_dates(p_property_id UUID)
RETURNS TABLE (
    start_date DATE,
    end_date DATE,
    block_type TEXT,
    block_id UUID,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Get confirmed bookings (fully blocked - red)
    SELECT
        b.start_date::DATE,
        b.end_date::DATE,
        'booking'::TEXT as block_type,
        b.id as block_id,
        'confirmed'::TEXT as status
    FROM bookings b
    WHERE b.property_id = p_property_id
      AND b.status = 'confirmed'

    UNION ALL

    -- Get pending bookings (partially blocked - yellow/orange)
    SELECT
        b.start_date::DATE,
        b.end_date::DATE,
        'booking'::TEXT as block_type,
        b.id as block_id,
        'pending'::TEXT as status
    FROM bookings b
    WHERE b.property_id = p_property_id
      AND b.status = 'pending'
      AND b.expires_at > NOW()  -- Only non-expired pending bookings

    UNION ALL

    -- Get manual blocks (fully blocked - red)
    SELECT
        a.start_date,
        a.end_date,
        'manual_block'::TEXT as block_type,
        a.id as block_id,
        'blocked'::TEXT as status
    FROM availability a
    WHERE a.property_id = p_property_id

    ORDER BY start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_property_blocked_dates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_blocked_dates(UUID) TO anon;

-- =====================================================
-- 7. CREATE AUTO-EXPIRY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION expire_pending_bookings()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired pending bookings
    WITH expired AS (
        UPDATE bookings
        SET status = 'expired'
        WHERE status = 'pending'
          AND expires_at IS NOT NULL
          AND expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO expired_count FROM expired;

    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This function will be called by a Supabase Edge Function (cron job)
GRANT EXECUTE ON FUNCTION expire_pending_bookings() TO authenticated;

-- =====================================================
-- 8. BACKFILL EXISTING DATA
-- =====================================================

-- Generate booking codes for existing bookings
UPDATE bookings
SET booking_code = generate_booking_code()
WHERE booking_code IS NULL;

-- Set num_guests to 1 for existing bookings where NULL
UPDATE bookings
SET num_guests = 1
WHERE num_guests IS NULL;

-- Set expires_at for existing pending bookings (48 hours from created_at)
UPDATE bookings
SET expires_at = created_at + INTERVAL '48 hours'
WHERE status = 'pending'
  AND expires_at IS NULL;

-- Expire old pending bookings that should have expired
UPDATE bookings
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at IS NOT NULL
  AND expires_at < NOW();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
