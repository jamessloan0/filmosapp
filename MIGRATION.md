# FilmOS — Supabase Migration Guide

This document explains how to get the migrated app running on Netlify + Supabase.

---

## What changed

| Before | After |
|---|---|
| base44 database | Supabase Postgres |
| base44 auth | Supabase Auth (email/password) |
| base44 functions (Deno) | Netlify Functions (Node.js) |
| base44 SDK | `@supabase/supabase-js` |
| base44 vite plugin | Standard Vite config |
| AWS S3 + CloudFront | **Unchanged** |
| Stripe | **Unchanged** |
| Resend | **Unchanged** |

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Go to **Storage**, create a new bucket called `public-assets`, set it to **Public**
4. Go to **Authentication > Providers** and enable **Email** (it's on by default)
5. Under **Authentication > URL Configuration**, add your Netlify URL to the Site URL and Redirect URLs fields

---

## Step 2 — Connect to Netlify

1. Push this repo to GitHub
2. In Netlify: **Add new site > Import from Git**, select the repo
3. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`

---

## Step 3 — Set environment variables in Netlify

Go to **Site settings > Environment variables** and add everything from `.env.example`:

```
VITE_SUPABASE_URL          — from Supabase: Settings > API > Project URL
VITE_SUPABASE_ANON_KEY     — from Supabase: Settings > API > anon public key
SUPABASE_URL               — same as VITE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY  — from Supabase: Settings > API > service_role key (keep secret!)
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESEND_AUDIENCE_ID
APP_URL                    — your Netlify URL e.g. https://filmos.netlify.app
CRON_SECRET                — any random string (protects the digest endpoint)
```

---

## Step 4 — Update Stripe webhook

In Stripe dashboard, update your webhook endpoint URL from the old base44 URL to:

```
https://your-netlify-url.netlify.app/.netlify/functions/stripeWebhook
```

---

## Step 5 — Set up daily digest (optional)

The daily notification digest is no longer a scheduled base44 function. To trigger it daily, use a cron service like [cron-job.org](https://cron-job.org) to POST to:

```
POST https://your-netlify-url.netlify.app/.netlify/functions/dailyNotificationDigest
Headers: x-cron-secret: <your CRON_SECRET value>
```

---

## Step 6 — First login & user roles

After deploying, sign up with your filmmaker email at the app. By default new users get `role: 'user'`, which the app gates behind the tester/admin check. To give yourself admin access:

1. In Supabase dashboard, go to **Table Editor > users**
2. Find your row and set `role` to `'admin'`

From there you can use the Admin Testers page to promote other users.

---

## AWS / CloudFront — no changes needed

All file uploads and downloads still go through your existing S3 bucket and CloudFront distribution. The only change is that the presigned URL functions now run as Netlify Functions instead of base44 Deno functions.
