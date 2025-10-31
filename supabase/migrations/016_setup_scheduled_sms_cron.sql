-- Setup SMS Scheduling Cron Job
-- IMPORTANT: This migration enables pg_cron extension but does NOT automatically create the cron job.
-- You must manually create the cron job via Supabase Dashboard or SQL.

-- Enable pg_cron extension (required for scheduled tasks)
create extension if not exists pg_cron with schema extensions;

-- Note: To complete SMS scheduling setup, run the following in Supabase SQL Editor:
-- 1. Enable pg_net extension: CREATE EXTENSION IF NOT EXISTS pg_net;
-- 2. Create the cron job (replace YOUR_PROJECT_URL and YOUR_ANON_KEY):
--
-- SELECT cron.schedule(
--   'process-scheduled-sms',
--   '* * * * *',
--   $$
--   SELECT net.http_post(
--     url:='https://YOUR_PROJECT_URL/functions/v1/process-scheduled-sms',
--     headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--     body:='{}'::jsonb
--   ) AS request_id;
--   $$
-- );
--
-- See README.md for alternative setup options using external cron services.

