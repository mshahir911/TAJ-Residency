-- ============================================================================
-- Migration: Fresh-Up / Day-Use & Multi-Room Group Allocation Schema
-- ============================================================================

-- 1. Extend bookings table for Day-Use and Multi-Room support
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'overnight',
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS group_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS assigned_room_ids TEXT[],
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_reason TEXT;

-- 2. Extend rooms table for Day-Use status reflection
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS is_day_use BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS day_use_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS group_size INTEGER,
  ADD COLUMN IF NOT EXISTS linked_room_numbers TEXT[];

-- 3. Notify pgrst to reload schema cache
NOTIFY pgrst, 'reload schema';
