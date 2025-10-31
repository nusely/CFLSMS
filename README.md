# CFL SMS

A secure PWA to manage church contacts/admins and send SMS via Fish African API.

## Deployment

**Production Domain:** `sms.cflhymnal.com`

> **Note:** Deployment configuration for production domain to be implemented later.

## Local Development
- Frontend: see `frontend/` (Vite + React + Tailwind)
- Supabase: run SQL in `supabase/migrations/` and deploy functions in `supabase/functions/`

## Environment
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- FISH_API_KEY (function, optional explicit Bearer)
- FISH_APP_ID + FISH_APP_SECRET (used to form Bearer "app_id.app_secret" if FISH_API_KEY not set)
- FISH_SENDER_ID (function, e.g. approved Sender ID)
- SERVICE_ROLE_KEY (magic-link function)

## SMS Scheduling Setup

**IMPORTANT:** Scheduled SMS requires a cron job to trigger the `process-scheduled-sms` edge function.

### Option 1: Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → Database → Extensions
2. Enable `pg_cron` extension
3. Create a cron job to call the edge function every minute:

```sql
SELECT cron.schedule(
  'process-scheduled-sms',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_URL/functions/v1/process-scheduled-sms',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

### Option 2: External Cron Service
Use a service like:
- **cron-job.org** (free)
- **EasyCron** (free tier)
- **Cronitor**
- **GitHub Actions** (if using CI/CD)

Set it to call: `https://YOUR_PROJECT_URL/functions/v1/process-scheduled-sms` every minute with:
- Method: POST
- Header: `Authorization: Bearer YOUR_ANON_KEY`

## Mobile Responsiveness

The app is fully responsive for mobile devices:
- No horizontal scrolling
- No hidden content
- Sticky bottom navigation on mobile
- Proper viewport constraints
- Overflow protection on all containers
