-- ==============================================================================
-- SmartProcure - Development Seed Data
-- ENVIRONMENT: LOCAL DEVELOPMENT & TESTING ONLY
-- NOTICE: This file contains minimal synthetic demonstration records for testing
-- and development. These records DO NOT represent real government procurement data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CROPS (The 5 foundational MSP commodities)
-- ------------------------------------------------------------------------------
INSERT INTO public.crops (id, name, hindi_name, category, season, standard_unit, is_active)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Wheat', 'गेहूं', 'Cereal', 'Rabi', 'Quintal', true),
  ('c0000001-0000-0000-0000-000000000002', 'Paddy', 'धान', 'Cereal', 'Kharif', 'Quintal', true),
  ('c0000001-0000-0000-0000-000000000003', 'Maize', 'मक्का', 'Coarse Cereal', 'Kharif', 'Quintal', true),
  ('c0000001-0000-0000-0000-000000000004', 'Rice', 'चावल', 'Cereal', 'Kharif', 'Quintal', true),
  ('c0000001-0000-0000-0000-000000000005', 'Mustard', 'सरसों', 'Oilseed', 'Rabi', 'Quintal', true)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. STATE ADMINS (Production Instructions)
-- ------------------------------------------------------------------------------
-- State administrators are authenticated strictly through Supabase Auth (Email + Password).
-- Once an administrator user is created in Supabase Auth (Studio or Admin API),
-- map their authentic user UUID to their designated state in public.state_admins.
--
-- Supported production states: Bihar (BR), Rajasthan (RJ), Uttar Pradesh (UP), West Bengal (WB).
--
-- Example SQL to authorize an administrator after creating them in Supabase Auth:
-- INSERT INTO public.state_admins (auth_user_id, state, state_code, admin_name, email, active)
-- VALUES (
--   '<ACTUAL_SUPABASE_AUTH_USER_UUID>',
--   'Bihar',
--   'BR',
--   'Bihar State Procurement Officer',
--   'adminBihar@procure.in',
--   true
-- ) ON CONFLICT (auth_user_id) DO UPDATE SET active = true;

-- ------------------------------------------------------------------------------
-- 3. PROCUREMENT CENTRES (Official Mandi yards with standard schedule)
-- Standard schedule: 09:00 - 18:00, with mandatory 14:00 - 15:00 lunch break
-- ------------------------------------------------------------------------------
INSERT INTO public.procurement_centres (
  id, code, name, state, district, address, latitude, longitude,
  operating_status, verified, opening_time, lunch_start, lunch_end, closing_time,
  capacity_per_day_quintals, contact_number
)
VALUES
  (
    'b0000001-0000-0000-0000-000000000001',
    'PC-PB-LDH-04',
    'Ludhiana Central Grain Mandi (Yard 4)',
    'Punjab',
    'Ludhiana',
    'GT Road Mandi Complex, Near Grain Silos, Ludhiana',
    30.901000,
    75.857300,
    'OPEN',
    true,
    '09:00:00',
    '14:00:00',
    '15:00:00',
    '18:00:00',
    3500.00,
    '+91 161 245 8890'
  ),
  (
    'b0000001-0000-0000-0000-000000000002',
    'PC-PB-LDH-02',
    'Khanna Grain Procurement Centre (Terminal Yard)',
    'Punjab',
    'Ludhiana',
    'National Highway 44, Khanna Grain Terminal',
    30.702500,
    76.216300,
    'BUSY',
    true,
    '09:00:00',
    '14:00:00',
    '15:00:00',
    '18:00:00',
    8000.00,
    '+91 162 822 5110'
  ),
  (
    'b0000001-0000-0000-0000-000000000003',
    'PC-PB-LDH-07',
    'Jagraon Agricultural Cooperative Centre',
    'Punjab',
    'Ludhiana',
    'Raikot Road, Jagraon Sub-Yard',
    30.785000,
    75.478000,
    'OPEN',
    true,
    '09:00:00',
    '14:00:00',
    '15:00:00',
    '18:00:00',
    2400.00,
    '+91 162 422 1040'
  ),
  (
    'b0000001-0000-0000-0000-000000000004',
    'PC-HR-KRN-01',
    'Karnal APMC Grain Mandi',
    'Haryana',
    'Karnal',
    'Sector 3, APMC Yard, Karnal',
    29.685700,
    76.990500,
    'OPEN',
    true,
    '09:00:00',
    '14:00:00',
    '15:00:00',
    '18:00:00',
    4500.00,
    '+91 184 225 1100'
  )
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. CROP PRICES (State-specific MSP rates managed by authorized state admins)
-- ------------------------------------------------------------------------------
INSERT INTO public.crop_prices (id, crop_id, state, rate, unit, effective_from, active, created_by_admin)
VALUES
  -- Punjab State Rates
  ('p0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Punjab', 2425.00, 'Quintal', '2026-01-01', true, NULL),
  ('p0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', 'Punjab', 2300.00, 'Quintal', '2026-01-01', true, NULL),
  ('p0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000003', 'Punjab', 2090.00, 'Quintal', '2026-01-01', true, NULL),
  ('p0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000004', 'Punjab', 2320.00, 'Quintal', '2026-01-01', true, NULL),
  ('p0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000005', 'Punjab', 5650.00, 'Quintal', '2026-01-01', true, NULL),
  -- Haryana State Rates
  ('p0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000001', 'Haryana', 2425.00, 'Quintal', '2026-01-01', true, NULL),
  ('p0000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000002', 'Haryana', 2300.00, 'Quintal', '2026-01-01', true, NULL),
  ('p0000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000005', 'Haryana', 5650.00, 'Quintal', '2026-01-01', true, NULL)
ON CONFLICT (crop_id, state, effective_from) DO NOTHING;
