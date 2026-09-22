-- ==============================================================================
-- SmartProcure - Supabase Database Schema Migration
-- Version: 20260907000001
-- Description: Core Relational Schema for Agricultural Procurement & Queue Intelligence
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Unique 6-character random token generator for procurement bookings
-- Produces tokens like "SP7K4Q" using an unambiguous character set (no 0, O, 1, I)
CREATE OR REPLACE FUNCTION generate_procurement_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate TEXT := 'SP';
  i INTEGER;
  token_exists BOOLEAN;
BEGIN
  LOOP
    candidate := 'SP';
    FOR i IN 1..4 LOOP
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check uniqueness against bookings table
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE token = candidate) INTO token_exists;
    IF NOT token_exists THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Farmer profiles linked directly to Supabase Auth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  profile_image_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  notification_preferences JSONB NOT NULL DEFAULT '{"sms": true, "whatsapp": true, "voice": false, "delay_alerts": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. STATE ADMINS (State-level administrative users with strict boundary)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.state_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL, -- e.g. "PB", "HR", "UP"
  admin_name TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_state_admins_updated_at
  BEFORE UPDATE ON public.state_admins
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ------------------------------------------------------------------------------
-- 3. PROCUREMENT CENTRES (Official government Mandi yards with operating hours)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.procurement_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g. "PC-PB-LDH-01"
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  operating_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (operating_status IN ('OPEN', 'BUSY', 'LUNCH_BREAK', 'CLOSED', 'MAINTENANCE')),
  verified BOOLEAN NOT NULL DEFAULT true,
  opening_time TIME NOT NULL DEFAULT '09:00:00',
  lunch_start TIME NOT NULL DEFAULT '14:00:00',
  lunch_end TIME NOT NULL DEFAULT '15:00:00',
  closing_time TIME NOT NULL DEFAULT '18:00:00',
  capacity_per_day_quintals NUMERIC(10,2) NOT NULL DEFAULT 3000.00,
  contact_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_procurement_centres_updated_at
  BEFORE UPDATE ON public.procurement_centres
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4. CROPS (Official supported agricultural commodities)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'Wheat', 'Paddy', 'Maize', 'Rice', 'Mustard'
  hindi_name TEXT,
  category TEXT DEFAULT 'Cereal',
  season TEXT CHECK (season IN ('Kharif', 'Rabi', 'Zaid', 'All Season')),
  standard_unit TEXT NOT NULL DEFAULT 'Quintal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ------------------------------------------------------------------------------
-- 5. CROP PRICES (State-specific MSP rates managed by authorized state admins)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  rate NUMERIC(10,2) NOT NULL CHECK (rate > 0),
  unit TEXT NOT NULL DEFAULT 'Quintal',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by_admin UUID REFERENCES public.state_admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_crop_state_effective_date UNIQUE (crop_id, state, effective_from)
);

CREATE TRIGGER tr_crop_prices_updated_at
  BEFORE UPDATE ON public.crop_prices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ------------------------------------------------------------------------------
-- 6. BOOKINGS (Farmer slot bookings with assigned time and random 6-char token)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES public.procurement_centres(id) ON DELETE RESTRICT,
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  preferred_date DATE NOT NULL,
  preferred_time_preference TEXT NOT NULL DEFAULT 'no_preference' CHECK (preferred_time_preference IN ('morning', 'afternoon', 'no_preference')),
  assigned_date DATE,
  assigned_start_time TIME,
  assigned_end_time TIME,
  token VARCHAR(6) NOT NULL UNIQUE DEFAULT generate_procurement_token(),
  qr_identifier TEXT NOT NULL UNIQUE, -- Opaque cryptographic identifier (never contains raw PII)
  booking_status TEXT NOT NULL DEFAULT 'booked' CHECK (booking_status IN ('booked', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ------------------------------------------------------------------------------
-- 7. QUEUE EVENTS (Discrete real-time event log driving queue intelligence)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.queue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'booking_created',
    'checked_in',
    'processing_started',
    'processing_completed',
    'delayed',
    'procurement_paused',
    'procurement_resumed',
    'cancelled',
    'no_show'
  )),
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  estimated_processing_minutes INTEGER DEFAULT 20,
  delay_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. PROCUREMENT REQUESTS (Connects booking to physical verification workflow)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.procurement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES public.procurement_centres(id) ON DELETE RESTRICT,
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
  submitted_quantity NUMERIC(10,2) NOT NULL CHECK (submitted_quantity > 0),
  verified_quantity NUMERIC(10,2),
  configured_rate NUMERIC(10,2) NOT NULL CHECK (configured_rate > 0),
  verified_rate NUMERIC(10,2),
  estimated_value NUMERIC(12,2) NOT NULL,
  final_value NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'booking' CHECK (status IN (
    'booking',
    'qr_verified',
    'document_verification',
    'weight_rate_verification',
    'procurement_completed',
    'payment_processing',
    'payment_completed',
    'rejected',
    'cancelled'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_procurement_requests_updated_at
  BEFORE UPDATE ON public.procurement_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ------------------------------------------------------------------------------
-- 9. VERIFICATION RECORDS (Auditable log for each inspection checkpoint)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_request_id UUID NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN (
    'QR verification',
    'document verification',
    'weight verification',
    'rate verification'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 10. PAYMENTS (Direct Benefit Transfer records and disbursement status)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_request_id UUID NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
  payment_reference TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ------------------------------------------------------------------------------
-- 11. NOTIFICATIONS (Operational alerts, queue advisories, and payment notices)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('booking', 'queue', 'delay', 'procurement', 'payment', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR HIGH-CONCURRENCY PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_state_district ON public.profiles (state, district);
CREATE INDEX IF NOT EXISTS idx_state_admins_auth_user ON public.state_admins (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_state_admins_state ON public.state_admins (state);

CREATE INDEX IF NOT EXISTS idx_procurement_centres_state_district ON public.procurement_centres (state, district);
CREATE INDEX IF NOT EXISTS idx_procurement_centres_status ON public.procurement_centres (operating_status);

CREATE INDEX IF NOT EXISTS idx_crop_prices_state_crop ON public.crop_prices (state, crop_id, active);

CREATE INDEX IF NOT EXISTS idx_bookings_farmer ON public.bookings (farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_centre_date ON public.bookings (centre_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_bookings_token ON public.bookings (token);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (booking_status);

CREATE INDEX IF NOT EXISTS idx_queue_events_centre_time ON public.queue_events (centre_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_queue_events_booking ON public.queue_events (booking_id);

CREATE INDEX IF NOT EXISTS idx_procurement_requests_booking ON public.procurement_requests (booking_id);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_farmer ON public.procurement_requests (farmer_id);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_centre_status ON public.procurement_requests (centre_id, status);

CREATE INDEX IF NOT EXISTS idx_verification_records_request ON public.verification_records (procurement_request_id);

CREATE INDEX IF NOT EXISTS idx_payments_farmer ON public.payments (farmer_id);
CREATE INDEX IF NOT EXISTS idx_payments_request ON public.payments (procurement_request_id);

CREATE INDEX IF NOT EXISTS idx_notifications_farmer_read ON public.notifications (farmer_id, read);
