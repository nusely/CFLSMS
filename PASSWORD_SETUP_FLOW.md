# Password Setup & Reset Flow

## Overview
Users must set a password after receiving a magic link invitation. Superadmins can resend invitations for password reset.

## Flow

### 1. **New User Invitation** (First Time)
1. Superadmin sends magic link via `/admins` page
2. User receives email with magic link
3. User clicks magic link → Redirects to `/set-password?reset=true`
4. User is authenticated automatically
5. User sets password (min 6 characters)
6. System marks password as set (`password_set: true` in user_metadata)
7. User redirected to dashboard

### 2. **Password Reset** (Forgot Password)
1. User forgets password
2. Superadmin sends new invitation via `/admins` page
3. User receives email with magic link
4. User clicks magic link → Redirects to `/set-password?reset=true`
5. User sets new password
6. System updates `password_set` flag
7. User redirected to dashboard

### 3. **Normal Login** (Password Already Set)
1. User goes to `/login`
2. Enters email and password
3. If password correct → Access granted
4. No redirect to set-password (password already set)

## Technical Details

### Magic Link Redirect
- Magic links redirect to: `${baseUrl}/set-password?reset=true`
- This allows both new user setup and password reset

### Password Check
- System checks `user_metadata.password_set === true`
- If false or magic link login → Redirect to `/set-password`
- If true and normal login → Allow access

### Security
- Minimum password length: 6 characters
- Password confirmation required
- Password stored securely via Supabase Auth

## What You Need to Do

### Deploy Magic Link Function
```bash
npx supabase functions deploy magic-link
```

This updates the redirect URL to point to `/set-password?reset=true`

## Testing

### Test New User Flow:
1. Superadmin: Go to `/admins`, enter email, click "Send Invite"
2. User: Check email, click magic link
3. Should redirect to `/set-password` page
4. Set password and confirm
5. Should redirect to dashboard
6. Try logging out and logging back in with password

### Test Password Reset:
1. User: Forget password (or superadmin resends invite)
2. Superadmin: Go to `/admins`, click "Send Invite" again
3. User: Check email, click new magic link
4. Should redirect to `/set-password?reset=true`
5. Set new password
6. Try logging in with new password


