-- ==============================================================================
-- SmartProcure - Realtime Payments Publication & Audit Sync Migration
-- Version: 20260907000007
-- Description: Adds public.payments to supabase_realtime publication and sets
-- REPLICA IDENTITY FULL for instant DBT status streaming to farmers and admins.
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
END $$;

ALTER TABLE public.payments REPLICA IDENTITY FULL;

-- Ensure index exists for farmer-specific payment query performance under RLS
CREATE INDEX IF NOT EXISTS idx_payments_farmer_id ON public.payments (farmer_id);
CREATE INDEX IF NOT EXISTS idx_payments_procurement_request_id ON public.payments (procurement_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments (payment_status);
