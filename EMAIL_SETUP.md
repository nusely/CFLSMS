# Email Setup Guide

## Customizing Invite Emails in Supabase

To customize the invitation email template and sender, you need to configure it in the Supabase Dashboard.

### Step 1: Configure Custom Sender Email

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Click on **Magic Link** template
3. Scroll down to **Sender Email** configuration
4. Enter your custom domain email (e.g., `noreply@cflhymnal.com`)
5. Configure SMTP settings or use Supabase's built-in email service

**Note:** For production, you should:
- Use a custom domain email address
- Configure SMTP settings for better deliverability
- Verify your domain in Supabase

### Step 2: Customize Email Template

1. In the **Magic Link** template editor, you can customize:
   - Subject line
   - Email body (HTML supported)
   - Footer

#### Recommended Template

**Subject:**
```
Welcome to CFL SMS - Set Up Your Account
```

**Option 1: Use Pre-made HTML Template**

We've created a beautiful, professional email template for you! Use the contents of `magic-link-email-template.html` file in your Supabase Dashboard.

**Option 2: Basic HTML Template**

**Body (HTML):**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <!-- Header with Logo -->
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://YOUR_LOGO_URL" alt="CFL SMS Logo" style="width: 80px; height: 80px; margin-bottom: 20px;" />
    <h1 style="color: #2563eb; margin: 0;">CFL SMS</h1>
    <p style="color: #64748b; margin: 5px 0 0 0;">Bulk SMS Management System</p>
  </div>

  <!-- Main Content -->
  <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #1e293b; margin-top: 0;">Welcome to CFL SMS!</h2>
    
    <p style="color: #475569; line-height: 1.6;">
      You've been invited to join the CFL SMS management system. This platform allows you to:
    </p>
    
    <ul style="color: #475569; line-height: 2;">
      <li>📱 <strong>Send SMS</strong> to contacts and groups</li>
      <li>📅 <strong>Schedule messages</strong> for future delivery</li>
      <li>👥 <strong>Manage contacts</strong> and groups</li>
      <li>📊 <strong>View history</strong> of all sent messages</li>
    </ul>
    
    <p style="color: #475569; line-height: 1.6;">
      Click the button below to set up your account and get started:
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: linear-gradient(to right, #3b82f6, #2563eb); 
                color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; 
                font-weight: 600; box-shadow: 0 4px 6px rgba(59,130,246,0.3);">
        Set Up My Account
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0;">
      Or copy and paste this link into your browser:<br/>
      <a href="{{ .ConfirmationURL }}" style="color: #3b82f6; word-break: break-all;">
        {{ .ConfirmationURL }}
      </a>
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">This invitation expires in 24 hours.</p>
    <p style="margin: 10px 0 0 0;">
      If you didn't request this invitation, you can safely ignore this email.
    </p>
    <p style="margin: 10px 0 0 0; color: #cbd5e1;">
      © 2025 CFL SMS by Cimons
    </p>
  </div>
</div>
```

### Step 3: Add Logo URL

Replace `https://YOUR_LOGO_URL` with your actual logo URL. Options:
- Host the logo on your Cloudflare Pages deployment
- Use a CDN like Cloudflare Images
- Upload to Supabase Storage

**Quick Solution:**
Since your frontend is on `sms.cflhymnal.com`, you can serve the logo from there:
```
https://sms.cflhymnal.com/icons/icon-192x192.png
```

### Step 4: SMTP Configuration (Production Recommended)

For production, configure custom SMTP:

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Click **Configure SMTP Settings**
3. Enter your SMTP credentials:
   - **Host:** Your SMTP server
   - **Port:** Usually 587 or 465
   - **Username:** Your SMTP username
   - **Password:** Your SMTP password
   - **Sender Email:** Your custom email (e.g., noreply@cflhymnal.com)

### Step 5: Test the Email

1. Go to your Admins page
2. Send a test invitation to your own email
3. Verify:
   - Logo displays correctly
   - Content is readable
   - Button link works
   - Sender email shows as your custom domain

### Important Notes

- **Email Limits:** Supabase free tier has daily email limits
- **Custom Domain:** Required for professional appearance
- **SMTP Recommended:** For better deliverability in production
- **Template Variables:** Use Supabase's built-in variables ({{ .ConfirmationURL }}, etc.)

## Alternative: Using External Email Service

If you want more control, you can:
1. Use SendGrid, Mailgun, or Resend
2. Call their API from the `magic-link` edge function
3. Get the confirmation URL and send custom HTML email
4. This requires more setup but gives full control

See: https://supabase.com/docs/guides/auth/auth-email-templates

