-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-create profile row when a new user signs up in auth.users
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_host, created_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NULL
    ),
    false,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- safe to re-run; never overwrites existing rows
  RETURN NEW;
END;
$$;

-- Drop if it already exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- One-time backfill: create profile rows for existing users who have none
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.profiles (id, full_name, is_host, created_at)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    NULL
  ),
  false,
  COALESCE(u.created_at, NOW())
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
