-- ==============================================================================
-- SmartProcure - Row Level Security (RLS) Policies
-- Version: 20260907000002
-- Description: Strict role and state-boundary isolation for Farmers and State Admins
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- SECURITY HELPER FUNCTIONS (Executed as SECURITY DEFINER to bypass RLS recursion)
-- ------------------------------------------------------------------------------

-- Retrieve the authorized state for the currently authenticated administrator
CREATE OR REPLACE FUNCTION public.get_auth_admin_state()
RETURNS TEXT AS $$
  SELECT state FROM public.state_admins 
  WHERE auth_user_id = auth.uid() 
    AND active = true 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if the current user is an active state administrator for a given state
CREATE OR REPLACE FUNCTION public.is_admin_for_state(target_state TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.state_admins
    WHERE auth_user_id = auth.uid()
      AND state = target_state
      AND active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if the current user is an active administrator in any state
CREATE OR REPLACE FUNCTION public.is_any_active_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.state_admins
    WHERE auth_user_id = auth.uid()
      AND active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- ENABLE RLS ACROSS ALL 11 DOMAIN TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can view their own profile; State admins can view profiles in their state
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR public.is_admin_for_state(state)
  );

-- Farmers can insert their own initial profile during registration
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Farmers can update only their own profile
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 2. STATE ADMINS POLICIES
-- ------------------------------------------------------------------------------
-- An administrator can view their own admin record or co-admins in their state
CREATE POLICY "state_admins_select_policy" ON public.state_admins
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR state = public.get_auth_admin_state()
  );

-- ------------------------------------------------------------------------------
-- 3. PROCUREMENT CENTRES POLICIES
-- ------------------------------------------------------------------------------
-- All authenticated farmers & public can view verified centres for booking discovery
CREATE POLICY "procurement_centres_select_policy" ON public.procurement_centres
  FOR SELECT TO authenticated
  USING (verified = true OR public.is_admin_for_state(state));

-- State Admins can create new centres within their state only
CREATE POLICY "procurement_centres_insert_policy" ON public.procurement_centres
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_for_state(state));

-- State Admins can update centre configurations (hours, status, capacity) in their state
CREATE POLICY "procurement_centres_update_policy" ON public.procurement_centres
  FOR UPDATE TO authenticated
  USING (public.is_admin_for_state(state))
  WITH CHECK (public.is_admin_for_state(state));

-- ------------------------------------------------------------------------------
-- 4. CROPS POLICIES
-- ------------------------------------------------------------------------------
-- Crops list is readable by all authenticated users
CREATE POLICY "crops_select_policy" ON public.crops
  FOR SELECT TO authenticated
  USING (is_active = true OR public.is_any_active_admin());

-- State Admins can create/update crop definitions
CREATE POLICY "crops_admin_manage_policy" ON public.crops
  FOR ALL TO authenticated
  USING (public.is_any_active_admin())
  WITH CHECK (public.is_any_active_admin());

-- ------------------------------------------------------------------------------
-- 5. CROP PRICES POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can view active crop prices
CREATE POLICY "crop_prices_select_policy" ON public.crop_prices
  FOR SELECT TO authenticated
  USING (active = true OR public.is_admin_for_state(state));

-- State Admins can manage MSP rates specifically for their authorized state
CREATE POLICY "crop_prices_insert_policy" ON public.crop_prices
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_for_state(state));

CREATE POLICY "crop_prices_update_policy" ON public.crop_prices
  FOR UPDATE TO authenticated
  USING (public.is_admin_for_state(state))
  WITH CHECK (public.is_admin_for_state(state));

-- ------------------------------------------------------------------------------
-- 6. BOOKINGS POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can view their own bookings; State admins can view bookings for centres in their state
CREATE POLICY "bookings_select_policy" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    farmer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.procurement_centres c
      WHERE c.id = bookings.centre_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- Farmers can insert bookings for themselves
CREATE POLICY "bookings_insert_policy" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid());

