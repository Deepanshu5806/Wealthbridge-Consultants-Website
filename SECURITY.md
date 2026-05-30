# Security Checklist — WealthBridge Website

## Before deploying to Netlify

### 1. Generate a Form Secret (NEW — do this once)
The contact form now requires a shared secret to deter spam bots.

1. Generate a long random string (40+ chars). Easy options:
   - PowerShell: `[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()`
   - Online: any password generator, 40+ chars
2. Open the Apps Script editor (Extensions → Apps Script in your Leads sheet)
3. Click ⚙️ Project Settings → Script Properties → Add property
   - Name: `WB_FORM_SECRET`
   - Value: <paste the secret>
4. Copy the SAME secret into `js/config.js` → `WB.formSecret`
5. Redeploy Apps Script (Deploy → Manage Deployments → Edit → New version)
6. Push the website to Netlify

### 2. Confirm `_headers` is uploaded
After deploy, open https://securityheaders.com and scan your domain. You should see A or A+. If not, Netlify isn't serving the `_headers` file — make sure it's in the publish root.

### 3. (Optional but recommended) Add Cloudflare Turnstile
The honeypot + secret + daily cap stops casual spam. For determined attackers, add an invisible CAPTCHA:
1. cloudflare.com/turnstile → sign up (free)
2. Create a site key for your domain
3. Add `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` to contact.html
4. Add `<div class="cf-turnstile" data-sitekey="YOUR_KEY"></div>` inside the form
5. In Apps Script, verify the `cf-turnstile-response` token via Cloudflare's siteverify endpoint before saving

### 4. Rotate the secret if leaked
If you ever commit the secret to GitHub by accident:
- Generate a new one
- Update WB_FORM_SECRET in Apps Script
- Update `formSecret` in js/config.js
- Force-push (or just commit a new value — the leaked one becomes useless once rotated)

## What's already protected
- ✅ `.gitignore` covers `node_modules`, `.env`, logs, OS junk
- ✅ Security headers via `_headers` (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Form submissions require a shared secret
- ✅ Apps Script sanitizes inputs, length-limits, validates email
- ✅ Apps Script daily cap (200 leads/day) prevents quota exhaustion
- ✅ Client-side rate-limit (3 submissions per 10 min per browser)
- ✅ Honeypot field catches naive bots
- ✅ HTML-escaped output in notification emails (no injection)
- ✅ WhatsApp links use `noopener noreferrer`

## Things to monitor
- **Google Sheet:** check weekly for spam patterns
- **Apps Script execution log:** Apps Script editor → Executions tab
- **Sanity content:** only edit via the studio, not direct API calls

## If something leaks
- **WB_FORM_SECRET:** rotate immediately (Apps Script + config.js)
- **Sanity write token:** rotate at sanity.io/manage. The publicly visible `projectId` is fine — it's not a secret.
- **Apps Script URL:** redeploy as a new version, update config.js
