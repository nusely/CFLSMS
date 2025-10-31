# Email Setup Guide

## Customizing Invite Emails in Supabase

Use Supabase's built-in email service - no SMTP configuration needed!

### Step 1: Configure Email Template

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Click on **Magic Link** template (NOT "Confirm signup" - that's different!)
3. You can customize:
   - **Subject line**
   - **Email body** (HTML supported)
   - **Sender name**

### Step 2: Customize Email Template

**Subject:**
```
Welcome to CFL SMS - Set Up Your Account
```

**Body (HTML):**
Copy the contents from `magic-link-email-template.html` and paste into the Supabase template editor.

### Step 3: Configure Redirect URLs (CRITICAL!)

To prevent localhost redirect issues, configure allowed redirect URLs in Supabase:

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://sms.cflhymnal.com`
3. Add to **Redirect URLs**:
   ```
   https://sms.cflhymnal.com/**
   http://localhost:5173/**
   ```
4. Save changes

### Step 4: Test the Email

1. Go to your Admins page in the app
2. Send a test invitation to your own email
3. Verify:
   - Logo displays correctly
   - Content is readable
   - Button link works
   - Styling looks good
   - Link redirects to `sms.cflhymnal.com` (NOT localhost)

### Important Notes

- **Email Limits:** Supabase free tier has daily email limits
- **No SMTP Needed:** Using Supabase's built-in email service
- **Template Variables:** Use Supabase's built-in variables like `{{ .ConfirmationURL }}`
- **Logo URL:** Make sure `sms.cflhymnal.com` is deployed so the logo loads
- **Redirect URLs:** Must be configured in Supabase Dashboard to allow redirects to your production domain

### That's It!

No complex SMTP configuration needed. Just paste the HTML template and you're good to go!
