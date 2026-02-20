-- Part 1: Add 'expired' enum value
-- This MUST be run separately first because ALTER TYPE ADD VALUE
-- cannot be used in the same transaction where the value is referenced

-- Add 'expired' to booking_status enum if it doesn't exist
-- Run this first, then run part 2
DO $$
BEGIN
    -- Check if 'expired' value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'expired'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status')
    ) THEN
        -- Add the new enum value
        EXECUTE 'ALTER TYPE booking_status ADD VALUE ''expired''';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- booking_status type doesn't exist, it will be created in initial_schema.sql
        RAISE NOTICE 'booking_status type does not exist yet';
END $$;
