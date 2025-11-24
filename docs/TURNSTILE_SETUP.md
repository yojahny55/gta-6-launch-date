# Cloudflare Turnstile Setup Guide

Date: 2025-11-21
Project: GTA 6 Launch Date Prediction Tracker
Author: Development Team

---

## Overview

This guide walks you through setting up Cloudflare Turnstile for bot protection in the GTA 6 Launch Date Prediction Tracker. Turnstile is a privacy-respecting alternative to Google reCAPTCHA that provides invisible bot detection while maintaining a frictionless user experience.

**Why Turnstile?**
- **Zero Cost:** Free on all Cloudflare plans (no surprise charges)
- **Privacy-Focused:** No personal data collection
- **Invisible:** No user interaction required (managed mode)
- **Stack Consolidation:** Works seamlessly with Cloudflare Workers + Pages + D1

---

## Prerequisites

- Cloudflare account (free tier works)
- Access to project's Cloudflare dashboard
- Repository access for environment variable configuration

---

## Step 1: Access Cloudflare Dashboard

1. Log in to your Cloudflare account at https://dash.cloudflare.com
2. Select your account (top left dropdown)
3. Navigate to **Turnstile** in the left sidebar
   - Or go directly to: `https://dash.cloudflare.com/?to=/:account/turnstile`

---

## Step 2: Create Turnstile Site

1. Click **"Add site"** button
2. Fill in the form:
   - **Site name:** `GTA 6 Launch Date Tracker` (or your preferred name)
   - **Domains:** Add the following domains:
     - `localhost` (for local development)
     - `127.0.0.1` (for local development)
     - `gta6-tracker.pages.dev` (production domain)
     - Add any other staging/preview domains if applicable
   - **Widget Mode:** Select **"Managed"** (invisible, most user-friendly)
   - **Pre-Clearance:** Leave as default

3. Click **"Create"** to generate your site

---

## Step 3: Obtain Site Key and Secret Key

After creating the site, you'll be shown:

### Site Key (Public)
- **Format:** Alphanumeric string (e.g., `1x00000000000000000000AB`)
- **Visibility:** Public (safe to embed in frontend code)
- **Purpose:** Identifies your Turnstile site in widget rendering

**Copy this key** - you'll need it for:
- Frontend integration (`public/index.html` and `public/app.js`)
- Build-time environment variables

### Secret Key (Private)
- **Format:** Alphanumeric string (e.g., `0x4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`)
- **Visibility:** PRIVATE (never commit to repository)
- **Purpose:** Backend API verification

**Copy this key** - you'll need it for:
- Local development (`.dev.vars`)
- Production secrets (Cloudflare Workers secrets)

⚠️ **Security Warning:** Treat the Secret Key like a password. Never commit it to git, never share it publicly, never embed it in frontend code.

---

## Step 4: Configure Local Development Environment

