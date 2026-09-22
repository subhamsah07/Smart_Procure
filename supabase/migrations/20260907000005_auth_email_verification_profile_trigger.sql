-- ==============================================================================
-- SmartProcure - Database Migration
-- Version: 20260907000005
-- Description: Automated Profile Provisioning and RLS Synchronization for Auth Email OTP
-- ==============================================================================

-- 1. Function to automatically sync auth.users metadata to public.profiles
-- This ensures that when a farmer confirms their email via OTP, their profile is instantly
-- and securely linked to public.profiles without depending on client-side timing.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_mobile TEXT;
  v_state TEXT;
  v_district TEXT;
  v_language TEXT;
BEGIN
  -- Extract metadata provided during signUp
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    split_part(NEW.email, '@', 1)
  );
  v_mobile := COALESCE(
    NEW.raw_user_meta_data->>'mobile',
    NEW.raw_user_meta_data->>'mobileNumber'
  );
  v_state := COALESCE(
    NEW.raw_user_meta_data->>'state',
    'Punjab'
  );
  v_district := COALESCE(
    NEW.raw_user_meta_data->>'district',
    'Ludhiana'
  );
  v_language := COALESCE(
    NEW.raw_user_meta_data->>'preferred_language',
    NEW.raw_user_meta_data->>'preferredLanguage',
    'en'
  );

  -- Upsert into public.profiles
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    mobile,
    state,
    district,
    preferred_language,
    notification_preferences,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_mobile,
    v_state,
    v_district,
    v_language,
    '{"sms": true, "whatsapp": true, "voice": false, "delay_alerts": true}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    mobile = COALESCE(EXCLUDED.mobile, public.profiles.mobile),
    state = COALESCE(EXCLUDED.state, public.profiles.state),
    district = COALESCE(EXCLUDED.district, public.profiles.district),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on auth.users when a new user registers or updates email verification
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email_confirmed_at, raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Ensure authenticated users can safely upsert their profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'profiles_upsert_policy'
  ) THEN
    CREATE POLICY "profiles_upsert_policy" ON public.profiles
      FOR INSERT TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;
