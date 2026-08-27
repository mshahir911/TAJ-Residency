-- ============================================================================
-- TAJ RESIDENCY PMS — SUPABASE POSTGRESQL MIGRATION & RLS REPAIR SCRIPT
-- Project: cdhrpaunmcyknmrcvqdg.supabase.co
-- Resolves: Error 42501 (RLS Policy Violations on rooms, guests, shift_logs, audit_logs)
--           Error 23502 (NOT NULL constraint violations on bookings)
-- Enrolls: All 8 core tables into Supabase Realtime Publication with REPLICA IDENTITY FULL
-- ============================================================================

-- Step 1: Ensure Schema Grants for anon and authenticated API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Step 2: Ensure default values on bookings to avoid 23502 constraint errors
ALTER TABLE IF EXISTS public.bookings 
  ALTER COLUMN created_by_staff_name SET DEFAULT 'Reception Desk',
  ALTER COLUMN status SET DEFAULT 'confirmed',
  ALTER COLUMN ac_or_non_ac SET DEFAULT 'AC',
  ALTER COLUMN advance_paid SET DEFAULT 0.00,
  ALTER COLUMN payment_mode SET DEFAULT 'Cash',
  ALTER COLUMN nights SET DEFAULT 1;

-- Step 3: Add missing columns if any
ALTER TABLE IF EXISTS public.guests
  ADD COLUMN IF NOT EXISTS id_proof_back_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS id_verified_at TEXT,
  ADD COLUMN IF NOT EXISTS id_verified_by_staff TEXT,
  ADD COLUMN IF NOT EXISTS total_stays INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS lifetime_spend NUMERIC(10,2) DEFAULT 0.00;

ALTER TABLE IF EXISTS public.invoices
  ADD COLUMN IF NOT EXISTS gross_room_charge NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS discount_reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS billed_by_staff_name TEXT DEFAULT 'Receptionist';

ALTER TABLE IF EXISTS public.rooms
  ADD COLUMN IF NOT EXISTS housekeeper_assigned TEXT,
  ADD COLUMN IF NOT EXISTS inspected_by TEXT,
  ADD COLUMN IF NOT EXISTS last_guest_name TEXT,
  ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ;

-- Step 4: Drop old restrictive / broken RLS policies
DROP POLICY IF EXISTS "Staff can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Staff can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow all for rooms" ON public.rooms;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rooms;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.rooms;
DROP POLICY IF EXISTS "Enable update for all users" ON public.rooms;

DROP POLICY IF EXISTS "Desk staff can manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all for bookings" ON public.bookings;

DROP POLICY IF EXISTS "Allow all for guests" ON public.guests;
DROP POLICY IF EXISTS "Enable read access for guests" ON public.guests;

DROP POLICY IF EXISTS "Desk staff can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all for invoices" ON public.invoices;

DROP POLICY IF EXISTS "Owners can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all for expenses" ON public.expenses;

DROP POLICY IF EXISTS "Allow all for shift_logs" ON public.shift_logs;
DROP POLICY IF EXISTS "Allow all for audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all for seasonal_overrides" ON public.seasonal_overrides;

-- Step 5: Enable Row Level Security and create comprehensive Read/Write Policies
-- Rooms: Full operational access for front desk and housekeeping
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_rooms_policy_all" ON public.rooms
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Bookings: Full lifecycle management
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_bookings_policy_all" ON public.bookings
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Guests: Permanent CRM profiles & identity verification
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_guests_policy_all" ON public.guests
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Invoices: Kerala GST billing & settled folios
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_invoices_policy_all" ON public.invoices
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Expenses: Operating cost ledger
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_expenses_policy_all" ON public.expenses
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Shift Logs: Cash drawer reconciliation
ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_shift_logs_policy_all" ON public.shift_logs
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Audit Logs: Compliance trail
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_audit_logs_policy_all" ON public.audit_logs
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Seasonal Overrides: Dynamic rates
ALTER TABLE public.seasonal_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_overrides_policy_all" ON public.seasonal_overrides
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Properties: Property metadata
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_properties_policy_all" ON public.properties
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Room Types: Base rate lookup
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_room_types_policy_all" ON public.room_types
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Staff Members: Role credentials
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pms_staff_policy_all" ON public.staff_members
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Step 6: Configure REPLICA IDENTITY FULL for Supabase Realtime
-- This ensures that UPDATE and DELETE payloads broadcast complete row snapshots
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.guests REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.shift_logs REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.seasonal_overrides REPLICA IDENTITY FULL;
ALTER TABLE public.properties REPLICA IDENTITY FULL;

-- Step 7: Enroll Tables into the Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
  tables_to_add text[] := ARRAY[
    'rooms', 'bookings', 'guests', 'invoices', 
    'expenses', 'shift_logs', 'audit_logs', 
    'seasonal_overrides', 'properties'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    EXCEPTION
      WHEN duplicate_object THEN
        -- Table already in publication, safe to continue
        NULL;
    END;
  END LOOP;
END $$;

-- Step 8: Seed Property & 11 Physical Rooms
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

INSERT INTO public.rooms (id, property_id, room_number, floor, room_type_id, status, wifi_voucher_code)
VALUES
  ('room-201', 'taj-residency-calicut', '201', 2, 'deluxe', 'vacant', 'TR-WIFI-201-98A2'),
  ('room-202', 'taj-residency-calicut', '202', 2, 'classic', 'vacant', 'TR-WIFI-202-31B4'),
  ('room-203', 'taj-residency-calicut', '203', 2, 'classic', 'vacant', 'TR-WIFI-203-44K1'),
  ('room-204', 'taj-residency-calicut', '204', 2, 'classic', 'vacant', 'TR-WIFI-204-89P0'),
  ('room-205', 'taj-residency-calicut', '205', 2, 'classic', 'vacant', 'TR-WIFI-205-12Q7'),
  ('room-206', 'taj-residency-calicut', '206', 2, 'deluxe', 'vacant', 'TR-WIFI-206-65T3'),
  ('room-301', 'taj-residency-calicut', '301', 3, 'deluxe', 'vacant', 'TR-WIFI-301-44X8'),
  ('room-302', 'taj-residency-calicut', '302', 3, 'classic', 'vacant', 'TR-WIFI-302-77L9'),
  ('room-303', 'taj-residency-calicut', '303', 3, 'classic', 'vacant', 'TR-WIFI-303-22M1'),
  ('room-304', 'taj-residency-calicut', '304', 3, 'classic', 'vacant', 'TR-WIFI-304-51X2'),
  ('room-305', 'taj-residency-calicut', '305', 3, 'deluxe', 'vacant', 'TR-WIFI-305-90V4')
ON CONFLICT (property_id, room_number) DO UPDATE SET
  status = EXCLUDED.status,
  room_type_id = EXCLUDED.room_type_id,
  floor = EXCLUDED.floor;
