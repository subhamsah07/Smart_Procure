# SmartProcure - Supabase Database Schema Architecture

This document specifies the PostgreSQL relational database architecture for **SmartProcure**, an intelligent digital agricultural procurement and queue coordination platform.

---

## Architecture Overview

SmartProcure's primary innovation is **dynamic queue intelligence**—shifting physical Mandi queues into real-time digital schedules so farmers arrive precisely when processing capacity is available.

The Supabase database consists of **11 core relational tables**, enforced through Row Level Security (RLS) policies, PostgreSQL triggers, and Realtime pub/sub channels.

```
                    auth.users
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
     profiles                     state_admins
     (Farmers)                  (State Regulators)
         │                             │
         │                             ▼
         │                        crop_prices ◄─── crops
         │                             │             │
         ▼                             │             │
      bookings ◄───────────────────────┼─────────────┘
         │                             │
         ├─────────────────────────────┼────────────────────────┐
         ▼                             ▼                        ▼
    queue_events              procurement_requests         notifications
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
                verification_records              payments
```

---

## Core Entities & Tables

### 1. `profiles`
- **Purpose**: Represents farmer profiles linked 1:1 with Supabase Auth users.
- **Security Constraint**: Does **not** store raw passwords (handled by Supabase Auth), Aadhaar numbers, or exposed bank credentials.
- **Important Columns**:
  - `id` (UUID, PK, REFERENCES `auth.users.id` ON DELETE CASCADE)
  - `full_name` (TEXT)
  - `email` (TEXT)
  - `mobile` (TEXT)
  - `state` (TEXT) — e.g. "Punjab", "Haryana"
  - `district` (TEXT) — e.g. "Ludhiana", "Karnal"
  - `preferred_language` (TEXT, default 'en') — 'en', 'hi', 'pa', 'bn'
  - `notification_preferences` (JSONB) — `{ "sms": true, "whatsapp": true, "voice": false, "delay_alerts": true }`
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS**: Farmers can only read and update their own profile; State Admins can inspect profiles within their state.

### 2. `state_admins`
- **Purpose**: Authorizes state-level procurement officials with an explicit state boundary.
- **Important Columns**:
  - `id` (UUID, PK)
  - `auth_user_id` (UUID, UNIQUE, REFERENCES `auth.users.id`)
  - `state` (TEXT) — e.g. "Punjab"
  - `state_code` (TEXT) — e.g. "PB"
  - `admin_name` (TEXT)
  - `email` (TEXT)
  - `active` (BOOLEAN, default true)
- **RLS**: Administrators can only access data belonging to their authorized state. Enforced via `is_admin_for_state(target_state)`.

### 3. `procurement_centres`
- **Purpose**: Official, verified government Mandi yards and procurement intake facilities.
- **Important Columns**:
  - `id` (UUID, PK)
  - `code` (TEXT, UNIQUE) — e.g. "PC-PB-LDH-04"
  - `name` (TEXT) — e.g. "Ludhiana Central Grain Mandi (Yard 4)"
  - `state`, `district`, `address` (TEXT)
  - `latitude`, `longitude` (NUMERIC(9,6))
  - `operating_status` (TEXT) — `'OPEN'`, `'BUSY'`, `'LUNCH_BREAK'`, `'CLOSED'`, `'MAINTENANCE'`
  - `verified` (BOOLEAN, default true)
  - `opening_time` (TIME, default '09:00:00')
  - `lunch_start` (TIME, default '14:00:00')
  - `lunch_end` (TIME, default '15:00:00')
  - `closing_time` (TIME, default '18:00:00')
  - `capacity_per_day_quintals` (NUMERIC(10,2))
  - `contact_number` (TEXT)
- **RLS**: Public read access for verified centres; modifications restricted to authorized State Admins for that state.

### 4. `crops`
- **Purpose**: Foundational agricultural commodities eligible for government procurement under Minimum Support Price (MSP).
- **Initial Supported Crops**: Wheat, Paddy, Maize, Rice, Mustard.
- **Important Columns**:
  - `id` (UUID, PK)
  - `name` (TEXT, UNIQUE) — 'Wheat', 'Paddy', 'Maize', 'Rice', 'Mustard'
  - `hindi_name` (TEXT) — e.g. 'गेहूं', 'धान', 'मक्का'
  - `category` (TEXT) — 'Cereal', 'Oilseed', etc.
  - `season` (TEXT) — 'Kharif', 'Rabi', 'Zaid', 'All Season'
  - `standard_unit` (TEXT, default 'Quintal')
  - `is_active` (BOOLEAN, default true)

