# Supabase Email OTP Configuration Guide: Confirm Signup Template

## Background

By default, Supabase's email template for **Confirm signup** includes the variable `{{ .ConfirmationURL }}`. When this variable is present, Supabase's authentication engine (`GoTrue`) automatically generates an email with a clickable confirmation link.

To make Supabase send a **6-digit numerical OTP** instead of a link:
1. The email template MUST include `{{ .Token }}`.
2. The email template MUST NOT include `{{ .ConfirmationURL }}`.

Supabase handles OTP generation internally. **Do not create a custom OTP generator**.

---

## Step-by-Step Supabase Dashboard Setup

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. In the left-hand navigation, navigate to **Authentication** &rarr; **Email Templates**.
3. Select the **Confirm signup** template.
4. Update the **Subject**:
   ```text
   SmartProcure: Your 6-Digit Email Verification Code
   ```
5. In the **Body** (HTML editor), replace the default content with:

```html
<h2>Verify your SmartProcure account</h2>

<p>Welcome to <strong>SmartProcure</strong> — National Agricultural Digital Procurement Platform.</p>

<p>Your 6-digit email verification code is:</p>

<div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0; max-width: 320px;">
  <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #047857; font-family: monospace;">
    {{ .Token }}
  </span>
</div>

<p style="font-size: 13px; color: #64748b;">
  This verification code will expire in 60 minutes. Enter this code on the verification screen to activate your account.
</p>

<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

<p style="font-size: 11px; color: #94a3b8;">
  Dispatched by SmartProcure National Procurement Infrastructure &bull; smartprocurementsystem@gmail.com<br />
  National Kisan Helpline: 1800-180-1551
</p>
```

6. Click **Save Changes**.

---

## Technical Verification Flow

```text
Farmer fills registration form (/register)
        │
        ▼
supabase.auth.signUp({ email, password, options: { data: { ... } } })
        │
        ▼
Supabase compiles "Confirm signup" template
(Detects {{ .Token }} and NO {{ .ConfirmationURL }})
        │
        ▼
Supabase generates 6-digit OTP and dispatches email via SMTP (smartprocurementsystem@gmail.com)
        │
        ▼
Farmer enters 6-digit code on /verify-otp
        │
        ▼
supabase.auth.verifyOtp({ email, token, type: 'email' })
        │
        ▼
Account confirmed (email_confirmed_at populated in auth.users)
        │
        ▼
Redirected to Farmer Dashboard (/farmer)
```

---

## Resend OTP Technical Implementation

When the user clicks "Resend Code" (after the 60-second cooldown):

```typescript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: email.trim(),
});
```

- Explicitly passes `type: 'signup'` and `email`.
- Supabase enforces a strict 60-second cooldown between resend requests.
