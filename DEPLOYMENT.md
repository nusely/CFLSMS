# Deployment Guide for CFL SMS

## Recommended: Cloudflare Pages

Since your domain `cflhymnal.com` is managed at Cloudflare, deploying to Cloudflare Pages is the best option for:
- Simplified DNS management (everything in one place)
- Free SSL certificates
- Global CDN
- Custom domain support
- Fast deployment times

## Deployment Steps

### 1. Prepare for Cloudflare Pages

The frontend is already configured with:
- ✅ `frontend/public/_redirects` for SPA routing support
- ✅ Vite build configuration
- ✅ Environment variables ready

### 2. Connect Repository to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click "Create a project" → "Connect to Git"
3. Connect your GitHub account and select `CFLSMS` repository
4. Configure the build:
   - **Project name:** `cfl-sms` (or your choice)
   - **Production branch:** `main`
   - **Framework preset:** `VitePreset` (may show wrong auto-detected commands, ignore them)
   - **Build command:** `cd frontend && npm ci && npm run build` ⚠️ **IMPORTANT: Override the auto-detected command**
   - **Build output directory:** `frontend/dist` ⚠️ **IMPORTANT: Override to `frontend/dist`, NOT `.vitepress/dist`**

### 3. Add Environment Variables

Go to Pages Settings → Environment Variables and add:

```
VITE_SUPABASE_URL=https://phbnbrxrreweeeulmpqt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYm5icnhycmV3ZWVldWxtcHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3OTQ1NzEsImV4cCI6MjA3NzM3MDU3MX0.zdoAWyHMCyYbMR0jFrylCW5qxxqYoD9jBjWLHS6WnJI
VITE_APP_URL=https://sms.cflhymnal.com
```

### 4. Configure Custom Domain

1. In your Cloudflare Pages project → Custom domains
2. Add custom domain: `sms.cflhymnal.com`
3. Cloudflare will automatically:
   - Create the CNAME record
   - Provision SSL certificate
   - Enable DDoS protection

### 5. Deploy

Push changes to `main` branch. Cloudflare Pages will automatically deploy.

### 6. Update README.md

Once deployed, update `README.md` with the production URL.

---

## Alternative: Vercel

If you prefer Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `cd frontend && vercel --prod`
3. Add environment variables in Vercel dashboard
4. Connect custom domain in Vercel settings
5. Update Cloudflare DNS to point to Vercel

### Vercel vs Cloudflare Comparison

| Feature | Cloudflare Pages | Vercel |
|---------|-----------------|--------|
| Free tier | ✅ Unlimited | ✅ 100GB bandwidth |
| CDN | ✅ Global | ✅ Global |
| Custom domain | ✅ Free SSL | ✅ Free SSL |
| DNS integration | ✅ Native | ⚠️ Manual setup |
| Build times | ✅ Fast | ✅ Fast |
| Edge functions | ✅ Available | ✅ Available |
| Your domain | ✅ Native | ⚠️ Extra config |

**Recommendation:** Choose Cloudflare Pages due to native domain integration.

---

## Database & Backend

- **Supabase:** Already deployed at `phbnbrxrreweeeulmpqt.supabase.co`
- **Edge Functions:** Deploy via Supabase CLI or dashboard
- **No additional configuration needed** for the frontend

