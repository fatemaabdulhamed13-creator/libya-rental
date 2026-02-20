-- ─────────────────────────────────────────────────────────────────────────────
-- Ensure the email column exists (no-op if already added via dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;


-- ─────────────────────────────────────────────────────────────────────────────
-- Fix the trigger: include email pulled from NEW.email (auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_host, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NULL
    ),
    false,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill: populate email for existing profile rows where it is null
-- Joins auth.users so we always use the canonical email address
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.profiles p
SET    email = u.email
FROM   auth.users u
WHERE  p.id    = u.id
  AND  p.email IS NULL
  AND  u.email IS NOT NULL;