### 5. `crop_prices`
- **Purpose**: State-specific MSP procurement pricing configured and audited by State Admins.
- **Constraint**: Strict state partitioning (`UNIQUE (crop_id, state, effective_from)`).
- **Important Columns**:
  - `id` (UUID, PK)
  - `crop_id` (UUID, REFERENCES `crops.id`)
  - `state` (TEXT)
  - `rate` (NUMERIC(10,2)) — MSP rate in INR per Quintal
  - `unit` (TEXT, default 'Quintal')
  - `effective_from` (DATE)
  - `effective_until` (DATE, optional)
  - `active` (BOOLEAN)
  - `created_by_admin` (UUID, REFERENCES `state_admins.id`)
- **RLS**: Public/Farmers can view active prices; State Admins can only insert/update rates for their own state.

### 6. `bookings`
- **Purpose**: Farmer procurement slot reservations. Farmer provides quantity, crop, and general time preference; the system assigns the scheduled date and arrival window based on centre throughput.
- **Important Columns**:
  - `id` (UUID, PK)
  - `farmer_id` (UUID, REFERENCES `profiles.id`)
  - `centre_id` (UUID, REFERENCES `procurement_centres.id`)
  - `crop_id` (UUID, REFERENCES `crops.id`)
  - `quantity` (NUMERIC(10,2)) — In Quintals
  - `preferred_date` (DATE)
  - `preferred_time_preference` (TEXT) — `'morning'`, `'afternoon'`, `'no_preference'`
  - `assigned_date` (DATE)
  - `assigned_start_time`, `assigned_end_time` (TIME)
  - `token` (VARCHAR(6), UNIQUE) — e.g. `SP7K4Q` generated by `generate_procurement_token()`. Never sequential (no 000001), no PII.
  - `qr_identifier` (TEXT, UNIQUE) — Opaque cryptographic hash/UUID (no raw farmer data).
  - `booking_status` (TEXT) — `'booked'`, `'confirmed'`, `'in_progress'`, `'completed'`, `'cancelled'`, `'no_show'`
- **RLS**: Farmers read their own bookings; State Admins read bookings for centres in their state.

### 7. `queue_events`
- **Purpose**: Discrete, append-only event stream powering real-time queue intelligence, dynamic wait calculation, and delay notification.
- **Important Columns**:
  - `id` (UUID, PK)
  - `booking_id` (UUID, REFERENCES `bookings.id`)
  - `centre_id` (UUID, REFERENCES `procurement_centres.id`)
  - `event_type` (TEXT):
    - `booking_created`
    - `checked_in`
    - `processing_started`
    - `processing_completed`
    - `delayed`
    - `procurement_paused`
    - `procurement_resumed`
    - `cancelled`
    - `no_show`
  - `event_time` (TIMESTAMPTZ, default now())
  - `estimated_processing_minutes` (INTEGER)
  - `delay_minutes` (INTEGER) — Logged operational delay (e.g. weighbridge recalibration)
  - `notes` (TEXT)
  - `created_by` (UUID)

### 8. `procurement_requests`
- **Purpose**: Orchestrates the physical intake and verification lifecycle connecting a booking to weighment and DBT payout.
- **Workflow Status Values**:
  1. `booking`
  2. `qr_verified`
  3. `document_verification`
  4. `weight_rate_verification`
  5. `procurement_completed`
  6. `payment_processing`
  7. `payment_completed`
  *(Also supports `rejected`, `cancelled`)*
- **Important Columns**:
  - `id` (UUID, PK)
  - `booking_id` (UUID, UNIQUE, REFERENCES `bookings.id`)
  - `farmer_id`, `centre_id`, `crop_id` (UUID foreign keys)
  - `submitted_quantity` (NUMERIC(10,2))
  - `verified_quantity` (NUMERIC(10,2)) — Certified Net Weight after Tare deduction
  - `configured_rate` (NUMERIC(10,2))
  - `verified_rate` (NUMERIC(10,2))
  - `estimated_value` (NUMERIC(12,2)) — submitted_quantity * configured_rate
  - `final_value` (NUMERIC(12,2)) — verified_quantity * verified_rate
  - `status` (TEXT)

