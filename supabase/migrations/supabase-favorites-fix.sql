-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FAVORITES TABLE: COMPLETE RESET & FIX
-- Run this in Supabase SQL Editor to force-fix all permissions
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Step 1: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
DROP POLICY IF EXISTS "favorites_select_policy" ON favorites;
DROP POLICY IF EXISTS "favorites_insert_policy" ON favorites;
DROP POLICY IF EXISTS "favorites_delete_policy" ON favorites;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON favorites;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON favorites;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON favorites;

-- Step 2: Ensure RLS is enabled
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Step 3: Create NEW policies with explicit permissions

-- POLICY 1: SELECT (Read) - Users can ONLY see their own favorites
CREATE POLICY "authenticated_users_select_own_favorites"
ON favorites
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- POLICY 2: INSERT (Create) - Users can ONLY add favorites for themselves
CREATE POLICY "authenticated_users_insert_own_favorites"
ON favorites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- POLICY 3: DELETE (Remove) - Users can ONLY delete their own favorites
CREATE POLICY "authenticated_users_delete_own_favorites"
ON favorites
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 4: Verify table structure and constraints
-- (This won't change anything, just outputs info for debugging)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'favorites'
ORDER BY ordinal_position;

-- Step 5: Check existing favorites count (for debugging)
SELECT
    COUNT(*) as total_favorites,
    COUNT(DISTINCT user_id) as unique_users
FROM favorites;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- EXPECTED RESULT:
-- ✅ 3 new policies created
-- ✅ Only authenticated users can access favorites
-- ✅ Users can ONLY manage their own favorites (no one else's)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Optional: If you need to recreate the entire table (DANGER: deletes data!)
-- Uncomment ONLY if you want to start completely fresh:

/*
DROP TABLE IF EXISTS favorites CASCADE;

CREATE TABLE favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Then run the policies above
*/
