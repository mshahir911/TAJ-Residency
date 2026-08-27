-- ============================================================================
-- TAJ RESIDENCY PMS — EOD REPORTS & MIDNIGHT 12:00 AM IST PG_CRON SCHEDULE
-- Project: cdhrpaunmcyknmrcvqdg.supabase.co
-- ============================================================================

-- Step 1: Create the permanent eod_reports table
CREATE TABLE IF NOT EXISTS public.eod_reports (
  id TEXT PRIMARY KEY DEFAULT ('eod-' || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  cash_revenue NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  upi_revenue NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  card_revenue NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  gst_collected NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  concessions_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  check_ins_count INTEGER NOT NULL DEFAULT 0,
  check_outs_count INTEGER NOT NULL DEFAULT 0,
  occupancy_pct INTEGER NOT NULL DEFAULT 0,
  cash_discrepancy NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  summary_text TEXT,
  report_html TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_property_report_date UNIQUE (property_id, report_date)
);

-- Step 2: Enable RLS and create policy for eod_reports
ALTER TABLE public.eod_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pms_eod_reports_all" ON public.eod_reports;
CREATE POLICY "pms_eod_reports_all" ON public.eod_reports
  FOR ALL TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Step 3: Configure Realtime for eod_reports
ALTER TABLE public.eod_reports REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.eod_reports;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 4: Configure pg_cron Schedule at 12:00 AM IST (18:30 UTC)
-- Note: 12:00 AM Indian Standard Time (UTC+5:30) is 18:30 UTC.
-- The cron expression for 18:30 UTC daily is: 30 18 * * *
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule old job if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'taj-midnight-eod-rollover') THEN
    PERFORM cron.unschedule('taj-midnight-eod-rollover');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule the 12:00 AM IST daily automated EOD report compilation
SELECT cron.schedule(
  'taj-midnight-eod-rollover',
  '30 18 * * *',
  $$
  SELECT net.http_post(
    url:='https://cdhrpaunmcyknmrcvqdg.supabase.co/functions/v1/midnight-eod-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkaHJwYXVubWN5a25tcmN2cWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODgzMjgsImV4cCI6MjEwMTc2NDMyOH0.5tk15WpxjRgZqlXki1II_EENnm21Bb1FgT0evsOWMXk"}'::jsonb,
    body:='{"triggered_by": "pg_cron", "property_id": "taj-residency-calicut"}'::jsonb
  ) AS request_id;
  $$
);
