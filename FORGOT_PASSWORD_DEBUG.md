# Forgot Password Email Issue - Debug Guide

## সমস্যা
- ✅ Login authentication code → **আসে**
- ❌ Forgot password code/link → **আসে না**

## Root Cause Analysis

### Technical Difference:

**✅ Authentication Email (কাজ করছে)**:
```
User signs up → supabase.auth.signUp() 
→ Supabase "Sign Up" template activated 
→ OTP code ইমেইলে পাঠানো হয় 
→ User verifies with code
```

**❌ Password Reset (কাজ করছে না)**:
```
User forgot password → supabase.auth.resetPasswordForEmail(email)
→ Supabase "Password Recovery" template activate হবে
→ Reset link ইমেইলে পাঠানো হওয়া উচিত
→ BUT: Email কি পাঠানো হচ্ছে? ❌
```

---

## ✅ Supabase Console Checklist

### Step 1: Login to Supabase Console
- Go to: https://app.supabase.com
- Select your project: `vocabspeak` (or your project name)

### Step 2: Check Email Templates
1. **Left sidebar → Authentication → Email Templates**
2. Look for **"Password Recovery"** template
3. Check if it's **ENABLED** (toggle should be ON)

### Step 3: Verify Template Content
In "Password Recovery" template, verify:
- ✅ Email body has `{{ .ConfirmationURL }}`
- ✅ Link redirects to: `https://your-domain.com/reset-password`
- ✅ Template is not empty

### Step 4: Check Email Logs
1. **Left sidebar → Logs → Auth**
2. Search for recent password reset attempts
3. Look for entries like:
   - `"password_recovery"` 
   - Or email sending logs

### Step 5: Check Email Configuration
1. **Project Settings → Auth → Email**
2. Verify:
   - ✅ Email provider is configured (built-in, SendGrid, AWS SES, etc.)
   - ✅ "From" email address is valid
   - ✅ SMTP settings (if custom provider)

### Step 6: Test from Supabase CLI
```bash
# If you have Supabase CLI installed
supabase auth resend --email test@example.com --type recovery
```

---

## 🔧 Potential Issues & Solutions

### Issue #1: "Password Recovery" template is DISABLED
**Solution**: Enable it
- Toggle ON the "Password Recovery" email template
- Wait 2-3 minutes for changes to take effect
- Test again

### Issue #2: Wrong redirect URL
**Current code redirects to**:
```tsx
redirectTo: `${window.location.origin}/reset-password`
```
**Should be**:
- `http://localhost:3000/reset-password` (local)
- `https://vocabspeak.me/reset-password` (production)
- `https://easy-vocab.vercel.app/reset-password` (Vercel)

**Fix if needed**:
```tsx
// Update this in src/app/forgot-password/page.tsx
const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
redirectTo: `${origin}/reset-password`
```

### Issue #3: Rate Limiting / Too many requests
**Symptom**: "Email rate limit exceeded" error
**Solution**: Wait 60 seconds before trying again

### Issue #4: Free Tier Email Limitations
**Check**:
- Supabase free tier might limit password recovery emails
- Upgrade plan if needed

### Issue #5: Domain verification issue
**Check**:
- If using custom domain, ensure it's verified in Supabase
- Check sender reputation

---

## ✅ Quick Test Steps

### Local Test (localhost:3000):
1. Go to: `http://localhost:3000/forgot-password`
2. Enter your test email
3. Click "Send Reset Link"
4. Check spam folder
5. Click the reset link in email
6. Set new password

### Production Test (Vercel):
1. Go to: `https://your-vercel-domain.com/forgot-password`
2. Repeat steps 2-5 above

---

## 📋 Code Review

**Current forgot password code** (`src/app/forgot-password/page.tsx`):
```tsx
const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

**Status**: ✅ Code is correct
- Uses correct Supabase method
- Redirect URL is set properly
- Error handling in place

**Issue is NOT in code** → **Issue is in Supabase configuration**

---

## 🆘 Next Steps

1. **Go to Supabase Console RIGHT NOW**
2. Check if "Password Recovery" email template is ENABLED
3. If disabled → **Enable it**
4. Test again immediately
5. If still not working → Check Auth Logs for error messages

---

## 📞 If Still Not Working

Run this command to see Supabase auth logs:
```bash
cd /Users/macos/easy-vocab
npm install -D @supabase/cli  # if not installed
# Then: supabase logs auth --project-ref zdbjsqfdymhlfwywpucs
```

---

## Current Configuration

**Supabase Project URL**: `https://zdbjsqfdymhlfwywpucs.supabase.co`

**Password Reset Page**: `/reset-password`

**Environment**: Production (Vercel deployment)
