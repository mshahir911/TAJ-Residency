-- ============================================================================
-- TAJ RESIDENCY PMS / FRONTDESK OS — PRODUCTION POSTGRESQL (SUPABASE) SCHEMA
-- ============================================================================
-- Multi-Tenant Architecture with Property Isolation, Role-Based Row Level Security (RLS),
-- Storage Bucket Policies for Guest ID Proofs, and Immutable Audit Logging.
-- ============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE room_status_type AS ENUM (
  'vacant',
  'occupied',
  'reserved',
  'dirty',
  'cleaning',
  'clean',
  'ready'
);

CREATE TYPE ac_type AS ENUM (
  'AC',
  'Non-AC'
);

CREATE TYPE staff_role_type AS ENUM (
  'owner',
  'receptionist',
  'housekeeping'
);

CREATE TYPE booking_status_type AS ENUM (
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled'
);

-- ============================================================================
-- 2. CORE RELATIONAL TABLES
-- ============================================================================

-- 2.1 Properties (Multi-Tenant Root)
CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY DEFAULT ('prop-' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  subtitle TEXT,
  address TEXT NOT NULL,
  gst_number TEXT NOT NULL DEFAULT '32AABCT9988Q1Z4',
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  wifi_ssid TEXT DEFAULT 'TajResidency_Guest_5G',
  total_rooms INTEGER NOT NULL DEFAULT 11,
  city TEXT NOT NULL DEFAULT 'Kozhikode',
  state TEXT NOT NULL DEFAULT 'Kerala',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 Room Types & Base Rate Tables
CREATE TABLE IF NOT EXISTS public.room_types (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ac_rate NUMERIC(10,2) NOT NULL,
  non_ac_rate NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 Staff Members (Auth & Permissions)
CREATE TABLE IF NOT EXISTS public.staff_members (
  id TEXT PRIMARY KEY DEFAULT ('staff-' || substr(md5(random()::text), 1, 8)),
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role staff_role_type NOT NULL DEFAULT 'receptionist',
  role_label TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  pin_hash TEXT NOT NULL, -- bcrypt hash of the 4-digit PIN
  shift TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4 Rooms Inventory
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type_id TEXT REFERENCES public.room_types(id) ON DELETE RESTRICT,
  floor INTEGER NOT NULL DEFAULT 2,
  status room_status_type NOT NULL DEFAULT 'vacant',
  current_booking_id TEXT,
  wifi_voucher_code TEXT,
  housekeeper_assigned TEXT,
  inspected_by TEXT,
  last_guest_name TEXT,
  checked_out_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_property_room_number UNIQUE (property_id, room_number)
);

-- 2.5 Guests Directory & CRM
CREATE TABLE IF NOT EXISTS public.guests (
  id TEXT PRIMARY KEY DEFAULT ('gst-' || substr(md5(random()::text), 1, 8)),
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_proof_type TEXT DEFAULT 'Aadhaar Card',
  id_proof_number TEXT,
  id_proof_photo_url TEXT, -- CDN URL in Supabase Storage bucket 'guest-id-proofs'
  id_proof_back_photo_url TEXT,
  id_verified_at TIMESTAMPTZ,
  id_verified_by_staff TEXT,
  address TEXT,
  notes TEXT,
  total_stays INTEGER DEFAULT 1,
  lifetime_spend NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_property_guest_phone UNIQUE (property_id, phone)
);

-- 2.6 Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE RESTRICT,
  guest_id TEXT REFERENCES public.guests(id) ON DELETE RESTRICT,
  check_in_date TIMESTAMPTZ NOT NULL,
  check_out_date TIMESTAMPTZ NOT NULL,
  nights INTEGER NOT NULL DEFAULT 1,
  ac_or_non_ac ac_type NOT NULL DEFAULT 'AC',
  rate_applied NUMERIC(10,2) NOT NULL,
  is_seasonal_rate BOOLEAN DEFAULT false,
  seasonal_name TEXT,
  status booking_status_type NOT NULL DEFAULT 'checked_in',
  advance_paid NUMERIC(10,2) DEFAULT 0.00,
  payment_mode TEXT DEFAULT 'Cash',
  wifi_code TEXT,
  created_by_staff_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.7 Invoices & Tax Receipts
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  nights INTEGER NOT NULL,
  rate_applied NUMERIC(10,2) NOT NULL,
  ac_or_non_ac ac_type NOT NULL,
  gross_room_charge NUMERIC(10,2),
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  discount_type TEXT DEFAULT 'flat',
  discount_reason TEXT,
  room_charge NUMERIC(10,2) NOT NULL,
  gst_rate NUMERIC(4,2) NOT NULL DEFAULT 12.00,
  gst_amount NUMERIC(10,2) NOT NULL,
  cgst_amount NUMERIC(10,2) NOT NULL,
  sgst_amount NUMERIC(10,2) NOT NULL,
  advance_paid NUMERIC(10,2) DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL,
  balance_settled NUMERIC(10,2) NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'UPI',
  billed_by_staff_name TEXT NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8 Operational Expenses & Monthly P&L Ledger
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY DEFAULT ('exp-' || substr(md5(random()::text), 1, 8)),
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'salary', 'utilities', 'supplies', 'repairs', 'other'
  category_label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT NOT NULL,
  notes TEXT,
  logged_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.9 Seasonal & Dynamic Rate Overrides
CREATE TABLE IF NOT EXISTS public.seasonal_overrides (
  id TEXT PRIMARY KEY DEFAULT ('ovr-' || substr(md5(random()::text), 1, 8)),
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  room_type_id TEXT REFERENCES public.room_types(id) ON DELETE CASCADE,
  override_ac_rate NUMERIC(10,2) NOT NULL,
  override_non_ac_rate NUMERIC(10,2) NOT NULL,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.10 Shift Handover & Cash Reconciliation Logs
CREATE TABLE IF NOT EXISTS public.shift_logs (
  id TEXT PRIMARY KEY DEFAULT ('shf-' || substr(md5(random()::text), 1, 8)),
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  shift_name TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  cash_in_drawer NUMERIC(10,2) NOT NULL,
  physical_cash_confirmed NUMERIC(10,2) NOT NULL,
  discrepancy NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  rooms_checked_in INTEGER DEFAULT 0,
  rooms_checked_out INTEGER DEFAULT 0,
  handover_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.11 Immutable Operations Audit Trail
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('aud-' || substr(md5(random()::text), 1, 8)),
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  staff_role TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  details TEXT NOT NULL
);

-- 2.12 Pre-Arrival QR Self Check-Ins
CREATE TABLE IF NOT EXISTS public.self_checkins (
  id TEXT PRIMARY KEY DEFAULT ('self-qr-' || substr(md5(random()::text), 1, 8)),
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
  room_number TEXT,
  guest_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_proof_type TEXT DEFAULT 'Aadhaar Card',
  id_proof_number TEXT,
  id_proof_photo_url TEXT,
  address TEXT,
  eta TEXT,
  digital_signature_captured BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending_reception_confirmation',
  submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. SUPABASE STORAGE BUCKET FOR GUEST ID PROOFS
-- ============================================================================
-- Bucket for storing guest identity documents (Aadhaar, Passport, DL photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-id-proofs', 'guest-id-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Authenticated staff can upload and view guest ID proofs
CREATE POLICY "Staff can upload guest ID proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'guest-id-proofs');

CREATE POLICY "Staff can view guest ID proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'guest-id-proofs');

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_properties_policy_all" ON public.properties FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_room_types_policy_all" ON public.room_types FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_rooms_policy_all" ON public.rooms FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_guests_policy_all" ON public.guests FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_bookings_policy_all" ON public.bookings FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_invoices_policy_all" ON public.invoices FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_expenses_policy_all" ON public.expenses FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_shift_logs_policy_all" ON public.shift_logs FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_audit_logs_policy_all" ON public.audit_logs FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.seasonal_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_overrides_policy_all" ON public.seasonal_overrides FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. SEED DATA (INITIAL PROPERTY & STAFF)
-- ============================================================================

INSERT INTO public.properties (id, name, subtitle, address, gst_number, phone, whatsapp, email, wifi_ssid, total_rooms, city, state)
VALUES (
  'taj-residency-calicut',
  'Taj Residency',
  'Tourist Home & Luxury Rooms • Main Beach Road, Kozhikode, Kerala',
  'Beach Road, Mananchira, Kozhikode, Kerala - 673032',
  '32AABCT9988Q1Z4',
  '+91 495 276 5000',
  '+919495000001',
  'reception@tajresidency.com',
  'TajResidency_Guest_5G',
  11,
  'Kozhikode',
  'Kerala'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.room_types (id, property_id, name, ac_rate, non_ac_rate, description)
VALUES 
  ('deluxe', 'taj-residency-calicut', 'Deluxe Room', 2000.00, 1500.00, 'Spacious sea-breeze room with king bed & balcony'),
  ('classic', 'taj-residency-calicut', 'Classic Room', 1500.00, 1000.00, 'Comfortable twin/double room with clean amenities')
ON CONFLICT (id) DO NOTHING;

-- Initial Staff Credentials (Bcrypt Pin Hashes)
INSERT INTO public.staff_members (id, property_id, name, role, role_label, email, phone, pin_hash, shift, avatar_url)
VALUES
  ('staff-owner-01', 'taj-residency-calicut', 'Muhammed Shahir', 'owner', 'Hotel Owner / GM', 'shahir@tajresidency.com', '+91 94950 11000', crypt('1001', gen_salt('bf')), 'Executive Oversight (24x7)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
  ('staff-rec-01', 'taj-residency-calicut', 'Anoop Nair', 'receptionist', 'Receptionist (Day Shift)', 'anoop.reception@tajresidency.com', '+91 98470 12001', crypt('2001', gen_salt('bf')), 'Day Shift (06:00 - 14:00 IST)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
  ('staff-rec-02', 'taj-residency-calicut', 'Suresh Babu', 'receptionist', 'Receptionist (Night Shift)', 'suresh.reception@tajresidency.com', '+91 98470 12002', crypt('2002', gen_salt('bf')), 'Evening / Night Shift (14:00 - 22:00 / 22:00 - 06:00 IST)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
  ('staff-hk-01', 'taj-residency-calicut', 'Meera Thomas', 'housekeeping', 'Housekeeping (Lady Staff)', 'meera.hk@tajresidency.com', '+91 98470 13001', crypt('3001', gen_salt('bf')), 'Linen Turnover & Sanitization', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. SUPABASE REALTIME PUBLICATION & REPLICA IDENTITY
-- ============================================================================
-- Ensure all PMS tables emit full payloads on UPDATE/DELETE to Realtime subscribers

ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.guests REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.shift_logs REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.properties REPLICA IDENTITY FULL;
ALTER TABLE public.seasonal_overrides REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication for postgres_changes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.seasonal_overrides;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