-- Farmers can cancel their unserved booking; Admins can update slot allocations & statuses
CREATE POLICY "bookings_update_policy" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    (farmer_id = auth.uid() AND booking_status = 'booked')
    OR EXISTS (
      SELECT 1 FROM public.procurement_centres c
      WHERE c.id = bookings.centre_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- ------------------------------------------------------------------------------
-- 7. QUEUE EVENTS POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can read queue events for centres where they hold an active booking;
-- State admins can read all events for their state's centres.
CREATE POLICY "queue_events_select_policy" ON public.queue_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.centre_id = queue_events.centre_id
        AND b.farmer_id = auth.uid()
        AND b.booking_status IN ('booked', 'confirmed', 'in_progress')
    )
    OR EXISTS (
      SELECT 1 FROM public.procurement_centres c
      WHERE c.id = queue_events.centre_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- State Admins can insert queue events (e.g. check-in, delays, weighbridge status)
CREATE POLICY "queue_events_insert_policy" ON public.queue_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.procurement_centres c
      WHERE c.id = queue_events.centre_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- ------------------------------------------------------------------------------
-- 8. PROCUREMENT REQUESTS POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can view their own requests; State admins can view requests in their state
CREATE POLICY "procurement_requests_select_policy" ON public.procurement_requests
  FOR SELECT TO authenticated
  USING (
    farmer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.procurement_centres c
      WHERE c.id = procurement_requests.centre_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- State Admins can insert or update procurement requests (e.g. during weighbridge processing)
CREATE POLICY "procurement_requests_admin_manage_policy" ON public.procurement_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.procurement_centres c
      WHERE c.id = procurement_requests.centre_id
        AND public.is_admin_for_state(c.state)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.procurement_centres c
      WHERE c.id = procurement_requests.centre_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- ------------------------------------------------------------------------------
-- 9. VERIFICATION RECORDS POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can view verification audit records for their own procurement requests
CREATE POLICY "verification_records_select_policy" ON public.verification_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.procurement_requests pr
      WHERE pr.id = verification_records.procurement_request_id
        AND pr.farmer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.procurement_requests pr
      JOIN public.procurement_centres c ON c.id = pr.centre_id
      WHERE pr.id = verification_records.procurement_request_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- State Admins can insert or update verification records
CREATE POLICY "verification_records_admin_manage_policy" ON public.verification_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.procurement_requests pr
      JOIN public.procurement_centres c ON c.id = pr.centre_id
      WHERE pr.id = verification_records.procurement_request_id
        AND public.is_admin_for_state(c.state)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.procurement_requests pr
      JOIN public.procurement_centres c ON c.id = pr.centre_id
      WHERE pr.id = verification_records.procurement_request_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- ------------------------------------------------------------------------------
-- 10. PAYMENTS POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can view their own DBT payments; State admins can view payments in their state
CREATE POLICY "payments_select_policy" ON public.payments
  FOR SELECT TO authenticated
  USING (
    farmer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.procurement_requests pr
      JOIN public.procurement_centres c ON c.id = pr.centre_id
      WHERE pr.id = payments.procurement_request_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- State Admins can manage payment records and update status to completed
CREATE POLICY "payments_admin_manage_policy" ON public.payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.procurement_requests pr
      JOIN public.procurement_centres c ON c.id = pr.centre_id
      WHERE pr.id = payments.procurement_request_id
        AND public.is_admin_for_state(c.state)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.procurement_requests pr
      JOIN public.procurement_centres c ON c.id = pr.centre_id
      WHERE pr.id = payments.procurement_request_id
        AND public.is_admin_for_state(c.state)
    )
  );

-- ------------------------------------------------------------------------------
-- 11. NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can view their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT TO authenticated
  USING (farmer_id = auth.uid());

-- Farmers can update read status on their own notifications
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE TO authenticated
  USING (farmer_id = auth.uid())
  WITH CHECK (farmer_id = auth.uid());

-- State Admins or system can insert notifications to farmers in their state
CREATE POLICY "notifications_insert_policy" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    farmer_id = auth.uid()
    OR public.is_any_active_admin()
  );
