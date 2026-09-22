-- ==============================================================================
-- SmartProcure - Realtime Publication Setup & Analytical Views
-- Version: 20260907000003
-- Description: Supabase Realtime pub/sub setup & ML-ready historical training views
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SUPABASE REALTIME PUBLICATION CONFIGURATION
-- ------------------------------------------------------------------------------
-- Ensure key transactional tables stream change payloads to subscribed clients
DO $$
BEGIN
  -- Check if supabase_realtime publication exists
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_events;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.procurement_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.procurement_centres;
  END IF;
END $$;

-- Set REPLICA IDENTITY to FULL so update events transmit complete row state
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.queue_events REPLICA IDENTITY FULL;
ALTER TABLE public.procurement_requests REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.procurement_centres REPLICA IDENTITY FULL;

-- ------------------------------------------------------------------------------
-- 2. DERIVED LIVE QUEUE INTELLIGENCE VIEW
-- ------------------------------------------------------------------------------
-- Dynamically derives live queue numbers from true operational events rather
-- than storing fragile, out-of-sync fake counters.
CREATE OR REPLACE VIEW public.v_active_centre_queues AS
SELECT 
  c.id AS centre_id,
  c.code AS centre_code,
  c.name AS centre_name,
  c.state AS centre_state,
  c.district AS centre_district,
  c.operating_status,
  c.capacity_per_day_quintals,
  -- Active token currently at the weighbridge/processing stage
  (
    SELECT b.token 
    FROM public.bookings b
    JOIN public.queue_events qe ON qe.booking_id = b.id
    WHERE b.centre_id = c.id 
      AND qe.event_type = 'processing_started'
      AND NOT EXISTS (
        SELECT 1 FROM public.queue_events qe_done 
        WHERE qe_done.booking_id = b.id 
          AND qe_done.event_type = 'processing_completed'
      )
    ORDER BY qe.event_time DESC 
    LIMIT 1
  ) AS active_processing_token,
  -- Total farmers currently waiting at the yard or confirmed for today
  (
    SELECT COUNT(*) 
    FROM public.bookings b
    WHERE b.centre_id = c.id
      AND b.assigned_date = CURRENT_DATE
      AND b.booking_status IN ('booked', 'confirmed', 'in_progress')
  ) AS total_waiting_in_queue,
  -- Latest logged operational delay in minutes
  COALESCE(
    (
      SELECT qe.delay_minutes
      FROM public.queue_events qe
      WHERE qe.centre_id = c.id
        AND qe.event_time >= CURRENT_DATE
      ORDER BY qe.event_time DESC
      LIMIT 1
    ), 0
  ) AS current_delay_minutes,
  -- Most recent operational event timestamp
  (
    SELECT MAX(qe.event_time)
    FROM public.queue_events qe
    WHERE qe.centre_id = c.id
  ) AS last_event_at
FROM public.procurement_centres c;

-- ------------------------------------------------------------------------------
-- 3. ML OPERATIONAL HISTORICAL VIEW (ETA Waiting-Time Prediction Training Data)
-- ------------------------------------------------------------------------------
-- Preserves the exact feature vector needed for the future waiting-time ML model:
-- Centre characteristics, crop type, volume, slot scheduled vs actual milestones,
-- and observed delays.
CREATE OR REPLACE VIEW public.v_ml_operational_processing_history AS
SELECT 
  b.id AS booking_id,
  b.token,
  c.id AS centre_id,
  c.code AS centre_code,
  c.name AS centre_name,
  c.state AS centre_state,
  c.district AS centre_district,
  c.capacity_per_day_quintals AS centre_daily_capacity,
  cr.id AS crop_id,
  cr.name AS crop_name,
  cr.category AS crop_category,
  b.quantity AS submitted_quantity_quintals,
  b.assigned_date,
  b.assigned_start_time,
  b.assigned_end_time,
  -- Actual event milestones
  (SELECT MIN(qe.event_time) FROM public.queue_events qe WHERE qe.booking_id = b.id AND qe.event_type = 'checked_in') AS actual_checkin_time,
  (SELECT MIN(qe.event_time) FROM public.queue_events qe WHERE qe.booking_id = b.id AND qe.event_type = 'processing_started') AS actual_processing_start_time,
  (SELECT MAX(qe.event_time) FROM public.queue_events qe WHERE qe.booking_id = b.id AND qe.event_type = 'processing_completed') AS actual_processing_completed_time,
  -- Derived processing duration in minutes
  ROUND(
    EXTRACT(EPOCH FROM (
      (SELECT MAX(qe.event_time) FROM public.queue_events qe WHERE qe.booking_id = b.id AND qe.event_type = 'processing_completed') -
      (SELECT MIN(qe.event_time) FROM public.queue_events qe WHERE qe.booking_id = b.id AND qe.event_type = 'processing_started')
    )) / 60.0, 2
  ) AS actual_processing_duration_minutes,
  -- Total observed delay reported during this intake session
  COALESCE((
    SELECT MAX(qe.delay_minutes)
    FROM public.queue_events qe
    WHERE qe.booking_id = b.id
  ), 0) AS reported_delay_minutes,
  -- Flag if assigned slot crossed standard scheduled lunch pause (14:00 - 15:00)
  CASE 
    WHEN (b.assigned_start_time < '15:00:00' AND b.assigned_end_time > '14:00:00') THEN true
    ELSE false
  END AS lunch_break_overlapped,
  b.booking_status,
  pr.status AS procurement_status,
  pr.verified_quantity AS verified_quantity_quintals,
  pr.final_value AS final_payout_amount,
  b.created_at AS booking_created_at
FROM public.bookings b
JOIN public.procurement_centres c ON c.id = b.centre_id
JOIN public.crops cr ON cr.id = b.crop_id
LEFT JOIN public.procurement_requests pr ON pr.booking_id = b.id;