### 9. `verification_records`
- **Purpose**: Granular audit log for each physical inspection checkpoint at the Mandi.
- **Verification Types**:
  - `'QR verification'` (Gate entry check)
  - `'document verification'` (Identity & land holding check)
  - `'weight verification'` (Electronic weighbridge gross & tare recording)
  - `'rate verification'` (Quality grade verification against state MSP)
- **Important Columns**:
  - `id` (UUID, PK)
  - `procurement_request_id` (UUID, REFERENCES `procurement_requests.id`)
  - `verification_type` (TEXT)
  - `status` (TEXT) — `'pending'`, `'verified'`, `'rejected'`
  - `verified_by` (UUID)
  - `notes` (TEXT)
  - `verified_at` (TIMESTAMPTZ)

### 10. `payments`
- **Purpose**: Direct Benefit Transfer (DBT) payment tracking and bank disbursement status.
- **Status Values**:
  - `'pending'`
  - `'processing'`
  - `'completed'`
  - `'failed'`
- **Important Columns**:
  - `id` (UUID, PK)
  - `procurement_request_id` (UUID, REFERENCES `procurement_requests.id`)
  - `farmer_id` (UUID, REFERENCES `profiles.id`)
  - `amount` (NUMERIC(12,2))
  - `payment_status` (TEXT)
  - `payment_reference` (TEXT) — e.g. "DBT-2026-PUNB-998124"
  - `processed_by` (UUID)
  - `processed_at` (TIMESTAMPTZ)

### 11. `notifications`
- **Purpose**: In-app operational alerts and automated advisories.
- **Types**: `'booking'`, `'queue'`, `'delay'`, `'procurement'`, `'payment'`, `'system'`
- **Important Columns**:
  - `id` (UUID, PK)
  - `farmer_id` (UUID, REFERENCES `profiles.id`)
  - `booking_id` (UUID, REFERENCES `bookings.id`, nullable)
  - `type` (TEXT)
  - `title` (TEXT)
  - `message` (TEXT)
  - `read` (BOOLEAN, default false)
  - `created_at` (TIMESTAMPTZ)

---

## Row Level Security (RLS) Strategy

| Entity | Farmer Access | State Admin Access | Public / Unauth |
| :--- | :--- | :--- | :--- |
| `profiles` | Read/Update Own Profile | Read All Profiles in Authorized State | None |
| `state_admins` | None | Read Own State Admin Team | None |
| `procurement_centres` | Read All Verified Centres | Full Manage (Centres in Authorized State) | Read Verified |
| `crops` | Read Active Crops | Full Manage | Read Active |
| `crop_prices` | Read Active Prices | Manage Prices in Authorized State | Read Active |
| `bookings` | Read/Create/Cancel Own | Read/Manage Bookings in Authorized State | None |
| `queue_events` | Read Events for Assigned Centre | Read/Insert for Centres in Authorized State | None |
| `procurement_requests` | Read Own Requests | Read/Update Requests in Authorized State | None |
| `verification_records` | Read Own Request Records | Insert/Update Records in Authorized State | None |
| `payments` | Read Own Payments | Read/Update Payments in Authorized State | None |
| `notifications` | Read/Mark Read Own | Dispatch to Farmers in Authorized State | None |

---

## Realtime Pub/Sub Channels

The following tables are registered with the `supabase_realtime` publication with `REPLICA IDENTITY FULL`:
1. `public.bookings` — Instant slot status updates
2. `public.queue_events` — Real-time queue progress (Now Serving, Next Vehicle)
3. `public.procurement_requests` — Stage-by-stage workflow transitions
4. `public.notifications` — Push notifications and delay alerts
5. `public.procurement_centres` — Operating status and emergency pauses

---

## ETA Data Foundation & ML-Ready Historical View

To support future Machine Learning models for precision wait-time prediction, the database records the complete operational intake lifecycle. 

The analytical view `public.v_ml_operational_processing_history` joins and outputs the exact feature set:
- **Spatial / Location Factors**: `centre_id`, `centre_state`, `centre_district`, `centre_daily_capacity`
- **Commodity Factors**: `crop_id`, `crop_name`, `crop_category`, `submitted_quantity_quintals`
- **Temporal Factors**: `assigned_date`, `assigned_start_time`, `assigned_end_time`
- **Scheduled Operational Pauses**: `lunch_break_overlapped` (indicates overlap with 14:00 - 15:00 lunch break)
- **Actual Empirical Milestones**:
  - `actual_checkin_time`
  - `actual_processing_start_time`
  - `actual_processing_completed_time`
  - `actual_processing_duration_minutes`
  - `reported_delay_minutes`