1. Create `.dev.vars` file in project root (if it doesn't exist):

```bash
# .dev.vars - Local development secrets
# This file is .gitignored - never commit to repository

TURNSTILE_SECRET_KEY=your_secret_key_here
SALT_V1=your_existing_salt_value
```

2. Replace `your_secret_key_here` with the Secret Key from Step 3
3. Verify `.dev.vars` is in `.gitignore` (should already be there)

---

## Step 5: Configure Production Environment (Cloudflare Workers)

### Option A: Using Wrangler CLI (Recommended)

```bash
# Add secret to production
npx wrangler secret put TURNSTILE_SECRET_KEY

# When prompted, paste your Secret Key and press Enter
```

### Option B: Using Cloudflare Dashboard

1. Go to **Workers & Pages** in Cloudflare Dashboard
2. Select your Worker (e.g., `gta-6-launch-date`)
3. Click **Settings** → **Variables**
4. Under **Environment Variables**, click **"Add variable"**
5. Add:
   - **Variable name:** `TURNSTILE_SECRET_KEY`
   - **Value:** Your Secret Key from Step 3
   - **Type:** Secret (encrypted)
6. Click **"Save"**

---

## Step 6: Add Site Key to Frontend (Build-time)

The Site Key needs to be embedded in the frontend code. There are two approaches:

### Approach 1: Hardcode in Source (Simple)

Update `public/index.html` and `public/app.js` with your Site Key directly:

```javascript
// In public/app.js
const TURNSTILE_SITE_KEY = '1x00000000000000000000AB'; // Your actual key
```

**Pros:** Simple, no build pipeline changes needed
**Cons:** Less flexible for multiple environments

### Approach 2: Environment Variable (Advanced)

If using a build tool like Vite or Webpack:

```bash
# .env.production
VITE_TURNSTILE_SITE_KEY=your_site_key_here
```

**Pros:** Environment-specific configuration
**Cons:** Requires build tool support

For this project (static frontend), **Approach 1** is recommended.

---

## Step 7: Verify Configuration

### Local Development Test

1. Start local development server:
```bash
npm run dev
```

2. Open browser to `http://localhost:8787` (or your local URL)
3. Open browser DevTools → Console
4. Submit a prediction
5. Check for Turnstile-related logs (no errors should appear)
6. Verify challenge completes invisibly (no user interaction required)

### Backend Verification Test

1. Check Worker logs:
```bash
npx wrangler tail
```

2. Submit a prediction
3. Look for verification logs:
```
INFO: Turnstile verification successful
```

4. If you see errors:
   - `missing-input-secret`: Secret key not configured
   - `invalid-input-secret`: Wrong secret key
   - `missing-input-response`: Token not sent from frontend
   - `invalid-input-response`: Invalid token format

---

## Step 8: Production Deployment

1. Deploy to production:
```bash
npm run deploy
```

2. Test production site at `https://gta6-tracker.pages.dev`
3. Submit a test prediction
4. Verify Turnstile badge appears in footer
5. Check Cloudflare Dashboard → Turnstile for verification statistics

---

## Troubleshooting

### Issue: "missing-input-secret" Error

**Cause:** Secret key not found in environment variables
**Solution:**
```bash
# Verify .dev.vars locally
cat .dev.vars | grep TURNSTILE_SECRET_KEY

# Verify production secret
npx wrangler secret list
```

### Issue: "invalid-input-response" Error

**Cause:** Token format is incorrect or expired
**Solution:**
- Check frontend sends token in `turnstile_token` field
- Verify token is generated from `turnstile.render()` callback
- Check token is not empty string

### Issue: Turnstile Widget Not Rendering

**Cause:** Script not loaded or container element missing
**Solution:**
1. Check `<script>` tag exists in `<head>`:
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

2. Check container element exists:
```html
<div id="turnstile-container"></div>
```

3. Verify Site Key is correct in `turnstile.render()` call

### Issue: High Failure Rate

**Cause:** Legitimate users being flagged as bots
**Solution:**
- Check widget mode is set to "Managed" (not "Non-Interactive" or "Invisible")
- Review Cloudflare Dashboard for failure reasons
- Consider adjusting widget settings in Turnstile dashboard

### Issue: Network Errors (API Unreachable)

**Cause:** Cloudflare API temporarily down or network issues
**Solution:**
- Backend implements fail-open pattern (allows submission)
- Check logs for "fail_open: true" entries
- Monitor Cloudflare status page: https://www.cloudflarestatus.com/

---

## Testing Checklist

Before marking setup complete, verify:

- [ ] Cloudflare Turnstile site created
- [ ] Site Key obtained (public)
- [ ] Secret Key obtained (private, stored securely)
- [ ] Domains configured (localhost, production)
- [ ] Widget mode set to "Managed"
- [ ] `.dev.vars` created with Secret Key
- [ ] `.dev.vars` is in `.gitignore`
- [ ] Production secret configured (wrangler or dashboard)
- [ ] Site Key embedded in frontend code
- [ ] Local development test passed (prediction submission works)
- [ ] Backend verification logs show success
- [ ] Production deployment tested
- [ ] Turnstile badge visible in footer
- [ ] No console errors related to Turnstile

---

## Key Rotation Procedure

If you need to rotate keys (security best practice every 90 days):

1. **Generate New Keys:**
   - Go to Turnstile dashboard
   - Create a new site or regenerate keys for existing site

2. **Update Configuration:**
   ```bash
   # Update local .dev.vars
   TURNSTILE_SECRET_KEY=new_secret_key_here

   # Update production
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

3. **Update Frontend:**
   - Replace Site Key in `public/app.js`
   - Commit and deploy

4. **Verify:**
   - Test both local and production
   - Monitor logs for errors

5. **Decommission Old Keys:**
   - Wait 24-48 hours (grace period)
   - Delete old Turnstile site in dashboard

---

## Monitoring and Analytics

### Cloudflare Dashboard Metrics

1. Go to Turnstile dashboard
2. Select your site
3. View metrics:
   - **Total verifications:** Number of challenges completed
   - **Success rate:** Percentage of passed challenges
   - **Failure rate:** Percentage of rejected challenges
   - **Error rate:** Network errors or API failures

### Application Logs

Monitor Worker logs for Turnstile activity:

```bash
npx wrangler tail --format pretty
```

Look for:
- `INFO: Turnstile verification successful` - Legitimate user
- `WARN: Turnstile challenge failed` - Likely bot
- `WARN: Turnstile verification timed out, failing open` - Network issue

---

## Additional Resources

- **Cloudflare Turnstile Documentation:** https://developers.cloudflare.com/turnstile/
- **Getting Started Guide:** https://developers.cloudflare.com/turnstile/get-started/
- **Client-Side Rendering:** https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- **Server-Side Validation:** https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- **Best Practices:** https://developers.cloudflare.com/turnstile/troubleshooting/
- **API Reference:** https://developers.cloudflare.com/turnstile/reference/

---

## Support

For issues or questions:
- Check this guide's Troubleshooting section
- Review Cloudflare Turnstile documentation
- Check project issue tracker
- Contact project maintainer

---

**Setup Guide Version:** 1.0
**Last Updated:** 2025-11-21
**Related Story:** 2-5b-cloudflare-turnstile-integration
