-- ============================================
-- ADMIN DASHBOARD - RLS POLICIES
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- to allow admin users to manage verifications
-- ============================================

-- 1. Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email = 'fatemaabdulhamed13@gmail.com'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Allow admin to SELECT all profiles (read-only for dashboard)
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());

-- 3. Allow admin to UPDATE verification status for any profile
CREATE POLICY "Admins can update verification status"
ON profiles
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 4. Allow admin to view identity documents in storage
CREATE POLICY "Admins can view all identity documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND is_admin()
);

-- ============================================
-- VERIFICATION INSTRUCTIONS
-- ============================================
-- After running this SQL, you can:
-- 1. Access /admin as fatemaabdulhamed13@gmail.com
-- 2. View all pending ID verifications
-- 3. Approve/Reject IDs
-- 4. View identity document previews
-- ============================================

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- To remove admin policies, run:
-- DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
-- DROP POLICY IF EXISTS "Admins can update verification status" ON profiles;
-- DROP POLICY IF EXISTS "Admins can view all identity documents" ON storage.objects;
-- DROP FUNCTION IF EXISTS is_admin();
-- ============================================
