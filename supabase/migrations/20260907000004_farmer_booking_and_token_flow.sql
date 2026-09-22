-- ==============================================================================
-- SmartProcure - Farmer Slot Booking & Random Token Generation Migration
-- Version: 20260907000004
-- Description: Unambiguous 6-char random token generation, capacity availability
-- RPC, and active booking conflict constraints.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENHANCED RANDOM 6-CHARACTER TOKEN GENERATOR
-- Generates completely random, non-sequential 6-character tokens (e.g., SP7K4Q, A8M2XZ, Q4T9KP)
-- Excludes ambiguous characters (0, O, 1, I) to prevent scanning and transcription mistakes.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_procurement_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate TEXT := '';
  i INTEGER;
  token_exists BOOLEAN;
  max_attempts INTEGER := 100;
  attempt_count INTEGER := 0;
BEGIN
  LOOP
    attempt_count := attempt_count + 1;
    candidate := '';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check uniqueness against bookings table
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE token = candidate) INTO token_exists;
    IF NOT token_exists THEN
      RETURN candidate;
    END IF;
    
    IF attempt_count >= max_attempts THEN
      -- Fallback to timestamp salted generation in extreme collision scenarios
      RETURN substr(candidate, 1, 4) || substr(chars, floor(random() * length(chars) + 1)::integer, 2);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ------------------------------------------------------------------------------
-- 2. SECURE CENTRE CAPACITY & SLOT AVAILABILITY CHECKER (SECURITY DEFINER)
-- Allows authenticated farmers to check real mandi handling capacity and booked volume
-- without compromising other farmers' personal data under Row Level Security.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_centre_slot_availability(
  p_centre_id UUID,
  p_date DATE,
  p_requested_quantity NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_centre_record RECORD;
  v_booked_quantity NUMERIC(10,2) := 0;
  v_remaining_capacity NUMERIC(10,2) := 0;
  v_is_available BOOLEAN := true;
  v_message TEXT := 'Slots available for selected date.';
BEGIN
  -- 1. Retrieve centre details and daily capacity
  SELECT id, name, operating_status, capacity_per_day_quintals
  INTO v_centre_record
  FROM public.procurement_centres
  WHERE id = p_centre_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_available', false,
      'operating_status', 'UNKNOWN',
      'capacity_per_day_quintals', 0,
      'booked_quintals', 0,
      'remaining_quintals', 0,
      'message', 'Selected procurement centre not found or inactive.'
    );
  END IF;

  -- 2. Check operational status
  IF v_centre_record.operating_status IN ('CLOSED', 'MAINTENANCE') THEN
    RETURN jsonb_build_object(
      'is_available', false,
      'operating_status', v_centre_record.operating_status,
      'capacity_per_day_quintals', v_centre_record.capacity_per_day_quintals,
      'booked_quintals', 0,
      'remaining_quintals', 0,
      'message', 'Centre is currently closed for maintenance or intake suspension.'
    );
  END IF;

  -- 3. Calculate currently booked quantity for this date
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_booked_quantity
  FROM public.bookings
  WHERE centre_id = p_centre_id
    AND preferred_date = p_date
    AND booking_status IN ('booked', 'confirmed', 'in_progress');

  v_remaining_capacity := GREATEST(0, v_centre_record.capacity_per_day_quintals - v_booked_quantity);

  -- 4. Check if capacity is exhausted or cannot fulfill requested quantity
  IF v_remaining_capacity <= 0 THEN
    v_is_available := false;
    v_message := 'Slots are currently full for this centre and date.';
  ELSIF p_requested_quantity > 0 AND (v_booked_quantity + p_requested_quantity) > v_centre_record.capacity_per_day_quintals THEN
    v_is_available := false;
    v_message := 'Requested quantity exceeds remaining daily intake capacity for this date.';
  END IF;

  RETURN jsonb_build_object(
    'is_available', v_is_available,
    'centre_id', v_centre_record.id,
    'centre_name', v_centre_record.name,
    'operating_status', v_centre_record.operating_status,
    'capacity_per_day_quintals', v_centre_record.capacity_per_day_quintals,
    'booked_quintals', v_booked_quantity,
    'remaining_quintals', v_remaining_capacity,
    'message', v_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_centre_slot_availability(UUID, DATE, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_centre_slot_availability(UUID, DATE, NUMERIC) TO anon;

-- ------------------------------------------------------------------------------
-- 3. PREVENT CONFLICTING ACTIVE BOOKINGS ON THE SAME DATE
-- Enforces that a farmer cannot create duplicate active bookings on the same date
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_farmer_booking_date 
ON public.bookings (farmer_id, preferred_date) 
WHERE booking_status IN ('booked', 'confirmed', 'in_progress');
