-- Availability System Migration
-- Creates availability table for manual date blocking and RPC function for fetching all blocked dates

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create index for performance
CREATE INDEX idx_availability_property_dates ON availability(property_id, start_date, end_date);

-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can read all availability
CREATE POLICY "Anyone can view availability"
    ON availability
    FOR SELECT
    USING (true);

-- RLS Policy: Hosts can insert blocks for their own properties
CREATE POLICY "Hosts can block their own properties"
    ON availability
    FOR INSERT
    WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE host_id = auth.uid()
        )
    );

-- RLS Policy: Hosts can delete their own blocks
CREATE POLICY "Hosts can unblock their own properties"
    ON availability
    FOR DELETE
    USING (
        property_id IN (
            SELECT id FROM properties WHERE host_id = auth.uid()
        )
    );

-- Database Function: Get all blocked dates for a property
-- Combines confirmed bookings and manual blocks
CREATE OR REPLACE FUNCTION get_property_blocked_dates(p_property_id UUID)
RETURNS TABLE (
    start_date DATE,
    end_date DATE,
    block_type TEXT,
    block_id UUID
) AS $$
BEGIN
    RETURN QUERY
    -- Get confirmed bookings
    SELECT 
        b.start_date::DATE,
        b.end_date::DATE,
        'booking'::TEXT as block_type,
        b.id as block_id
    FROM bookings b
    WHERE b.property_id = p_property_id
      AND b.status = 'confirmed'
    
    UNION ALL
    
    -- Get manual blocks
    SELECT 
        a.start_date,
        a.end_date,
        'manual_block'::TEXT as block_type,
        a.id as block_id
    FROM availability a
    WHERE a.property_id = p_property_id
    
    ORDER BY start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Database Function: Check if date range overlaps with existing bookings
-- Used as a constraint to prevent blocking dates that have confirmed bookings
CREATE OR REPLACE FUNCTION check_availability_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the new block overlaps with any confirmed bookings
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE property_id = NEW.property_id
          AND status = 'confirmed'
          AND (
              (start_date::DATE <= NEW.end_date AND end_date::DATE >= NEW.start_date)
          )
    ) THEN
        RAISE EXCEPTION 'Cannot block dates that overlap with confirmed bookings';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce no overlap with bookings
CREATE TRIGGER prevent_booking_overlap
    BEFORE INSERT ON availability
    FOR EACH ROW
    EXECUTE FUNCTION check_availability_overlap();

-- Grant execute permissions on the RPC function
GRANT EXECUTE ON FUNCTION get_property_blocked_dates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_blocked_dates(UUID) TO anon;
