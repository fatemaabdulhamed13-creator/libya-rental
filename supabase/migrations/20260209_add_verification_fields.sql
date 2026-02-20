-- Migration: Add Tiered Verification System
-- Created: 2026-02-09

-- Add verification columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_identity_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_document_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'; 
-- Possible values: 'unverified', 'pending', 'verified'

-- Add comment for clarity
COMMENT ON COLUMN profiles.verification_status IS 'unverified = no ID uploaded, pending = ID uploaded awaiting review, verified = admin approved';
COMMENT ON COLUMN profiles.is_identity_verified IS 'true only after admin reviews and approves identity document';

-- Create storage bucket for identity documents (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('identity-documents', 'identity-documents', false);

-- Storage policy for identity documents (admin only read, user can upload their own)
-- CREATE POLICY "Users can upload own identity docs" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'identity-documents' AND auth.uid() = owner);

-- CREATE POLICY "Admins can read identity docs" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'identity-documents' AND auth.jwt() ->> 'role' = 'admin');
