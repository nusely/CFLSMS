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

## Mobile Responsiveness

The app is fully responsive for mobile devices:
- No horizontal scrolling
- No hidden content
- Sticky bottom navigation on mobile
- Proper viewport constraints
- Overflow protection on all containers
