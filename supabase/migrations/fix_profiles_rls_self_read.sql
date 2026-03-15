-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FIX: Restore authenticated users' ability to read their own profile
-- Run this in Supabase SQL Editor IMMEDIATELY to fix login
--
-- Context: Dropping "Public profiles" USING (true) also removed the
-- ability for logged-in users to fetch their own profile row.
-- This broke navbar (is_host check), profile-form, and host/layout.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Users can read their own full profile row (needed for profile-form, navbar, host layout)
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Ensure public_profiles_view is readable by everyone (anon + authenticated)
--    The view should only expose safe columns (id, full_name, avatar_url, is_host,
--    is_identity_verified, verification_status, created_at).
--    Views inherit table RLS, so we need this grant:
GRANT SELECT ON public_profiles_view TO anon, authenticated;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFY: After running, confirm these 3 policies exist on profiles:
--   1. "Users can read own profile"     → FOR SELECT USING (auth.uid() = id)
--   2. "Users can update own profile"   → FOR UPDATE USING (auth.uid() = id)
--   3. "Users can insert their own profile" → FOR INSERT WITH CHECK (auth.uid() = id)
--   4. "Admins can view all profiles"   → FOR SELECT USING (is_admin())
--   5. "Admins can update verification status"
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
